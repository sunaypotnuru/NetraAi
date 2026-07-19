import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.supabase import supabase
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactMessageRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str


@router.post("/submit")
async def submit_contact_message(request: ContactMessageRequest):
    """Submit a contact form message and send email confirmation."""
    try:
        # Insert into contact_messages table
        result = (
            supabase.table("contact_messages")
            .insert(
                {
                    "name": request.name,
                    "email": request.email,
                    "phone": request.phone,
                    "message": request.message,
                    "status": "new",
                    "created_at": datetime.utcnow().isoformat(),
                }
            )
            .execute()
        )

        logger.info(f"Contact message received from {request.email}")

        # Send confirmation email to user via SendGrid provider
        try:
            from app.services.email_provider import SendGridProvider
            email_provider = SendGridProvider()
            
            subject = "Thank you for contacting Netra AI"
            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0D9488;">Netra AI — We Received Your Message</h2>
                <p>Dear {request.name},</p>
                <p>Thank you for reaching out to Netra AI! We have received your inquiry:</p>
                <blockquote style="background: #F8FAFC; border-left: 4px solid #0D9488; padding: 12px; font-style: italic;">
                    "{request.message}"
                </blockquote>
                <p>Our clinical & technical support team will review your message and respond within 24 hours.</p>
                <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748B;">Netra AI Tele-Health Platform — Non-Invasive Diagnostics</p>
            </div>
            """
            await email_provider.send_email(
                to_email=request.email,
                subject=subject,
                html_content=html_body,
            )
        except Exception as email_err:
            logger.warning(f"Contact email confirmation skipped/failed: {email_err}")

        return {
            "success": True,
            "message": "Thank you for contacting us! We will get back to you soon.",
            "data": result.data[0] if result.data else None,
        }
    except Exception as e:
        logger.error(f"Failed to save contact message: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to submit message: {str(e)}"
        )


@router.get("/messages")
async def get_contact_messages():
    """Get all contact messages (admin only - should add auth check)."""
    try:
        result = (
            supabase.table("contact_messages")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {"success": True, "data": result.data or []}
    except Exception as e:
        logger.error(f"Failed to get contact messages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")


@router.patch("/messages/{message_id}/status")
async def update_message_status(message_id: str, status: str):
    """Update contact message status (admin only)."""
    try:
        valid_statuses = ["new", "read", "replied", "archived"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {valid_statuses}",
            )

        result = (
            supabase.table("contact_messages")
            .update({"status": status, "updated_at": datetime.utcnow().isoformat()})
            .eq("id", message_id)
            .execute()
        )

        return {
            "success": True,
            "message": f"Message status updated to {status}",
            "data": result.data[0] if result.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update message status: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to update status: {str(e)}"
        )


@router.delete("/messages/{message_id}")
async def delete_contact_message(message_id: str):
    """Delete a contact message (admin only)."""
    try:
        supabase.table("contact_messages").delete().eq("id", message_id).execute()

        return {"success": True, "message": "Message deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete message: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to delete message: {str(e)}"
        )
