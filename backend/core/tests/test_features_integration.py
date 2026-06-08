"""
Integration tests for new category features including:
- Gamification (Achievements, Badges, Challenges)
- Health Timeline (Chronological search and manual addition)
- Documents & Medical Reports (Access and categorization)
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.models.schemas import TokenPayload
from app.services.supabase import supabase

client = TestClient(app, base_url="http://localhost")


# Mock token payload for standard patient user
mock_user_payload = TokenPayload(
    sub="patient_user_uuid",
    role="patient",
    exp=9999999999
)


async def override_get_current_user():
    return mock_user_payload


class MockTableQuery:
    def __init__(self, data=None, count=None):
        self.data = data or []
        self.count = count or 0

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def gte(self, *args, **kwargs):
        return self

    def lte(self, *args, **kwargs):
        return self

    def insert(self, *args, **kwargs):
        return self

    def execute(self, *args, **kwargs):
        mock_res = MagicMock()
        mock_res.data = self.data
        mock_res.count = self.count
        return mock_res


def table_side_effect(table_name):
    if table_name == "achievements":
        return MockTableQuery(data=[
            {
                "id": "ach_1",
                "code": "first_login",
                "title": "Welcome Aboard",
                "description": "Log in for the first time",
                "icon": "🏆",
                "points": 50,
                "target_value": 1,
                "role_type": "patient"
            }
        ])
    elif table_name == "user_achievements":
        return MockTableQuery(data=[
            {
                "achievement_id": "ach_1",
                "progress": 1,
                "is_completed": True,
                "completed_at": "2026-05-19T12:00:00"
            }
        ])
    elif table_name == "user_points":
        return MockTableQuery(data=[
            {"total_points": 350}
        ])
    elif table_name == "badges":
        return MockTableQuery(data=[
            {
                "id": "badge_1",
                "name": "Super Patient",
                "description": "Earned by logging vitals daily",
                "icon": "🎖️",
                "points_reward": 100
            }
        ])
    elif table_name == "user_badges":
        return MockTableQuery(data=[
            {"badge_id": "badge_1", "earned_at": "2026-05-19"}
        ])
    elif table_name == "challenges":
        return MockTableQuery(data=[
            {
                "id": "ch_1",
                "title": "Daily Steps",
                "description": "Walk 10k steps",
                "target_value": 10000,
                "reward_points": 20,
                "is_active": True
            }
        ])
    elif table_name == "user_challenges":
        return MockTableQuery(data=[
            {
                "challenge_id": "ch_1",
                "current_progress": 5000,
                "completed": False,
                "completed_at": None
            }
        ])
    elif table_name == "timeline_events":
        return MockTableQuery(data=[
            {
                "id": "evt_1",
                "title": "Regular Dental Checkup",
                "event_date": "2026-05-18",
                "event_type": "consultation",
                "description": "Healthy gums and teeth"
            }
        ])
    elif table_name == "documents":
        return MockTableQuery(data=[
            {
                "id": "doc_1",
                "patient_id": "patient_user_uuid",
                "title": "Chest X-Ray.pdf",
                "name": "Chest X-Ray.pdf",
                "description": "Routine scan",
                "file_type": "application/pdf",
                "file_size": 245000,
                "category": "scans",
                "file_url": "https://example.com/doc_1",
                "created_at": "2026-05-18T10:00:00"
            }
        ])
    return MockTableQuery()


@pytest.fixture(autouse=True)
def mock_dependencies():
    """Mocks authentications and database connections for feature router testing"""
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    with patch.object(supabase, "table", side_effect=table_side_effect) as mock_table:
        yield mock_table
        
    app.dependency_overrides.pop(get_current_user, None)


# ============================================================================
# GAMIFICATION INTEGRATION TESTS
# ============================================================================

def test_get_gamification_achievements(mock_dependencies):
    """Test retrieving achievements and current user points/level."""
    response = client.get("/api/v1/gamification/achievements")
    assert response.status_code == 200
    data = response.json()
    assert data["points"] == 350
    assert data["level"] == 4  # 350 // 100 + 1 = 4
    assert data["next_level_points"] == 400
    assert len(data["achievements"]) == 1
    assert data["achievements"][0]["name"] == "Welcome Aboard"


def test_get_gamification_badges(mock_dependencies):
    """Test retrieving earned and unearned badges."""
    response = client.get("/api/v1/gamification/badges")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Super Patient"
    assert data[0]["earned"] is True


def test_get_gamification_challenges(mock_dependencies):
    """Test retrieving active health challenges."""
    response = client.get("/api/v1/gamification/challenges")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "Daily Steps"
    assert data[0]["current_progress"] == 5000


# ============================================================================
# HEALTH TIMELINE INTEGRATION TESTS
# ============================================================================

def test_get_health_timeline(mock_dependencies):
    """Test unified health timeline history."""
    response = client.get("/api/v1/timeline")
    assert response.status_code == 200
    data = response.json()
    assert "records" in data
    assert len(data["records"]) >= 1
    assert data["records"][0]["title"] == "Regular Dental Checkup"


def test_add_manual_timeline_event(mock_dependencies):
    """Test adding custom manual event to health history timeline."""
    with patch.object(supabase, "table") as local_mock_table:
        local_mock_table.return_value.insert.return_value.execute.return_value.data = [
            {"id": "evt_new", "title": "Jogging Marathon", "event_date": "2026-05-19"}
        ]
        
        payload = {
            "title": "Jogging Marathon",
            "category": "exercise",
            "event_date": "2026-05-19",
            "description": "Completed 5k running exercise"
        }
        
        response = client.post("/api/v1/timeline", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "evt_new"
        assert data["title"] == "Jogging Marathon"


# ============================================================================
# DOCUMENTS INTEGRATION TESTS
# ============================================================================

def test_get_documents_and_reports(mock_dependencies):
    """Test fetching and listing uploaded health reports and scans."""
    response = client.get("/api/v1/documents")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Chest X-Ray.pdf"
