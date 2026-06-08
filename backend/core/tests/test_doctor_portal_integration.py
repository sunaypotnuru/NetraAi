"""
Integration tests for the updated Doctor Portal API endpoints, including
earnings, statistics, clinical notes, note templates, prescription templates,
revenue analytics, patient analytics, transaction history, and earnings summary.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

from app.core.security import get_current_doctor
from app.services.supabase import supabase

client = TestClient(app, base_url="http://localhost")

# Mock token dependency to return doctor user
mock_current_doctor = {
    "id": "doctor-123",
    "email": "doctor@example.com",
    "role": "doctor"
}

mock_token_payload = MagicMock()
mock_token_payload.sub = "doctor-123"
mock_token_payload.role = "doctor"


@pytest.fixture(autouse=True)
def mock_dependencies():
    """Mocks authentications and database connections for router testing"""
    app.dependency_overrides[get_current_doctor] = lambda: mock_token_payload
    
    with patch.object(supabase, "table") as mock_table:
        # Setup common mock behavior
        mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        yield mock_table
        
    app.dependency_overrides.clear()


# ============================================================================
# 1. Earnings & Statistics Routes
# ============================================================================

def test_get_earnings(mock_dependencies):
    mock_table = mock_dependencies

    # Setup mocked response for appointments search
    mock_table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value.data = [
        {
            "id": "apt-1",
            "doctor_id": "doctor-123",
            "patient_id": "patient-1",
            "consultation_fee": 150.00,
            "type": "consultation",
            "payment_status": "paid",
            "scheduled_at": "2026-05-19T10:00:00"
        }
    ]

    response = client.get("/api/v1/doctor/earnings?period=month")
    assert response.status_code == 200
    data = response.json()
    assert data["total_earnings"] == 150.00
    assert data["total_appointments"] == 1


def test_get_statistics(mock_dependencies):
    mock_table = mock_dependencies

    # Setup mocked responses for different table queries inside statistics calculation
    mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"patient_id": "patient-1"},
        {"patient_id": "patient-2"}
    ]
    mock_table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.count = 5
    mock_table.return_value.select.return_value.eq.return_value.execute.return_value.count = 3

    response = client.get("/api/v1/doctor/statistics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_patients"] == 2


# ============================================================================
# 2. Clinical Notes Endpoints
# ============================================================================

def test_clinical_notes_lifecycle(mock_dependencies):
    mock_table = mock_dependencies

    # 1. Create clinical note
    mock_table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "note-1",
            "doctor_id": "doctor-123",
            "patient_id": "patient-1",
            "note_type": "soap",
            "subjective": "Feeling tired",
            "objective": "Normal blood pressure",
            "assessment": "Fatigue",
            "plan": "Rest and follow-up in 1 week",
            "is_ai_generated": False
        }
    ]

    payload = {
        "patient_id": "patient-1",
        "note_type": "soap",
        "subjective": "Feeling tired",
        "objective": "Normal blood pressure",
        "assessment": "Fatigue",
        "plan": "Rest and follow-up in 1 week"
    }

    response = client.post("/api/v1/doctor/clinical-notes", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "note-1"
    assert data["assessment"] == "Fatigue"


# ============================================================================
# 3. Prescription Templates Endpoints
# ============================================================================

def test_prescription_templates_lifecycle(mock_dependencies):
    mock_table = mock_dependencies

    # Mock template creation response
    mock_table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "template-1",
            "doctor_id": "doctor-123",
            "name": "General Hypertension Protocol",
            "medication_name": "Amlodipine",
            "dosage": "5mg",
            "frequency": "OD",
            "duration": "30 days",
            "is_favorite": True
        }
    ]

    payload = {
        "name": "General Hypertension Protocol",
        "medication_name": "Amlodipine",
        "dosage": "5mg",
        "frequency": "OD",
        "duration": "30 days",
        "is_favorite": True
    }

    response = client.post("/api/v1/doctor/prescription-templates", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "template-1"
    assert data["medication_name"] == "Amlodipine"
    assert data["is_favorite"] is True


# ============================================================================
# 4. Advanced Analytics & Summary Endpoints
# ============================================================================

def test_advanced_analytics_endpoints(mock_dependencies):
    mock_table = mock_dependencies

    # Setup mocked response for appointments and earnings breakdown
    mock_table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value.data = []

    # Test /analytics/revenue
    response = client.get("/api/v1/doctor/analytics/revenue?period=year")
    assert response.status_code == 200
    
    # Test /analytics/patients
    response = client.get("/api/v1/doctor/analytics/patients?period=year")
    assert response.status_code == 200

    # Test /earnings/summary
    response = client.get("/api/v1/doctor/earnings/summary?period=month")
    assert response.status_code == 200
