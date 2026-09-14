import pytest
from backend.app.hashing import hash_password, verify_password, compute_all_hashes, compute_ntlm, compute_bcrypt, compute_argon2id
from backend.app.config import BCRYPT_COST, ARGON2_MEMORY, ARGON2_ITERATIONS

def test_hash_password_interface_contract():
    pwd = "Company2026!"

    # 1. NTLM (Active Directory Default - MD4 based)
    ntlm_res = hash_password(pwd, "NTLM")
    assert ntlm_res["algorithm"] == "NTLM"
    assert len(ntlm_res["hash"]) == 32
    assert isinstance(ntlm_res["time_taken_ms"], float)
    assert ntlm_res["time_taken_ms"] >= 0
    # Known test vector for "Company2026!" in UTF-16LE MD4
    assert ntlm_res["hash"] == "248DE74C1E9440B4F79F14965F5FF47D"
    assert verify_password(pwd, ntlm_res["hash"], "ntlm") is True
    assert verify_password(pwd, ntlm_res["hash"].lower(), "NTLM") is True
    assert verify_password("WrongPassword123!", ntlm_res["hash"], "ntlm") is False

    # 2. SHA-256 (Standard non-adaptive digest)
    sha_res = hash_password(pwd, "sha-256")
    assert sha_res["algorithm"] == "sha-256"
    assert len(sha_res["hash"]) == 64
    assert isinstance(sha_res["time_taken_ms"], float)
    assert verify_password(pwd, sha_res["hash"], "SHA-256") is True
    assert verify_password("WrongPassword123!", sha_res["hash"], "SHA256") is False

    # 3. Bcrypt (Adaptive Eksblowfish - Cost 12)
    bcrypt_res = hash_password(pwd, "bcrypt")
    assert bcrypt_res["algorithm"] == "bcrypt"
    assert bcrypt_res["hash"].startswith("$2b$") or bcrypt_res["hash"].startswith("$2a$")
    assert f"${BCRYPT_COST}$" in bcrypt_res["hash"]
    assert isinstance(bcrypt_res["time_taken_ms"], float)
    assert verify_password(pwd, bcrypt_res["hash"], "bcrypt") is True
    assert verify_password("WrongPassword123!", bcrypt_res["hash"], "bcrypt") is False

    # 4. Argon2id (Memory-hard standard - 64MB, 4 Passes)
    argon_res = hash_password(pwd, "Argon2id")
    assert argon_res["algorithm"] == "Argon2id"
    assert "$argon2id$" in argon_res["hash"]
    assert f"m={ARGON2_MEMORY},t={ARGON2_ITERATIONS}" in argon_res["hash"]
    assert isinstance(argon_res["time_taken_ms"], float)
    assert verify_password(pwd, argon_res["hash"], "Argon2id") is True
    assert verify_password("WrongPassword123!", argon_res["hash"], "argon2id") is False

    # 5. MD5 (Legacy compatibility)
    md5_res = hash_password(pwd, "MD5")
    assert md5_res["algorithm"] == "MD5"
    assert len(md5_res["hash"]) == 32
    assert verify_password(pwd, md5_res["hash"], "md5") is True

def test_unsupported_algorithm_raises_error():
    with pytest.raises(ValueError, match="Unsupported algorithm"):
        hash_password("test", "DES_LEGACY")

def test_compute_all_hashes_integrity():
    pwd = "EnterpriseSecure2026!"
    all_hashes = compute_all_hashes(pwd)
    assert "hash_ntlm" in all_hashes
    assert "hash_md5" in all_hashes
    assert "hash_sha256" in all_hashes
    assert "hash_bcrypt" in all_hashes
    assert "hash_argon2id" in all_hashes

    assert verify_password(pwd, all_hashes["hash_ntlm"], "ntlm") is True
    assert verify_password(pwd, all_hashes["hash_md5"], "md5") is True
    assert verify_password(pwd, all_hashes["hash_sha256"], "sha256") is True
    assert verify_password(pwd, all_hashes["hash_bcrypt"], "bcrypt") is True
    assert verify_password(pwd, all_hashes["hash_argon2id"], "argon2id") is True

def test_hashing_api_endpoints():
    from fastapi.testclient import TestClient
    from backend.app.main import app

    client = TestClient(app)

    # 1. POST /api/hashing/compute
    comp_resp = client.post("/api/hashing/compute", json={"password": "Company2026!"})
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert "hash_ntlm" in comp_data
    assert "hash_sha256" in comp_data
    assert "hash_bcrypt" in comp_data
    assert "hash_argon2id" in comp_data

    # 2. POST /api/hashing/verify
    verify_resp = client.post("/api/hashing/verify", json={
        "password": "Company2026!",
        "algorithm": "ntlm",
        "hash_value": comp_data["hash_ntlm"]
    })
    assert verify_resp.status_code == 200
    assert verify_resp.json()["matched"] is True

    # 3. POST /api/hashing/estimate-crack-time
    crack_resp = client.post("/api/hashing/estimate-crack-time", json={
        "password": "Company2026!",
        "algorithm": "ntlm",
        "hardware_rig": "8x_rtx_4090"
    })
    assert crack_resp.status_code == 200
    crack_data = crack_resp.json()
    assert "estimated_seconds" in crack_data
    assert "human_readable" in crack_data

    # 4. GET /api/hashing/algorithms
    algo_resp = client.get("/api/hashing/algorithms")
    assert algo_resp.status_code == 200
    algos = algo_resp.json()
    assert len(algos) >= 4
    assert any(a["name"] == "NTLM" for a in algos)
    assert any(a["name"] == "Argon2id" for a in algos)


