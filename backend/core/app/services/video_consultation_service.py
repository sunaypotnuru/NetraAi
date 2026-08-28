"""
Video Consultation Service
Manages video consultation sessions, participants, and lifecycle
"""

import logging
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.supabase import supabase

logger = logging.getLogger(__name__)


class VideoConsultationService:
    """Service for managing video consultations using Supabase"""

    def __init__(self):
        pass

    def create_session(
        self, appointment_id: str, doctor_id: str, patient_id: str
    ) -> Dict[str, Any]:
        """
        Create a new video consultation session

        Args:
            appointment_id: Appointment ID
            doctor_id: Doctor user ID
            patient_id: Patient user ID

        Returns:
            Session details or None if failed
        """
        try:
            # Generate unique session ID
            session_id = str(uuid.uuid4())

            # Create consultation
            entry = {
                "appointment_id": appointment_id,
                "session_id": session_id,
                "doctor_id": doctor_id,
                "patient_id": patient_id,
                "status": "waiting",
                "recording_enabled": False,
                "recording_consent_given": False,
                "emergency_disconnect": False,
                "created_at": datetime.utcnow().isoformat(),
            }

            result = supabase.table("video_consultations").insert(entry).execute()

            if not result.data:
                logger.error("Failed to insert video consultation into Supabase")
                return {
                    "success": False,
                    "error": "Failed to create session database entry",
                }

            consultation = result.data[0]
            logger.info(f"Created video consultation session: {session_id}")

            return {
                "success": True,
                "id": str(consultation["id"]),
                "session_id": consultation["session_id"],
                "appointment_id": consultation.get("appointment_id"),
                "doctor_id": consultation.get("doctor_id"),
                "patient_id": consultation.get("patient_id"),
                "status": consultation.get("status"),
                "created_at": consultation.get("created_at"),
            }

        except Exception as e:
            logger.error(f"Error creating video consultation: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """
        Get session details

        Args:
            session_id: Session ID

        Returns:
            Session details or None if not found
        """
        try:
            result = (
                supabase.table("video_consultations")
                .select("*")
                .eq("session_id", session_id)
                .execute()
            )

            if not result.data:
                return {"success": False, "error": f"Session {session_id} not found"}

            consultation = result.data[0]

            return {
                "success": True,
                "id": str(consultation["id"]),
                "session_id": consultation["session_id"],
                "appointment_id": consultation.get("appointment_id"),
                "doctor_id": (
                    str(consultation["doctor_id"])
                    if consultation.get("doctor_id")
                    else None
                ),
                "patient_id": (
                    str(consultation["patient_id"])
                    if consultation.get("patient_id")
                    else None
                ),
                "status": consultation.get("status"),
                "started_at": consultation.get("started_at"),
                "ended_at": consultation.get("ended_at"),
                "duration_seconds": consultation.get("duration_seconds"),
                "recording_enabled": consultation.get("recording_enabled"),
                "recording_consent_given": consultation.get("recording_consent_given"),
                "emergency_disconnect": consultation.get("emergency_disconnect"),
                "created_at": consultation.get("created_at"),
            }

        except Exception as e:
            logger.error(f"Error getting session: {str(e)}")
            return {"success": False, "error": str(e)}

    def join_session(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """
        Join a video consultation session

        Args:
            session_id: Session ID
            user_id: User ID joining

        Returns:
            Dict representing status
        """
        try:
            result = (
                supabase.table("video_consultations")
                .select("*")
                .eq("session_id", session_id)
                .execute()
            )

            if not result.data:
                logger.warning(f"Session not found: {session_id}")
                return {"success": False, "error": f"Session {session_id} not found"}

            consultation = result.data[0]

            # Verify user is authorized
            is_doctor = str(consultation.get("doctor_id")) == user_id
            is_patient = str(consultation.get("patient_id")) == user_id

            if not is_doctor and not is_patient:
                logger.warning(f"Unauthorized join attempt: {user_id}")
                return {"success": False, "error": "Unauthorized to join this session"}

            # Start session if both participants present
            if consultation.get("status") == "waiting":
                update_result = (
                    supabase.table("video_consultations")
                    .update(
                        {
                            "status": "active",
                            "started_at": datetime.utcnow().isoformat(),
                        }
                    )
                    .eq("session_id", session_id)
                    .execute()
                )
                if update_result.data:
                    logger.info(f"Session started: {session_id}")
                    return {"success": True}
                return {"success": False, "error": "Failed to update session status"}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error joining session: {str(e)}")
            return {"success": False, "error": str(e)}

    def leave_session(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """
        Leave a video consultation session

        Args:
            session_id: Session ID
            user_id: User ID leaving

        Returns:
            Dict representing status
        """
        try:
            result = (
                supabase.table("video_consultations")
                .select("*")
                .eq("session_id", session_id)
                .execute()
            )

            if not result.data:
                return {"success": False, "error": f"Session {session_id} not found"}

            consultation = result.data[0]

            # If either participant leaves, end the session
            if consultation.get("status") == "active":
                self._end_session_internal(consultation)

            logger.info(f"User {user_id} left session: {session_id}")
            return {"success": True}

        except Exception as e:
            logger.error(f"Error leaving session: {str(e)}")
            return {"success": False, "error": str(e)}

    def end_session(
        self, session_id: str, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        End a video consultation session

        Args:
            session_id: Session ID

        Returns:
            Dict representing status
        """
        try:
            result = (
                supabase.table("video_consultations")
                .select("*")
                .eq("session_id", session_id)
                .execute()
            )

            if not result.data:
                return {"success": False, "error": f"Session {session_id} not found"}

            consultation = result.data[0]
            self._end_session_internal(consultation)

            logger.info(f"Session ended: {session_id}")
            return {"success": True}

        except Exception as e:
            logger.error(f"Error ending session: {str(e)}")
            return {"success": False, "error": str(e)}

    def _end_session_internal(self, consultation):
        """Internal method to end a session"""
        if consultation.get("status") == "active":
            ended_at_dt = datetime.utcnow()

            updates = {"status": "completed", "ended_at": ended_at_dt.isoformat()}

            # Calculate duration
            started_at_str = consultation.get("started_at")
            if started_at_str:
                started_at_dt = datetime.fromisoformat(
                    started_at_str.replace("Z", "+00:00")
                ).replace(tzinfo=None)
                duration = (ended_at_dt - started_at_dt).total_seconds()
                updates["duration_seconds"] = int(duration)

            supabase.table("video_consultations").update(updates).eq(
                "id", consultation["id"]
            ).execute()

    def get_active_sessions(
        self, user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get active sessions

        Args:
            user_id: Filter by user ID (optional)

        Returns:
            List of active sessions
        """
        try:
            query = (
                supabase.table("video_consultations").select("*").eq("status", "active")
            )

            if user_id:
                query = query.or_(f"doctor_id.eq.{user_id},patient_id.eq.{user_id}")

            result = query.execute()

            consultations = result.data or []

            active_sessions = []
            for c in consultations:
                duration = 0
                started_at = c.get("started_at")
                if started_at:
                    started_at_dt = datetime.fromisoformat(
                        started_at.replace("Z", "+00:00")
                    ).replace(tzinfo=None)
                    duration = int((datetime.utcnow() - started_at_dt).total_seconds())

                active_sessions.append(
                    {
                        "id": str(c["id"]),
                        "session_id": c["session_id"],
                        "doctor_id": str(c.get("doctor_id")),
                        "patient_id": str(c.get("patient_id")),
                        "started_at": started_at,
                        "duration_seconds": duration,
                    }
                )

            return active_sessions

        except Exception as e:
            logger.error(f"Error getting active sessions: {str(e)}")
            return []

    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """
        Get session status

        Args:
            session_id: Session ID

        Returns:
            Status string or None if not found
        """
        try:
            result = (
                supabase.table("video_consultations")
                .select("status")
                .eq("session_id", session_id)
                .execute()
            )
            if result.data:
                return {"success": True, "status": result.data[0].get("status")}
            return {"success": False, "error": f"Session {session_id} not found"}
        except Exception as e:
            logger.error(f"Error getting session status: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_session_participants(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session participants

        Args:
            session_id: Session ID

        Returns:
            Participant details or None if not found
        """
        try:
            result = (
                supabase.table("video_consultations")
                .select("doctor_id, patient_id")
                .eq("session_id", session_id)
                .execute()
            )

            if not result.data:
                return None

            consultation = result.data[0]
            doc_id = consultation.get("doctor_id")
            pat_id = consultation.get("patient_id")

            doctor = None
            if doc_id:
                doc_res = (
                    supabase.table("profiles_doctor")
                    .select("*")
                    .eq("id", doc_id)
                    .execute()
                )
                if doc_res.data:
                    d = doc_res.data[0]
                    doctor = {
                        "id": str(d.get("id")),
                        "name": d.get("full_name") or d.get("email"),
                        "specialty": d.get("specialty"),
                    }

            patient = None
            if pat_id:
                pat_res = (
                    supabase.table("profiles_patient")
                    .select("*")
                    .eq("id", pat_id)
                    .execute()
                )
                if pat_res.data:
                    p = pat_res.data[0]
                    patient = {
                        "id": str(p.get("id")),
                        "name": p.get("full_name") or p.get("email"),
                        "age": None,
                    }

            return {"doctor": doctor, "patient": patient}

        except Exception as e:
            logger.error(f"Error getting session participants: {str(e)}")
            return None

    def update_recording_status(
        self,
        session_id: str,
        recording_enabled: bool,
        recording_url: Optional[str] = None,
    ) -> bool:
        """
        Update recording status

        Args:
            session_id: Session ID
            recording_enabled: Whether recording is enabled
            recording_url: Recording URL (if available)

        Returns:
            True if updated successfully
        """
        try:
            updates = {"recording_enabled": recording_enabled}
            if recording_url:
                updates["recording_url"] = recording_url

            result = (
                supabase.table("video_consultations")
                .update(updates)
                .eq("session_id", session_id)
                .execute()
            )

            if result.data:
                logger.info(
                    f"Recording status updated for session {session_id}: {recording_enabled}"
                )
                return True
            return False

        except Exception as e:
            logger.error(f"Error updating recording status: {str(e)}")
            return False

    def get_consultation_history(
        self, user_id: str, user_role: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get consultation history for a user

        Args:
            user_id: User ID
            user_role: User role (doctor/patient)
            limit: Maximum number of results

        Returns:
            List of past consultations
        """
        try:
            query = (
                supabase.table("video_consultations")
                .select("*")
                .in_("status", ["completed", "cancelled", "emergency_ended"])
            )

            if user_role == "doctor":
                query = query.eq("doctor_id", user_id)
            else:
                query = query.eq("patient_id", user_id)

            result = query.order("created_at", desc=True).limit(limit).execute()

            consultations = result.data or []

            return [
                {
                    "id": str(c.get("id")),
                    "session_id": c.get("session_id"),
                    "status": c.get("status"),
                    "started_at": c.get("started_at"),
                    "ended_at": c.get("ended_at"),
                    "duration_seconds": c.get("duration_seconds"),
                    "recording_available": bool(c.get("recording_url")),
                    "emergency_disconnect": c.get("emergency_disconnect"),
                }
                for c in consultations
            ]

        except Exception as e:
            logger.error(f"Error getting consultation history: {str(e)}")
            return []


# ==================== SERVICE INSTANCE ====================

_video_consultation_service = None


def get_video_consultation_service() -> VideoConsultationService:
    """Get or create video consultation service instance"""
    global _video_consultation_service
    if _video_consultation_service is None:
        _video_consultation_service = VideoConsultationService()
    return _video_consultation_service
