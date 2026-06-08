import os
from typing import Dict, Any


def get_agent_card() -> Dict[str, Any]:
    """
    Generate an A2A Specification v1.0 compliant agent card with enhanced SHARP-on-MCP support.

    References:
    - https://agents-assemble.devpost.com/
    - A2A Spec v1.0 (supportedInterfaces, securitySchemes, etc.)
    - SHARP-on-MCP for FHIR context propagation
    """
    # Force public URL for hackathon validator reliability
    base_url = "https://sunay-potnuru-netra-mcp-server.hf.space"

    return {
        "id": "netra-ai",
        "name": "NetraAI Diagnostic Engine",
        "description": "Advanced interoperable healthcare agent providing rapid AI-powered diagnostics for anemia, cataracts, diabetic retinopathy, mental health, and Parkinson's disease using computer vision, audio analysis, and SHARP-on-MCP standards.",
        "version": "2.0.0",
        "publisher": "NetraAI Team",
        "contact": {
            "name": "NetraAI Team",
            "email": "sunaypotnuru@gmail.com",
            "url": "https://netra-ai-ten.vercel.app/",
        },
        "privacyPolicyUrl": "https://netra-ai-ten.vercel.app/",
        "termsOfServiceUrl": "https://netra-ai-ten.vercel.app/",
        "supportedLanguages": ["en"],
        "defaultInputModes": ["text", "image", "audio"],
        "defaultOutputModes": ["text", "fhir-resource", "diagnostic-report"],
        # 💎 ENHANCED SKILLS with marketplace-optimized keywords
        "skills": [
            {
                "id": "diagnose_anemia_tool",
                "name": "Anemia Screening",
                "description": "Non-invasive anemia detection from conjunctival images with hemoglobin estimation per WHO 2023 guidelines.",
                "tags": [
                    "anemia",
                    "hemoglobin",
                    "conjunctiva",
                    "blood-test",
                    "iron-deficiency",
                    "point-of-care",
                ],
            },
            {
                "id": "detect_cataract_tool",
                "name": "Cataract Detection",
                "description": "AI-powered cataract screening with explainable AI (Grad-CAM heatmaps) showing decision reasoning.",
                "tags": [
                    "cataract",
                    "vision",
                    "ophthalmology",
                    "eye-disease",
                    "xai",
                    "explainable-ai",
                ],
            },
            {
                "id": "screen_dr_tool",
                "name": "Diabetic Retinopathy Screening",
                "description": "5-stage DR classification from fundus images using EfficientNet-B5. Detects microaneurysms and hemorrhages.",
                "tags": [
                    "diabetic-retinopathy",
                    "dr",
                    "diabetes",
                    "retinopathy",
                    "fundus",
                    "eye-screening",
                ],
            },
            {
                "id": "analyze_mental_health_tool",
                "name": "Mental Health Assessment",
                "description": "Multi-modal mental health analysis combining voice biomarkers and sentiment analysis.",
                "tags": [
                    "mental-health",
                    "depression",
                    "anxiety",
                    "vocal-biomarkers",
                    "audio-analysis",
                    "sentiment",
                ],
            },
            {
                "id": "screen_parkinsons_tool",
                "name": "Parkinson's Disease Screening",
                "description": "Early Parkinson's detection from voice analysis using LightGBM. Analyzes jitter, shimmer, and tremor patterns.",
                "tags": [
                    "parkinsons",
                    "neurology",
                    "voice-analysis",
                    "tremor",
                    "movement-disorder",
                ],
            },
            {
                "id": "get_patient_fhir_tool",
                "name": "FHIR Integration",
                "description": "Full FHIR R4 support for patient data retrieval and observation creation. SHARP-on-MCP compliant.",
                "tags": [
                    "fhir",
                    "fhir-r4",
                    "ehr-integration",
                    "patient-data",
                    "interoperability",
                    "sharp",
                ],
            },
            {
                "id": "orchestrate_screening_workflow_tool",
                "name": "Clinical Workflow Orchestration",
                "description": "Intelligent multi-step diagnostic workflows based on chief complaints. Automatically chains appropriate screenings.",
                "tags": [
                    "workflow",
                    "orchestration",
                    "clinical-decision-support",
                    "multi-agent",
                    "diagnostic-workflow",
                ],
            },
            {
                "id": "health_check_tool",
                "name": "System Health Diagnostics",
                "description": "Real-time health monitoring of the NetraAI engine and ML subsystems.",
                "tags": ["monitoring", "health-check", "system-status"],
            },
            {
                "id": "query_patient_timeline_tool",
                "name": "FHIR Timeline Analysis",
                "description": "Historical analysis of patient diagnostic events and longitudinal observation mapping.",
                "tags": ["fhir-timeline", "longitudinal-data", "historical-analysis"],
            },
            {
                "id": "compare_diagnostic_history_tool",
                "name": "Diagnostic History Comparison",
                "description": "Compares current results with historical diagnostic reports to track disease progression.",
                "tags": ["progression-tracking", "comparative-analysis", "history"],
            },
            {
                "id": "generate_prior_auth_tool",
                "name": "Prior Authorization Engine",
                "description": "Automated generation of medical necessity documentation and prior-auth requests based on AI findings.",
                "tags": ["prior-auth", "medical-necessity", "insurance-compliance", "automation"],
            },
        ],
        # 💎 ENHANCED CAPABILITIES with SHARP and FHIR scopes
        "capabilities": {
            "supportsFHIRContext": True,
            "supportsSHARP": True,
            "supportsXAI": True,
            "supportsMultiModal": True,
            "supportedFHIRVersions": ["4.0.1"],
            "supportedFHIRResources": [
                "Patient",
                "Observation",
                "DiagnosticReport",
                "Condition",
                "MedicationStatement",
            ],
            "fhirScopes": [
                "patient/*.read",
                "Observation.read",
                "DiagnosticReport.read",
                "Condition.read",
                "MedicationStatement.read",
            ],
            "experimental": {
                "ai.promptopinion/fhir-context": {
                    "value": True,
                    "description": "SHARP-on-MCP standard for FHIR context propagation",
                }
            },
        },
        "supportedInterfaces": [
            {
                "type": "mcp-sse-v1",
                "protocolBinding": "mcp-sse-v1",
                "url": f"{base_url}/mcp/sse/",
                "endpointUrl": f"{base_url}/mcp/sse/",
                "protocolVersion": "1.0.0",
            },
            {
                "type": "http-json-openai-v1",
                "protocolBinding": "http-json-openai-v1",
                "url": f"{base_url}/v1/chat/completions",
                "endpointUrl": f"{base_url}/v1/chat/completions",
                "protocolVersion": "1.0.0",
            },
            {
                "type": "json-rpc-a2a-v1",
                "protocolBinding": "json-rpc-a2a-v1",
                "url": f"{base_url}/rpc",
                "endpointUrl": f"{base_url}/rpc",
                "protocolVersion": "1.0.0",
            },
        ],
        "securitySchemes": {
            "apiKeySecurityScheme": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "API key required for authenticated access",
            }
        },
        "security": [{"apiKeySecurityScheme": []}],
        # 💎 METADATA for marketplace discovery
        "metadata": {
            "category": "healthcare",
            "tags": [
                "ai-diagnostics",
                "computer-vision",
                "fhir",
                "mcp",
                "a2a",
                "sharp",
                "xai",
            ],
            "license": "MIT",
            "repository": "https://github.com/sunaypotnuru/Netra-Ai",
            "documentation": "https://netra-ai-ten.vercel.app/",
        },
    }
