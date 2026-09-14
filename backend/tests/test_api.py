import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_dataset_summary():
    response = client.get("/api/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_accounts"] == 50000
    assert "critical_count" in data
    assert "risk_distribution" in data
    assert data["hero_account_id"] == "ACC-00042"

def test_api_hero_account():
    response = client.get("/api/dataset/hero-account")
    assert response.status_code == 200
    acc = response.json()
    assert acc["id"] == "ACC-00042"
    assert acc["username"] == "alex.morgan"
    assert acc["is_privileged"] is True
    assert acc["password_group_id"] == 42
    assert acc["baseline_tier"] == "Critical"

def test_api_accounts_search_and_filter():
    response = client.get("/api/dataset/accounts?search=alex.morgan")
    assert response.status_code == 200
    res = response.json()
    assert res["total"] >= 1
    assert any(a["username"] == "alex.morgan" for a in res["accounts"])
    
    # Filter by tier
    crit_resp = client.get("/api/dataset/accounts?tier=Critical&page_size=10")
    assert crit_resp.status_code == 200
    crit_data = crit_resp.json()
    assert len(crit_data["accounts"]) > 0
    assert all(a["baseline_tier"] == "Critical" for a in crit_data["accounts"])

def test_api_reuse_cluster():
    response = client.get("/api/dataset/reuse-clusters/42")
    assert response.status_code == 200
    cluster = response.json()
    assert cluster["group_id"] == 42
    assert cluster["total_accounts"] == 31
    assert cluster["privileged_count"] >= 1
    assert "accounts" in cluster

def test_api_attack_result_recording():
    payload = {
        "account_id": "ACC-00042",
        "algorithm": "MD5",
        "candidates_tested": 1420,
        "elapsed_ms": 312.5,
        "matched": True,
        "matched_rule": "year_suffix",
        "time_budget_ms": 30000
    }
    response = client.post("/api/attack/result", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == "ACC-00042"
    assert data["matched"] is True
    assert data["attack_adjustment"] > 0
    assert data["final_risk"] >= data["baseline_risk"]
    assert "Empirical match found" in data["message"]
