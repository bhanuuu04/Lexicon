import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_login_success():
    response = client.post("/api/auth/login", json={
        "username": "alex.morgan",
        "password": "Company2026!"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("authenticated", "blocked")
    assert data["account"] is not None

def test_login_blocked_account():
    # 1. Block account
    client.post("/api/accounts/ACC-00042/block", json={
        "is_blocked": True,
        "reason": "Suspicious credential activity"
    })
    
    # 2. Try login
    response = client.post("/api/auth/login", json={
        "username": "alex.morgan",
        "password": "Company2026!"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "blocked"
    assert "temporarily blocked" in data["message"]
    assert data["account"]["is_blocked"] is True

    # 3. Restore unblock
    client.post("/api/accounts/ACC-00042/block", json={
        "is_blocked": False
    })

def test_login_invalid_user():
    response = client.post("/api/auth/login", json={
        "username": "nonexistent.user.12345",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "invalid_credentials"
    assert data["account"] is None

def test_bulk_block_all_sensitive():
    response = client.post("/api/accounts/block-all-sensitive", json={
        "reason": "Enterprise SOC Lockdown",
        "scope": "critical_and_breached"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["blocked_count"] >= 0
    assert "locked down" in data["message"]

def test_database_status_endpoint():
    response = client.get("/api/database/status")
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "provider" in data
    assert data["provider"] == "Supabase Cloud PostgreSQL"
    assert data["total_local_accounts"] >= 100

def test_audit_logs_endpoint():
    response = client.get("/api/audit/logs?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
