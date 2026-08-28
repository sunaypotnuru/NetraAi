import uuid
import logging
from datetime import datetime
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Body,
    Query,
)
from typing import Optional, Dict, Any

from app.core.security import get_current_admin
from app.models.schemas import TokenPayload, UserRole
from app.services.supabase import supabase
from app.db.database import get_db  # noqa: F401
from app.services.analytics_service import get_analytics_service  # noqa: F401
from sqlalchemy.orm import Session  # noqa: F401

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])
public_router = APIRouter(prefix="/team", tags=["Team (Public)"])


@router.get("/settings")
async def get_admin_settings(current_user: TokenPayload = Depends(get_current_admin)):
    """Fetch platform settings for the admin portal."""
    from app.routes.settings import get_platform_settings

    return await get_platform_settings()


@router.put("/settings")
@router.post("/settings")
async def update_admin_settings(
    settings: Dict[str, Any] = Body(...),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Update platform settings from the admin portal."""
    from app.routes.settings import update_platform_settings

    return await update_platform_settings(settings, current_user)


@router.get("/stats")
async def get_platform_stats(current_user: TokenPayload = Depends(get_current_admin)):
    """Platform wide statistics overview using Supabase REST API."""
    try:
        from datetime import timedelta

        # 1. Core counts via Supabase REST (HTTPS â€” works from Docker)
        patient_count = 0
        doctor_count = 0
        appt_count = 0
        scan_count = 0
        completed_count = 0
        _ = 0  # pending_count placeholder  # noqa: F841

        try:
            r = supabase.table("profiles_patient").select("id", count="exact").execute()
            patient_count = r.count or 0
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        try:
            r = (
                supabase.table("users")
                .select("id", count="exact")
                .eq("role", "doctor")
                .execute()
            )
            if r.count is not None and r.count > 0:
                doctor_count = r.count
            else:
                r2 = (
                    supabase.table("profiles_doctor")
                    .select("id", count="exact")
                    .eq("is_verified", True)
                    .execute()
                )
                doctor_count = r2.count if (r2.count and r2.count > 0) else 1
        except Exception as e:
            logger.warning(f"Failed to get doctor count: {e}")
            doctor_count = 1

        try:
            r = supabase.table("appointments").select("id", count="exact").execute()
            appt_count = r.count or 0
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        try:
            r = supabase.table("scans").select("id", count="exact").execute()
            scan_count = r.count or 0
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        try:
            r = (
                supabase.table("appointments")
                .select("id", count="exact")
                .eq("status", "completed")
                .execute()
            )
            completed_count = r.count or 0
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        try:
            r = (
                supabase.table("appointments")
                .select("id", count="exact")
                .eq("status", "pending")
                .execute()
            )
            _ = r.count or 0  # noqa: F841
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        # 2. Growth data â€” build from current totals across current year months
        user_total = patient_count + doctor_count
        current_month_num = datetime.now().month
        all_months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        growth_data = []
        for i, month in enumerate(all_months[:current_month_num]):
            ratio = (i + 1) / current_month_num
            growth_data.append(
                {
                    "name": month,
                    "users": int(user_total * ratio),
                    "scans": int(scan_count * ratio),
                }
            )

        # 3. Weekly appointment trends via Supabase REST
        appointments_weekly = []
        try:
            for day_offset in range(6, -1, -1):
                day = datetime.now() - timedelta(days=day_offset)
                day_str = day.strftime("%Y-%m-%d")
                next_day_str = (day + timedelta(days=1)).strftime("%Y-%m-%d")
                cnt_r = (
                    supabase.table("appointments")
                    .select("id", count="exact")
                    .gte("created_at", day_str)
                    .lt("created_at", next_day_str)
                    .execute()
                )
                appointments_weekly.append(
                    {"name": day.strftime("%a"), "count": cnt_r.count or 0}
                )
        except Exception as trend_err:
            logger.warning(f"Could not build weekly trends: {trend_err}")

        # 4. Recent activity
        recent_activity = []
        try:
            latest_appts = (
                supabase.table("appointments")
                .select("patient_id, created_at, status")
                .order("created_at", desc=True)
                .limit(5)
                .execute()
            )
            patient_ids = list(
                set(
                    [
                        a.get("patient_id")
                        for a in latest_appts.data or []
                        if a.get("patient_id")
                    ]
                )
            )
            patient_map = {}
            if patient_ids:
                try:
                    pats_res = (
                        supabase.table("profiles_patient")
                        .select("id, full_name")
                        .in_("id", patient_ids)
                        .execute()
                    )
                    patient_map = {p["id"]: p["full_name"] for p in pats_res.data or []}
                except Exception as e:
                    logger.warning(f"Non-critical data fetch failed: {e}")

            for appt in latest_appts.data or []:
                name = patient_map.get(appt.get("patient_id"), "Unknown Patient")
                recent_activity.append(
                    {
                        "id": str(uuid.uuid4())[:8],
                        "user": name,
                        "action": f"Booked an appointment (Status: {appt.get('status', 'unknown')})",
                        "time": "Recently",
                        "type": "appointment",
                    }
                )
        except Exception as act_err:
            logger.warning(f"Could not load recent activity: {act_err}")

        return {
            "total_patients": patient_count,
            "total_doctors": doctor_count,
            "total_appointments": appt_count,
            "total_scans": scan_count,
            "growth_data": growth_data,
            "appointments_weekly": appointments_weekly,
            "recent_activity": recent_activity,
            "analytics_summary": {
                "new_users_30d": user_total,
                "completion_rate": (
                    round((completed_count / appt_count * 100), 1)
                    if appt_count > 0
                    else 0
                ),
                "avg_appointments_day": round(appt_count / 30, 1),
            },
        }
    except Exception as e:
        logger.error(f"Error in get_platform_stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/doctors/pending")
async def get_pending_doctors(current_user: TokenPayload = Depends(get_current_admin)):
    """List unverified doctors requiring admin approval."""
    res = (
        supabase.table("profiles_doctor")
        .select("*")
        .eq("verification_status", "pending")
        .neq("is_admin", True)
        .neq("email", "sunaypotnuru@gmail.com")
        .execute()
    )
    return res.data


@router.put("/doctors/{id}/verify")
async def verify_doctor(
    id: str, payload: dict, current_user: TokenPayload = Depends(get_current_admin)
):
    """Approve or revoke a doctor's profile verification.

    Both approve (verified=true) and reject/revoke (verified=false) update
    the is_verified flag and verification_status. Profiles are never deleted
    from this endpoint to prevent accidental data loss and foreign-key constraint failures.
    """
    status_payload = payload.get("verification_status")
    verified_payload = payload.get("verified")
    notes_payload = payload.get("verification_notes")

    if verified_payload is not None:
        verified = bool(verified_payload)
        status = "approved" if verified else "rejected"
    elif status_payload is not None:
        verified = status_payload in ["verified", "approved"]
        status = "approved" if verified else "rejected"
    else:
        verified = True
        status = "approved"

    update_data = {"is_verified": verified, "verification_status": status}
    if notes_payload is not None:
        update_data["verification_notes"] = notes_payload

    res = supabase.table("profiles_doctor").update(update_data).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return res.data[0]


@router.get("/message-contacts")
async def get_message_contacts(current_user: TokenPayload = Depends(get_current_admin)):
    """
    Lightweight endpoint that returns all platform users (patients + doctors)
    with only the fields needed for the messaging 'New Conversation' dialog.
    Intentionally avoids the heavy Supabase Auth admin per-user lookups used
    by /admin/users, making it fast and reliable even in Docker dev environments.
    """
    try:
        contacts = []

        # Fetch patients - only the columns needed for the contact picker
        try:
            p_res = (
                supabase.table("profiles_patient")
                .select("id, full_name, email, avatar_url")
                .execute()
            )
            for p in p_res.data or []:
                p["role"] = "patient"
                contacts.append(p)
        except Exception as pe:
            logger.warning(f"[message-contacts] Could not fetch patients: {pe}")

        # Fetch doctors
        try:
            d_res = (
                supabase.table("profiles_doctor")
                .select("id, full_name, email, avatar_url, specialty")
                .execute()
            )
            for d in d_res.data or []:
                if d.get("email") == "sunaypotnuru@gmail.com":
                    continue
                d["role"] = "doctor"
                d["specialization"] = d.get("specialty")  # normalise field name
                contacts.append(d)
        except Exception as de:
            logger.warning(f"[message-contacts] Could not fetch doctors: {de}")

        # Sort alphabetically by name
        contacts.sort(key=lambda x: (x.get("full_name") or "").lower())

        return {"contacts": contacts, "total": len(contacts)}
    except Exception as e:
        logger.error(f"[message-contacts] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{id}/role")
async def update_user_role(
    id: str, role: UserRole, current_user: TokenPayload = Depends(get_current_admin)
):
    """
    Update a user's role.
    Note: Supabase Auth metadata updates are strictly admin-only.
    """
    try:
        # We use supabase.auth.admin to update user metadata
        supabase.auth.admin.update_user_by_id(
            id, {"user_metadata": {"role": role.value}}
        )
        return {"message": f"Role updated to {role.value} successfully.", "user_id": id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_auth_metadata_batch(user_ids: list[str]) -> Dict[str, Any]:
    """
    Helper to fetch auth metadata for a batch of users.
    Avoids fetching the entire user list.
    """
    if not user_ids:
        return {}

    auth_map = {}
    try:
        # Supabase admin client doesn't support batch get_user by IDs efficiently
        # in some versions, but we can try to use list_users with a filter if supported,
        # or just fetch them individually if the batch is small (like pagination limit).
        # For now, we'll fetch them individually as it's safer for the admin client API.
        for uid in user_ids:
            try:
                auth_user = supabase.auth.admin.get_user_by_id(uid)
                if auth_user and hasattr(auth_user, "user"):
                    auth_map[uid] = auth_user.user
            except Exception as e:
                logger.debug(f"Failed to fetch auth metadata for user: {e}")
                continue
    except Exception as e:
        logger.warning(f"Failed to fetch auth metadata batch: {e}")

    return auth_map


@router.get("/patients")
async def get_all_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """List all patient profiles with enriched auth metadata."""
    try:
        # 1. Get total count
        count_res = (
            supabase.table("profiles_patient").select("id", count="exact").execute()
        )
        total = count_res.count or 0

        # 2. Get paginated profiles
        res = (
            supabase.table("profiles_patient")
            .select("*")
            .order("created_at", desc=True)
            .range((page - 1) * limit, page * limit - 1)
            .execute()
        )
        profiles = res.data or []
        user_ids = [p["id"] for p in profiles]

        # 3. Batch fetch auth metadata
        auth_users_map = await get_auth_metadata_batch(user_ids)

        # 4. Enrich
        enriched_patients = []
        for p in profiles:
            auth_user = auth_users_map.get(p["id"])
            metadata = getattr(auth_user, "user_metadata", {}) if auth_user else {}

            # Use metadata as fallback for phone
            p["phone"] = p.get("phone") or metadata.get("phone")
            p["role"] = metadata.get("role", "patient")
            enriched_patients.append(p)

        return {
            "patients": enriched_patients,
            "total": total,
            "page": page,
            "limit": limit,
        }
    except Exception as e:
        logger.error(f"Error in get_all_patients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patients/{id}")
async def get_patient_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific patient."""
    try:
        # Get patient profile
        patient_res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("id", id)
            .single()
            .execute()
        )
        if not patient_res.data:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Get patient's appointments
        appts_res = (
            supabase.table("appointments").select("*").eq("patient_id", id).execute()
        )

        # Get patient's scans
        scans_res = supabase.table("scans").select("*").eq("patient_id", id).execute()

        # Get auth info for metadata (phone, etc)
        phone = patient_res.data.get("phone")
        try:
            auth_user = supabase.auth.admin.get_user_by_id(id)
            if auth_user and hasattr(auth_user, "user"):
                metadata = auth_user.user.user_metadata or {}
                phone = metadata.get("phone") or phone
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        profile_data = patient_res.data
        profile_data["phone"] = phone

        return {
            "profile": profile_data,
            "appointments": appts_res.data,
            "scans": scans_res.data,
            "total_appointments": len(appts_res.data),
            "total_scans": len(scans_res.data),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/doctors")
async def get_all_doctors(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """List all doctor profiles with enriched auth metadata."""
    try:
        # 1. Get total count
        count_res = (
            supabase.table("profiles_doctor")
            .select("id", count="exact")
            .neq("is_admin", True)
            .neq("email", "sunaypotnuru@gmail.com")
            .execute()
        )
        total = count_res.count or 0

        # 2. Get paginated profiles
        res = (
            supabase.table("profiles_doctor")
            .select("*")
            .neq("is_admin", True)
            .neq("email", "sunaypotnuru@gmail.com")
            .order("created_at", desc=True)
            .range((page - 1) * limit, page * limit - 1)
            .execute()
        )
        profiles = res.data or []
        user_ids = [d["id"] for d in profiles]

        # 3. Batch fetch auth metadata
        auth_users_map = await get_auth_metadata_batch(user_ids)

        # 4. Enrich
        enriched_doctors = []
        for d in profiles:
            auth_user = auth_users_map.get(d["id"])
            metadata = getattr(auth_user, "user_metadata", {}) if auth_user else {}

            d["phone"] = d.get("phone") or metadata.get("phone")
            enriched_doctors.append(d)

        return {
            "doctors": enriched_doctors,
            "total": total,
            "page": page,
            "limit": limit,
        }
    except Exception as e:
        logger.error(f"Error in get_all_doctors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/doctors/{id}")
async def get_doctor_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific doctor."""
    try:
        # Get doctor profile
        doctor_res = (
            supabase.table("profiles_doctor")
            .select("*")
            .eq("id", id)
            .single()
            .execute()
        )
        if not doctor_res.data:
            raise HTTPException(status_code=404, detail="Doctor not found")

        # Get doctor's appointments
        appts_res = (
            supabase.table("appointments").select("*").eq("doctor_id", id).execute()
        )

        # Get doctor's ratings
        ratings_res = (
            supabase.table("ratings").select("*").eq("doctor_id", id).execute()
        )

        return {
            "profile": doctor_res.data,
            "appointments": appts_res.data,
            "ratings": ratings_res.data,
            "total_appointments": len(appts_res.data),
            "average_rating": (
                sum(r.get("rating", 0) for r in ratings_res.data)
                / len(ratings_res.data)
                if ratings_res.data
                else 0
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/appointments")
async def get_all_appointments(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """List all platform appointments using Supabase REST API."""
    try:
        query = supabase.table("appointments").select("*", count="exact")

        if status and status != "all":
            query = query.eq("status", status)

        # Basic pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1).order("created_at", desc=True)

        res = query.execute()

        appointments = res.data or []
        total = res.count or 0

        # Enrich appointments with patient and doctor details in Python (avoid schema join cache errors)
        if appointments:
            patient_ids = list(
                set([a["patient_id"] for a in appointments if a.get("patient_id")])
            )
            doctor_ids = list(
                set([a["doctor_id"] for a in appointments if a.get("doctor_id")])
            )

            patients_map = {}
            if patient_ids:
                try:
                    pats_res = (
                        supabase.table("profiles_patient")
                        .select("id, full_name, email")
                        .in_("id", patient_ids)
                        .execute()
                    )
                    patients_map = {p["id"]: p for p in pats_res.data or []}
                except Exception as pat_err:
                    logger.warning(
                        f"Could not load profiles_patient in appointments enrich: {pat_err}"
                    )

            doctors_map = {}
            if doctor_ids:
                try:
                    docs_res = (
                        supabase.table("profiles_doctor")
                        .select("id, full_name, specialty, consultation_fee")
                        .in_("id", doctor_ids)
                        .execute()
                    )
                    doctors_map = {d["id"]: d for d in docs_res.data or []}
                except Exception as doc_err:
                    logger.warning(
                        f"Could not load profiles_doctor in appointments enrich: {doc_err}"
                    )

            for a in appointments:
                a["profiles_patient"] = patients_map.get(a.get("patient_id"), {})
                a["profiles_doctor"] = doctors_map.get(a.get("doctor_id"), {})

        # In-memory search fallback for text matching (since ILIKE on joined tables is complex via REST)
        if search:
            search_lower = search.lower()
            appointments = [
                a
                for a in appointments
                if search_lower
                in (a.get("profiles_patient", {}).get("full_name") or "").lower()
                or search_lower
                in (a.get("profiles_doctor", {}).get("full_name") or "").lower()
                or search_lower in (a.get("type") or "").lower()
                or search_lower in str(a.get("id")).lower()
            ]
            total = len(appointments)  # Re-adjust total for filtered view

        return {
            "appointments": appointments,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if total > 0 else 0,
            "stats": {
                "total": total,
                "pending": len(
                    [a for a in appointments if a.get("status") == "pending"]
                ),
                "completed": len(
                    [a for a in appointments if a.get("status") == "completed"]
                ),
                "cancelled": len(
                    [a for a in appointments if a.get("status") == "cancelled"]
                ),
            },
        }
    except Exception as e:
        logger.error(f"Failed to fetch appointments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/waitlist")
async def get_waitlisted_appointments(
    current_user: TokenPayload = Depends(get_current_admin),
):
    """List all waitlisted appointments."""
    res = (
        supabase.table("appointments")
        .select("*")
        .eq("status", "waitlist")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.get("/appointments/{id}")
async def get_appointment_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific appointment."""
    try:
        # Get appointment
        appt_res = (
            supabase.table("appointments").select("*").eq("id", id).single().execute()
        )
        if not appt_res.data:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Get patient info
        patient_res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("id", appt_res.data["patient_id"])
            .single()
            .execute()
        )

        # Get doctor info
        doctor_res = (
            supabase.table("profiles_doctor")
            .select("*")
            .eq("id", appt_res.data["doctor_id"])
            .single()
            .execute()
        )

        return {
            "appointment": appt_res.data,
            "patient": patient_res.data if patient_res.data else None,
            "doctor": doctor_res.data if doctor_res.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scans")
async def get_all_scans(
    search: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """List all AI scans performed on the platform using Supabase REST API."""
    try:
        query = supabase.table("scans").select("*", count="exact")

        # Basic pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1).order("created_at", desc=True)

        res = query.execute()

        scans = res.data or []
        total = res.count or 0

        # Enrich scans with patient info (avoid schema join cache errors)
        if scans:
            patient_ids = list(
                set([s["patient_id"] for s in scans if s.get("patient_id")])
            )
            patients_map = {}
            if patient_ids:
                try:
                    pats_res = (
                        supabase.table("profiles_patient")
                        .select("id, full_name")
                        .in_("id", patient_ids)
                        .execute()
                    )
                    patients_map = {p["id"]: p for p in pats_res.data or []}
                except Exception as pat_err:
                    logger.warning(
                        f"Could not load profiles_patient in scans enrich: {pat_err}"
                    )

            for s in scans:
                s["profiles_patient"] = patients_map.get(s.get("patient_id"), {})

        # In-memory filtering for search and risk (similar to appointments)
        if search or (risk and risk != "All"):
            search_lower = search.lower() if search else ""
            risk_lower = risk.lower() if risk and risk != "All" else ""

            filtered_scans = []
            for s in scans:
                # Risk filter
                prediction = str(s.get("prediction", "")).lower()
                severity = str(s.get("severity", "")).lower()
                if risk_lower and not (
                    risk_lower in prediction or risk_lower in severity
                ):
                    continue

                # Search filter
                patient_name = str(
                    s.get("profiles_patient", {}).get("full_name") or ""
                ).lower()
                scan_id = str(s.get("id", "")).lower()

                if search_lower and not (
                    search_lower in patient_name
                    or search_lower in prediction
                    or search_lower in scan_id
                ):
                    continue

                filtered_scans.append(s)

            scans = filtered_scans
            total = len(scans)  # Re-adjust total for filtered view

        return {
            "scans": scans,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if total > 0 else 0,
            "stats": {
                "total": total,
                "high_risk": len(
                    [s for s in scans if "high" in str(s.get("prediction", "")).lower()]
                ),
                "normal": len(
                    [
                        s
                        for s in scans
                        if "normal" in str(s.get("prediction", "")).lower()
                    ]
                ),
            },
        }
    except Exception as e:
        logger.error(f"Error fetching scans: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scans/{id}")
async def get_scan_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific scan."""
    try:
        scan_res = supabase.table("scans").select("*").eq("id", id).single().execute()
        if not scan_res.data:
            raise HTTPException(status_code=404, detail="Scan not found")
        patient_res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("id", scan_res.data["patient_id"])
            .single()
            .execute()
        )
        return {
            "scan": scan_res.data,
            "patient": patient_res.data if patient_res.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
async def get_all_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """List all platform users using Supabase REST API."""
    try:
        user_list = []

        # Fetch patients
        if not role or role == "patient" or role == "all":
            p_res = supabase.table("profiles_patient").select("*").execute()
            for p in p_res.data or []:
                p["role"] = "patient"
                user_list.append(p)

        # Fetch doctors
        if not role or role == "doctor" or role == "all":
            d_res = supabase.table("profiles_doctor").select("*").execute()
            for d in d_res.data or []:
                d["role"] = "doctor"
                user_list.append(d)

        # In-memory filtering for search
        if search:
            search_lower = search.lower()
            user_list = [
                u
                for u in user_list
                if search_lower in (u.get("full_name") or "").lower()
                or search_lower in (u.get("email") or "").lower()
            ]

        # Sorting
        sort_field = "created_at"
        reverse = True
        if sort:
            reverse = sort.startswith("-")
            field = sort.lstrip("-")
            if field == "name":
                sort_field = "full_name"
            elif field == "date":
                sort_field = "created_at"
            else:
                sort_field = field

        user_list.sort(key=lambda x: str(x.get(sort_field) or ""), reverse=reverse)

        total = len(user_list)

        # Pagination
        offset = (page - 1) * limit
        paginated_users = user_list[offset : offset + limit]

        # Enrich with auth metadata (batch fetch)
        user_ids = [u["id"] for u in paginated_users if "id" in u]
        auth_users_map = await get_auth_metadata_batch(user_ids)

        for u in paginated_users:
            auth_user = auth_users_map.get(u["id"])
            if auth_user:
                u["last_login"] = getattr(auth_user, "last_sign_in_at", None)

            # Status mapping (simplified for view)
            u["status"] = "active"

        return {
            "users": paginated_users,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if total > 0 else 0,
            "stats": {
                "total": total,
                "patients": len([u for u in user_list if u.get("role") == "patient"]),
                "doctors": len([u for u in user_list if u.get("role") == "doctor"]),
            },
        }
    except Exception as e:
        logger.error(f"Failed to fetch users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{id}")
async def get_user_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific user."""
    try:
        # Try to get from patient table first
        try:
            patient_res = (
                supabase.table("profiles_patient")
                .select("*")
                .eq("id", id)
                .single()
                .execute()
            )
            if patient_res.data:
                profile = patient_res.data
                role = "patient"

                # Get appointments
                appts_res = (
                    supabase.table("appointments")
                    .select("*")
                    .eq("patient_id", id)
                    .execute()
                )

                # Get scans
                scans_res = (
                    supabase.table("scans").select("*").eq("patient_id", id).execute()
                )

                return {
                    "id": id,
                    "role": role,
                    "profile": profile,
                    "appointments": appts_res.data or [],
                    "scans": scans_res.data or [],
                    "total_appointments": len(appts_res.data or []),
                    "total_scans": len(scans_res.data or []),
                }
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        # Try doctor table
        try:
            doctor_res = (
                supabase.table("profiles_doctor")
                .select("*")
                .eq("id", id)
                .single()
                .execute()
            )
            if doctor_res.data:
                profile = doctor_res.data
                role = "doctor"

                # Get appointments
                appts_res = (
                    supabase.table("appointments")
                    .select("*")
                    .eq("doctor_id", id)
                    .execute()
                )

                # Get ratings
                ratings_res = (
                    supabase.table("ratings").select("*").eq("doctor_id", id).execute()
                )

                return {
                    "id": id,
                    "role": role,
                    "profile": profile,
                    "appointments": appts_res.data or [],
                    "ratings": ratings_res.data or [],
                    "total_appointments": len(appts_res.data or []),
                    "average_rating": (
                        sum(r.get("rating", 0) for r in ratings_res.data or [])
                        / len(ratings_res.data or [])
                        if ratings_res.data
                        else 0
                    ),
                }
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch user detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{id}")
async def update_user(
    id: str,
    payload: dict = Body(...),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Update user information."""
    try:
        # Determine user role
        role = payload.get("role")

        if not role:
            # Try to detect role
            patient_res = (
                supabase.table("profiles_patient").select("id").eq("id", id).execute()
            )
            if patient_res.data:
                role = "patient"
            else:
                doctor_res = (
                    supabase.table("profiles_doctor")
                    .select("id")
                    .eq("id", id)
                    .execute()
                )
                if doctor_res.data:
                    role = "doctor"

        if not role:
            raise HTTPException(status_code=404, detail="User not found")

        # Update profile based on role
        update_data = {}
        if "full_name" in payload:
            update_data["full_name"] = payload["full_name"]
        if "email" in payload:
            update_data["email"] = payload["email"]
        if "phone" in payload:
            update_data["phone"] = payload["phone"]
        if "status" in payload:
            if role == "patient":
                update_data["is_deleted"] = payload["status"] != "active"
            elif role == "doctor":
                update_data["is_verified"] = payload["status"] == "active"

        if update_data:
            table = "profiles_patient" if role == "patient" else "profiles_doctor"
            res = supabase.table(table).update(update_data).eq("id", id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
            return res.data[0]

        return {"message": "No updates provided"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{id}")
async def delete_user(id: str, current_user: TokenPayload = Depends(get_current_admin)):
    """Delete a user (soft delete)."""
    try:
        # Try patient first
        try:
            res = (
                supabase.table("profiles_patient")
                .update({"is_deleted": True})
                .eq("id", id)
                .execute()
            )
            if res.data:
                return {"success": True, "message": "User deleted successfully"}
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        # Try doctor
        try:
            res = (
                supabase.table("profiles_doctor")
                .update({"is_verified": False, "is_deleted": True})
                .eq("id", id)
                .execute()
            )
            if res.data:
                return {"success": True, "message": "User deleted successfully"}
        except Exception as e:
            logger.warning(f"Non-critical data fetch failed: {e}")

        raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews")
async def get_all_reviews(
    rating: Optional[int] = Query(None, ge=1, le=5),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Get all ratings and reviews from patients with improved filtering, pagination and global stats."""
    try:
        # 1. Build base query
        query = supabase.table("follow_up_surveys").select("*", count="exact")

        if rating:
            query = query.eq("rating", rating)

        res = query.execute()
        all_surveys = res.data or []
        total = len(all_surveys)

        # 2. Paginate
        start = (page - 1) * limit
        end = start + limit
        surveys_slice = all_surveys[start:end]

        if not surveys_slice:
            return {
                "reviews": [],
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit if total > 0 else 0,
                "stats": {
                    "average_rating": 0,
                    "rating_distribution": {str(i): 0 for i in range(1, 6)},
                },
            }

        # 3. Batch fetch related data for the slice
        patient_ids = list(
            set([s["patient_id"] for s in surveys_slice if s.get("patient_id")])
        )
        doctor_ids = list(
            set([s["doctor_id"] for s in surveys_slice if s.get("doctor_id")])
        )
        appointment_ids = list(
            set([s["appointment_id"] for s in surveys_slice if s.get("appointment_id")])
        )

        patient_map = {}
        if patient_ids:
            p_res = (
                supabase.table("profiles_patient")
                .select("id, full_name, email")
                .in_("id", patient_ids)
                .execute()
            )
            patient_map = {p["id"]: p for p in p_res.data or []}

        doctor_map = {}
        if doctor_ids:
            d_res = (
                supabase.table("profiles_doctor")
                .select("id, full_name, specialty")
                .in_("id", doctor_ids)
                .execute()
            )
            doctor_map = {d["id"]: d for d in d_res.data or []}

        appointment_map = {}
        if appointment_ids:
            a_res = (
                supabase.table("appointments")
                .select("id, scheduled_at, type, status")
                .in_("id", appointment_ids)
                .execute()
            )
            appointment_map = {a["id"]: a for a in a_res.data or []}

        # 4. Enrich
        enriched_ratings = []
        for survey in surveys_slice:
            patient = patient_map.get(survey["patient_id"], {})
            doctor = doctor_map.get(survey["doctor_id"], {})
            appointment = appointment_map.get(survey.get("appointment_id"), {})

            enriched_ratings.append(
                {
                    "id": survey.get("id"),
                    "patient_id": survey.get("patient_id"),
                    "doctor_id": survey.get("doctor_id"),
                    "appointment_id": survey.get("appointment_id"),
                    "rating": survey.get("rating", 0),
                    "review": survey.get("response", ""),
                    "created_at": survey.get("answered_at"),
                    "patient_name": patient.get("full_name", "Unknown Patient"),
                    "patient_email": patient.get("email"),
                    "doctor_name": doctor.get("full_name", "Unknown Doctor"),
                    "doctor_specialty": doctor.get("specialty"),
                    "appointment": appointment if appointment else None,
                }
            )

        # 5. Calculate global stats from ALL matches
        all_ratings = [s.get("rating", 0) for s in all_surveys]
        avg_rating = sum(all_ratings) / len(all_ratings) if all_ratings else 0
        distribution = {str(i): 0 for i in range(1, 6)}
        for r in all_ratings:
            if 1 <= r <= 5:
                distribution[str(r)] += 1

        return {
            "reviews": enriched_ratings,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if total > 0 else 0,
            "stats": {
                "average_rating": round(avg_rating, 1),
                "rating_distribution": distribution,
            },
        }
    except Exception as e:
        logger.error(f"Error fetching reviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/reviews/{id}")
async def delete_review(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Delete a review (admin only)."""
    try:
        # Delete from follow_up_surveys table (where reviews are actually stored)
        result = supabase.table("follow_up_surveys").delete().eq("id", id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Review not found")
        return {"success": True, "message": "Review deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete review: {str(e)}"
        )


@public_router.get("")
async def get_team_members_public():
    """Publicly accessible endpoint to list all active team members."""
    try:
        res = (
            supabase.table("team_members")
            .select("*")
            .eq("is_active", True)
            .order("created_at", desc=False)
            .execute()
        )
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team")
async def get_team_members(current_user: TokenPayload = Depends(get_current_admin)):
    """List all team members (admin only)."""
    try:
        res = (
            supabase.table("team_members")
            .select("*")
            .order("created_at", desc=False)
            .execute()
        )
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/team")
async def create_team_member(
    name: str = Form(...),
    role: str = Form(...),
    bio: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    is_active: bool = Form(True),
    avatar: Optional[UploadFile] = File(None),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Create a new team member with optional avatar upload."""
    try:
        avatar_url = None
        if avatar:
            contents = await avatar.read()
            file_ext = (
                avatar.filename.split(".")[-1] if "." in avatar.filename else "jpg"
            )
            unique_name = f"team/{uuid.uuid4()}.{file_ext}"
            try:
                supabase.storage.create_bucket("avatars", options={"public": True})
            except Exception as e:
                logger.warning(
                    f"Non-critical data fetch failed: {e}"
                )  # Bucket may already exist
            supabase.storage.from_("avatars").upload(
                path=unique_name,
                file=contents,
                file_options={"content-type": avatar.content_type},
            )
            avatar_url = supabase.storage.from_("avatars").get_public_url(unique_name)

        data = {
            "name": name,
            "role": role,
            "bio": bio,
            "linkedin_url": linkedin_url,
            "is_active": is_active,
            "avatar_url": avatar_url,
        }
        res = supabase.table("team_members").insert(data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/team/{id}")
async def update_team_member(
    id: str,
    name: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Update a team member."""
    try:
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if role is not None:
            update_data["role"] = role
        if bio is not None:
            update_data["bio"] = bio
        if linkedin_url is not None:
            update_data["linkedin_url"] = linkedin_url
        if is_active is not None:
            update_data["is_active"] = str(is_active)

        if avatar:
            contents = await avatar.read()
            file_ext = (
                avatar.filename.split(".")[-1] if "." in avatar.filename else "jpg"
            )
            unique_name = f"team/{id}_{uuid.uuid4()}.{file_ext}"
            try:
                supabase.storage.create_bucket("avatars", options={"public": True})
            except Exception as e:
                logger.warning(
                    f"Non-critical data fetch failed: {e}"
                )  # Bucket may already exist
            supabase.storage.from_("avatars").upload(
                path=unique_name,
                file=contents,
                file_options={"content-type": avatar.content_type},
            )
            update_data["avatar_url"] = (
                supabase.storage.from_("avatars")
                .get_public_url(unique_name)
                .split("?")[0]
            )

        res = supabase.table("team_members").update(update_data).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Team member not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/team/{id}")
async def delete_team_member(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Delete a team member."""
    try:
        res = supabase.table("team_members").delete().eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Team member not found")
        return {"success": True, "message": "Team member deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# â”€â”€â”€ Payment Management Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


@router.get("/payments")
async def get_all_payments(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """
    List all payment transactions with corrected filtering and pagination.
    """
    try:
        # 1. Build base query with status filter
        query = supabase.table("payments").select("*", count="exact")
        if status and status != "all":
            query = query.eq("status", status)

        if sort:
            reverse = sort.startswith("-")
            sort_field = sort.lstrip("-")
            query = query.order(sort_field, desc=reverse)
        else:
            query = query.order("created_at", desc=True)

        res = query.execute()
        all_payments = res.data or []

        # 2. Batch fetch patient and doctor names for all potential matches
        patient_ids = list(
            set([p["patient_id"] for p in all_payments if p.get("patient_id")])
        )
        doctor_ids = list(
            set([p["doctor_id"] for p in all_payments if p.get("doctor_id")])
        )

        patient_map = {}
        if patient_ids:
            p_res = (
                supabase.table("profiles_patient")
                .select("id, full_name")
                .in_("id", patient_ids)
                .execute()
            )
            patient_map = {p["id"]: p["full_name"] for p in p_res.data or []}

        doctor_map = {}
        if doctor_ids:
            d_res = (
                supabase.table("profiles_doctor")
                .select("id, full_name")
                .in_("id", doctor_ids)
                .execute()
            )
            doctor_map = {d["id"]: d["full_name"] for d in d_res.data or []}

        # 3. Enrich and Filter
        enriched_payments = []
        for p in all_payments:
            p["patient_name"] = patient_map.get(p.get("patient_id"), "Unknown Patient")
            p["doctor_name"] = doctor_map.get(p.get("doctor_id"), "Unknown Doctor")

            if search:
                search_lower = search.lower()
                if (
                    search_lower in p["patient_name"].lower()
                    or search_lower in p["doctor_name"].lower()
                    or search_lower in (p.get("razorpay_payment_id") or "").lower()
                    or search_lower in (p.get("razorpay_order_id") or "").lower()
                ):
                    enriched_payments.append(p)
            else:
                enriched_payments.append(p)

        total = len(enriched_payments)

        # 4. Paginate
        start = (page - 1) * limit
        end = start + limit
        paginated_payments = enriched_payments[start:end]

        # 5. Global Stats from ALL matches
        stats = {
            "total_revenue": sum(
                p.get("amount", 0)
                for p in enriched_payments
                if p.get("status") == "success"
            ),
            "successful": len(
                [p for p in enriched_payments if p.get("status") == "success"]
            ),
            "pending": len(
                [p for p in enriched_payments if p.get("status") == "pending"]
            ),
        }

        return {
            "payments": paginated_payments,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if total > 0 else 0,
            "stats": stats,
        }
    except Exception as e:
        logger.error(f"Failed to fetch payments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments/{id}")
async def get_payment_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific payment."""
    try:
        # Get payment
        try:
            payment_res = (
                supabase.table("payments").select("*").eq("id", id).single().execute()
            )
            if not payment_res.data:
                raise HTTPException(status_code=404, detail="Payment not found")
            payment = payment_res.data
        except Exception as e:
            logger.error(f"Payment not found: {e}")
            raise HTTPException(status_code=404, detail="Payment not found")

        # Get patient info
        patient_id = payment.get("patient_id")
        patient = None
        if patient_id:
            try:
                patient_res = (
                    supabase.table("profiles_patient")
                    .select("*")
                    .eq("id", patient_id)
                    .single()
                    .execute()
                )
                patient = patient_res.data
            except Exception as e:
                logger.warning(f"Non-critical data fetch failed: {e}")

        # Get doctor info
        doctor_id = payment.get("doctor_id")
        doctor = None
        if doctor_id:
            try:
                doctor_res = (
                    supabase.table("profiles_doctor")
                    .select("*")
                    .eq("id", doctor_id)
                    .single()
                    .execute()
                )
                doctor = doctor_res.data
            except Exception as e:
                logger.warning(f"Non-critical data fetch failed: {e}")

        # Get appointment info
        appointment_id = payment.get("appointment_id")
        appointment = None
        if appointment_id:
            try:
                appointment_res = (
                    supabase.table("appointments")
                    .select("*")
                    .eq("id", appointment_id)
                    .single()
                    .execute()
                )
                appointment = appointment_res.data
            except Exception as e:
                logger.warning(f"Non-critical data fetch failed: {e}")

        # Get refund history
        try:
            refunds_res = (
                supabase.table("refunds").select("*").eq("payment_id", id).execute()
            )
            refunds = refunds_res.data or []
        except Exception as e:
            logger.warning(f"Failed to fetch refunds: {e}")
            refunds = []

        return {
            "payment": payment,
            "patient": patient,
            "doctor": doctor,
            "appointment": appointment,
            "refunds": refunds,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch payment detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payments/{id}/refund")
async def process_refund(
    id: str,
    payload: dict = Body(...),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Process a refund for a payment."""
    try:
        # Get payment
        try:
            payment_res = (
                supabase.table("payments").select("*").eq("id", id).single().execute()
            )
            if not payment_res.data:
                raise HTTPException(status_code=404, detail="Payment not found")
            payment = payment_res.data
        except Exception as e:
            logger.error(f"Payment not found: {e}")
            raise HTTPException(status_code=404, detail="Payment not found")

        # Check if already refunded
        if payment.get("status") == "refunded":
            raise HTTPException(status_code=400, detail="Payment already refunded")

        # Create refund record
        refund_amount = payload.get("amount", payment.get("amount", 0))
        refund_reason = payload.get("reason", "Admin initiated refund")

        try:
            refund_data = {
                "payment_id": id,
                "patient_id": payment.get("patient_id"),
                "doctor_id": payment.get("doctor_id"),
                "appointment_id": payment.get("appointment_id"),
                "amount": refund_amount,
                "reason": refund_reason,
                "status": "approved",
                "processed_by": current_user.sub,
                "processed_at": datetime.now().isoformat(),
            }

            refund_res = supabase.table("refunds").insert(refund_data).execute()

            # Update payment status
            supabase.table("payments").update({"status": "refunded"}).eq(
                "id", id
            ).execute()

            return {
                "success": True,
                "message": "Refund processed successfully",
                "refund": refund_res.data[0] if refund_res.data else refund_data,
            }
        except Exception as e:
            logger.error(f"Failed to create refund record: {e}")
            # If refunds table doesn't exist, just update payment status
            supabase.table("payments").update({"status": "refunded"}).eq(
                "id", id
            ).execute()
            return {
                "success": True,
                "message": "Refund processed successfully (refunds table not available)",
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process refund: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# â”€â”€â”€ Refund Management Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


@router.get("/refunds")
async def get_all_refunds(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """
    List all refund requests with corrected filtering and pagination.
    """
    try:
        # 1. Build base query with status filter
        query = supabase.table("refunds").select("*", count="exact")
        if status and status != "all":
            query = query.eq("status", status)

        if sort:
            reverse = sort.startswith("-")
            sort_field = sort.lstrip("-")
            query = query.order(sort_field, desc=reverse)
        else:
            query = query.order("created_at", desc=True)

        res = query.execute()
        refunds = res.data or []

        # 2. Batch fetch patient names and payment info for all potential matches
        patient_ids = list(
            set([r["patient_id"] for r in refunds if r.get("patient_id")])
        )
        payment_ids = list(
            set([r["payment_id"] for r in refunds if r.get("payment_id")])
        )

        patient_map = {}
        if patient_ids:
            p_res = (
                supabase.table("profiles_patient")
                .select("id, full_name")
                .in_("id", patient_ids)
                .execute()
            )
            patient_map = {p["id"]: p["full_name"] for p in p_res.data or []}

        payment_map = {}
        if payment_ids:
            py_res = (
                supabase.table("payments")
                .select("id, razorpay_payment_id, razorpay_order_id")
                .in_("id", payment_ids)
                .execute()
            )
            payment_map = {py["id"]: py for py in py_res.data or []}

        # 3. Enrich and Filter
        enriched_refunds = []
        for r in refunds:
            r["patient_name"] = patient_map.get(r.get("patient_id"), "Unknown Patient")
            r["payment_info"] = payment_map.get(r.get("payment_id"))

            if search:
                search_lower = search.lower()
                if (
                    search_lower in r["patient_name"].lower()
                    or search_lower in (r.get("reason") or "").lower()
                    or (
                        r["payment_info"]
                        and (
                            search_lower
                            in (
                                r["payment_info"].get("razorpay_payment_id") or ""
                            ).lower()
                            or search_lower
                            in (
                                r["payment_info"].get("razorpay_order_id") or ""
                            ).lower()
                        )
                    )
                ):
                    enriched_refunds.append(r)
            else:
                enriched_refunds.append(r)

        total = len(enriched_refunds)

        # 4. Paginate the enriched/filtered results
        start = (page - 1) * limit
        end = start + limit
        paginated_refunds = enriched_refunds[start:end]

        return {
            "refunds": paginated_refunds,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if total > 0 else 0,
            "stats": {
                "total_refunded": sum(
                    r.get("amount", 0)
                    for r in enriched_refunds
                    if r.get("status") == "approved"
                ),
                "processed": len(
                    [r for r in enriched_refunds if r.get("status") == "approved"]
                ),
                "pending": len(
                    [r for r in enriched_refunds if r.get("status") == "pending"]
                ),
            },
        }
    except Exception as e:
        logger.error(f"Failed to fetch refunds: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/refunds/{id}/approve")
async def approve_refund(
    id: str,
    payload: dict = Body(...),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Approve a refund request."""
    try:
        # Get refund
        try:
            refund_res = (
                supabase.table("refunds").select("*").eq("id", id).single().execute()
            )
            if not refund_res.data:
                raise HTTPException(status_code=404, detail="Refund not found")
            refund = refund_res.data
        except Exception as e:
            logger.error(f"Refund not found: {e}")
            raise HTTPException(status_code=404, detail="Refund not found")

        # Check if already processed
        if refund.get("status") != "pending":
            raise HTTPException(status_code=400, detail="Refund already processed")

        # Update refund status
        update_data = {
            "status": "approved",
            "processed_by": current_user.sub,
            "processed_at": datetime.now().isoformat(),
            "admin_notes": payload.get("notes", ""),
        }

        res = supabase.table("refunds").update(update_data).eq("id", id).execute()

        # Update payment status
        payment_id = refund.get("payment_id")
        if payment_id:
            try:
                supabase.table("payments").update({"status": "refunded"}).eq(
                    "id", payment_id
                ).execute()
            except Exception as e:
                logger.warning(f"Failed to update payment status: {e}")

        return {
            "success": True,
            "message": "Refund approved successfully",
            "refund": res.data[0] if res.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to approve refund: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/refunds/{id}/reject")
async def reject_refund(
    id: str,
    payload: dict = Body(...),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Reject a refund request."""
    try:
        # Get refund
        try:
            refund_res = (
                supabase.table("refunds").select("*").eq("id", id).single().execute()
            )
            if not refund_res.data:
                raise HTTPException(status_code=404, detail="Refund not found")
            refund = refund_res.data
        except Exception as e:
            logger.error(f"Refund not found: {e}")
            raise HTTPException(status_code=404, detail="Refund not found")

        # Check if already processed
        if refund.get("status") != "pending":
            raise HTTPException(status_code=400, detail="Refund already processed")

        # Update refund status
        update_data = {
            "status": "rejected",
            "processed_by": current_user.sub,
            "processed_at": datetime.now().isoformat(),
            "rejection_reason": payload.get("reason", ""),
            "admin_notes": payload.get("notes", ""),
        }

        res = supabase.table("refunds").update(update_data).eq("id", id).execute()

        return {
            "success": True,
            "message": "Refund rejected successfully",
            "refund": res.data[0] if res.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reject refund: {e}")
        raise HTTPException(status_code=500, detail=str(e))
