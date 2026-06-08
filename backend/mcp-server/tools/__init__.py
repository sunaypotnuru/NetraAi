"""
NetraAI MCP Server - Tools Package (v2.0.0)

11 MCP Tools organized into 3 categories:

DIAGNOSTIC ML TOOLS (5):
  1. diagnose_anemia       — Conjunctiva image → Hemoglobin estimate (WHO 2023)
  2. detect_cataract       — Lens image → Opacity score + XAI heatmap (AAO 2024)
  3. screen_diabetic_retinopathy — Fundus image → NPDR/PDR grade + urgency (AAO 2024)
  4. analyze_mental_health  — Voice audio → PHQ-9 score + crisis detection (DSM-5)
  5. screen_parkinsons      — Spiral drawing → UPDRS score (MDS Guidelines)

FHIR R4 OPERATIONS (3):
  6. get_patient_fhir       — Retrieve patient demographics (FHIR R4 Patient)
  7. create_fhir_observation — Store diagnostic results (FHIR R4 Observation)
  8. query_patient_timeline  — Query historical data (FHIR R4 Bundle)

ADVANCED ANALYTICS (3):
  9. compare_diagnostic_history — Longitudinal trend analysis (Stanford HAI 2026)
  10. orchestrate_screening_workflow — Chief complaint → multi-tool orchestration
  11. generate_prior_auth — CMS-0057-F compliant prior authorization generation
"""

from .anemia import diagnose_anemia
from .cataract import detect_cataract
from .dr import screen_diabetic_retinopathy
from .mental_health import analyze_mental_health
from .parkinsons import screen_parkinsons
from .fhir_ops import get_patient_fhir, create_fhir_observation, query_patient_timeline
from .comparison import compare_diagnostic_history
from .workflow import orchestrate_screening_workflow
from .prior_auth import generate_prior_auth

__all__ = [
    # Diagnostic ML Tools (1-5)
    "diagnose_anemia",
    "detect_cataract",
    "screen_diabetic_retinopathy",
    "analyze_mental_health",
    "screen_parkinsons",
    # FHIR R4 Operations (6-8)
    "get_patient_fhir",
    "create_fhir_observation",
    "query_patient_timeline",
    # Advanced Analytics (9-11)
    "compare_diagnostic_history",
    "orchestrate_screening_workflow",
    "generate_prior_auth",
]
