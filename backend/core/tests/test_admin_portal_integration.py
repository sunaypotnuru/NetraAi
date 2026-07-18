"""
Integration tests for the Admin Portal endpoints.
- Stats
- Sessions
- Security Logs
- Force Session Terminate
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_admin
from app.models.schemas import TokenPayload
from app.services.supabase import supabase

client = TestClient(app, base_url="http://localhost")


# Mock token payload for admin
mock_admin = TokenPayload(
    sub="admin_user_id",
    role="admin",
    exp=9999999999
)


async def override_get_current_admin():
    return mock_admin


@pytest.fixture(autouse=True)
def mock_dependencies():
    """Mocks authentications and database connections for admin router testing"""
    app.dependency_overrides[get_current_admin] = override_get_current_admin
    
    with patch.object(supabase, "table") as mock_table:
        # Setup common mock behavior to prevent hitting real unconfigured DB
        mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        yield mock_table
        
    app.dependency_overrides.pop(get_current_admin, None)


def test_get_security_stats(mock_dependencies):
    """Test getting security statistics overview."""
    mock_table = mock_dependencies
    
    # Mock failed logins count
    mock_table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.count = 2
    
    # Mock active sessions
    mock_table.return_value.select.return_value.gte.return_value.execute.return_value.data = [
        {"user_id": "user_1"},
        {"user_id": "user_2"}
    ]
    
    # Mock open alerts
    mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": "incident_1", "title": "Brute Force Warning", "severity": "warning"}
    ]
    
    response = client.get("/api/v1/admin/security/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["failed_logins_24h"] == 2
    assert data["active_sessions"] == 2
    assert data["open_alerts"] == 1
    assert data["security_score"] == 98


def test_get_active_sessions(mock_dependencies):
    """Test getting list of active user sessions."""
    mock_table = mock_dependencies
    
    mock_table.return_value.select.return_value.gte.return_value.order.return_value.execute.return_value.data = [
        {"user_id": "user_123_uuid", "ip_address": "192.168.1.5", "user_agent": "Chrome", "timestamp": "2026-05-19T12:00:00"}
    ]
    
    response = client.get("/api/v1/admin/security/sessions")
    assert response.status_code == 200
    sessions = response.json()
    assert len(sessions) == 1
    assert sessions[0]["user_id"] == "user_123_uuid"
    assert sessions[0]["ip"] == "192.168.1.5"


def test_get_security_logs(mock_dependencies):
    """Test getting recent security audit logs."""
    mock_table = mock_dependencies
    
    mock_table.return_value.select.return_value.in_.return_value.order.return_value.limit.return_value.execute.return_value.data = [
        {"action": "login_failed", "event_category": "auth", "timestamp": "2026-05-19T11:00:00"}
    ]
    
    response = client.get("/api/v1/admin/security/logs?limit=10")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 1
    assert logs[0]["action"] == "login_failed"


def test_force_terminate_user_sessions(mock_dependencies):
    """Test force terminating user sessions by admin."""
    mock_table = mock_dependencies
    
    # Mock session terminate database execution
    mock_table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
        {"id": "session_1"}
    ]
    
    # Mock audit trail log insert
    mock_table.return_value.insert.return_value.execute.return_value.data = [{}]
    
    response = client.post("/api/v1/admin/security/sessions/target_user_id/terminate")
    assert response.status_code == 200
    data = response.json()
    assert "Successfully terminated" in data["message"]
    assert data["count"] == 1
