from fastapi import APIRouter, Depends, HTTPException, UploadFile, File  # type: ignore
from typing import Optional, Any, Dict, List
from datetime import datetime, timedelta
import uuid
import logging
import asyncio

from app.core.config import settings  # type: ignore
from app.core.security import get_current_doctor  # type: ignore
from app.models.schemas import (  # type: ignore
    TokenPayload,
    AppointmentResponse,
    PrescriptionCreate,
    PrescriptionResponse,
    AppointmentUpdateStatus,
)
from app.services.supabase import supabase  # type: ignore
from app.utils.storage import generate_signed_url
from app.routes.timeline import get_timeline  # type: ignore
from app.services.achievements import record_achievement_progress
from app.db.schema import Tables, Col  # type: ignore
from app.routes.audit import log_audit  # type: ignore
from app.services.clinical_notes_service import get_clinical_notes_service  # type: ignore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/doctor", tags=["Doctor"])
public_router = APIRouter(prefix="/doctors", tags=["Public Doctors"])


@public_router.get("")
async def get_all_doctors(q: Optional[str] = None):
    """List all verified doctors for patients with optional search."""
    db_data = []
    db_success = False
    try:
        query = (
            supabase.table("profiles_doctor")
            .select(
                "id, full_name, email, specialty, rating, is_verified, consultation_fee, bio, experience_years, availability, avatar_url"
            )
            .eq("is_verified", True)
        )

        if q:
            res = query.or_(f"full_name.ilike.%{q}%, specialty.ilike.%{q}%").execute()
        else:
            res = query.execute()

        if hasattr(res, "data"):
            db_success = True
            for d in res.data or []:
                name = str(d.get("full_name") or "").lower()
                email = str(d.get("email") or "").lower()
                # Filter out admins if any accidentally marked as doctor
                if "admin" not in name and email != "sunaypotnuru@gmail.com":
                    db_data.append(d)

            # If we found data in DB, return it
            if db_data:
                return db_data
    except Exception as e:
        logger.error(f"Error fetching doctors from DB: {str(e)}")
        db_success = False

    return db_data if db_success else []


@public_router.get("/{doctor_id}")
async def get_doctor_by_id(doctor_id: str):
    """Get a single doctor by ID. Falls back to mock data if not found in DB."""
    try:
        res = (
            supabase.table("profiles_doctor")
            .select("*")
            .eq("id", doctor_id)
            .maybe_single()
            .execute()
        )
        if res.data:
            return res.data
    except Exception as e:
        logger.warning(f"DB lookup failed for doctor {doctor_id}: {e}")

    raise HTTPException(status_code=404, detail="Doctor not found")


@public_router.get("/{doctor_id}/availability")
async def get_doctor_availability(doctor_id: str, date: Optional[str] = None):
    """Get available time slots for a doctor on a specific date."""
    from app.services.appointment_service import get_appointment_service
    from datetime import datetime

    try:
        # Parse date or use today
        if date:
            target_date = datetime.fromisoformat(date.replace("Z", "+00:00"))
        else:
            target_date = datetime.now()

        # Get available slots
        appointment_service = get_appointment_service()
        slots = await appointment_service.get_available_slots(
            doctor_id=doctor_id, date=target_date, slot_duration=30  # 30-minute slots
        )

        return {
            "doctor_id": doctor_id,
            "date": target_date.date().isoformat(),
            "available_slots": slots,
            "total_slots": len(slots),
        }
    except Exception as e:
        logger.error(f"Error getting availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_dashboard(current_user: TokenPayload = Depends(get_current_doctor)):
    """Fetch aggregated dashboard data for the doctor."""
    try:
        # Get profile - safely using existing columns
        profile_fields = "id, full_name, specialty, email, avatar_url, license_number, is_verified, rating, bio, experience_years, consultation_fee, created_at, updated_at"
        
        # Get profile
        profile_res = (
            supabase.table("profiles_doctor")
            .select(profile_fields + ", availability")
            .eq("id", current_user.sub)
            .execute()
        )

        if not profile_res.data:
            # Auto-create profile if missing (due to no DB trigger on signup)
            # Use upsert to handle race conditions
            try:
                meta: Dict[str, Any] = {}
                if settings.BYPASS_AUTH:
                    meta = {}
                else:
                    user_auth = supabase.auth.admin.get_user_by_id(current_user.sub)
                    meta = (
                        user_auth.user.user_metadata
                        if user_auth and user_auth.user
                        else {}
                    )
            except Exception as auth_err:
                logger.warning(f"Could not fetch user metadata: {auth_err}")
                meta = {}

            name = meta.get("full_name") or meta.get("name") or "Doctor"
            specialty = meta.get("specialty", "Specialist")

            # Use fallback consultation fee from Meta if preset
            fee = meta.get("consultation_fee", 0)
            if isinstance(fee, str) and fee.isdigit():
                fee = int(fee)
            elif not isinstance(fee, (int, float)):
                fee = 0

            new_profile = {
                "id": current_user.sub,
                "email": current_user.email,
                "full_name": name,
                "specialty": specialty,
                "consultation_fee": fee,
            }
            try:
                # Use upsert to prevent race condition errors
                supabase.table("profiles_doctor").upsert(new_profile, on_conflict="id").execute()
            except Exception as insert_err:
                logger.warning(f"Could not upsert doctor profile: {insert_err}")
                # Try to fetch again in case another request created it
                profile_res = (
                    supabase.table("profiles_doctor")
                    .select(profile_fields + ", availability")
                    .eq("id", current_user.sub)
                    .execute()
                )
                if profile_res.data:
                    profile = profile_res.data[0]
                else:
                    profile = new_profile
            else:
                profile = new_profile
        else:
            profile = profile_res.data[0]


        # Get today's appointments
        today = datetime.now().date().isoformat()
        try:
            appts_res = (
                supabase.table("appointments")
                .select("*")
                .eq("doctor_id", current_user.sub)
                .gte("scheduled_at", today)
                .order("scheduled_at", desc=False)
                .execute()
            )
            appointments = appts_res.data or []
        except Exception as appt_err:
            logger.error(f"Error fetching appointments: {appt_err}")
            appointments = []

        # Get patient details for appointments
        if appointments:
            try:
                patient_ids = list(set([a["patient_id"] for a in appointments]))
                patients_res = (
                    supabase.table("profiles_patient")
                    .select("id, full_name, age, avatar_url")
                    .in_("id", patient_ids)
                    .execute()
                )
                patients_map = (
                    {p["id"]: p for p in patients_res.data} if patients_res.data else {}
                )

                # Attach patient data to appointments
                for apt in appointments:
                    apt["profiles_patient"] = patients_map.get(apt["patient_id"])
            except Exception as pat_err:
                logger.error(f"Error fetching patient profiles for dashboard: {pat_err}")

        # Get pending scans assigned to this doctor's patients
        pat_ids = (
            [appt["patient_id"] for appt in appointments] if appointments else []
        )
        scans_data: List[Dict[str, Any]] = []
        if pat_ids:
            try:
                scans_res = (
                    supabase.table("scans")
                    .select("*")
                    .in_("patient_id", list(set(pat_ids)))
                    .order("created_at", desc=True)
                    .limit(10)
                    .execute()
                )
                scans_data = scans_res.data or []

                # Get patient details for scans
                if scans_data:
                    scan_patient_ids = list(set([s["patient_id"] for s in scans_data]))
                    patients_res = (
                        supabase.table("profiles_patient")
                        .select("id, full_name, age, email")
                        .in_("id", scan_patient_ids)
                        .execute()
                    )
                    patients_map = (
                        {p["id"]: p for p in patients_res.data} if patients_res.data else {}
                    )

                    # Attach patient data to scans
                    for scan in scans_data:
                        scan["profiles_patient"] = patients_map.get(scan["patient_id"])
            except Exception as scan_err:
                logger.error(f"Error fetching scans for dashboard: {scan_err}")

        # Aggregate super simple stats
        revenue = (
            sum([float(profile.get("consultation_fee") or 0) for _ in appointments])
            if profile and appointments
            else 0
        )
        stats = {
            "appointments_today": len(appointments),
            "pending_patients": len(scans_data),
            "revenue_today": revenue,
        }

        return {
            "profile": profile,
            "appointments": appointments,
            "pending_scans": scans_data,
            "stats": stats,
        }
    except Exception as e:
        logger.error(f"Critical error in doctor dashboard: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Dashboard load failed: {str(e)}"
        )


@router.get("/alerts")
async def get_doctor_alerts(current_user: TokenPayload = Depends(get_current_doctor)):
    """Fetch escalated AI Nurse alerts for patients assigned to this doctor."""
    try:
        # Get patients that belong to this doctor
        appts_res = (
            supabase.table("appointments")
            .select("patient_id")
            .eq("doctor_id", current_user.sub)
            .execute()
        )
        if not appts_res.data:
            return []

        patient_ids = list(set([a["patient_id"] for a in appts_res.data]))

        # Get recent voice_call_logs with a side_effect logged
        logs_res = (
            supabase.table("voice_call_logs")
            .select("*, profiles_patient(full_name, avatar_url)")
            .in_("patient_id", patient_ids)
            .neq("side_effects_detected", "null")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )

        return logs_res.data or []
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        return []


@router.get("/patients")
async def get_patients(current_user: TokenPayload = Depends(get_current_doctor)):
    """List patients that have booked an appointment with this doctor."""
    try:
        appts_res = (
            supabase.table("appointments")
            .select("patient_id")
            .eq("doctor_id", current_user.sub)
            .execute()
        )
        if not appts_res.data:
            return []
        patient_ids = list(set([a["patient_id"] for a in appts_res.data]))
        patients_res = (
            supabase.table("profiles_patient")
            .select("id, full_name, age, gender, blood_type, avatar_url")
            .in_("id", patient_ids)
            .execute()
        )
        return patients_res.data or []
    except Exception as e:
        logger.error(f"get_patients DB error: {e}")
        return []


@router.get("/patients/{id}")
async def get_patient_details(
    id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Get detailed information about a specific patient."""
    # Verify the doctor has access to this patient (has an appointment with them)
    appts_res = (
        supabase.table("appointments")
        .select("id")
        .eq("doctor_id", current_user.sub)
        .eq("patient_id", id)
        .execute()
    )
    if not appts_res.data:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this patient's details."
        )

    patient_res = (
        supabase.table("profiles_patient")
        .select("id, full_name, email, age, gender, blood_type, avatar_url")
        .eq("id", id)
        .execute()
    )
    if not patient_res.data:
        raise HTTPException(status_code=404, detail="Patient not found.")

    return patient_res.data[0]


@router.get("/patients/{id}/timeline")
async def get_patient_timeline(
    id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Fetch the chronological timeline of a specific patient's health history."""
    try:
        # Check authorization
        appts_res = (
            supabase.table("appointments")
            .select("id")
            .eq("doctor_id", current_user.sub)
            .eq("patient_id", id)
            .execute()
        )
        if not appts_res.data:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to view this patient's timeline.",
            )

        # Fake a token payload for the patient to use the shared timeline logic
        mock_patient_token = TokenPayload(sub=id, role="patient")
        # Direct call to the existing controller
        timeline_data = await get_timeline(current_user=mock_patient_token)
        records = timeline_data.get("records", [])

        # Fetch clinical_notes for this patient
        try:
            notes_res = (
                supabase.table("clinical_notes")
                .select("*, profiles_doctor(full_name, specialty)")
                .eq("patient_id", id)
                .execute()
            )
            for note in notes_res.data or []:
                created_at = note.get("created_at", "")
                doc_name = note.get("profiles_doctor", {}) or {}
                name = doc_name.get("full_name") or "A Doctor"

                # Prepare summary from SOAP parts if available
                summary = note.get("content", "")
                if not summary and note.get("subjective"):
                    summary = f"S: {note.get('subjective')}\nO: {note.get('objective')}\nA: {note.get('assessment')}\nP: {note.get('plan')}"

                records.append(
                    {
                        "id": note.get("id"),
                        "date": (
                            datetime.fromisoformat(
                                created_at.replace("Z", "+00:00")
                            ).strftime("%b %d %Y")
                            if created_at
                            else "Unknown Date"
                        ),
                        "raw_date": created_at,
                        "type": "Clinical Note",
                        "title": f"Note by {name}",
                        "summary": summary,
                        "note_type": note.get("note_type", "general"),
                        "is_manual": True,
                        "details": (
                            "AI Generated"
                            if note.get("is_ai_generated")
                            else "Manual Note"
                        ),
                        "soap": (
                            {
                                "subjective": note.get("subjective"),
                                "objective": note.get("objective"),
                                "assessment": note.get("assessment"),
                                "plan": note.get("plan"),
                            }
                            if note.get("note_type") == "soap"
                            else None
                        ),
                    }
                )
        except Exception as e:
            logger.warning(f"Could not fetch clinical_notes: {e}")

        # Re-sort descending since we injected notes
        records.sort(key=lambda x: x.get("raw_date", ""), reverse=True)
        return {"records": records}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch patient timeline: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch timeline")


@router.post("/patients/{id}/notes")
async def add_clinical_note(
    id: str, note_data: dict, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Add a clinical note to a patient's timeline."""
    try:
        service = get_clinical_notes_service()
        note = await service.create_note(
            doctor_id=current_user.sub, patient_id=id, note_data=note_data
        )

        # Audit Log for SOC 2 Compliance
        await log_audit(
            user_id=current_user.sub,
            action="CREATE_CLINICAL_NOTE",
            resource_type="clinical_notes",
            resource_id=note.get("id"),
            details={
                "patient_id": id,
                "note_type": note_data.get("note_type"),
                "is_ai_generated": note_data.get("is_ai_generated", False),
            },
        )

        return note
    except Exception as e:
        logger.error(f"Error adding clinical note: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/appointments/{id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    id: str,
    update: AppointmentUpdateStatus,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Update appointment status (e.g. mark as completed)."""
    res = (
        supabase.table("appointments")
        .update({"status": update.status})
        .eq("id", id)
        .eq("doctor_id", current_user.sub)
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404, detail="Appointment not found or not authorized."
        )

    if update.status == "completed":
        try:
            asyncio.create_task(record_achievement_progress(current_user.sub, "MENTOR", 1))
        except Exception as achievement_error:
            logger.warning(f"Achievement recording failed for MENTOR: {achievement_error}")

    return res.data[0]


@router.post("/prescriptions/{id}/upload")
async def upload_prescription_pdf(
    id: str,
    file: UploadFile = File(...),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Upload the generated PDF for a prescription using backend service role to bypass RLS."""
    try:
        content = await file.read()
        file_name = f"{id}.pdf"

        # Upload to Supabase Storage
        # Bucket must be pre-created by admin - do not auto-create for security
        try:
            supabase.storage.from_("prescriptions").upload(
                path=file_name,
                file=content,
                file_options={"content-type": "application/pdf", "upsert": "true"},
            )
        except Exception as storage_err:
            logger.error(f"Storage upload failed: {storage_err}")
            raise HTTPException(
                status_code=500, 
                detail="Storage upload failed. Ensure 'prescriptions' bucket exists and has correct permissions."
            )

        # Get the public URL
        url = supabase.storage.from_("prescriptions").get_public_url(file_name)

        # Update the prescription record
        supabase.table("prescriptions").update({"pdf_url": url}).eq("id", id).execute()

        return {"status": "success", "pdf_url": url}
    except Exception as e:
        logger.error(f"Error uploading prescription PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prescriptions", response_model=PrescriptionResponse)
async def create_prescription(
    rx: PrescriptionCreate, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Generate a prescription for a patient and auto-add medications to patient's reminder list."""
    data = rx.model_dump()
    data["doctor_id"] = current_user.sub

    # Map additional_notes to notes column in DB
    if "additional_notes" in data:
        data["notes"] = data.pop("additional_notes")

    # Prune unmapped keys to avoid PGRST204 errors
    data.pop("expires_at", None)
    res = supabase.table("prescriptions").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create prescription.")

    prescription = res.data[0]

    # AUTO-INTEGRATION: Add medications to patient's medication reminders
    try:
        patient_id = rx.patient_id

        for med in rx.medications:
            # Parse frequency to determine time slots
            med_dict = med.model_dump()
            frequency = med_dict.get("frequency", "").lower()
            time_slots = []

            # Smart time slot assignment based on frequency
            if "once" in frequency or "daily" in frequency or "1" in frequency:
                time_slots = ["09:00"]  # Morning
            elif "twice" in frequency or "2" in frequency:
                time_slots = ["09:00", "21:00"]  # Morning and night
            elif "thrice" in frequency or "three" in frequency or "3" in frequency:
                time_slots = ["09:00", "14:00", "21:00"]  # Morning, afternoon, night
            elif "four" in frequency or "4" in frequency:
                time_slots = ["08:00", "12:00", "17:00", "22:00"]
            else:
                time_slots = ["09:00"]  # Default to morning

            # Calculate end date (default 30 days if duration not specified)
            duration_days = med_dict.get("duration_days", 30)
            start_date = datetime.now().isoformat()
            end_date = (datetime.now() + timedelta(days=duration_days)).isoformat()

            # Create medication reminder entry
            medication_data = {
                "patient_id": patient_id,
                "name": med_dict.get("name") or med_dict.get("drug_name"),
                "dosage": med_dict.get("dosage"),
                "frequency": med_dict.get("frequency"),
                "time_slots": time_slots,
                "start_date": start_date,
                "end_date": end_date,
                "is_active": True,
                "prescription_id": prescription.get("id"),  # Link to prescription
            }

            # Check if medication already exists to avoid duplicates
            # Include dosage in duplicate check to allow same medication with different dosages
            existing = (
                supabase.table("medications")
                .select("id")
                .eq("patient_id", patient_id)
                .eq("name", medication_data["name"])
                .eq("dosage", medication_data["dosage"])
                .eq("is_active", True)
                .execute()
            )

            if not existing.data:
                res = supabase.table("medications").insert(medication_data).execute()
                logger.info(
                    f"Auto-added medication reminder: {medication_data['name']} ({medication_data['dosage']}) for patient {patient_id}"
                )
            else:
                logger.info(
                    f"Medication {medication_data['name']} ({medication_data['dosage']}) already exists in reminders for patient {patient_id}"
                )

    except Exception as auto_add_err:
        # Don't fail the prescription creation if auto-add fails
        logger.error(f"Failed to auto-add medications to reminders: {auto_add_err}")

    # Auto-dispatch prescription email to patient via SendGrid
    try:
        patient_id = rx.patient_id
        patient_res = (
            supabase.table("profiles_patient")
            .select("full_name, email")
            .eq("id", patient_id)
            .single()
            .execute()
        )
        if patient_res.data:
            patient_name = patient_res.data.get("full_name") or "Patient"
            patient_email = patient_res.data.get("email")
            
            if patient_email:
                # Retrieve doctor name for the email signature
                doctor_res = (
                    supabase.table("profiles_doctor")
                    .select("full_name")
                    .eq("id", current_user.sub)
                    .single()
                    .execute()
                )
                doctor_name = (
                    doctor_res.data.get("full_name") 
                    if doctor_res.data 
                    else "Your Physician"
                )
                
                # Build HTML table for medications list
                med_lines = []
                for idx, med in enumerate(rx.medications, 1):
                    med_dict = med.model_dump()
                    med_lines.append(
                        f"<tr>"
                        f"<td style='padding: 8px; border-bottom: 1px solid #e2e8f0;'><strong>{idx}. {med_dict.get('name') or med_dict.get('drug_name')}</strong></td>"
                        f"<td style='padding: 8px; border-bottom: 1px solid #e2e8f0;'>{med_dict.get('dosage')}</td>"
                        f"<td style='padding: 8px; border-bottom: 1px solid #e2e8f0;'>{med_dict.get('duration')}</td>"
                        f"<td style='padding: 8px; border-bottom: 1px solid #e2e8f0;'>{med_dict.get('instructions')}</td>"
                        f"</tr>"
                    )
                medications_table = (
                    f"<table style='width:100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;'>"
                    f"<thead>"
                    f"<tr style='background-color: #f1f5f9; text-align: left;'>"
                    f"<th style='padding: 8px; border-bottom: 2px solid #cbd5e1;'>Medication</th>"
                    f"<th style='padding: 8px; border-bottom: 2px solid #cbd5e1;'>Dosage</th>"
                    f"<th style='padding: 8px; border-bottom: 2px solid #cbd5e1;'>Duration</th>"
                    f"<th style='padding: 8px; border-bottom: 2px solid #cbd5e1;'>Instructions</th>"
                    f"</tr>"
                    f"</thead>"
                    f"<tbody>"
                    f"{''.join(med_lines)}"
                    f"</tbody>"
                    f"</table>"
                )
                
                email_subject = "Your New Prescription - Netra AI"
                email_body = (
                    f"Dear {patient_name},<br><br>"
                    f"A new prescription has been generated for you by <strong>{doctor_name}</strong>.<br><br>"
                    f"<strong>Diagnosis:</strong> {rx.diagnosis}<br><br>"
                    f"<strong>Prescribed Medications:</strong><br>"
                    f"{medications_table}<br>"
                )
                
                if rx.additional_notes:
                    email_body += f"<br><strong>Doctor's Notes:</strong> {rx.additional_notes}<br>"
                    
                email_body += (
                    f"<br>These medications have also been automatically added to your medication reminders list in the Netra AI portal.<br><br>"
                    f"Take care of your health!<br><br>"
                    f"Sincerely,<br>"
                    f"The Netra AI Platform Support Team"
                )
                
                # Import and dispatch the SendGrid email in a background task
                from app.utils.reminders import _send_email
                asyncio.create_task(_send_email(patient_email, email_subject, email_body))
                logger.info(f"Triggered prescription email dispatch task for patient: {patient_email}")
    except Exception as email_err:
        logger.error(f"Failed to trigger prescription email auto-dispatch: {email_err}")

    # Gamification (with error monitoring)
    try:
        asyncio.create_task(record_achievement_progress(current_user.sub, "HEALER", 1))
    except Exception as achievement_error:
        logger.warning(f"Achievement recording failed for HEALER: {achievement_error}")

    return prescription


@router.get("/appointments")
async def get_appointments(current_user: TokenPayload = Depends(get_current_doctor)):
    """Get all appointments for the doctor with patient details."""
    res = (
        supabase.table("appointments")
        .select("*")
        .eq("doctor_id", current_user.sub)
        .order("scheduled_at", desc=False)
        .execute()
    )
    appointments = res.data or []

    # Get patient details
    if appointments:
        patient_ids = list(set([a["patient_id"] for a in appointments]))
        patients_res = (
            supabase.table("profiles_patient")
            .select("id, full_name, age, avatar_url")
            .in_("id", patient_ids)
            .execute()
        )
        patients_map = (
            {p["id"]: p for p in patients_res.data} if patients_res.data else {}
        )

        # Attach patient data to appointments
        for apt in appointments:
            apt["profiles_patient"] = patients_map.get(apt["patient_id"])

    return appointments


@router.put("/availability")
async def update_availability(
    payload: dict, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Update doctor's weekly availability slots."""
    availability = payload.get("availability")

    res = (
        supabase.table("profiles_doctor")
        .update({"availability": availability})
        .eq("id", current_user.sub)
        .execute()
    )
    if res.data:
        return res.data[0]
    raise HTTPException(status_code=400, detail="Failed to update availability.")


@router.get("/scans/pending")
async def get_pending_scans(current_user: TokenPayload = Depends(get_current_doctor)):
    """Get recent AI scans for the doctor's patients."""
    try:
        # Find patients who have appointments with this doctor
        appts_res = (
            supabase.table("appointments")
            .select("patient_id")
            .eq("doctor_id", current_user.sub)
            .execute()
        )
        if not appts_res.data:
            return []
        patient_ids = list(set([a["patient_id"] for a in appts_res.data]))
        scans_res = (
            supabase.table("scans")
            .select(
                "id, patient_id, image_url, prediction, confidence, hemoglobin_estimate, created_at, updated_at"
            )
            .in_("patient_id", patient_ids)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        return scans_res.data or []
    except Exception as e:
        logger.warning(f"Could not fetch pending scans: {e}")
        return []


@router.get("/scans")
async def get_scans(current_user: TokenPayload = Depends(get_current_doctor)):
    """Get all scans for the doctor's patients with patient details."""
    try:
        # Find patients who have appointments with this doctor
        appts_res = (
            supabase.table("appointments")
            .select("patient_id")
            .eq("doctor_id", current_user.sub)
            .execute()
        )
        if not appts_res.data:
            return []

        patient_ids = list(set([a["patient_id"] for a in appts_res.data]))

        # Get scans
        scans_res = (
            supabase.table("scans")
            .select("*")
            .in_("patient_id", patient_ids)
            .order("created_at", desc=True)
            .execute()
        )
        scans = scans_res.data or []

        # Get patient profile information
        if scans:
            scan_patient_ids = list(set([s["patient_id"] for s in scans]))
            patients_res = (
                supabase.table("profiles_patient")
                .select("id, full_name, avatar_url")
                .in_("id", scan_patient_ids)
                .execute()
            )
            patients_map = (
                {p["id"]: p for p in patients_res.data} if patients_res.data else {}
            )

        # Attach patient data to scans and generate signed URLs
        for scan in scans:
            scan["profiles_patient"] = patients_map.get(scan["patient_id"])

            # Generate dynamic signed URL if image_url is a storage path (centralized)
            img_url = scan.get("image_url")
            if img_url and not img_url.startswith("http"):
                signed_url = generate_signed_url("scan-images", img_url, 3600)
                if signed_url:
                    scan["image_url"] = signed_url

        return scans
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch scans: {str(e)}")


@router.put("/scans/{id}/review")
async def review_scan(
    id: str, payload: dict, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Review and update a scan with doctor's assessment."""
    try:
        # Verify the scan belongs to one of the doctor's patients
        scan_res = supabase.table("scans").select("patient_id").eq("id", id).execute()
        if not scan_res.data:
            raise HTTPException(status_code=404, detail="Scan not found")

        patient_id = scan_res.data[0]["patient_id"]

        # Verify doctor has access to this patient
        appts_res = (
            supabase.table("appointments")
            .select("id")
            .eq("doctor_id", current_user.sub)
            .eq("patient_id", patient_id)
            .execute()
        )
        if not appts_res.data:
            raise HTTPException(
                status_code=403, detail="Not authorized to review this scan"
            )

        # Update scan — only write columns that exist in the scans table
        # Real review columns: reviewed_by, reviewed_at, clinical_notes, diagnosis, recommendations
        update_data = {
            Col.Scans.REVIEWED_BY: current_user.sub,
            Col.Scans.REVIEWED_AT: datetime.now().isoformat(),
        }
        if payload.get("doctor_notes") or payload.get("clinical_notes"):
            update_data["clinical_notes"] = str(
                payload.get("doctor_notes") or payload.get("clinical_notes")
            )
        if payload.get("final_diagnosis") or payload.get("diagnosis"):
            update_data["diagnosis"] = str(
                payload.get("final_diagnosis") or payload.get("diagnosis")
            )
        if payload.get("recommended_action") or payload.get("recommendations"):
            update_data[Col.Scans.RECOMMENDATIONS] = str(
                payload.get("recommended_action") or payload.get("recommendations")
            )
        res = supabase.table("scans").update(update_data).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to update scan review")

        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review scan: {str(e)}")


@router.get("/ratings")
async def get_ratings(current_user: TokenPayload = Depends(get_current_doctor)):
    """Get ratings and reviews for the doctor."""
    try:
        # Get doctor's average rating from profile
        profile_res = (
            supabase.table(Tables.PROFILES_DOCTOR)
            .select(Col.ProfilesDoctor.RATING)
            .eq(Col.ProfilesDoctor.ID, current_user.sub)
            .execute()
        )
        average_rating = (
            profile_res.data[0][Col.ProfilesDoctor.RATING]
            if profile_res.data and profile_res.data[0].get(Col.ProfilesDoctor.RATING)
            else 0.0
        )

        # Get all appointments for this doctor
        appts_res = (
            supabase.table(Tables.APPOINTMENTS)
            .select(f"{Col.Appointments.ID}, {Col.Appointments.PATIENT_ID}")
            .eq(Col.Appointments.DOCTOR_ID, current_user.sub)
            .execute()
        )
        if not appts_res.data:
            return _default_ratings_payload(average_rating)

        appt_ids = [a[Col.Appointments.ID] for a in appts_res.data]
        # Build appointment→patient map
        appt_patient_map = {
            a[Col.Appointments.ID]: a.get(Col.Appointments.PATIENT_ID)
            for a in appts_res.data
        }

        # Fetch surveys — no FK join, use real columns only
        surveys_res = (
            supabase.table(Tables.FOLLOW_UP_SURVEYS)
            .select("*")
            .in_(Col.FollowUpSurveys.APPOINTMENT_ID, appt_ids)
            .order(Col.FollowUpSurveys.ANSWERED_AT, desc=True)
            .execute()
        )

        reviews = []
        rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

        for survey in surveys_res.data or []:
            patient_name = "Anonymous"
            rating = survey.get(Col.FollowUpSurveys.RATING, 5)
            if isinstance(rating, int) and rating in rating_counts:
                rating_counts[rating] += 1

            patient_id = appt_patient_map.get(
                survey.get(Col.FollowUpSurveys.APPOINTMENT_ID)
            )
            if patient_id:
                p_res = (
                    supabase.table(Tables.PROFILES_PATIENT)
                    .select(Col.ProfilesPatient.FULL_NAME)
                    .eq(Col.ProfilesPatient.ID, patient_id)
                    .execute()
                )
                if p_res.data:
                    patient_name = p_res.data[0].get(
                        Col.ProfilesPatient.FULL_NAME, "Anonymous"
                    )

            reviews.append(
                {
                    "id": survey[Col.FollowUpSurveys.ID],
                    "rating": rating,
                    "comment": survey.get(Col.FollowUpSurveys.RESPONSE)
                    or "No written feedback provided.",
                    "created_at": survey.get(Col.FollowUpSurveys.ANSWERED_AT),
                    "appointment_id": survey.get(Col.FollowUpSurveys.APPOINTMENT_ID),
                    "patient_name": patient_name,
                }
            )

        total_reviews = len(reviews)
        if total_reviews > 0:
            average_rating = round(sum(r["rating"] for r in reviews) / total_reviews, 1)
            supabase.table(Tables.PROFILES_DOCTOR).update(
                {Col.ProfilesDoctor.RATING: average_rating}
            ).eq(Col.ProfilesDoctor.ID, current_user.sub).execute()

        return {
            "stats": {
                "average_rating": average_rating,
                "total_reviews": total_reviews,
                "five_star": rating_counts[5],
                "four_star": rating_counts[4],
                "three_star": rating_counts[3],
                "two_star": rating_counts[2],
                "one_star": rating_counts[1],
            },
            "reviews": reviews,
        }
    except Exception as e:
        logger.error(f"Error fetching ratings: {e}")
        return _default_ratings_payload(0.0)


def _default_ratings_payload(avg: float):
    return {
        "stats": {
            "average_rating": avg,
            "total_reviews": 0,
            "five_star": 0,
            "four_star": 0,
            "three_star": 0,
            "two_star": 0,
            "one_star": 0,
        },
        "reviews": [],
    }


def _compute_revenue(
    appointments: list[dict[str, Any]],
    fee: int,
    today_start: datetime,
    week_start: datetime,
    month_start: datetime,
) -> dict[str, Any]:
    """Pure helper – operates only on typed inputs so the type checker is happy."""

    today_rev: int = 0
    week_rev: int = 0
    month_rev: int = 0
    total_rev: int = 0
    video_rev: int = 0
    inperson_rev: int = 0
    chart_data: list[dict[str, Any]] = []
    recent_transactions: list[dict[str, Any]] = []
    date_revenue_map: dict[str, int] = {}
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    last_month_rev: int = 0

    for apt in appointments:
        scheduled_at = str(apt.get("scheduled_at", ""))
        if not scheduled_at:
            continue
        apt_date = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))

        total_rev = total_rev + fee  # type: ignore
        if apt_date >= today_start:
            today_rev = today_rev + fee  # type: ignore
        if apt_date >= week_start:
            week_rev = week_rev + fee  # type: ignore
        if apt_date >= month_start:
            month_rev = month_rev + fee  # type: ignore

        if apt.get("consultation_type") == "video":
            video_rev = video_rev + fee  # type: ignore
        else:
            inperson_rev = inperson_rev + fee  # type: ignore

        date_key = apt_date.strftime("%Y-%m-%d")
        date_revenue_map[date_key] = date_revenue_map.get(date_key, 0) + fee  # type: ignore
        if last_month_start <= apt_date < month_start:
            last_month_rev = last_month_rev + fee  # type: ignore

    # Chart data for last 30 days
    for i in range(30):
        d = today_start - timedelta(days=29 - i)
        dk = d.strftime("%Y-%m-%d")
        chart_data.append(
            {"date": d.strftime("%b %d"), "revenue": date_revenue_map.get(dk, 0)}
        )

    # Recent transactions (last 10)
    sorted_appts = sorted(
        appointments, key=lambda x: str(x.get("scheduled_at", "")), reverse=True
    )
    recent_appts = [sorted_appts[i] for i in range(min(10, len(sorted_appts)))]

    return {
        "today_revenue": today_rev,
        "week_revenue": week_rev,
        "month_revenue": month_rev,
        "total_revenue": total_rev,
        "video_revenue": video_rev,
        "inperson_revenue": inperson_rev,
        "chart_data": chart_data,
        "recent_transactions": recent_transactions,
        "recent_appts": recent_appts,
        "last_month_revenue": last_month_rev,
    }


@router.get("/revenue")
async def get_revenue(
    period: str = "month", current_user: TokenPayload = Depends(get_current_doctor)
):
    """Get revenue statistics and breakdown for the doctor."""
    try:

        # Get doctor's consultation fee
        profile_res = (
            supabase.table("profiles_doctor")
            .select("consultation_fee")
            .eq("id", current_user.sub)
            .execute()
        )
        fee_raw = profile_res.data[0]["consultation_fee"] if profile_res.data else 500
        consultation_fee: int = int(fee_raw) if fee_raw is not None else 500

        # Calculate date ranges
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        # Get all completed appointments
        completed_appts = (
            supabase.table("appointments")
            .select("*")
            .eq("doctor_id", current_user.sub)
            .eq("status", "completed")
            .execute()
        )
        all_appointments: list[dict] = [dict(a) for a in (completed_appts.data or [])]  # type: ignore[arg-type]

        # Calculate revenue using helper
        stats = _compute_revenue(
            all_appointments, consultation_fee, today_start, week_start, month_start
        )

        growth_percentage: float = 0.0
        if stats["last_month_revenue"] > 0:
            val = (
                float(stats["month_revenue"] - stats["last_month_revenue"])
                / float(stats["last_month_revenue"])
                * 100.0
            )
            growth_percentage = round(val, 1)  # type: ignore

        # Build recent transactions with patient names
        recent_transactions: list[dict[str, Any]] = []
        recent_appts = stats.get("recent_appts", [])
        if isinstance(recent_appts, list) and recent_appts:
            patient_ids = [
                str(a.get("patient_id", ""))
                for a in recent_appts
                if isinstance(a, dict)
            ]
            patients_res = (
                supabase.table("profiles_patient")
                .select("id, full_name")
                .in_("id", patient_ids)
                .execute()
            )
            patients_map = (
                {p["id"]: p["full_name"] for p in patients_res.data}
                if patients_res.data
                else {}
            )

            for apt in recent_appts:
                if not isinstance(apt, dict):
                    continue
                recent_transactions.append(
                    {
                        "id": apt.get("id"),
                        "date": apt.get("scheduled_at"),
                        "patient_name": patients_map.get(
                            str(apt.get("patient_id", "")), "Unknown Patient"
                        ),
                        "type": (
                            "Video Call"
                            if apt.get("consultation_type") == "video"
                            else "In-Person"
                        ),
                        "status": apt.get("status"),
                        "amount": consultation_fee,
                    }
                )

        return {
            "stats": {
                "today": stats["today_revenue"],
                "week": stats["week_revenue"],
                "month": stats["month_revenue"],
                "total": stats["total_revenue"],
                "total_appointments": len(all_appointments),
                "completed_appointments": len(all_appointments),
                "average_per_appointment": consultation_fee,
                "growth_percentage": growth_percentage,
            },
            "chart_data": stats["chart_data"],
            "appointment_types": [
                {"name": "Video Consultations", "value": stats["video_revenue"]},
                {"name": "In-Person Visits", "value": stats["inperson_revenue"]},
            ],
            "recent_transactions": recent_transactions,
        }
    except Exception:
        # Return default data if there's an error
        return {
            "stats": {
                "today": 0,
                "week": 0,
                "month": 0,
                "total": 0,
                "total_appointments": 0,
                "completed_appointments": 0,
                "average_per_appointment": 500,
                "growth_percentage": 0,
            },
            "chart_data": [],
            "appointment_types": [],
            "recent_transactions": [],
        }


@router.post("/profile/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Upload profile avatar image to Supabase Storage."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Validate file size (max 5MB)
        contents = await file.read()  # Read file contents
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400, detail="File size must be less than 5MB"
            )

        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{current_user.sub}_{uuid.uuid4()}.{file_ext}"

        # Upload to Supabase Storage
        try:
            # Create bucket if it doesn't exist (will fail silently if exists)
            try:
                supabase.storage.create_bucket("avatars", options={"public": True})
            except Exception as e:
                logger.debug(f"Bucket creation skipped (may already exist): {e}")

            # Upload file
            supabase.storage.from_("avatars").upload(
                path=unique_filename,
                file=contents,
                file_options={"content-type": file.content_type},
            )

            # Get public URL
            public_url = supabase.storage.from_("avatars").get_public_url(
                unique_filename
            )

            # Update profile with avatar URL
            update_res = (
                supabase.table("profiles_doctor")
                .update({"avatar_url": public_url})
                .eq("id", current_user.sub)
                .execute()
            )

            if not update_res.data:
                raise HTTPException(
                    status_code=500, detail="Failed to update profile with avatar URL"
                )

            return {
                "success": True,
                "avatar_url": public_url,
                "message": "Avatar uploaded successfully",
            }

        except Exception as storage_err:
            logger.error(f"Storage error: {storage_err}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload to storage: {str(storage_err)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# PRESCRIPTION TEMPLATES
# ============================================


@router.get("/templates")
async def get_prescription_templates(
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get all prescription templates for current doctor."""
    try:
        res = (
            supabase.table("prescription_templates")
            .select("*")
            .eq("doctor_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/templates")
async def create_prescription_template(
    template: dict, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Create a new prescription template."""
    try:
        template_data = {
            "doctor_id": current_user.sub,
            "name": template.get("name"),
            "description": template.get("description", ""),
            "medications": template.get("medications", []),
            "instructions": template.get("instructions", ""),
            "is_public": template.get("is_public", False),
        }
        res = supabase.table("prescription_templates").insert(template_data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/templates/{template_id}")
async def update_prescription_template(
    template_id: str,
    template: dict,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Update a prescription template."""
    try:
        # Verify ownership
        existing = (
            supabase.table("prescription_templates")
            .select("id")
            .eq("id", template_id)
            .eq("doctor_id", current_user.sub)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Template not found")

        res = (
            supabase.table("prescription_templates")
            .update(template)
            .eq("id", template_id)
            .execute()
        )
        return res.data[0] if res.data else {}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/templates/{template_id}")
async def delete_prescription_template(
    template_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Delete a prescription template."""
    try:
        # Verify ownership
        existing = (
            supabase.table("prescription_templates")
            .select("id")
            .eq("id", template_id)
            .eq("doctor_id", current_user.sub)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Template not found")

        supabase.table("prescription_templates").delete().eq(
            "id", template_id
        ).execute()
        return {"message": "Template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/templates/{template_id}/use")
async def use_prescription_template(
    template_id: str,
    patient_id: str,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Create a prescription from a template."""
    try:
        # Get template
        template_res = (
            supabase.table("prescription_templates")
            .select("*")
            .eq("id", template_id)
            .execute()
        )
        if not template_res.data:
            raise HTTPException(status_code=404, detail="Template not found")

        template = template_res.data[0]

        # Create prescription
        prescription_data = {
            "patient_id": patient_id,
            "doctor_id": current_user.sub,
            "medications": template["medications"],
            "instructions": template["instructions"],
            "diagnosis": f"Prescribed using template: {template['name']}",
        }
        res = supabase.table("prescriptions").insert(prescription_data).execute()

        # Increment usage count
        supabase.table("prescription_templates").update(
            {"usage_count": template.get("usage_count", 0) + 1}
        ).eq("id", template_id).execute()

        return res.data[0] if res.data else {}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error using template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# FOLLOW-UP TEMPLATES
# ============================================


@router.get("/follow-up-templates")
async def get_follow_up_templates(
    current_user: TokenPayload = Depends(get_current_doctor),
):
    try:
        res = (
            supabase.table("follow_up_templates")
            .select("*")
            .eq("doctor_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/follow-up-templates")
async def create_follow_up_template(
    data: dict, current_user: TokenPayload = Depends(get_current_doctor)
):
    try:
        data["doctor_id"] = current_user.sub
        res = supabase.table("follow_up_templates").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/follow-up-templates/{template_id}")
async def update_follow_up_template(
    template_id: str,
    data: dict,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    try:
        res = (
            supabase.table("follow_up_templates")
            .update(data)
            .eq("id", template_id)
            .eq("doctor_id", current_user.sub)
            .execute()
        )
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/follow-up-templates/{template_id}")
async def delete_follow_up_template(
    template_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    try:
        supabase.table("follow_up_templates").delete().eq("id", template_id).eq(
            "doctor_id", current_user.sub
        ).execute()
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# PRO QUESTIONNAIRES
# ============================================


@router.get("/pro-questionnaires")
async def get_pro_questionnaires(
    current_user: TokenPayload = Depends(get_current_doctor),
):
    try:
        res = (
            supabase.table("pro_questionnaires")
            .select("*")
            .eq("doctor_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pro-questionnaires")
async def create_pro_questionnaire(
    data: dict, current_user: TokenPayload = Depends(get_current_doctor)
):
    try:
        data["doctor_id"] = current_user.sub
        res = supabase.table("pro_questionnaires").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/pro-questionnaires/{q_id}")
async def update_pro_questionnaire(
    q_id: str, data: dict, current_user: TokenPayload = Depends(get_current_doctor)
):
    try:
        res = (
            supabase.table("pro_questionnaires")
            .update(data)
            .eq("id", q_id)
            .eq("doctor_id", current_user.sub)
            .execute()
        )
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/pro-questionnaires/{q_id}")
async def delete_pro_questionnaire(
    q_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    try:
        supabase.table("pro_questionnaires").delete().eq("id", q_id).eq(
            "doctor_id", current_user.sub
        ).execute()
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patients/{patient_id}/pro-data")
async def get_patient_pro_data(
    patient_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Returns aggregated PRO submissions for a specific patient,
    joined with questionnaire templates."""
    try:
        # Basic check to ensure doctor has access to this patient could go here (e.g. check appointments)
        res = (
            supabase.table("pro_submissions")
            .select("*, pro_questionnaires(name)")
            .eq("patient_id", patient_id)
            .order("submitted_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.warning(
            f"Joined Supabase select failed, falling back to manual merge: {e}"
        )
        try:
            # Step 1: Fetch all submissions for the patient
            subs_res = (
                supabase.table("pro_submissions")
                .select("*")
                .eq("patient_id", patient_id)
                .order("submitted_at", desc=True)
                .execute()
            )
            submissions = subs_res.data or []
            if not submissions:
                return []

            # Step 2: Extract unique questionnaire IDs
            q_ids = list(
                {
                    s.get("questionnaire_id")
                    for s in submissions
                    if s.get("questionnaire_id")
                }
            )

            # Step 3: Fetch pro_questionnaires matching those IDs
            q_map = {}
            if q_ids:
                q_res = (
                    supabase.table("pro_questionnaires")
                    .select("id, name")
                    .in_("id", q_ids)
                    .execute()
                )
                if q_res.data:
                    for q in q_res.data:
                        if isinstance(q, dict) and "id" in q:
                            q_map[q["id"]] = q.get("name", "Unknown Questionnaire")

            # Step 4: Perform left join / merge in Python
            for s in submissions:
                qid = s.get("questionnaire_id")
                qname = q_map.get(qid, "Unknown Questionnaire")
                s["pro_questionnaires"] = {"name": qname}

            return submissions
        except Exception as fallback_err:
            logger.error(f"Fallback manual PRO merge failed: {fallback_err}")
            raise HTTPException(status_code=500, detail=str(fallback_err))
