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
    assert "Synthetic Compromised Password Corpus" in stats["source"]

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
