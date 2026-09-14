import pytest
from backend.app.breach_checker import BreachChecker
from backend.app.hashing import compute_md5, compute_sha256, compute_bcrypt, compute_argon2id, verify_hash
from backend.app.audit_engine import check_policy_violations

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
