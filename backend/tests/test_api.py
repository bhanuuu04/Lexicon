import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.features.dataset_api.router import get_accounts, save_accounts

client = TestClient(app)

@pytest.fixture(autouse=True)
def restore_dataset_state():
    accounts = get_accounts()
    hero_snapshot = next((dict(a) for a in accounts if a["id"] == "ACC-00042"), None)
    yield
    if hero_snapshot:
        for idx, a in enumerate(accounts):
            if a["id"] == "ACC-00042":
                accounts[idx] = dict(hero_snapshot)
                break
        save_accounts(accounts)

def test_api_dataset_summary():
    response = client.get("/api/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_accounts"] >= 100
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

def test_api_dataset_metadata():
    response = client.get("/api/dataset/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert "created_at" in data
    assert data["total_accounts"] >= 100

def test_api_compromised_accounts():
    response = client.get("/api/dataset/compromised-accounts?vector=all&page_size=20")
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert "accounts" in data
    assert data["stats"]["total_compromised"] > 0

def test_api_block_and_unblock_account():
    # 1. Block account
    block_resp = client.post("/api/accounts/ACC-00042/block", json={
        "is_blocked": True,
        "reason": "Compromised in attack simulation"
    })
    assert block_resp.status_code == 200
    block_data = block_resp.json()
    assert block_data["is_blocked"] is True
    assert block_data["blocked_reason"] == "Compromised in attack simulation"

    # 2. Check in account detail
    acc_resp = client.get("/api/dataset/accounts/ACC-00042")
    assert acc_resp.status_code == 200
    assert acc_resp.json()["is_blocked"] is True

    # 3. Unblock account
    unblock_resp = client.post("/api/accounts/ACC-00042/block", json={
        "is_blocked": False
    })
    assert unblock_resp.status_code == 200
    assert unblock_resp.json()["is_blocked"] is False

def test_api_deterministic_password_reset_reject_and_accept():
    # 1. Test rejection (weak season password with company context)
    bad_resp = client.post("/api/accounts/ACC-00042/reset-password", json={
        "new_password": "LexiconSummer2024!"
    })
    assert bad_resp.status_code == 200
    bad_data = bad_resp.json()
    assert bad_data["success"] is False
    assert any(not c["passed"] for c in bad_data["checks"])

    # 2. Test rejection (contains username)
    user_resp = client.post("/api/accounts/ACC-00042/reset-password", json={
        "new_password": "AlexMorgan#2026Secure!"
    })
    assert user_resp.status_code == 200
    user_data = user_resp.json()
    assert user_data["success"] is False

    # 3. Test acceptance (hardened compliant password)
    strong_pwd = "Xk9#vP!qR7$wL2zM"
    good_resp = client.post("/api/accounts/ACC-00042/reset-password", json={
        "new_password": strong_pwd
    })
    assert good_resp.status_code == 200
    good_data = good_resp.json()
    assert good_data["success"] is True
    assert all(c["passed"] for c in good_data["checks"])
    assert good_data["account"]["is_blocked"] is False
    assert good_data["account"]["final_tier"] == "Low"

    # 4. Verify that summary and organization_health updated in real-time
    sum_resp = client.get("/api/dataset/summary")
    assert sum_resp.status_code == 200
    sum_data = sum_resp.json()
    assert "organization_health" in sum_data
    assert "security_readiness_pct" in sum_data["organization_health"]
    assert sum_data["organization_health"]["security_readiness_pct"] > 0


