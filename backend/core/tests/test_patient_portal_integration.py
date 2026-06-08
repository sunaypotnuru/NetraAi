"""
Integration tests for the updated Patient Portal API endpoints, including
alias routes, schema mappings, health records, settings, and family member accounts.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

from app.core.security import get_current_user
from app.routes.patient import get_current_patient

client = TestClient(app, base_url="http://localhost")

# Mock token dependency to return patient user
mock_current_user = MagicMock()
mock_current_user.sub = "patient-123"
mock_current_user.id = "patient-123"
mock_current_user.email = "patient@example.com"
mock_current_user.role = "patient"

mock_token_payload = mock_current_user


from app.services.supabase import supabase

@pytest.fixture(autouse=True)
def mock_dependencies():
    """Mocks authentications and database connections for router testing"""
    app.dependency_overrides[get_current_user] = lambda: mock_current_user
    app.dependency_overrides[get_current_patient] = lambda: mock_token_payload
    
    with patch.object(supabase, "table") as mock_table:
        # Setup common mock behavior
        mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        yield mock_table
        
    app.dependency_overrides.clear()


# ============================================================================
# 1. Medication Schema Integration Mappings
# ============================================================================

def test_medication_creation_and_retrieval_mapping(mock_dependencies):
    mock_table = mock_dependencies

    # Setup insert response mock
    mock_table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "med-1",
            "patient_id": "patient-123",
            "name": "Ibuprofen",
            "dosage": "200mg",
            "frequency": "daily",
            "start_date": "2026-05-01",
            "end_date": None,
            "reminder_times": ["08:00", "20:00"],
            "reminder_enabled": True,
            "is_active": True
        }
    ]

    # Create medication payload using new portal keys
    payload = {
        "medication_name": "Ibuprofen",
        "dosage": "200mg",
        "frequency": "daily",
        "start_date": "2026-05-01",
        "reminder_times": ["08:00", "20:00"]
    }

    response = client.post("/api/v1/patient/medications", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Assert bidirectional schema mapping translates correctly
    assert data["medication_name"] == "Ibuprofen"
    assert data["name"] == "Ibuprofen"
    assert data["reminder_times"] == ["08:00", "20:00"]
    assert data["time_slots"] == ["08:00", "20:00"]


# ============================================================================
# 2. Family Members Validation & Aliases
# ============================================================================

def test_family_member_capitalization_and_phone(mock_dependencies):
    mock_table = mock_dependencies

    # Mock DB insert for family member
    mock_table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "fam-1",
            "primary_user_id": "patient-123",
            "name": "Jane Doe",
            "relationship": "parent",
            "email": "jane@example.com",
            "phone": "+1234567890",
            "can_view_records": True,
            "can_book_appointments": True
        }
    ]

    # Send capitalized relationship and custom name/email fields
    payload = {
        "name": "Jane Doe",
        "relationship": "Parent",  # Capitalized, should normalize and pass validation
        "email": "jane@example.com",
        "phone": "+1234567890",
        "can_view_records": True,
        "can_book_appointments": True
    }

    # Test GET, POST, PUT, DELETE aliases
    response = client.post("/api/v1/patient/family", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["relationship"] == "parent"  # Normalized to lowercase
    assert data["phone"] == "+1234567890"


# ============================================================================
# 3. Health Record Endpoints
# ============================================================================

def test_health_record_vitals(mock_dependencies):
    mock_table = mock_dependencies
    
    mock_table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
        {"id": "v-1", "systolic": 120, "diastolic": 80, "logged_at": "2026-05-18T10:00:00"}
    ]

    response = client.get("/api/v1/patient/records/vitals")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["systolic"] == 120


def test_health_record_lab_results(mock_dependencies):
    mock_table = mock_dependencies
    
    mock_table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
        {
            "id": "s-1",
            "hemoglobin_estimate": "11.5",
            "prediction": "Mild Anemia Detected",
            "created_at": "2026-05-18T10:00:00"
        }
    ]

    response = client.get("/api/v1/patient/records/lab-results")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["test_name"] == "Hemoglobin Scan Assessment"
    assert results[0]["result_value"] == "11.5"
    assert results[0]["abnormal_flag"] == "L"  # 11.5 is < 12.0


# ============================================================================
# 4. Settings & Preferences Endpoints
# ============================================================================

def test_settings_profile_and_preferences(mock_dependencies):
    mock_table = mock_dependencies

    # GET profile
    mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"user_id": "patient-123", "full_name": "John Doe", "blood_group": "O+"}
    ]
    response = client.get("/api/v1/patient/settings/profile")
    assert response.status_code == 200
    assert response.json()["full_name"] == "John Doe"

    # PUT profile
    mock_table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
        {"user_id": "patient-123", "full_name": "John Changed"}
    ]
    response = client.put("/api/v1/patient/settings/profile", json={"full_name": "John Changed"})
    assert response.status_code == 200
    assert response.json()["full_name"] == "John Changed"
