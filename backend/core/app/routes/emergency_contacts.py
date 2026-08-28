"""
Emergency Contact Management API
HIPAA-compliant emergency contact CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
from datetime import datetime

from app.core.dependencies import get_current_user, get_current_patient
from app.core.supabase_client import supabase
from app.core.schemas import TokenPayload
from app.utils.validators import validate_phone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/patient/emergency-contacts", tags=["Emergency Contacts"])


# ── Schemas ──────────────────────────────────────────────────────────────────


class EmergencyContactCreate(BaseModel):
    """Schema for creating emergency contact"""
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., description="Phone number with country code")
    relationship: str = Field(..., description="e.g., Spouse, Parent, Sibling, Friend")
    is_primary: bool = Field(default=False, description="Primary emergency contact")


class EmergencyContactUpdate(BaseModel):
    """Schema for updating emergency contact"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    relationship: Optional[str] = None
    is_primary: Optional[bool] = None


class EmergencyContactResponse(BaseModel):
    """Schema for emergency contact response"""
    id: str
    full_name: str
    phone: str
    relationship: str
    is_primary: bool
    created_at: str
    updated_at: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/", response_model=List[EmergencyContactResponse])
async def get_emergency_contacts(
    current_user: TokenPayload = Depends(get_current_patient)
):
    """
    Get all emergency contacts for current patient
    Returns list sorted by primary contact first, then by creation date
    """
    try:
        # Query family_relationships where is_emergency_contact = True
        response = (
            supabase.table("family_relationships")
            .select("id, related_user_id, relation, is_emergency_contact, created_at, updated_at, profiles_patient!related_user_id(full_name, phone)")
            .eq("primary_user_id", current_user.sub)
            .eq("is_emergency_contact", True)
            .execute()
        )
        
        contacts = []
        for item in response.data or []:
            profile = item.get("profiles_patient", {})
            if isinstance(profile, dict) and profile.get("phone"):
                contacts.append({
                    "id": item.get("id"),
                    "full_name": profile.get("full_name", "Unknown"),
                    "phone": profile.get("phone"),
                    "relationship": item.get("relation", "Family"),
                    "is_primary": item.get("is_primary_contact", False),
                    "created_at": item.get("created_at", datetime.now().isoformat()),
                    "updated_at": item.get("updated_at"),
                })
        
        # Sort: primary first, then by created_at
        contacts.sort(key=lambda x: (not x["is_primary"], x["created_at"]))
        
        return contacts
    
    except Exception as e:
        logger.error(f"Failed to fetch emergency contacts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch emergency contacts")


@router.post("/", response_model=EmergencyContactResponse)
async def add_emergency_contact(
    contact: EmergencyContactCreate,
    current_user: TokenPayload = Depends(get_current_patient)
):
    """
    Add new emergency contact
    Creates user profile + family_relationships entry
    """
    try:
        # Validate phone number
        if not validate_phone(contact.phone):
            raise HTTPException(
                status_code=400,
                detail="Invalid phone number format. Use international format (e.g., +1234567890)"
            )
        
        # If setting as primary, unset existing primary contacts
        if contact.is_primary:
            supabase.table("family_relationships").update({
                "is_primary_contact": False
            }).eq("primary_user_id", current_user.sub).eq("is_emergency_contact", True).execute()
        
        # Check if user with this phone already exists
        existing_user = (
            supabase.table("profiles_patient")
            .select("id")
            .eq("phone", contact.phone)
            .execute()
        )
        
        if existing_user.data and len(existing_user.data) > 0:
            # User exists - link as emergency contact
            related_user_id = existing_user.data[0]["id"]
        else:
            # Create new minimal profile for emergency contact
            new_profile = (
                supabase.table("profiles_patient")
                .insert({
                    "full_name": contact.full_name,
                    "phone": contact.phone,
                    "role": "patient",
                    "is_emergency_contact_only": True,  # Flag for emergency-only profiles
                })
                .execute()
            )
            
            if not new_profile.data:
                raise HTTPException(status_code=500, detail="Failed to create contact profile")
            
            related_user_id = new_profile.data[0]["id"]
        
        # Create family_relationships entry
        relationship_entry = (
            supabase.table("family_relationships")
            .insert({
                "primary_user_id": current_user.sub,
                "related_user_id": related_user_id,
                "relation": contact.relationship,
                "is_emergency_contact": True,
                "is_primary_contact": contact.is_primary,
                "can_view_records": False,  # Emergency contacts don't need record access
                "can_book_appointments": False,
            })
            .execute()
        )
        
        if not relationship_entry.data:
            raise HTTPException(status_code=500, detail="Failed to create emergency contact")
        
        return {
            "id": relationship_entry.data[0]["id"],
            "full_name": contact.full_name,
            "phone": contact.phone,
            "relationship": contact.relationship,
            "is_primary": contact.is_primary,
            "created_at": relationship_entry.data[0].get("created_at", datetime.now().isoformat()),
            "updated_at": None,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add emergency contact: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add emergency contact: {str(e)}")


@router.put("/{contact_id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    contact_id: str,
    updates: EmergencyContactUpdate,
    current_user: TokenPayload = Depends(get_current_patient)
):
    """
    Update emergency contact details
    Can update name, phone, relationship, or primary status
    """
    try:
        # Verify ownership
        existing = (
            supabase.table("family_relationships")
            .select("related_user_id, relation, is_primary_contact")
            .eq("id", contact_id)
            .eq("primary_user_id", current_user.sub)
            .eq("is_emergency_contact", True)
            .execute()
        )
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Emergency contact not found")
        
        related_user_id = existing.data[0]["related_user_id"]
        
        # Update profile if name or phone changed
        profile_updates = {}
        if updates.full_name:
            profile_updates["full_name"] = updates.full_name
        if updates.phone:
            if not validate_phone(updates.phone):
                raise HTTPException(status_code=400, detail="Invalid phone number format")
            profile_updates["phone"] = updates.phone
        
        if profile_updates:
            supabase.table("profiles_patient").update(profile_updates).eq("id", related_user_id).execute()
        
        # Update relationship if relationship or primary status changed
        relationship_updates = {"updated_at": datetime.now().isoformat()}
        if updates.relationship:
            relationship_updates["relation"] = updates.relationship
        if updates.is_primary is not None:
            # If setting as primary, unset other primary contacts first
            if updates.is_primary:
                supabase.table("family_relationships").update({
                    "is_primary_contact": False
                }).eq("primary_user_id", current_user.sub).eq("is_emergency_contact", True).execute()
            relationship_updates["is_primary_contact"] = updates.is_primary
        
        updated_relationship = (
            supabase.table("family_relationships")
            .update(relationship_updates)
            .eq("id", contact_id)
            .execute()
        )
        
        # Fetch updated data
        updated_profile = (
            supabase.table("profiles_patient")
            .select("full_name, phone")
            .eq("id", related_user_id)
            .execute()
        )
        
        profile_data = updated_profile.data[0] if updated_profile.data else {}
        relationship_data = updated_relationship.data[0] if updated_relationship.data else {}
        
        return {
            "id": contact_id,
            "full_name": profile_data.get("full_name", "Unknown"),
            "phone": profile_data.get("phone", ""),
            "relationship": relationship_data.get("relation", "Family"),
            "is_primary": relationship_data.get("is_primary_contact", False),
            "created_at": relationship_data.get("created_at", datetime.now().isoformat()),
            "updated_at": relationship_data.get("updated_at"),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update emergency contact: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update emergency contact: {str(e)}")


@router.delete("/{contact_id}")
async def delete_emergency_contact(
    contact_id: str,
    current_user: TokenPayload = Depends(get_current_patient)
):
    """
    Remove emergency contact
    Deletes family_relationships entry (profile remains)
    """
    try:
        # Verify ownership and delete
        result = (
            supabase.table("family_relationships")
            .delete()
            .eq("id", contact_id)
            .eq("primary_user_id", current_user.sub)
            .eq("is_emergency_contact", True)
            .execute()
        )
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Emergency contact not found")
        
        return {
            "success": True,
            "message": "Emergency contact removed successfully",
            "deleted_id": contact_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete emergency contact: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete emergency contact: {str(e)}")


@router.post("/{contact_id}/set-primary")
async def set_primary_contact(
    contact_id: str,
    current_user: TokenPayload = Depends(get_current_patient)
):
    """
    Set emergency contact as primary
    Unsets all other primary contacts first
    """
    try:
        # Verify contact exists and belongs to user
        existing = (
            supabase.table("family_relationships")
            .select("id")
            .eq("id", contact_id)
            .eq("primary_user_id", current_user.sub)
            .eq("is_emergency_contact", True)
            .execute()
        )
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Emergency contact not found")
        
        # Unset all primary contacts
        supabase.table("family_relationships").update({
            "is_primary_contact": False
        }).eq("primary_user_id", current_user.sub).eq("is_emergency_contact", True).execute()
        
        # Set this contact as primary
        supabase.table("family_relationships").update({
            "is_primary_contact": True
        }).eq("id", contact_id).execute()
        
        return {
            "success": True,
            "message": "Primary emergency contact updated",
            "primary_contact_id": contact_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to set primary contact: {e}")
        raise HTTPException(status_code=500, detail="Failed to set primary contact")
