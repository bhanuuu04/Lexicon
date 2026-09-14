import pytest
from backend.app.breach_checker import BreachChecker
from backend.app.hashing import compute_md5, compute_sha256, compute_bcrypt, compute_argon2id, verify_hash
from backend.app.audit_engine import check_policy_violations
from backend.app.features.dataset_generator.generator import (
    generate_accounts,
    build_reuse_groups,
    generate_distinct_password_pools,
    generate_and_save_dataset
)

def test_hashing_verifications():
    pwd = "Company2026!"
    
    md5_hash = compute_md5(pwd)
    assert len(md5_hash) == 32
    assert verify_hash(pwd, "md5", md5_hash) is True
    assert verify_hash("WrongPass", "md5", md5_hash) is False
    
    sha256_hash = compute_sha256(pwd)
    assert len(sha256_hash) == 64
    assert verify_hash(pwd, "sha256", sha256_hash) is True
    
    bcrypt_hash = compute_bcrypt(pwd, cost=10)
    assert bcrypt_hash.startswith("$2b$") or bcrypt_hash.startswith("$2a$")
    assert verify_hash(pwd, "bcrypt", bcrypt_hash) is True
    assert verify_hash("WrongPass", "bcrypt", bcrypt_hash) is False
    
    argon2_hash = compute_argon2id(pwd)
    assert "$argon2id$" in argon2_hash
    assert verify_hash(pwd, "argon2id", argon2_hash) is True
    assert verify_hash("WrongPass", "argon2id", argon2_hash) is False

def test_policy_violation_detection():
    # Weak predictable password
    violations = check_policy_violations("company2026", "alex.morgan", "IT")
    assert any("length" in v.lower() or "complexity" in v.lower() for v in violations)
    assert any("company" in v.lower() or "predictable" in v.lower() for v in violations)
    
    # Strong random password
    strong_violations = check_policy_violations("K#9xP$vL2@mQ7!zR", "alex.morgan", "IT")
    assert len(strong_violations) == 0

def test_generate_accounts_structure_and_hero_group():
    """Verify that synthetic generation creates valid accounts, invariants, and zero duplicate groups."""
    accounts, breach_corpus, summary = generate_accounts(total_accounts=500)
    
    assert len(accounts) == 500
    assert len(breach_corpus) > 0
    assert summary["total_accounts"] == 500

    # 1. Hero Account #42 Invariants
    hero_acc = accounts[0]
    assert hero_acc["is_hero"] is True
    assert hero_acc["id"] == "ACC-00042"
    assert hero_acc["username"] == "alex.morgan"
    assert hero_acc["email"] == "alex.morgan@lexicon.corp"
    assert hero_acc["department"] == "Information Technology"
    assert hero_acc["role"] == "Enterprise Active Directory Admin"
    assert hero_acc["is_privileged"] is True
    assert hero_acc["plaintext_password"] == "Company2026!"
    assert hero_acc["password_group_id"] == 42
    assert hero_acc["breach_match"] is True

    # Check that Hero Group 42 has exactly 31 accounts
    group_42_members = [a for a in accounts if a.get("password_group_id") == 42]
    assert len(group_42_members) == 31

    # 2. Enterprise Active Directory attributes
    for a in accounts[:20]:
        assert "email" in a and "@lexicon.corp" in a["email"]
        assert "first_name" in a and len(a["first_name"]) > 0
        assert "last_name" in a and len(a["last_name"]) > 0
        assert "sid" in a and a["sid"].startswith("S-1-5-21-")
        assert "hash_ntlm" in a and len(a["hash_ntlm"]) == 32
        assert "hash_sha256" in a and len(a["hash_sha256"]) == 64
        assert "hash_bcrypt" in a
        assert "hash_argon2id" in a
        assert "factors" in a and isinstance(a["factors"], dict)
        assert "radar" in a and isinstance(a["radar"], dict)
        assert 0.0 <= a["baseline_risk"] <= 1.0

def test_unique_accounts_have_no_duplicate_collisions():
    """Verify that accounts marked with password_group_id=None have strictly unique passwords."""
    accounts, _, _ = generate_accounts(total_accounts=300)
    
    unique_accs = [a for a in accounts if a.get("password_group_id") is None]
    unique_pwds = [a["plaintext_password"] for a in unique_accs]
    
    assert len(unique_pwds) == len(set(unique_pwds)), "Found duplicate passwords among unique non-reused accounts!"

def test_distinct_password_pools():
    """Verify distinct password pool generator produces valid lists."""
    weak, strong = generate_distinct_password_pools(weak_count=50, strong_count=30)
    assert len(weak) == 50
    assert len(strong) == 30
    assert len(set(weak)) == 50
    assert len(set(strong)) == 30

def test_admin_generate_dataset_endpoint(monkeypatch):
    """Verify the /api/dataset/generate endpoint completes rapidly and updates summary without polluting production files."""
    def mock_generate_and_save(total_accounts=250):
        accs = [{"id": "ACC-00042", "username": "alex.morgan", "is_blocked": False, "final_tier": "Critical", "department": "SecOps", "is_privileged": True, "password_hash": "abc"}]
        corpus = ["Company2026!"]
        meta = {"version": "1.0.0", "total_accounts": total_accounts, "is_custom_generated": True, "blocked_count": 0}
        summary = {"total_accounts": total_accounts, "critical_count": 1, "high_risk_count": 0, "medium_risk_count": 0, "low_risk_count": 0, "breached_count": 1, "reuse_cluster_count": 1, "total_reused_accounts": 1, "privileged_count": 1, "privileged_at_risk_count": 1, "policy_violations_count": 0, "risk_distribution": {"critical": 1, "high": 0, "medium": 0, "low": 0}, "department_risk_summary": {}, "top_reuse_clusters": [], "hero_account_id": "ACC-00042"}
        return accs, corpus, meta, summary

    import sys
    import backend.app.features.dataset_generator.generator as gen_mod
    monkeypatch.setattr(gen_mod, "generate_and_save_dataset", mock_generate_and_save)
    for mod_name, mod in list(sys.modules.items()):
        if "dataset_api" in mod_name and hasattr(mod, "generate_and_save_dataset"):
            monkeypatch.setattr(mod, "generate_and_save_dataset", mock_generate_and_save)

    from backend.app.features.dataset_api.router import get_accounts_cache_state, restore_accounts_cache_state
    orig_accs, orig_audit, orig_meta = get_accounts_cache_state()

    from fastapi.testclient import TestClient
    from backend.app.main import app

    client = TestClient(app)
    try:
        resp = client.post("/api/dataset/generate", json={"count": 250, "replace_supabase": False})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert "metadata" in data
        assert "summary" in data
        assert data["metadata"]["total_accounts"] == 250
        assert data["summary"]["total_accounts"] == 250
    finally:
        restore_accounts_cache_state(orig_accs, orig_audit, orig_meta)


