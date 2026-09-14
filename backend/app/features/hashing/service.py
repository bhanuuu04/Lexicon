import time
import hashlib
import struct
import binascii
import bcrypt
import argon2
from argon2 import PasswordHasher
from typing import Dict, Any

from backend.app.config import BCRYPT_COST, ARGON2_MEMORY, ARGON2_ITERATIONS, ARGON2_PARALLELISM

# Initialize Argon2id hasher with Argon2id type (64MB, 4 Passes by default)
argon2_hasher = PasswordHasher(
    time_cost=ARGON2_ITERATIONS,
    memory_cost=ARGON2_MEMORY,
    parallelism=ARGON2_PARALLELISM,
    hash_len=32,
    salt_len=16,
    type=argon2.Type.ID
)

# ---------------------------------------------------------------------------
# Pure Python MD4 Fallback for NTLM
# ---------------------------------------------------------------------------

def _md4_ntlm_fallback(msg: bytes) -> str:
    """Pure Python MD4 digest implementation for environments where md4 is disabled in OpenSSL."""
    A, B, C, D = 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476
    orig_len = len(msg) * 8
    msg += b"\x80"
    msg += b"\x00" * ((56 - (len(msg) % 64)) % 64)
    msg += struct.pack("<Q", orig_len)
    F = lambda x, y, z: (x & y) | (~x & z)
    G = lambda x, y, z: (x & y) | (x & z) | (y & z)
    H = lambda x, y, z: x ^ y ^ z
    ROL = lambda x, n: ((x << n) & 0xFFFFFFFF) | (x >> (32 - n))
    for i in range(0, len(msg), 64):
        X = struct.unpack("<16I", msg[i:i+64])
        AA, BB, CC, DD = A, B, C, D
        for j, s in [(0,3), (1,7), (2,11), (3,19), (4,3), (5,7), (6,11), (7,19),
                     (8,3), (9,7), (10,11), (11,19), (12,3), (13,7), (14,11), (15,19)]:
            A = ROL((A + F(B, C, D) + X[j]) & 0xFFFFFFFF, s)
            A, B, C, D = D, A, B, C
        for j, s in [(0,3), (4,5), (8,9), (12,13), (1,3), (5,5), (9,9), (13,13),
                     (2,3), (6,5), (10,9), (14,13), (3,3), (7,5), (11,9), (15,13)]:
            A = ROL((A + G(B, C, D) + X[j] + 0x5A827999) & 0xFFFFFFFF, s)
            A, B, C, D = D, A, B, C
        for j, s in [(0,3), (8,9), (4,11), (12,15), (2,3), (10,9), (6,11), (14,15),
                     (1,3), (9,9), (5,11), (13,15), (3,3), (11,9), (7,11), (15,15)]:
            A = ROL((A + H(B, C, D) + X[j] + 0x6ED9EBA1) & 0xFFFFFFFF, s)
            A, B, C, D = D, A, B, C
        A = (A + AA) & 0xFFFFFFFF
        B = (B + BB) & 0xFFFFFFFF
        C = (C + CC) & 0xFFFFFFFF
        D = (D + DD) & 0xFFFFFFFF
    return binascii.hexlify(struct.pack("<4I", A, B, C, D)).decode("ascii").upper()

# ---------------------------------------------------------------------------
# Individual Algorithm Computations
# ---------------------------------------------------------------------------

def compute_ntlm(password: str) -> str:
    """
    Compute authentic Windows Active Directory NTLM hash (MD4 over UTF-16LE).
    Default AD protocol, highly vulnerable to offline hash cracking / Pass-the-Hash.
    """
    try:
        return hashlib.new("md4", password.encode("utf-16le")).hexdigest().upper()
    except Exception:
        return _md4_ntlm_fallback(password.encode("utf-16le"))

def compute_md5(password: str) -> str:
    """Compute standard MD5 hex digest."""
    return hashlib.md5(password.encode("utf-8")).hexdigest()

def compute_sha256(password: str) -> str:
    """Compute standard SHA-256 hex digest without adaptive work factor."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def compute_bcrypt(password: str, cost: int = BCRYPT_COST) -> str:
    """Compute genuine bcrypt hash with adaptive Eksblowfish work factor (default Cost 12)."""
    salt = bcrypt.gensalt(rounds=cost)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def compute_argon2id(password: str) -> str:
    """Compute genuine Argon2id hash (Memory-Hard: 64MB, 4 Passes)."""
    return argon2_hasher.hash(password)

def compute_all_hashes(password: str) -> dict:
    """Compute all 4 industry hashing standards (plus MD5 compatibility) for an account."""
    return {
        "hash_ntlm": compute_ntlm(password),
        "hash_md5": compute_md5(password),
        "hash_sha256": compute_sha256(password),
        "hash_bcrypt": compute_bcrypt(password),
        "hash_argon2id": compute_argon2id(password)
    }

# ---------------------------------------------------------------------------
# The Shared Interface Contract
# ---------------------------------------------------------------------------

def hash_password(password: str, algorithm: str) -> Dict[str, Any]:
    """
    Used by: dataset_generator (to create the 50K accounts' hashes),
             Hash Race feature.
    Returns: {"algorithm": str, "hash": str, "time_taken_ms": float}
    """
    algo = algorithm.lower().replace("-", "").replace("_", "")
    start_time = time.perf_counter()

    if algo == "ntlm":
        computed = compute_ntlm(password)
    elif algo == "md5":
        computed = compute_md5(password)
    elif algo == "sha256":
        computed = compute_sha256(password)
    elif algo == "bcrypt":
        computed = compute_bcrypt(password)
    elif algo in ["argon2", "argon2id"]:
        computed = compute_argon2id(password)
    else:
        raise ValueError(f"Unsupported algorithm: '{algorithm}'. Supported: ntlm, md5, sha256, bcrypt, argon2id")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "algorithm": algorithm,
        "hash": computed,
        "time_taken_ms": round(elapsed_ms, 3)
    }


def verify_password(candidate: str, target_hash: str, algorithm: str) -> bool:
    """
    Used by: Attack Lab — this is the ONE function called per mutation candidate,
             per account, during a live attack run.
    Returns: True if candidate matches target_hash, False otherwise.
    """
    algo = algorithm.lower().replace("-", "").replace("_", "")

    if algo == "ntlm":
        return compute_ntlm(candidate).upper() == target_hash.upper()
    elif algo == "md5":
        return compute_md5(candidate).lower() == target_hash.lower()
    elif algo == "sha256":
        return compute_sha256(candidate).lower() == target_hash.lower()
    elif algo == "bcrypt":
        try:
            return bcrypt.checkpw(candidate.encode("utf-8"), target_hash.encode("utf-8"))
        except Exception:
            return False
    elif algo in ["argon2", "argon2id"]:
        try:
            return argon2_hasher.verify(target_hash, candidate)
        except Exception:
            return False
    return False


def verify_hash(password: str, hash_type: str, hash_value: str) -> bool:
    """Backward compatibility alias for verify_password."""
    return verify_password(candidate=password, target_hash=hash_value, algorithm=hash_type)


