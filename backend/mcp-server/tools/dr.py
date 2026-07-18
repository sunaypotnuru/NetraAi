"""
Tool 3: screen_diabetic_retinopathy

Screen fundus image for diabetic retinopathy.
"""

from fastmcp import Context
import httpx
from typing import Dict, Optional
from datetime import datetime, timezone
import os
from utils.audit import audit_log


async def screen_diabetic_retinopathy(
    ctx: Optional[Context] = None,
    image_url: Optional[str] = None,
    patient_id: Optional[str] = None,
    **kwargs,
) -> Dict:
    """Screen fundus image for diabetic retinopathy."""
    # 💎 Input Validation (FIXED: Prevent None crash)
    if not image_url:
        return {
            "resourceType": "OperationOutcome",
            "issue": [
                {
                    "severity": "error",
                    "code": "required",
                    "diagnostics": "image_url is required for DR screening",
                }
            ],
        }

    if patient_id:
        if isinstance(ctx, Context):
            await ctx.set_state("current_patient_id", patient_id)
    else:
        if isinstance(ctx, Context):
            patient_id = await ctx.get_state("current_patient_id") or "unknown"
        else:
            patient_id = "unknown"

    service_url = os.getenv("DR_SERVICE_URL", "https://sunay-potnuru-netra-dr.hf.space")

    try:
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            img_response = await client.get(image_url)
            img_response.raise_for_status()

            ml_response = await client.post(
                f"{service_url}/predict",
                files={"file": ("image.jpg", img_response.content, "image/jpeg")},
            )
            ml_response.raise_for_status()
            ml_result = ml_response.json()
    except Exception as e:
        if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() == "true":
            severity = "Mild NPDR"
            urgency = "Routine"
            heatmap_url = f"https://example.com/visualize?image={image_url}&patient={patient_id}"
            result = {
                "resourceType": "DiagnosticReport",
                "id": f"dr-{patient_id}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
                "status": "final",
                "code": {
                    "coding": [{"system": "http://loinc.org", "code": "79888-4"}],
                    "text": "DR Screening",
                },
                "subject": {"reference": f"Patient/{patient_id}"},
                "effectiveDateTime": datetime.now(timezone.utc).isoformat(),
                "result": {
                    "severity": severity,
                    "referral_urgency": urgency,
                    "attention_heatmap_url": heatmap_url,
                    "recommendation": _get_dr_recommendation(severity),
                    "guideline": "AAO 2024 Retinal Standards",
                    "mocked": True,
                },
            }
            await audit_log("screen_diabetic_retinopathy", patient_id, result)
            return result

        return {
            "resourceType": "OperationOutcome",
            "issue": [
                {
                    "severity": "error",
                    "code": "exception",
                    "diagnostics": f"ML Service Error: {str(e)}",
                }
            ],
        }

    # 💎 AGGRESSIVE EXTRACTION
    # Handle cases where the service returns a list [ {result} ]
    if isinstance(ml_result, list) and len(ml_result) > 0:
        ml_result = ml_result[0]

    # 💎 STRICT EXTRACTION: No more searching, no more guessing.
    # 💎 THE FINAL TRUTH: Using the exact key from your model's JSON
    severity = ml_result.get("grade_name") or "No DR"

    # 💎 SURPLUS VALUE: Referral Urgency & XAI
    urgency = "Urgent" if any(x in severity for x in ["Severe", "Proliferative"]) else "Routine"
    heatmap_url = f"{service_url}/visualize?image={image_url}&patient={patient_id}"

    result = {
        "resourceType": "DiagnosticReport",
        "id": f"dr-{patient_id}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "status": "final",
        "code": {
            "coding": [{"system": "http://loinc.org", "code": "79888-4"}],
            "text": "DR Screening",
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "effectiveDateTime": datetime.now(timezone.utc).isoformat(),
        "result": {
            "severity": severity,
            "referral_urgency": urgency,
            "attention_heatmap_url": heatmap_url,
            "recommendation": _get_dr_recommendation(severity),
            "guideline": "AAO 2024 Retinal Standards",
        },
    }

    await audit_log("screen_diabetic_retinopathy", patient_id, result)
    return result


def _get_dr_recommendation(severity: str) -> str:
    """Clinical support based on AAO guidelines."""
    sev = str(severity).replace(" NPDR", "").strip()
    recs = {
        "No DR": "Annual dilated eye exams. Maintain A1c < 7%.",
        "Mild": "Dilated exam in 12 months. Optimize glycemic control.",
        "Moderate": "Dilated exam in 6-12 months. Strict glycemic control.",
        "Severe": "⚠️ URGENT: Ophthalmology referral within 1 month. High risk of progression.",
        "Proliferative": "⚠️ URGENT: Ophthalmology referral within 1 week. Anti-VEGF or PRP indicated.",
    }
    return recs.get(sev, "Strict glycemic control.")
