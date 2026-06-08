"""
Tools 6-8: FHIR Operations

FHIR R4 compliant operations for patient data management:
- get_patient_fhir: Retrieve patient demographics
- create_fhir_observation: Store diagnostic results
- query_patient_timeline: Query historical data

Research: FHIR R4 specification + CMS 2027 mandate compliance
"""

from fastmcp import Context
from typing import Dict, Optional
from datetime import datetime, timezone
import os
import httpx
import sys
import uuid

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.audit import audit_log

# Supabase client will be initialized when needed
_supabase_client = None


def _get_supabase_client():
    """
    Get or create Supabase client.

    Lazy initialization to avoid import errors if Supabase not configured.
    """
    global _supabase_client

    if _supabase_client is None:
        try:
            from supabase import create_client

            supabase_url = os.getenv("SUPABASE_URL", "").strip()
            supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "").strip()

            if not supabase_url or not supabase_key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment"
                )

            _supabase_client = create_client(supabase_url, supabase_key)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Supabase client: {str(e)}")

    return _supabase_client


def is_valid_uuid(val: str) -> bool:
    """Helper to check if a string is a valid UUID."""
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False


MOCK_PATIENTS = {
    "synthetic-patient-001": {
        "resourceType": "Patient",
        "id": "synthetic-patient-001",
        "active": True,
        "name": [
            {
                "use": "official",
                "family": "Doe",
                "given": ["Jane"],
                "text": "Jane Doe"
            }
        ],
        "gender": "female",
        "birthDate": "1980-05-15",
        "telecom": [
            {
                "system": "phone",
                "value": "555-0199",
                "use": "home"
            }
        ],
        "address": [
            {
                "use": "home",
                "line": ["123 Main St"],
                "city": "Boston",
                "state": "MA",
                "postalCode": "02108",
                "country": "US"
            }
        ],
        "identifier": [
            {
                "use": "official",
                "system": "http://hl7.org/fhir/sid/us-ssn",
                "value": "999-12-3456"
            }
        ]
    },
    "synthetic-patient-002": {
        "resourceType": "Patient",
        "id": "synthetic-patient-002",
        "active": True,
        "name": [
            {
                "use": "official",
                "family": "Smith",
                "given": ["John"],
                "text": "John Smith"
            }
        ],
        "gender": "male",
        "birthDate": "1975-09-20",
        "telecom": [
            {
                "system": "phone",
                "value": "555-0245",
                "use": "home"
            }
        ],
        "address": [
            {
                "use": "home",
                "line": ["456 Elm St"],
                "city": "Chicago",
                "state": "IL",
                "postalCode": "60601",
                "country": "US"
            }
        ],
        "identifier": [
            {
                "use": "official",
                "system": "http://hl7.org/fhir/sid/us-ssn",
                "value": "999-23-4567"
            }
        ]
    },
    "synthetic-patient-003": {
        "resourceType": "Patient",
        "id": "synthetic-patient-003",
        "active": True,
        "name": [
            {
                "use": "official",
                "family": "Johnson",
                "given": ["Alice"],
                "text": "Alice Johnson"
            }
        ],
        "gender": "female",
        "birthDate": "1960-12-10",
        "telecom": [
            {
                "system": "phone",
                "value": "555-0321",
                "use": "home"
            }
        ],
        "address": [
            {
                "use": "home",
                "line": ["789 Oak Ave"],
                "city": "Seattle",
                "state": "WA",
                "postalCode": "98101",
                "country": "US"
            }
        ],
        "identifier": [
            {
                "use": "official",
                "system": "http://hl7.org/fhir/sid/us-ssn",
                "value": "999-34-5678"
            }
        ]
    },
    "synthetic-patient-004": {
        "resourceType": "Patient",
        "id": "synthetic-patient-004",
        "active": True,
        "name": [
            {
                "use": "official",
                "family": "Williams",
                "given": ["Robert"],
                "text": "Robert Williams"
            }
        ],
        "gender": "male",
        "birthDate": "1955-03-30",
        "telecom": [
            {
                "system": "phone",
                "value": "555-0456",
                "use": "home"
            }
        ],
        "address": [
            {
                "use": "home",
                "line": ["101 Pine Rd"],
                "city": "Atlanta",
                "state": "GA",
                "postalCode": "30303",
                "country": "US"
            }
        ],
        "identifier": [
            {
                "use": "official",
                "system": "http://hl7.org/fhir/sid/us-ssn",
                "value": "999-45-6789"
            }
        ]
    }
}


async def _get_external_fhir_patient(
    patient_id: str, fhir_server: str, fhir_token: str
) -> Dict:
    """Fetch patient from external FHIR server"""
    try:
        headers = {"Authorization": f"Bearer {fhir_token}"} if fhir_token else {}
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{fhir_server.rstrip('/')}/Patient/{patient_id}"
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "resourceType": "OperationOutcome",
                    "issue": [
                        {
                            "severity": "error",
                            "code": "not-found",
                            "diagnostics": f"External FHIR error: {response.status_code}",
                        }
                    ],
                }
    except Exception as e:
        return {
            "resourceType": "OperationOutcome",
            "issue": [
                {"severity": "error", "code": "exception", "diagnostics": str(e)}
            ],
        }


async def get_patient_fhir(
    ctx: Optional[Context] = None,
    patient_id: str = "unknown",
    fhir_server: Optional[str] = None,
    fhir_token: Optional[str] = None,
) -> Dict:
    """
    Retrieve FHIR Patient resource from external FHIR server or local Supabase.
    """
    # 💎 Check for external SHARP context first
    if not fhir_server and isinstance(ctx, Context):
        fhir_server = await ctx.get_state("fhir_server")
        fhir_token = await ctx.get_state("fhir_token")

    if fhir_server and patient_id != "unknown":
        return await _get_external_fhir_patient(patient_id, fhir_server, fhir_token)

    # 💎 Store in session state for subsequent tool calls
    if isinstance(ctx, Context):
        await ctx.set_state("current_patient_id", patient_id)

    try:
        if not is_valid_uuid(patient_id):
            if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() == "true":
                mock_patient = MOCK_PATIENTS.get(patient_id) or MOCK_PATIENTS.get("synthetic-patient-001")
                await audit_log("get_patient_fhir", patient_id, mock_patient)
                return mock_patient
            return {
                "resourceType": "OperationOutcome",
                "issue": [
                    {
                        "severity": "error",
                        "code": "invalid",
                        "diagnostics": f"Patient ID {patient_id} is not a valid UUID",
                    }
                ],
            }

        supabase = _get_supabase_client()

        # Query Supabase for patient data
        response = (
            supabase.table("fhir_patients").select("*").eq("id", patient_id).execute()
        )

        if not response.data or len(response.data) == 0:
            if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() == "true":
                mock_patient = MOCK_PATIENTS.get(patient_id) or MOCK_PATIENTS.get("synthetic-patient-001")
                await audit_log("get_patient_fhir", patient_id, mock_patient)
                return mock_patient

            return {
                "resourceType": "OperationOutcome",
                "issue": [
                    {
                        "severity": "error",
                        "code": "not-found",
                        "diagnostics": f"Patient {patient_id} not found in FHIR database",
                    }
                ],
            }

        row = response.data[0]
        patient_data = row.get("data", {})

        # 💎 FALLBACK: If 'data' column missing (relational schema active)
        if not patient_data:
            patient_data = {
                "resourceType": "Patient",
                "id": row.get("fhir_id", patient_id),
                "name": [row.get("name", {})],
                "gender": row.get("gender"),
                "birthDate": row.get("birth_date"),
                "identifier": row.get("identifier", []),
            }

        # 💎 Audit logging
        await audit_log("get_patient_fhir", patient_id, patient_data)

        return patient_data

    except Exception as e:
        if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() == "true":
            mock_patient = MOCK_PATIENTS.get(patient_id) or MOCK_PATIENTS.get("synthetic-patient-001")
            await audit_log("get_patient_fhir", patient_id, mock_patient)
            return mock_patient

        return {
            "resourceType": "OperationOutcome",
            "issue": [
                {
                    "severity": "error",
                    "code": "exception",
                    "diagnostics": f"Failed to retrieve patient: {str(e)}",
                }
            ],
        }


async def create_fhir_observation(
    ctx: Optional[Context] = None,
    code: str = "",
    value: float = 0.0,
    unit: str = "",
    patient_id: Optional[str] = None,
    **kwargs,
) -> Dict:
    """
    Create FHIR Observation resource (e.g., lab result, vital sign).

    Args:
        ctx: FastMCP Context for session state management
        code: LOINC code (e.g., "718-7" for hemoglobin)
        value: Numeric value
        unit: Unit of measure (e.g., "g/dL")
        patient_id: Optional (uses session state if not provided)

    Returns:
        FHIR R4 Observation resource
    """
    # 💎 Use session state if patient_id not provided
    if not patient_id:
        if isinstance(ctx, Context):
            patient_id = await ctx.get_state("current_patient_id") or "unknown"
        else:
            patient_id = "unknown"

    try:
        supabase = _get_supabase_client()

        # Build FHIR R4 Observation
        observation_id = str(uuid.uuid4())
        observation = {
            "resourceType": "Observation",
            "id": observation_id,
            "status": "final",
            "code": {"coding": [{"system": "http://loinc.org", "code": code}]},
            "subject": {"reference": f"Patient/{patient_id}"},
            "effectiveDateTime": datetime.now(timezone.utc).isoformat(),
            "issued": datetime.now(timezone.utc).isoformat(),
            "valueQuantity": {
                "value": value,
                "unit": unit,
                "system": "http://unitsofmeasure.org",
                "code": unit,
            },
        }

        # Store in Supabase
        if is_valid_uuid(patient_id):
            data_to_insert = {
                "id": observation_id,
                "patient_id": patient_id,
                "data": observation,
                "effectiveDateTime": observation["effectiveDateTime"],
            }

            # 💎 ADAPTIVE: Check if columns exist before insert
            try:
                supabase.table("fhir_observations").insert(data_to_insert).execute()
            except Exception as e:
                print(f"Error inserting full observation data: {e}")
                # Fallback for relational-only schema
                rel_data = {
                    "fhir_id": observation_id,
                    "code": code,
                    "value": observation["valueQuantity"],
                }
                try:
                    supabase.table("fhir_observations").insert(rel_data).execute()
                except Exception as ex:
                    print(f"Error in fallback insert: {ex}")
                    if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() != "true":
                        raise
        else:
            if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() != "true":
                raise ValueError(f"Patient ID {patient_id} is not a valid UUID")

        # 💎 Audit logging
        await audit_log("create_fhir_observation", patient_id, observation)

        return observation

    except Exception as e:
        if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() == "true":
            # Return successfully simulated observation
            observation_id = str(uuid.uuid4())
            observation = {
                "resourceType": "Observation",
                "id": observation_id,
                "status": "final",
                "code": {"coding": [{"system": "http://loinc.org", "code": code}]},
                "subject": {"reference": f"Patient/{patient_id}"},
                "effectiveDateTime": datetime.now(timezone.utc).isoformat(),
                "issued": datetime.now(timezone.utc).isoformat(),
                "valueQuantity": {
                    "value": value,
                    "unit": unit,
                    "system": "http://unitsofmeasure.org",
                    "code": unit,
                },
            }
            await audit_log("create_fhir_observation", patient_id, observation)
            return observation

        return {
            "resourceType": "OperationOutcome",
            "issue": [
                {
                    "severity": "error",
                    "code": "exception",
                    "diagnostics": f"Failed to create observation: {str(e)}",
                }
            ],
        }


async def query_patient_timeline(
    ctx: Optional[Context] = None,
    patient_id: Optional[str] = None,
    resource_type: str = "DiagnosticReport",
    limit: int = 10,
    **kwargs,
) -> Dict:
    """
    Query patient's FHIR timeline (historical data).

    Essential for longitudinal analysis and comparison tool.
    """
    # 💎 Use session state if patient_id not provided
    if not patient_id:
        if isinstance(ctx, Context):
            patient_id = await ctx.get_state("current_patient_id") or "unknown"
        else:
            patient_id = "unknown"

    try:
        if not is_valid_uuid(patient_id):
            if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() == "true":
                # Return a realistic mock timeline bundle
                if resource_type.lower() == "observation":
                    bundle = {
                        "resourceType": "Bundle",
                        "type": "searchset",
                        "total": 2,
                        "entry": [
                            {
                                "resource": {
                                    "resourceType": "Observation",
                                    "id": f"obs-{patient_id}-historical-1",
                                    "status": "final",
                                    "code": {
                                        "coding": [{"system": "http://loinc.org", "code": "718-7"}],
                                        "text": "Hemoglobin",
                                    },
                                    "subject": {"reference": f"Patient/{patient_id}"},
                                    "effectiveDateTime": (datetime.now(timezone.utc)).isoformat(),
                                    "valueQuantity": {
                                        "value": 11.2,
                                        "unit": "g/dL",
                                        "system": "http://unitsofmeasure.org",
                                        "code": "g/dL",
                                    }
                                }
                            },
                            {
                                "resource": {
                                    "resourceType": "Observation",
                                    "id": f"obs-{patient_id}-historical-2",
                                    "status": "final",
                                    "code": {
                                        "coding": [{"system": "http://loinc.org", "code": "79888-4"}],
                                        "text": "Glucose",
                                    },
                                    "subject": {"reference": f"Patient/{patient_id}"},
                                    "effectiveDateTime": (datetime.now(timezone.utc)).isoformat(),
                                    "valueQuantity": {
                                        "value": 95.0,
                                        "unit": "mg/dL",
                                        "system": "http://unitsofmeasure.org",
                                        "code": "mg/dL",
                                    }
                                }
                            }
                        ],
                    }
                else:
                    bundle = {
                        "resourceType": "Bundle",
                        "type": "searchset",
                        "total": 2,
                        "entry": [
                            {
                                "resource": {
                                    "resourceType": "DiagnosticReport",
                                    "id": f"anemia-{patient_id}-historical-1",
                                    "status": "final",
                                    "code": {
                                        "coding": [{"system": "http://loinc.org", "code": "718-7"}],
                                        "text": "Anemia Screening",
                                    },
                                    "subject": {"reference": f"Patient/{patient_id}"},
                                    "effectiveDateTime": (datetime.now(timezone.utc)).isoformat(),
                                    "result": {
                                        "hemoglobin_estimate": 11.2,
                                        "unit": "g/dL",
                                        "severity": "Mild",
                                        "recommendation": "Dietary counseling.",
                                    }
                                }
                            },
                            {
                                "resource": {
                                    "resourceType": "DiagnosticReport",
                                    "id": f"dr-{patient_id}-historical-2",
                                    "status": "final",
                                    "code": {
                                        "coding": [{"system": "http://loinc.org", "code": "79888-4"}],
                                        "text": "DR Screening",
                                    },
                                    "subject": {"reference": f"Patient/{patient_id}"},
                                    "effectiveDateTime": (datetime.now(timezone.utc)).isoformat(),
                                    "result": {
                                        "severity": "No DR",
                                        "referral_urgency": "Routine",
                                        "recommendation": "Annual eye exams.",
                                    }
                                }
                            }
                        ],
                    }
                await audit_log("query_patient_timeline", patient_id, {"count": bundle["total"]})
                return bundle
            return {
                "resourceType": "OperationOutcome",
                "issue": [
                    {
                        "severity": "error",
                        "code": "invalid",
                        "diagnostics": f"Patient ID {patient_id} is not a valid UUID",
                    }
                ],
            }

        supabase = _get_supabase_client()

        # Map FHIR resourceType → Supabase table name
        resource_lower = resource_type.lower()
        if resource_lower == "observation":
            table_name = "fhir_observations"
        elif resource_lower == "diagnosticreport":
            table_name = "fhir_diagnostic_reports"
        else:
            table_name = f"fhir_{resource_lower}s"

        response = (
            supabase.table(table_name)
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        # Build FHIR R4 Bundle
        entries = []
        for item in response.data or []:
            resource = item.get("data")
            if not resource:
                # Reconstruct minimal resource from relational columns
                resource = {
                    "resourceType": resource_type,
                    "id": item.get("id"),
                    "code": item.get("code"),
                    "status": item.get("status"),
                    "conclusion": item.get("conclusion"),
                }
                if resource_type == "Observation":
                    resource["valueQuantity"] = item.get("value")
            entries.append({"resource": resource})

        bundle = {
            "resourceType": "Bundle",
            "type": "searchset",
            "total": len(entries),
            "entry": entries,
        }

        # Audit log the access (PHI-safe — only count is logged)
        await audit_log(
            "query_patient_timeline", patient_id, {"count": bundle["total"]}
        )

        return bundle

    except Exception as e:
        if os.getenv("ALLOW_MOCK_RESPONSES", "false").lower() == "true":
            # Return simulated bundle on DB query failure
            if resource_type.lower() == "observation":
                bundle = {
                    "resourceType": "Bundle",
                    "type": "searchset",
                    "total": 2,
                    "entry": [
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "id": f"obs-{patient_id}-historical-1",
                                "status": "final",
                                "code": {
                                    "coding": [{"system": "http://loinc.org", "code": "718-7"}],
                                    "text": "Hemoglobin",
                                },
                                "subject": {"reference": f"Patient/{patient_id}"},
                                "effectiveDateTime": (datetime.now(timezone.utc)).isoformat(),
                                "valueQuantity": {
                                    "value": 11.2,
                                    "unit": "g/dL",
                                    "system": "http://unitsofmeasure.org",
                                    "code": "g/dL",
                                }
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "id": f"obs-{patient_id}-historical-2",
                                "status": "final",
                                "code": {
                                    "coding": [{"system": "http://loinc.org", "code": "79888-4"}],
                                    "text": "Glucose",
                                },
                                "subject": {"reference": f"Patient/{patient_id}"},
                                "effectiveDateTime": (datetime.now(timezone.utc)).isoformat(),
                                "valueQuantity": {
                                    "value": 95.0,
                                    "unit": "mg/dL",
                                    "system": "http://unitsofmeasure.org",
                                    "code": "mg/dL",
                                }
                            }
                        }
                    ],
                }
            else:
                bundle = {
                    "resourceType": "Bundle",
                    "type": "searchset",
                    "total": 2,
                    "entry": [
                        {
                            "resource": {
                                "resourceType": "DiagnosticReport",
                                "id": f"anemia-{patient_id}-historical-1",
                                "status": "final",
                                "code": {
                                    "coding": [{"system": "http://loinc.org", "code": "718-7"}],
                                    "text": "Anemia Screening",
                                },
                                "subject": {"reference": f"Patient/{patient_id}"},
                                "effectiveDateTime": (datetime.now(timezone.utc)).isoformat(),
                                "result": {
                                    "hemoglobin_estimate": 11.2,
                                    "unit": "g/dL",
                                    "severity": "Mild",
                                    "recommendation": "Dietary counseling.",
                                }
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "DiagnosticReport",
                                "id": f"dr-{patient_id}-historical-2",
                                "status": "final",
                                "code": {
                                    "coding": [{"system": "http://loinc.org", "code": "79888-4"}],
                                    "text": "DR Screening",
                                },
                                "subject": {"reference": f"Patient/{patient_id}"},
                                "effectiveDateTime": (datetime.now(timezone.utc)).isoformat(),
                                "result": {
                                    "severity": "No DR",
                                    "referral_urgency": "Routine",
                                    "recommendation": "Annual eye exams.",
                                }
                            }
                        }
                    ],
                }
            await audit_log("query_patient_timeline", patient_id, {"count": bundle["total"]})
            return bundle

        return {
            "resourceType": "OperationOutcome",
            "issue": [
                {
                    "severity": "error",
                    "code": "exception",
                    "diagnostics": f"Failed to query timeline: {str(e)}",
                }
            ],
        }
