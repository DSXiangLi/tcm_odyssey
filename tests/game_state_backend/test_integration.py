"""Integration tests for game state backend."""

import requests
import pytest

BASE_URL = "http://localhost:8643"
PLAYER_ID = "test_player"

def test_health_check():
    """Test health endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_and_query_task():
    """Test create task and query."""
    # Create task
    create_response = requests.post(
        f"{BASE_URL}/api/task/create",
        json={
            "player_id": PLAYER_ID,
            "task_id": "test-task-001",
            "title": "Test Task",
            "type": "prescription"
        }
    )
    assert create_response.status_code == 200
    assert create_response.json()["status"] == "created"

    # Query tasks
    query_response = requests.get(
        f"{BASE_URL}/api/tasks/{PLAYER_ID}"
    )
    assert query_response.status_code == 200
    tasks = query_response.json()["tasks"]
    assert len(tasks) > 0
    assert any(t["task_id"] == "test-task-001" for t in tasks)

def test_complete_case():
    """Test complete case."""
    response = requests.post(
        f"{BASE_URL}/api/case/complete",
        json={
            "player_id": PLAYER_ID,
            "case_id": "test-case-001",
            "title": "Test Case",
            "score": 85,
            "diagnosis": "风寒表实",
            "prescription": "麻黄汤",
            "errors": ["脉诊判断"]
        }
    )
    assert response.status_code == 200
    assert response.json()["experience_gained"] >= 50

def test_record_weakness():
    """Test record weakness."""
    response = requests.post(
        f"{BASE_URL}/api/weakness/record",
        json={
            "player_id": PLAYER_ID,
            "weakness_type": "配伍理解",
            "details": "Test weakness",
            "task_id": "test-task-001"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "recorded"