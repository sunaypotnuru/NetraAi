"""
Integration tests for the Video Consultation API endpoints.
Tests session creation, joining, status retrieval, and integration with Supabase.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

from app.core.security import get_current_user
from app.services.supabase import supabase

client = TestClient(app, base_url="http://localhost")

# Mock token dependency
mock_token_payload = MagicMock()
mock_token_payload.sub = "doctor-123"
mock_token_payload.role = "doctor"

@pytest.fixture(autouse=True)
def mock_dependencies():
    """Mocks authentications and database connections for router testing"""
    app.dependency_overrides[get_current_user] = lambda: mock_token_payload
    
    with patch.object(supabase, "table") as mock_table:
        # Provide sensible default empty mock responses
        mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        yield mock_table
        
    app.dependency_overrides.clear()


def test_create_video_session(mock_dependencies):
    mock_table = mock_dependencies

    # Setup insert response mock
    mock_table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "session_id": "session-xyz",
            "appointment_id": "appt-456",
            "doctor_id": "doctor-123",
            "patient_id": "patient-789",
            "status": "waiting",
            "created_at": "2026-05-19T12:00:00"
        }
    ]

    payload = {
        "appointment_id": "appt-456",
        "patient_id": "patient-789",
        "doctor_id": "doctor-123"
    }

    response = client.post("/api/v1/video/sessions", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["session_id"] == "session-xyz"
    assert data["status"] == "waiting"


def test_get_session_details(mock_dependencies):
    mock_table = mock_dependencies

    # Setup select response mock
    mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "session_id": "session-xyz",
            "appointment_id": "appt-456",
            "doctor_id": "doctor-123",
            "patient_id": "patient-789",
            "status": "active",
            "started_at": "2026-05-19T12:05:00",
            "duration_seconds": None,
            "recording_enabled": True,
            "recording_consent_given": True,
            "emergency_disconnect": False,
            "created_at": "2026-05-19T12:00:00"
        }
    ]

    response = client.get("/api/v1/video/sessions/session-xyz")
    assert response.status_code == 200
    data = response.json()
    
    assert data["session_id"] == "session-xyz"
    assert data["status"] == "active"
    assert data["recording_enabled"] is True


def test_join_session(mock_dependencies):
    mock_table = mock_dependencies

    # Setup select response mock for joining
    mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "session_id": "session-xyz",
            "appointment_id": "appt-456",
            "doctor_id": "doctor-123",
            "patient_id": "patient-789",
            "status": "waiting",
        }
    ]
    
    # Setup update response mock
    mock_table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
        {"id": "11111111-1111-1111-1111-111111111111", "status": "active"}
    ]

    payload = {
        "user_id": "doctor-123"
    }

    # Test joining as doctor
    response = client.post("/api/v1/video/sessions/session-xyz/join", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True
    
    # Test unauthorized join
    payload_unauth = {
        "user_id": "hacker-999"
    }
    response = client.post("/api/v1/video/sessions/session-xyz/join", json=payload_unauth)
    # The route returns 403 when False is returned by join_session
    assert response.status_code == 403


def test_end_session(mock_dependencies):
    mock_table = mock_dependencies

    # Setup select response mock
    mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "session_id": "session-xyz",
            "status": "active",
            "started_at": "2026-05-19T12:05:00+00:00"
        }
    ]

    # End session internally updates the table
    mock_table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
        {"id": "11111111-1111-1111-1111-111111111111", "status": "completed"}
    ]

    response = client.post("/api/v1/video/sessions/session-xyz/end")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_get_quality_diagnostics(mock_dependencies):
    # Tests call_quality_monitor.py integration
    mock_table = mock_dependencies

    # Setup select response mock for metrics including the limit(limit) chain call
    mock_table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = [
        {
            "video_bitrate_kbps": 1200,
            "audio_bitrate_kbps": 128,
            "packet_loss_percent": 0.5,
            "jitter_ms": 15,
            "round_trip_time_ms": 40,
            "frames_per_second": 30,
            "quality_score": 90,
            "quality_rating": "excellent",
            "timestamp": "2026-05-19T12:10:00"
        }
    ]

    response = client.get("/api/v1/video/quality/diagnostics/session-xyz")
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "quality_score" in data
    assert data["quality_score"] == 90
    assert data["quality_rating"] == "excellent"


def test_webrtc_signaling(mock_dependencies):
    mock_table = mock_dependencies
    
    # Test WebRTC Offer Creation
    mock_table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "sig-123",
            "consultation_id": "session-xyz",
            "user_id": "doctor-123",
            "sdp": "v=0...",
            "sdp_type": "offer"
        }
    ]
    
    payload = {
        "sdp": "v=0...",
        "sdp_type": "offer"
    }
    
    response = client.post("/api/v1/video/signaling/offer/session-xyz", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True
