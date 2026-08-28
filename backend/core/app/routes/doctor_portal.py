"""
Doctor Portal Routes

API endpoints for doctor portal features:
- Earnings dashboard
- Clinical notes (SOAP format)
- Prescription templates
- Doctor analytics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.core.security import get_current_doctor
from app.models.schemas import TokenPayload
from app.services.doctor_analytics_service import get_doctor_analytics_service
from app.services.clinical_notes_service import get_clinical_notes_service
from app.services.prescription_template_service import get_prescription_template_service

router = APIRouter(prefix="/api/v1/doctor", tags=["Doctor Portal"])


# ============================================================================
# Request/Response Models
# ============================================================================


class EarningsRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    period: str = Field(default="month", pattern="^(day|week|month|year)$")


class ClinicalNoteCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    note_type: str = Field(default="soap", pattern="^(soap|progress|consultation)$")
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    content: Optional[str] = None
    template_id: Optional[str] = None
    is_ai_generated: bool = False


class ClinicalNoteUpdate(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    content: Optional[str] = None


class NoteTemplateCreate(BaseModel):
    name: str
    note_type: str = Field(pattern="^(soap|progress|consultation)$")
    template_content: Dict[str, Any]
    is_favorite: bool = False


class PrescriptionTemplateCreate(BaseModel):
    name: str
    medication_name: str
    dosage: str
    frequency: str
    duration: Optional[str] = None
    instructions: Optional[str] = None
    is_favorite: bool = False


class PrescriptionTemplateUpdate(BaseModel):
    name: Optional[str] = None
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    is_favorite: Optional[bool] = None


class PrescriptionFromTemplate(BaseModel):
    template_id: str
    patient_id: str
    appointment_id: Optional[str] = None


# ============================================================================
# Core Dashboard Endpoints
# ============================================================================


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get summarized dashboard statistics (appointments, revenue, pending scans)"""
    service = get_doctor_analytics_service()
    stats = service.get_dashboard_stats(doctor_id=str(current_user.sub))
    return stats


@router.get("/availability")
async def get_doctor_availability(
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get current doctor's availability settings"""
    service = get_doctor_analytics_service()
    availability = service.get_doctor_availability(doctor_id=str(current_user.sub))
    return {"availability": availability}


@router.get("/revenue")
async def get_doctor_portal_revenue(
    period: str = Query(default="month", pattern="^(day|week|month|year)$"),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get revenue data for the specified period"""
    service = get_doctor_analytics_service()
    # Using existing analytics method or detailed summary
    revenue = service.get_revenue_analytics(
        doctor_id=str(current_user.sub), period=period
    )
    return revenue


# ============================================================================
# Earnings Dashboard Endpoints
# ============================================================================


@router.get("/earnings")
async def get_earnings(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    period: str = Query(default="month", pattern="^(day|week|month|year)$"),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get earnings summary for doctor"""
    service = get_doctor_analytics_service()
    earnings = service.get_earnings_summary(
        doctor_id=str(current_user.sub),
        start_date=start_date,
        end_date=end_date,
        period=period,
    )

    return earnings


@router.get("/statistics")
async def get_statistics(current_user: TokenPayload = Depends(get_current_doctor)):
    """Get overall statistics for doctor"""
    service = get_doctor_analytics_service()
    stats = service.get_doctor_statistics(doctor_id=str(current_user.sub))

    return stats


# ============================================================================
# Clinical Notes Endpoints
# ============================================================================


@router.post("/clinical-notes")
async def create_clinical_note(
    note_data: ClinicalNoteCreate,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Create a new clinical note"""
    service = get_clinical_notes_service()
    note = await service.create_note(
        doctor_id=str(current_user.sub),
        patient_id=note_data.patient_id,
        note_data=note_data.model_dump(),
    )

    return note


@router.get("/clinical-notes")
async def get_clinical_notes(
    patient_id: Optional[str] = None,
    appointment_id: Optional[str] = None,
    note_type: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get clinical notes with filters"""
    service = get_clinical_notes_service()
    notes = await service.get_notes(
        doctor_id=str(current_user.sub),
        patient_id=patient_id,
        appointment_id=appointment_id,
        note_type=note_type,
        limit=limit,
        offset=offset,
    )

    return notes


@router.get("/clinical-notes/{note_id}")
async def get_clinical_note(
    note_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Get a single clinical note"""
    service = get_clinical_notes_service()
    note = await service.get_note(note_id=note_id, doctor_id=str(current_user.sub))

    if not note:
        raise HTTPException(status_code=404, detail="Clinical note not found")

    return note


@router.put("/clinical-notes/{note_id}")
async def update_clinical_note(
    note_id: str,
    update_data: ClinicalNoteUpdate,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Update a clinical note"""
    service = get_clinical_notes_service()
    note = await service.update_note(
        note_id=note_id,
        doctor_id=str(current_user.sub),
        update_data=update_data.model_dump(exclude_unset=True),
    )

    return note


@router.delete("/clinical-notes/{note_id}")
async def delete_clinical_note(
    note_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Delete a clinical note"""
    service = get_clinical_notes_service()
    success = await service.delete_note(
        note_id=note_id, doctor_id=str(current_user.sub)
    )

    if not success:
        raise HTTPException(status_code=404, detail="Clinical note not found")

    return {"message": "Clinical note deleted successfully"}


@router.get("/clinical-notes/search")
async def search_clinical_notes(
    query: str = Query(..., min_length=1),
    limit: int = Query(default=50, le=100),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Search clinical notes"""
    service = get_clinical_notes_service()
    notes = await service.search_notes(
        doctor_id=str(current_user.sub), query=query, limit=limit
    )

    return {"notes": notes}


# ============================================================================
# Note Templates Endpoints
# ============================================================================


@router.post("/note-templates")
async def create_note_template(
    template_data: NoteTemplateCreate,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Create a note template"""
    service = get_clinical_notes_service()
    template = await service.create_template(
        doctor_id=str(current_user.sub), template_data=template_data.model_dump()
    )

    return template


@router.get("/note-templates")
async def get_note_templates(
    note_type: Optional[str] = None,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get note templates"""
    service = get_clinical_notes_service()
    templates = await service.get_templates(
        doctor_id=str(current_user.sub), note_type=note_type
    )

    return {"templates": templates}


@router.put("/note-templates/{template_id}")
async def update_note_template(
    template_id: str,
    update_data: dict,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Update a note template"""
    service = get_clinical_notes_service()
    template = await service.update_template(
        template_id=template_id,
        doctor_id=str(current_user.sub),
        update_data=update_data,
    )

    return template


@router.delete("/note-templates/{template_id}")
async def delete_note_template(
    template_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Delete a note template"""
    service = get_clinical_notes_service()
    success = await service.delete_template(
        template_id=template_id, doctor_id=str(current_user.sub)
    )

    if not success:
        raise HTTPException(status_code=404, detail="Note template not found")

    return {"message": "Note template deleted successfully"}


# ============================================================================
# Prescription Templates Endpoints
# ============================================================================


@router.post("/prescription-templates")
async def create_prescription_template(
    template_data: PrescriptionTemplateCreate,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Create a prescription template"""
    service = get_prescription_template_service()
    template = await service.create_template(
        doctor_id=str(current_user.sub), template_data=template_data.model_dump()
    )

    return template


@router.get("/prescription-templates")
async def get_prescription_templates(
    is_favorite: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get prescription templates"""
    service = get_prescription_template_service()
    templates = await service.get_templates(
        doctor_id=str(current_user.sub),
        is_favorite=is_favorite,
        search=search,
        limit=limit,
        offset=offset,
    )

    return templates


@router.get("/prescription-templates/{template_id}")
async def get_prescription_template(
    template_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Get a single prescription template"""
    service = get_prescription_template_service()
    template = await service.get_template(
        template_id=template_id, doctor_id=str(current_user.sub)
    )

    if not template:
        raise HTTPException(status_code=404, detail="Prescription template not found")

    return template


@router.put("/prescription-templates/{template_id}")
async def update_prescription_template(
    template_id: str,
    update_data: PrescriptionTemplateUpdate,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Update a prescription template"""
    service = get_prescription_template_service()
    template = await service.update_template(
        template_id=template_id,
        doctor_id=str(current_user.sub),
        update_data=update_data.model_dump(exclude_unset=True),
    )

    return template


@router.delete("/prescription-templates/{template_id}")
async def delete_prescription_template(
    template_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Delete a prescription template"""
    service = get_prescription_template_service()
    success = await service.delete_template(
        template_id=template_id, doctor_id=str(current_user.sub)
    )

    if not success:
        raise HTTPException(status_code=404, detail="Prescription template not found")

    return {"message": "Prescription template deleted successfully"}


@router.post("/prescription-templates/{template_id}/toggle-favorite")
async def toggle_template_favorite(
    template_id: str, current_user: TokenPayload = Depends(get_current_doctor)
):
    """Toggle favorite status of a template"""
    service = get_prescription_template_service()
    template = await service.toggle_favorite(
        template_id=template_id, doctor_id=str(current_user.sub)
    )

    return template


@router.post("/prescriptions/from-template")
async def create_prescription_from_template(
    prescription_data: PrescriptionFromTemplate,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Create a prescription from a template"""
    service = get_prescription_template_service()
    prescription = await service.create_prescription_from_template(
        template_id=prescription_data.template_id,
        doctor_id=str(current_user.sub),
        patient_id=prescription_data.patient_id,
        appointment_id=prescription_data.appointment_id,
    )

    return prescription


# ============================================================================
# Doctor Analytics Endpoints
# ============================================================================


@router.get("/analytics")
async def get_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get comprehensive doctor analytics"""
    service = get_doctor_analytics_service()
    doctor_id = str(current_user.sub)

    # Get all analytics data
    earnings = await service.get_earnings_summary(
        doctor_id=doctor_id, start_date=start_date, end_date=end_date
    )

    statistics = await service.get_doctor_statistics(doctor_id=doctor_id)
    demographics = await service.get_patient_demographics(doctor_id=doctor_id)
    trends = await service.get_appointment_trends(doctor_id=doctor_id)
    diagnoses = await service.get_common_diagnoses(doctor_id=doctor_id)
    prescriptions = await service.get_prescription_patterns(doctor_id=doctor_id)

    return {
        "earnings": earnings,
        "statistics": statistics,
        "patient_demographics": demographics,
        "appointment_trends": trends,
        "common_diagnoses": diagnoses,
        "prescription_patterns": prescriptions,
    }


@router.get("/analytics/demographics")
async def get_patient_demographics(
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get patient demographics"""
    service = get_doctor_analytics_service()
    demographics = await service.get_patient_demographics(
        doctor_id=str(current_user.sub)
    )

    return demographics


@router.get("/analytics/appointment-trends")
async def get_appointment_trends(
    days: int = Query(default=30, ge=1, le=365),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get appointment trends"""
    service = get_doctor_analytics_service()
    trends = await service.get_appointment_trends(
        doctor_id=str(current_user.sub), days=days
    )

    return {"trends": trends}


@router.get("/analytics/common-diagnoses")
async def get_common_diagnoses(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get common diagnoses"""
    service = get_doctor_analytics_service()
    diagnoses = await service.get_common_diagnoses(
        doctor_id=str(current_user.sub), limit=limit
    )

    return {"diagnoses": diagnoses}


@router.get("/analytics/prescription-patterns")
async def get_prescription_patterns(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get prescription patterns"""
    service = get_doctor_analytics_service()
    patterns = await service.get_prescription_patterns(
        doctor_id=str(current_user.sub), limit=limit
    )

    return {"patterns": patterns}


# ============================================================================
# Analytics Overview Endpoint (used by DoctorAnalyticsDashboard)
# ============================================================================


@router.get("/analytics/overview")
def get_analytics_overview(
    period: str = Query(default="month", pattern="^(week|month|quarter|year)$"),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get comprehensive analytics overview for the doctor portal dashboard"""
    service = get_doctor_analytics_service()
    doctor_id = str(current_user.sub)

    # Gather all analytics data
    statistics = service.get_doctor_statistics(doctor_id=doctor_id)
    trends = service.get_appointment_trends(doctor_id=doctor_id)
    demographics = service.get_patient_demographics(doctor_id=doctor_id)
    diagnoses = service.get_common_diagnoses(doctor_id=doctor_id, limit=5)

    total_patients = statistics.get("total_patients", 0)
    total_appointments = statistics.get("total_appointments", 0)
    completed_appointments = statistics.get("completed_appointments", 0)

    return {
        "summary": {
            "total_patients": total_patients,
            "new_patients_this_month": statistics.get("new_patients_this_month", 0),
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "cancelled_appointments": statistics.get("cancelled_appointments", 0),
            "total_revenue": statistics.get("total_revenue", 0),
            "average_rating": statistics.get("average_rating", 0),
            "response_time": statistics.get("avg_response_time_minutes", 0),
            "patient_satisfaction": statistics.get("patient_satisfaction_pct", 0),
            "growth_metrics": {
                "patients_growth": statistics.get("patients_growth_pct", 0),
                "revenue_growth": statistics.get("revenue_growth_pct", 0),
                "appointments_growth": statistics.get("appointments_growth_pct", 0),
                "rating_growth": statistics.get("rating_growth_pct", 0),
            },
        },
        "appointment_trends": [
            {
                "date": t.get("date", ""),
                "appointments": t.get("count", 0),
                "completed": t.get("completed", 0),
                "cancelled": t.get("cancelled", 0),
                "revenue": t.get("revenue", 0),
            }
            for t in trends
        ],
        "patient_demographics": [
            {
                "age_group": age,
                "count": count,
                "percentage": round(count / max(total_patients, 1) * 100, 1),
            }
            for age, count in demographics.get("age_distribution", {}).items()
            if count > 0
        ],
        "top_conditions": [
            {
                "condition": d.get("diagnosis", ""),
                "count": d.get("count", 0),
                "percentage": 0,
            }
            for d in diagnoses
        ],
        "performance_metrics": {
            "consultation_time": statistics.get("avg_consultation_minutes", 25),
            "follow_up_rate": statistics.get("follow_up_rate_pct", 0),
            "prescription_accuracy": statistics.get("prescription_accuracy_pct", 95),
            "patient_retention": statistics.get("patient_retention_pct", 0),
        },
        "recent_activities": statistics.get("recent_activities", []),
    }


# ============================================================================
# Revenue Analytics Endpoint (used by DoctorRevenueAnalytics)
# ============================================================================


@router.get("/analytics/revenue")
def get_revenue_analytics(
    period: str = Query(default="year", pattern="^(month|quarter|year|all)$"),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get detailed revenue analytics for the doctor"""
    service = get_doctor_analytics_service()
    doctor_id = str(current_user.sub)

    revenue_data = service.get_revenue_analytics(doctor_id=doctor_id, period=period)
    return revenue_data


# ============================================================================
# Patient Analytics Endpoint (used by DoctorPatientAnalytics)
# ============================================================================


@router.get("/analytics/patients")
def get_patient_analytics(
    period: str = Query(default="year", pattern="^(month|quarter|year|all)$"),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get detailed patient analytics for the doctor"""
    service = get_doctor_analytics_service()
    doctor_id = str(current_user.sub)

    patient_data = service.get_patient_analytics(doctor_id=doctor_id, period=period)
    return patient_data


# ============================================================================
# Transactions Endpoint (used by DoctorTransactionHistory)
# ============================================================================


@router.get("/transactions")
def get_transactions(
    status: Optional[str] = None,
    type: Optional[str] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: str = Query(default="date"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get transaction history for the doctor"""
    service = get_doctor_analytics_service()
    doctor_id = str(current_user.sub)

    transactions = service.get_transactions(
        doctor_id=doctor_id,
        status=status,
        appointment_type=type,
        payment_method=payment_method,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )
    return transactions


# ============================================================================
# Earnings Summary Endpoint (used by DoctorEarningsSummary)
# ============================================================================


@router.get("/earnings/summary")
def get_earnings_summary(
    period: str = Query(default="month", pattern="^(today|week|month|year)$"),
    current_user: TokenPayload = Depends(get_current_doctor),
):
    """Get detailed earnings summary with trends and breakdown"""
    service = get_doctor_analytics_service()
    doctor_id = str(current_user.sub)

    summary = service.get_detailed_earnings_summary(doctor_id=doctor_id, period=period)
    return summary
