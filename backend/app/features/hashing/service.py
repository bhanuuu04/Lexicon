import time
import hashlib
import struct
import binascii
import bcrypt
import argon2
from argon2 import PasswordHasher
from typing import Dict, Any, List, Optional

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

# ---------------------------------------------------------------------------
# Hardware Benchmarks & Theoretical Crack Time Estimation
# ---------------------------------------------------------------------------

HARDWARE_HASHRATES = {
    "8x_rtx_4090": {
        "ntlm": 1_200_000_000_000,    # 1.2 TH/s on 8x 4090 rig
        "md5": 800_000_000_000,       # 800 GH/s
        "sha256": 280_000_000_000,    # 280 GH/s
        "bcrypt": 800_000,            # 800 kH/s (cost 12: ~200 kH/s)
        "argon2id": 35_000            # 35 kH/s (at 64MB memory: ~5 kH/s)
    },
    "single_rtx_4090": {
        "ntlm": 150_000_000_000,      # 150 GH/s
        "md5": 100_000_000_000,       # 100 GH/s
        "sha256": 35_000_000_000,     # 35 GH/s
        "bcrypt": 25_000,             # 25 kH/s
        "argon2id": 650               # 650 H/s
    },
    "cpu_standard": {
        "ntlm": 500_000_000,          # 500 MH/s
        "md5": 300_000_000,           # 300 MH/s
        "sha256": 120_000_000,        # 120 MH/s
        "bcrypt": 45,                 # 45 H/s
        "argon2id": 2                 # 2 H/s
    }
}

def format_duration(seconds: float) -> str:
    if seconds < 0.001: return "Instantaneous (< 1 ms)"
    if seconds < 1: return f"{seconds * 1000:.1f} ms"
    if seconds < 60: return f"{seconds:.1f} seconds"
    if seconds < 3600: return f"{seconds / 60:.1f} minutes"
    if seconds < 86400: return f"{seconds / 3600:.1f} hours"
    if seconds < 31536000: return f"{seconds / 86400:.1f} days"
    if seconds < 3153600000: return f"{seconds / 31536000:.1f} years"
    return f"{seconds / 31536000:.2e} centuries"

def estimate_crack_time(entropy_bits: float, algorithm: str = "ntlm", rig: str = "8x_rtx_4090") -> Dict[str, Any]:
    """
    Estimate seconds and human-readable time to exhaust 50% search space
    for a given password entropy and hardware profile.
    """
    algo = algorithm.lower().replace("-", "").replace("_", "")
    total_combinations = 2 ** max(1.0, min(128.0, entropy_bits))
    
    hash_rates = HARDWARE_HASHRATES.get(rig, HARDWARE_HASHRATES["8x_rtx_4090"])
    rate = hash_rates.get(algo, 1_000_000)
    
    # 50% expected search space
    seconds = (total_combinations / 2.0) / max(1.0, rate)
    
    return {
        "entropy_bits": round(entropy_bits, 1),
        "total_combinations": f"{total_combinations:.2e}",
        "hardware_rig": rig,
        "hash_rate_per_sec": rate,
        "estimated_seconds": seconds,
        "human_readable": format_duration(seconds)
    }

def get_algorithms_metadata() -> List[Dict[str, Any]]:
    """Return standard industry comparison metadata for all supported algorithms."""
    return [
        {
            "name": "NTLM",
            "category": "Legacy / Broken",
            "work_factor": "1 (Single MD4 Pass)",
            "memory_cost": "0 KB",
            "gpu_resistance": "None (1.2 TH/s on 8x RTX 4090)",
            "standard": "Windows Active Directory Default",
            "description": "Unsalted, fast legacy digest. Enables Pass-the-Hash and rapid offline cracking."
        },
        {
            "name": "SHA-256",
            "category": "Standard Digest",
            "work_factor": "1 (Single NIST Pass)",
            "memory_cost": "0 KB",
            "gpu_resistance": "None (280 GH/s on 8x RTX 4090)",
            "standard": "FIPS 180-4",
            "description": "Cryptographically secure for signatures, but vulnerable to GPU brute forcing when used raw for passwords."
        },
        {
            "name": "bcrypt",
            "category": "Adaptive Salted",
            "work_factor": f"Cost {BCRYPT_COST} (4,096 Rounds)",
            "memory_cost": "4 KB",
            "gpu_resistance": "High (Adaptive Eksblowfish)",
            "standard": "OpenBSD / OWASP Recommended",
            "description": "Automatic salt embedding with configurable work factor scaling."
        },
        {
            "name": "Argon2id",
            "category": "Memory-Hard / Post-Quantum",
            "work_factor": f"t={ARGON2_ITERATIONS} Passes, p={ARGON2_PARALLELISM}",
            "memory_cost": f"{ARGON2_MEMORY // 1024} MB",
            "gpu_resistance": "Extreme (Memory-hardness neutralizes ASIC/GPU parallel arrays)",
            "standard": "RFC 9106 / Password Hashing Competition Winner",
            "description": "Gold standard for modern enterprise identity systems, immune to GPU acceleration."
        }
    ]



