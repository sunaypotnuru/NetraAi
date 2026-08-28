"""
Patient Portal Routes

API endpoints for patient portal features:
- Medication reminders
- Health goals
- Family accounts
- Document upload
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pydantic import BaseModel, Field
from io import BytesIO
from datetime import datetime
from uuid import uuid4
import logging

from app.core.security import get_current_user
from app.models.schemas import TokenPayload
from app.services.medication_reminder_service import get_medication_reminder_service
from app.services.health_goals_service import get_health_goals_service
from app.services.family_account_service import get_family_account_service
from app.services.document_service import get_document_service
from app.services.supabase import supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/patient", tags=["Patient Portal"])


# ============================================================================
# Request/Response Models
# ============================================================================


class MedicationCreate(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    start_date: str
    end_date: Optional[str] = None
    reminder_times: List[str] = []
    reminder_enabled: bool = True


class MedicationUpdate(BaseModel):
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    reminder_times: Optional[List[str]] = None
    reminder_enabled: Optional[bool] = None
    is_active: Optional[bool] = None


class MedicationLogCreate(BaseModel):
    medication_id: str
    scheduled_at: str
    status: str = Field(pattern="^(taken|missed|skipped)$")
    taken_at: Optional[str] = None
    notes: Optional[str] = None


class HealthGoalCreate(BaseModel):
    goal_type: str = Field(
        pattern="^(weight|exercise|diet|sleep|blood_pressure|blood_sugar|custom)$"
    )
    title: str
    description: Optional[str] = None
    target_value: float
    current_value: float
    unit: str
    start_date: str
    target_date: str


class HealthGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    target_date: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|completed|abandoned)$")


class GoalProgressCreate(BaseModel):
    goal_id: str
    value: float
    notes: Optional[str] = None


class FamilyMemberAdd(BaseModel):
    name: Optional[str] = None
    member_name: Optional[str] = None
    email: Optional[str] = None
    member_email: Optional[str] = None
    relationship: str
    can_view_records: bool = False
    can_book_appointments: bool = False
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None


class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    can_view_records: Optional[bool] = None
    can_book_appointments: Optional[bool] = None


class DocumentShare(BaseModel):
    document_id: str
    doctor_id: str
    notes: Optional[str] = None
    title: Optional[str] = None


# ============================================================================
# Medication Reminders Endpoints
# ============================================================================


@router.post("/medications")
async def create_medication(
    medication_data: MedicationCreate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Create a medication reminder"""
    service = get_medication_reminder_service()
    medication = await service.create_medication(
        patient_id=current_user.sub, medication_data=medication_data.model_dump()
    )

    return medication


@router.get("/medications")
async def get_medications(
    is_active: Optional[bool] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get medications for patient"""
    service = get_medication_reminder_service()
    medications = await service.get_medications(
        patient_id=current_user.sub, is_active=is_active, limit=limit, offset=offset
    )

    return medications


@router.get("/medications/upcoming")
async def get_upcoming_reminders(
    hours: int = Query(default=24, ge=1, le=168),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get upcoming medication reminders"""
    service = get_medication_reminder_service()
    reminders = await service.get_upcoming_reminders(
        patient_id=current_user.sub, hours=hours
    )

    return {"reminders": reminders}


@router.get("/medications/reminders")
async def get_medication_reminders_alias(
    hours: int = Query(default=24, ge=1, le=168),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get medication reminders alias"""
    return await get_upcoming_reminders(hours=hours, current_user=current_user)


@router.get("/medications/{medication_id}")
async def get_medication(
    medication_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Get a single medication"""
    service = get_medication_reminder_service()
    medication = await service.get_medication(
        medication_id=medication_id, patient_id=current_user.sub
    )

    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")

    return medication


@router.put("/medications/{medication_id}")
async def update_medication(
    medication_id: str,
    update_data: MedicationUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Update a medication"""
    service = get_medication_reminder_service()
    medication = await service.update_medication(
        medication_id=medication_id,
        patient_id=current_user.sub,
        update_data=update_data.model_dump(exclude_unset=True),
    )

    return medication


@router.delete("/medications/{medication_id}")
async def delete_medication(
    medication_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Delete a medication"""
    service = get_medication_reminder_service()
    success = await service.delete_medication(
        medication_id=medication_id, patient_id=current_user.sub
    )

    if not success:
        raise HTTPException(status_code=404, detail="Medication not found")

    return {"message": "Medication deleted successfully"}


@router.post("/medication-logs")
async def log_medication(
    log_data: MedicationLogCreate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Log medication intake"""
    service = get_medication_reminder_service()
    log = await service.log_medication(
        patient_id=current_user.sub, log_data=log_data.model_dump()
    )

    return log


@router.get("/medication-logs")
async def get_medication_logs(
    medication_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get medication logs"""
    service = get_medication_reminder_service()
    logs = await service.get_medication_logs(
        patient_id=current_user.sub,
        medication_id=medication_id,
        start_date=start_date,
        end_date=end_date,
        status=status,
        limit=limit,
        offset=offset,
    )

    return logs


@router.get("/medication-adherence")
async def get_medication_adherence(
    medication_id: Optional[str] = None,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get medication adherence statistics"""
    service = get_medication_reminder_service()
    adherence = await service.get_adherence_statistics(
        patient_id=current_user.sub, medication_id=medication_id
    )

    return {"adherence": adherence}


# ============================================================================
# Health Goals Endpoints
# ============================================================================


@router.post("/health-goals")
async def create_health_goal(
    goal_data: HealthGoalCreate, current_user: TokenPayload = Depends(get_current_user)
):
    """Create a health goal"""
    service = get_health_goals_service()
    goal = await service.create_goal(
        patient_id=current_user.sub, goal_data=goal_data.model_dump()
    )

    return goal


@router.get("/health-goals")
async def get_health_goals(
    status: Optional[str] = None,
    goal_type: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get health goals"""
    service = get_health_goals_service()
    goals = await service.get_goals(
        patient_id=current_user.sub,
        status=status,
        goal_type=goal_type,
        limit=limit,
        offset=offset,
    )

    return goals


@router.get("/health-goals/{goal_id}")
async def get_health_goal(
    goal_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Get a single health goal"""
    service = get_health_goals_service()
    goal = await service.get_goal(goal_id=goal_id, patient_id=current_user.sub)

    if not goal:
        raise HTTPException(status_code=404, detail="Health goal not found")

    return goal


@router.put("/health-goals/{goal_id}")
async def update_health_goal(
    goal_id: str,
    update_data: HealthGoalUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Update a health goal"""
    service = get_health_goals_service()
    goal = await service.update_goal(
        goal_id=goal_id,
        patient_id=current_user.sub,
        update_data=update_data.model_dump(exclude_unset=True),
    )

    return goal


@router.delete("/health-goals/{goal_id}")
async def delete_health_goal(
    goal_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Delete a health goal"""
    service = get_health_goals_service()
    success = await service.delete_goal(goal_id=goal_id, patient_id=current_user.sub)

    if not success:
        raise HTTPException(status_code=404, detail="Health goal not found")

    return {"message": "Health goal deleted successfully"}


@router.post("/goal-progress")
async def log_goal_progress(
    progress_data: GoalProgressCreate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Log progress for a health goal"""
    service = get_health_goals_service()
    progress = await service.log_progress(
        patient_id=current_user.sub, progress_data=progress_data.model_dump()
    )

    return progress


@router.get("/goal-progress")
async def get_goal_progress(
    goal_id: str = Query(...),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get progress history for a goal"""
    service = get_health_goals_service()
    progress = await service.get_progress(
        goal_id=goal_id,
        patient_id=current_user.sub,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )

    return progress


@router.get("/goal-achievements")
async def get_goal_achievements(current_user: TokenPayload = Depends(get_current_user)):
    """Get all achievements"""
    service = get_health_goals_service()
    achievements = await service.get_achievements(patient_id=current_user.sub)

    return {"achievements": achievements}


@router.get("/health-goals/statistics")
async def get_goal_statistics(current_user: TokenPayload = Depends(get_current_user)):
    """Get goal statistics"""
    service = get_health_goals_service()
    statistics = await service.get_statistics(patient_id=current_user.sub)

    return statistics


# ============================================================================
# Family Accounts Endpoints
# ============================================================================


@router.get("/family-members")
async def get_family_members(current_user: TokenPayload = Depends(get_current_user)):
    """Get all family members"""
    service = get_family_account_service()
    members = await service.get_family_members(primary_user_id=current_user.sub)

    return members


@router.get("/family-members/{member_id}")
async def get_family_member(
    member_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Get a single family member"""
    service = get_family_account_service()
    member = await service.get_family_member(
        member_id=member_id, primary_user_id=current_user.sub
    )

    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    return member


@router.post("/family-members")
async def add_family_member(
    member_data: FamilyMemberAdd, current_user: TokenPayload = Depends(get_current_user)
):
    """Add a family member"""
    service = get_family_account_service()
    member = await service.add_family_member(
        primary_user_id=current_user.sub, member_data=member_data.model_dump()
    )

    return member


@router.put("/family-members/{member_id}")
async def update_family_member(
    member_id: str,
    update_data: FamilyMemberUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Update family member permissions"""
    service = get_family_account_service()
    member = await service.update_family_member(
        member_id=member_id,
        primary_user_id=current_user.sub,
        update_data=update_data.model_dump(exclude_unset=True),
    )

    return member


@router.delete("/family-members/{member_id}")
async def remove_family_member(
    member_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Remove a family member"""
    service = get_family_account_service()
    success = await service.remove_family_member(
        member_id=member_id, primary_user_id=current_user.sub
    )

    if not success:
        raise HTTPException(status_code=404, detail="Family member not found")

    return {"message": "Family member removed successfully"}


@router.get("/family-dashboard")
async def get_family_health_dashboard(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get family health dashboard"""
    service = get_family_account_service()
    dashboard = await service.get_family_health_dashboard(
        primary_user_id=current_user.sub
    )

    return dashboard


@router.post("/family-members/{member_id}/switch")
async def switch_to_family_member(
    member_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Switch to family member account"""
    service = get_family_account_service()
    result = await service.switch_to_family_member(
        member_id=member_id, primary_user_id=current_user.sub
    )

    return result


# ============================================================================
# Document Upload Endpoints
# ============================================================================


@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Query(...),
    notes: Optional[str] = None,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Upload a document"""
    service = get_document_service()

    # Read file content
    file_content = await file.read()
    file_obj = BytesIO(file_content)

    document = await service.upload_document(
        patient_id=current_user.sub,
        file=file_obj,
        file_name=file.filename,
        document_type=document_type,
        notes=notes,
    )

    return document


@router.get("/documents")
async def get_documents(
    document_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get documents"""
    service = get_document_service()
    documents = await service.get_documents(
        patient_id=current_user.sub,
        document_type=document_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )

    return documents


@router.get("/documents/categories")
async def get_document_categories(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get document categories with counts"""
    service = get_document_service()
    categories = await service.get_document_categories(patient_id=current_user.sub)

    return {"categories": categories}


@router.get("/documents/statistics")
async def get_document_statistics(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get document storage statistics"""
    service = get_document_service()
    statistics = await service.get_storage_statistics(patient_id=current_user.sub)

    return statistics


@router.get("/documents/{document_id}")
async def get_document(
    document_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Get a single document"""
    service = get_document_service()
    document = await service.get_document(
        document_id=document_id, patient_id=current_user.sub
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


@router.put("/documents/{document_id}")
async def update_document(
    document_id: str,
    update_data: dict,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Update document metadata"""
    service = get_document_service()
    document = await service.update_document(
        document_id=document_id, patient_id=current_user.sub, update_data=update_data
    )

    return document


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Delete a document"""
    service = get_document_service()
    success = await service.delete_document(
        document_id=document_id, patient_id=current_user.sub
    )

    if not success:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"message": "Document deleted successfully"}


@router.post("/documents/share")
async def share_document(
    share_data: DocumentShare, current_user: TokenPayload = Depends(get_current_user)
):
    """Share document with doctor and send attachment message"""
    service = get_document_service()
    doc_id = share_data.document_id
    doctor_id = share_data.doctor_id
    doc = None
    try:
        doc = await service.share_document(
            document_id=doc_id,
            patient_id=current_user.sub,
            doctor_id=doctor_id,
        )
    except Exception as err:
        logger.warning(f"Document record update skipped/failed: {err}")

    # Send message attachment to doctor chat thread
    try:
        doc_title = share_data.title or (
            doc.get("title") if doc else "Medical Document"
        )
        notes_text = f"\n\nNotes: {share_data.notes}" if share_data.notes else ""
        msg_body = f"📄 [Shared Document] {doc_title}{notes_text}\n\nThis document has been shared with your doctor portal."

        msg_data = {
            "id": str(uuid4()),
            "sender_id": current_user.sub,
            "recipient_id": doctor_id,
            "content": msg_body,
            "read": False,
            "created_at": datetime.now().isoformat(),
        }
        supabase.table("messages").insert(msg_data).execute()
    except Exception as msg_err:
        logger.warning(f"Failed to create chat attachment message: {msg_err}")

    return doc or {"status": "shared", "document_id": doc_id, "doctor_id": doctor_id}


@router.post("/documents/{document_id}/share")
async def share_document_by_id(
    document_id: str,
    share_data: dict,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Share document with doctor using document_id path parameter"""
    service = get_document_service()
    doctor_id = share_data.get("doctor_id") or share_data.get("doctorId") or ""
    notes = share_data.get("notes")
    title = (
        share_data.get("title") or share_data.get("documentTitle") or "Medical Document"
    )
    doc = None
    try:
        doc = await service.share_document(
            document_id=document_id,
            patient_id=current_user.sub,
            doctor_id=doctor_id,
        )
    except Exception as err:
        logger.warning(f"Document record update skipped/failed: {err}")

    if doctor_id:
        try:
            notes_text = f"\n\nNotes: {notes}" if notes else ""
            msg_body = f"📄 [Shared Document] {title}{notes_text}\n\nThis document has been shared with your doctor portal."
            msg_data = {
                "id": str(uuid4()),
                "sender_id": current_user.sub,
                "recipient_id": doctor_id,
                "content": msg_body,
                "read": False,
                "created_at": datetime.now().isoformat(),
            }
            supabase.table("messages").insert(msg_data).execute()
        except Exception as msg_err:
            logger.warning(f"Failed to create chat attachment message: {msg_err}")

    return doc or {
        "status": "shared",
        "document_id": document_id,
        "doctor_id": doctor_id,
    }


@router.post("/documents/{document_id}/unshare")
async def unshare_document(
    document_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Unshare a document"""
    service = get_document_service()
    document = await service.unshare_document(
        document_id=document_id, patient_id=current_user.sub
    )

    return document


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Download a document"""
    service = get_document_service()

    # Get document metadata
    document = await service.get_document(
        document_id=document_id, patient_id=current_user.sub
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Download file
    file_data = await service.download_document(
        document_id=document_id, patient_id=current_user.sub
    )

    return StreamingResponse(
        BytesIO(file_data),
        media_type=document.get("file_type", "application/octet-stream"),
        headers={
            "Content-Disposition": f"attachment; filename={document.get('file_name', 'document')}"
        },
    )


# ============================================================================
# Front-end API Routing & Service Aliases
# ============================================================================


# --- MEDICATIONS ALIASES ---


@router.get("/medications/{medication_id}/logs")
async def get_medication_specific_logs(
    medication_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get specific medication logs (frontend patientPortalAPI.getMedicationLogs match)"""
    return await get_medication_logs(
        medication_id=medication_id,
        start_date=start_date,
        end_date=end_date,
        status=status,
        limit=limit,
        offset=offset,
        current_user=current_user,
    )


@router.post("/medications/{medication_id}/log")
async def log_specific_medication(
    medication_id: str,
    payload: dict,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Log a specific medication intake (frontend patientPortalAPI.logMedication match)"""
    payload["medication_id"] = medication_id
    log_data = MedicationLogCreate(**payload)
    return await log_medication(log_data=log_data, current_user=current_user)


@router.put("/medications/{medication_id}/reminders")
async def update_medication_reminders(
    medication_id: str,
    payload: dict,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Update medication reminder settings (frontend patientPortalAPI.updateMedicationReminders match)"""
    service = get_medication_reminder_service()
    update_data = {
        "reminder_times": payload.get("reminder_times", []),
        "reminder_enabled": payload.get("reminder_enabled", True),
    }
    return await service.update_medication(
        medication_id=medication_id,
        patient_id=current_user.sub,
        update_data=update_data,
    )


# --- HEALTH GOALS ALIASES ---


@router.get("/goals")
async def get_goals_alias(
    status: Optional[str] = None,
    goal_type: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get health goals (alias for frontend goals api)"""
    return await get_health_goals(status, goal_type, limit, offset, current_user)


@router.post("/goals")
async def create_goal_alias(
    goal_data: HealthGoalCreate, current_user: TokenPayload = Depends(get_current_user)
):
    """Create a health goal (alias for frontend goals api)"""
    return await create_health_goal(goal_data, current_user)


@router.get("/goals/achievements")
async def get_goals_achievements_alias(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get achievements (alias for frontend goals api)"""
    service = get_health_goals_service()
    achievements = await service.get_achievements(patient_id=current_user.sub)
    return {"achievements": achievements}


@router.get("/goals/{goal_id}")
async def get_goal_alias(
    goal_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Get a single health goal (alias for frontend goals api)"""
    return await get_health_goal(goal_id, current_user)


@router.put("/goals/{goal_id}")
async def update_goal_alias(
    goal_id: str,
    update_data: HealthGoalUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Update a health goal (alias for frontend goals api)"""
    return await update_health_goal(goal_id, update_data, current_user)


@router.delete("/goals/{goal_id}")
async def delete_goal_alias(
    goal_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Delete a health goal (alias for frontend goals api)"""
    return await delete_health_goal(goal_id, current_user)


# --- FAMILY MEMBER ALIASES ---


@router.get("/family")
async def get_family_alias(current_user: TokenPayload = Depends(get_current_user)):
    """Get all family members as a list (frontend patientPortalAPI.getFamilyMembers match)"""
    service = get_family_account_service()
    members = await service.get_family_members(primary_user_id=current_user.sub)
    return members.get("members", [])


@router.post("/family")
async def add_family_alias(
    member_data: FamilyMemberAdd, current_user: TokenPayload = Depends(get_current_user)
):
    """Add a family member (frontend patientPortalAPI.addFamilyMember match)"""
    return await add_family_member(member_data, current_user)


@router.get("/family/{member_id}")
async def get_family_member_alias(
    member_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Get a single family member (frontend patientPortalAPI.getFamilyMember match)"""
    return await get_family_member(member_id, current_user)


@router.put("/family/{member_id}")
async def update_family_member_alias(
    member_id: str,
    update_data: FamilyMemberUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Update family member permissions (frontend patientPortalAPI.updateFamilyMember match)"""
    return await update_family_member(member_id, update_data, current_user)


@router.delete("/family/{member_id}")
async def remove_family_member_alias(
    member_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Remove a family member (frontend patientPortalAPI.deleteFamilyMember match)"""
    return await remove_family_member(member_id, current_user)


# --- DOCUMENT ALIASES ---


@router.post("/documents/upload")
async def upload_document_alias(
    file: UploadFile = File(...),
    document_type: str = Query("other"),
    notes: Optional[str] = None,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Upload document (frontend upload alias)"""
    return await upload_document(
        file=file,
        document_type=document_type,
        notes=notes,
        current_user=current_user,
    )


@router.post("/documents/{document_id}/share")
async def share_document_alias(
    document_id: str,
    payload: dict,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Share document (frontend share alias)"""
    service = get_document_service()
    document = await service.share_document(
        document_id=document_id,
        patient_id=current_user.sub,
        doctor_id=payload["doctor_id"],
        notes=payload.get("notes"),
    )
    return document


# --- HEALTH RECORDS HISTORY ---


@router.get("/records/vitals")
async def get_records_vitals(current_user: TokenPayload = Depends(get_current_user)):
    """Get vitals history (Patient Portal API match)"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase

    try:
        res = (
            supabase.table("vitals_log")
            .select("*")
            .eq("patient_id", current_user.sub)
            .order("logged_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching records vitals: {e}")
        return []


@router.get("/records/lab-results")
async def get_records_lab_results(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get lab results history (Patient Portal API match, maps scans to blood/lab assessments)"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase

    try:
        res = (
            supabase.table("scans")
            .select("*")
            .eq("patient_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )
        records = []
        for scan in res.data or []:
            hgb = scan.get("hemoglobin_estimate")
            pred = scan.get("prediction") or "Completed"

            # Determine abnormal flag
            abnormal_flag = "N"
            critical_value = False
            if hgb is not None:
                try:
                    hgb_float = float(hgb)
                    if hgb_float < 12.0:
                        abnormal_flag = "L"
                    if hgb_float < 8.0:
                        critical_value = True
                except ValueError:
                    pass
            elif "anemia" in pred.lower():
                abnormal_flag = "L"

            records.append(
                {
                    "id": scan.get("id"),
                    "test_name": "Hemoglobin Scan Assessment",
                    "test_category": "Blood Screening",
                    "result_value": hgb,
                    "result_text": pred,
                    "units": "g/dL",
                    "reference_range": "12.0 - 16.0 g/dL",
                    "status": "final",
                    "abnormal_flag": abnormal_flag,
                    "critical_value": critical_value,
                    "reported_date": scan.get("reviewed_at") or scan.get("created_at"),
                    "created_at": scan.get("created_at"),
                    "ordered_by": (
                        "Netra AI Referral"
                        if not scan.get("doctor_id")
                        else "Primary Doctor"
                    ),
                    "performed_by_lab": "Netra AI Computer Vision Platform",
                    "collected_date": scan.get("created_at"),
                    "notes": scan.get("recommendations"),
                }
            )
        return records
    except Exception as e:
        logger.error(f"Error fetching records lab-results: {e}")
        return []


@router.get("/records/prescriptions")
async def get_records_prescriptions(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get prescriptions history (Patient Portal API match)"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase

    try:
        res = (
            supabase.table("prescriptions")
            .select("*")
            .eq("patient_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching records prescriptions: {e}")
        return []


@router.get("/records/timeline")
async def get_records_timeline(
    current_user: TokenPayload = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_type: Optional[str] = None,
):
    """Get timeline history (Patient Portal API match)"""
    from app.routes.timeline import get_timeline
    from app.models.schemas import TokenPayload

    payload = TokenPayload(sub=current_user.sub, role="patient")
    res = await get_timeline(
        current_user=payload,
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
    )
    return res


# --- SETTINGS PROFILE & PREFERENCES ---


@router.get("/settings/profile")
async def get_settings_profile(current_user: TokenPayload = Depends(get_current_user)):
    """Get patient profile settings"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase

    try:
        res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("user_id", current_user.sub)
            .execute()
        )
        if res.data:
            return res.data[0]
        res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("id", current_user.sub)
            .execute()
        )
        if res.data:
            return res.data[0]
        return {}
    except Exception as e:
        logger.error(f"Error fetching settings profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings/profile")
async def update_settings_profile(
    data: dict, current_user: TokenPayload = Depends(get_current_user)
):
    """Update patient profile settings"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase

    # Filter keys to only allow valid columns
    allowed_keys = {
        "full_name",
        "phone",
        "date_of_birth",
        "gender",
        "address",
        "emergency_contact_name",
        "emergency_contact_phone",
        "blood_group",
    }
    filtered_data = {k: v for k, v in data.items() if k in allowed_keys}
    try:
        res = (
            supabase.table("profiles_patient")
            .update(filtered_data)
            .eq("user_id", current_user.sub)
            .execute()
        )
        if res.data:
            return res.data[0]
        res = (
            supabase.table("profiles_patient")
            .update(filtered_data)
            .eq("id", current_user.sub)
            .execute()
        )
        if res.data:
            return res.data[0]
        raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        logger.error(f"Error updating settings profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings/preferences")
async def get_settings_preferences(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get patient settings preferences"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase

    user_id = current_user.sub
    try:
        pref_res = (
            supabase.table("user_preferences")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        pref_data = pref_res.data[0] if pref_res.data else {}

        notif_res = (
            supabase.table("notification_preferences")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        notif_data = notif_res.data[0] if notif_res.data else {}

        return {
            "language": pref_data.get("language", "en"),
            "timezone": pref_data.get("timezone", "UTC"),
            "theme": pref_data.get("theme", "light"),
            "notifications": {
                "email": notif_data.get("email", True),
                "sms": notif_data.get("sms", False),
                "push": notif_data.get("push", True),
            },
        }
    except Exception as e:
        logger.error(f"Error getting preferences: {e}")
        return {
            "language": "en",
            "timezone": "UTC",
            "theme": "light",
            "notifications": {"email": True, "sms": False, "push": True},
        }


@router.put("/settings/preferences")
async def update_settings_preferences(
    data: dict, current_user: TokenPayload = Depends(get_current_user)
):
    """Update patient settings preferences"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase

    user_id = current_user.sub
    try:
        pref_updates = {}
        if "language" in data:
            pref_updates["language"] = data["language"]
        if "timezone" in data:
            pref_updates["timezone"] = data["timezone"]
        if "theme" in data:
            pref_updates["theme"] = data["theme"]

        if pref_updates:
            supabase.table("user_preferences").upsert(
                {"user_id": user_id, **pref_updates}, on_conflict="user_id"
            ).execute()

        notif_updates = data.get("notifications", {})
        if notif_updates:
            notif_data = {
                "user_id": user_id,
                "email": notif_updates.get("email", True),
                "sms": notif_updates.get("sms", False),
                "push": notif_updates.get("push", True),
            }
            supabase.table("notification_preferences").upsert(
                notif_data, on_conflict="user_id"
            ).execute()

        return {"message": "Preferences updated successfully"}
    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- APPOINTMENT ENDPOINTS ---


@router.get("/appointments")
async def get_appointments_alias(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get all appointments (frontend client api match)"""
    from app.routes.patient import get_appointments
    from app.models.schemas import TokenPayload, UserRole

    user_payload = TokenPayload(sub=current_user.sub, role=UserRole.PATIENT)
    return await get_appointments(current_user=user_payload)


@router.get("/appointments/upcoming")
async def get_upcoming_appointments(
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get upcoming appointments for patient portal dashboard"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase
    from datetime import datetime

    try:
        now_iso = datetime.now().isoformat()
        res = (
            supabase.table("appointments")
            .select(
                "id, patient_id, doctor_id, scheduled_at, status, type, reason, notes, created_at, updated_at"
            )
            .eq("patient_id", current_user.sub)
            .neq("status", "cancelled")
            .gte("scheduled_at", now_iso)
            .order("scheduled_at", asc=True)
            .execute()
        )
        appointments = res.data or []

        doc_ids = list(
            set(str(a["doctor_id"]) for a in appointments if a.get("doctor_id"))
        )
        doctor_map = {}
        if doc_ids:
            try:
                doc_res = (
                    supabase.table("profiles_doctor")
                    .select("id, full_name, specialty, avatar_url")
                    .in_("id", doc_ids)
                    .execute()
                )
                for doc in doc_res.data or []:
                    doctor_map[str(doc["id"])] = {
                        "name": doc.get("full_name", "Doctor"),
                        "specialty": doc.get("specialty", "Specialist"),
                        "avatar_url": doc.get("avatar_url"),
                    }
            except Exception as e:
                logger.warning(f"Doctor profile enrichment failed: {e}")

        for appt in appointments:
            doc_id = appt.get("doctor_id")
            appt["profiles_doctor"] = doctor_map.get(
                str(doc_id) if doc_id else "",
                {"name": "Doctor", "specialty": "Specialist"},
            )

        return appointments
    except Exception as e:
        logger.error(f"Error fetching upcoming appointments: {e}")
        return []


@router.get("/appointments/{appointment_id}")
async def get_appointment_detail(
    appointment_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Get details of a specific appointment"""
    import logging

    logger = logging.getLogger(__name__)
    from app.services.supabase import supabase

    try:
        res = (
            supabase.table("appointments")
            .select("*")
            .eq("id", appointment_id)
            .eq("patient_id", current_user.sub)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Appointment not found")

        appt = res.data[0]
        doc_id = appt.get("doctor_id")
        if doc_id:
            try:
                doc_res = (
                    supabase.table("profiles_doctor")
                    .select("id, full_name, specialty, avatar_url")
                    .eq("id", doc_id)
                    .execute()
                )
                if doc_res.data:
                    doc = doc_res.data[0]
                    appt["profiles_doctor"] = {
                        "name": doc.get("full_name", "Doctor"),
                        "specialty": doc.get("specialty", "Specialist"),
                        "avatar_url": doc.get("avatar_url"),
                    }
            except Exception as e:
                logger.warning(f"Doctor profile enrichment failed: {e}")

        return appt
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointment detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/appointments/{appointment_id}/cancel")
async def cancel_appointment_post(
    appointment_id: str,
    payload: dict = None,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Cancel an appointment (POST alias for frontend)"""
    from app.routes.patient import cancel_appointment
    from app.models.schemas import TokenPayload

    user_payload = TokenPayload(sub=current_user.sub, role="patient")
    return await cancel_appointment(id=appointment_id, current_user=user_payload)


@router.post("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment_post(
    appointment_id: str,
    payload: dict,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Reschedule an appointment (POST alias for frontend)"""
    from app.routes.patient import reschedule_appointment
    from app.models.schemas import TokenPayload

    user_payload = TokenPayload(sub=current_user.sub, role="patient")
    backend_payload = {"scheduled_at": payload.get("new_date")}
    return await reschedule_appointment(
        id=appointment_id, payload=backend_payload, current_user=user_payload
    )
