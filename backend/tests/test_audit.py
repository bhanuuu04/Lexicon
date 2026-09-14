import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.breach_checker import BreachChecker

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Lexicon" in data["service"]

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "Lexicon"
    assert "summary" in data["endpoints"]

def test_breach_checker_in_memory():
    checker = BreachChecker()
    checker._synthetic_breach_set = {"password123", "Company2026!", "Summer2026!"}
    checker._loaded = True
    
    assert checker.is_breached("Company2026!") is True
    assert checker.is_breached("Summer2026!") is True
    assert checker.is_breached("ExtremelyUnlikelyToEverBeBreached_9384729184!") is False
    
    stats = checker.get_corpus_stats()
    assert stats["total_compromised_passwords"] == 3
    assert "Compromised Password Dictionary" in stats["source"]

def test_breach_checker_k_anonymity_and_bulk():
    checker = BreachChecker()
    checker.import_custom_passwords(["Finance2026!", "P@ssword123"], source_label="Custom Threat Feed")
    
    found, prefix, suffix = checker.check_local_k_anonymity("Finance2026!")
    assert found is True
    assert len(prefix) == 5
    assert len(suffix) == 35

    bulk = checker.check_bulk(["Finance2026!", "CleanPassword9981!", "P@ssword123"])
    assert len(bulk) == 3
    assert bulk[0]["is_breached"] is True
    assert bulk[1]["is_breached"] is False
    assert bulk[2]["is_breached"] is True

def test_breach_api_endpoints():
    # 1. POST /api/breach/check
    check_resp = client.post("/api/breach/check", json={"password": "Company2026!", "check_hibp": False})
    assert check_resp.status_code == 200
    data = check_resp.json()
    assert data["is_breached"] is True
    assert data["severity"] == "critical"

    # 2. POST /api/breach/check-bulk
    bulk_resp = client.post("/api/breach/check-bulk", json={"passwords": ["Company2026!", "UniqueRandomPass!99"]})
    assert bulk_resp.status_code == 200
    b_data = bulk_resp.json()
    assert b_data["total_checked"] == 2
    assert b_data["breached_count"] == 1
    assert b_data["clean_count"] == 1

    # 3. GET /api/breach/stats
    stats_resp = client.get("/api/breach/stats")
    assert stats_resp.status_code == 200
    s_data = stats_resp.json()
    assert s_data["total_compromised_passwords"] > 0
    assert "categories" in s_data

    # 4. POST /api/breach/import
    import_resp = client.post("/api/breach/import", json={
        "passwords": ["InjectedLeakedPass2026!"],
        "source_label": "Unit Test Import"
    })
    assert import_resp.status_code == 200
    assert import_resp.json()["imported_count"] == 1

def test_remediation_fallback_generation():
    req_payload = {
        "total_audited": 50000,
        "critical_count": 2140,
        "high_risk_count": 14200,
        "privileged_at_risk": 52,
        "breached_count": 18200,
        "sample_findings": [
            {
                "account_id": "ACC-00042",
                "username": "alex.morgan",
                "department": "Information Technology",
                "role": "Enterprise Active Directory Admin",
                "is_privileged": True,
                "risk_tier": "Critical",
                "baseline_risk": 0.925,
                "final_risk": 0.925,
                "zxcvbn_score": 1,
                "breach_match": True,
                "reuse_cluster_size": 31,
                "policy_violations": ["Length < 12", "Company keyword", "Year suffix"]
            }
        ]
    }
    response = client.post("/api/remediation/report", json=req_payload)
    assert response.status_code == 200
    report = response.json()
    assert "executive_summary" in report
    assert "priority_accounts" in report
    assert len(report["priority_accounts"]) >= 1
    assert "password_policy_recommendations" in report
    assert "mfa_recommendations" in report
    assert "org_blocklist_suggestions" in report

def test_remediation_gpo_powershell_and_playbooks():
    # 1. GET /api/remediation/gpo-script
    gpo_resp = client.get("/api/remediation/gpo-script")
    assert gpo_resp.status_code == 200
    assert "New-ADFineGrainedPasswordPolicy" in gpo_resp.text
    assert "Lexicon-Privileged-PSO" in gpo_resp.text

    # 2. GET /api/remediation/department-playbook/Finance
    fin_resp = client.get("/api/remediation/department-playbook/Finance")
    assert fin_resp.status_code == 200
    f_data = fin_resp.json()
    assert "Finance" in f_data["department"]
    assert len(f_data["top_actions"]) > 0

    # 3. GET /api/remediation/department-playbook/IT
    it_resp = client.get("/api/remediation/department-playbook/IT")
    assert it_resp.status_code == 200
    it_data = it_resp.json()
    assert "Information Technology" in it_data["department"]
