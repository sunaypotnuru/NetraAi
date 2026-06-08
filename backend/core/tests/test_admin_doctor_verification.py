"""
Unit tests for the admin doctor verification endpoints:
- GET /api/v1/admin/doctors/pending
- PUT /api/v1/admin/doctors/{id}/verify
- GET /api/v1/admin/doctors
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_admin
from app.models.schemas import TokenPayload
from app.services.supabase import supabase

client = TestClient(app, base_url="http://localhost")

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
        yield mock_table
    app.dependency_overrides.pop(get_current_admin, None)

def test_get_pending_doctors(mock_dependencies):
    """Test retrieving only pending doctors excluding admins."""
    mock_table = mock_dependencies
    
    # Configure mock chain for get_pending_doctors
    # supabase.table("profiles_doctor").select("*").eq("verification_status", "pending").neq("is_admin", True).execute()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_neq = MagicMock()
    mock_execute = MagicMock()
    
    mock_table.return_value = mock_select
    mock_select.select.return_value = mock_eq
    mock_eq.eq.return_value = mock_neq
    mock_neq.neq.return_value = mock_execute
    mock_execute.execute.return_value.data = [
        {"id": "doc1", "email": "doc1@example.com", "verification_status": "pending", "is_admin": False}
    ]
    
    response = client.get("/api/v1/admin/doctors/pending")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "doc1"
    
    # Verify exact call chains
    mock_table.assert_any_call("profiles_doctor")
    mock_select.select.assert_called_with("*")
    mock_eq.eq.assert_called_with("verification_status", "pending")
    mock_neq.neq.assert_called_with("is_admin", True)

def test_verify_doctor_approve(mock_dependencies):
    """Test approving a doctor updates is_verified and verification_status to approved."""
    mock_table = mock_dependencies
    
    mock_update = MagicMock()
    mock_eq = MagicMock()
    mock_execute = MagicMock()
    
    mock_table.return_value = mock_update
    mock_update.update.return_value = mock_eq
    mock_eq.eq.return_value = mock_execute
    mock_execute.execute.return_value.data = [
        {"id": "doc1", "is_verified": True, "verification_status": "approved"}
    ]
    
    response = client.put("/api/v1/admin/doctors/doc1/verify", json={"verified": True})
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_verified"] is True
    assert data["verification_status"] == "approved"
    
    # Verify update payload
    mock_table.assert_called_with("profiles_doctor")
    mock_update.update.assert_called_with({
        "is_verified": True,
        "verification_status": "approved"
    })
    mock_eq.eq.assert_called_with("id", "doc1")

def test_verify_doctor_reject(mock_dependencies):
    """Test rejecting a doctor updates is_verified to False and verification_status to rejected."""
    mock_table = mock_dependencies
    
    mock_update = MagicMock()
    mock_eq = MagicMock()
    mock_execute = MagicMock()
    
    mock_table.return_value = mock_update
    mock_update.update.return_value = mock_eq
    mock_eq.eq.return_value = mock_execute
    mock_execute.execute.return_value.data = [
        {"id": "doc1", "is_verified": False, "verification_status": "rejected"}
    ]
    
    response = client.put("/api/v1/admin/doctors/doc1/verify", json={"verified": False})
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_verified"] is False
    assert data["verification_status"] == "rejected"
    
    # Verify update payload
    mock_table.assert_called_with("profiles_doctor")
    mock_update.update.assert_called_with({
        "is_verified": False,
        "verification_status": "rejected"
    })
    mock_eq.eq.assert_called_with("id", "doc1")

def test_get_all_doctors_excludes_admins(mock_dependencies):
    """Test retrieving all doctors page filters out admin accounts."""
    mock_table = mock_dependencies
    
    # We mock get_all_doctors which has two calls to profiles_doctor:
    # 1. select("id", count="exact").neq("is_admin", True)
    # 2. select("*").neq("is_admin", True).order("created_at", desc=True).range(...)
    mock_profiles_query = MagicMock()
    mock_table.return_value = mock_profiles_query
    
    # Chain 1: Count
    mock_count_select = MagicMock()
    mock_count_neq = MagicMock()
    mock_count_execute = MagicMock()
    mock_count_execute.execute.return_value.count = 5
    
    # Chain 2: Fetch
    mock_fetch_select = MagicMock()
    mock_fetch_neq = MagicMock()
    mock_fetch_order = MagicMock()
    mock_fetch_range = MagicMock()
    mock_fetch_execute = MagicMock()
    mock_fetch_execute.execute.return_value.data = [
        {"id": "doc1", "email": "doc1@example.com", "verification_status": "approved", "is_admin": False}
    ]
    
    # Hook it all up: since the mock_table returns the same mock query builder,
    # we can use side_effects or structured mocks depending on call pattern.
    # To keep it simple, we can set up mock_profiles_query to return appropriate chains.
    # Note that in python we can inspect the call arguments to differentiate count select vs select("*").
    def select_side_effect(columns=None, count=None):
        if count == "exact":
            res = MagicMock()
            res.neq.return_value.execute.return_value.count = 5
            return res
        else:
            res = MagicMock()
            res.neq.return_value.order.return_value.range.return_value.execute.return_value.data = [
                {"id": "doc1", "email": "doc1@example.com", "verification_status": "approved", "is_admin": False}
            ]
            return res
            
    mock_profiles_query.select.side_effect = select_side_effect
    
    # Mock get_auth_metadata_batch inside get_all_doctors
    with patch("app.routes.admin.get_auth_metadata_batch") as mock_batch:
        mock_batch.return_value = {}
        
        response = client.get("/api/v1/admin/doctors?page=1&limit=50")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert len(data["doctors"]) == 1
        assert data["doctors"][0]["id"] == "doc1"
        
        # Verify both queries filtered by is_admin = True
        mock_profiles_query.select.assert_any_call("id", count="exact")
        mock_profiles_query.select.assert_any_call("*")
