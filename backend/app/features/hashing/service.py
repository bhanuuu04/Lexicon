import hashlib
import bcrypt
import argon2
from argon2 import PasswordHasher
from backend.app.config import BCRYPT_COST, ARGON2_MEMORY, ARGON2_ITERATIONS, ARGON2_PARALLELISM

# Initialize Argon2id hasher with Argon2id type
argon2_hasher = PasswordHasher(
    time_cost=ARGON2_ITERATIONS,
    memory_cost=ARGON2_MEMORY,
    parallelism=ARGON2_PARALLELISM,
    hash_len=32,
    salt_len=16,
    type=argon2.Type.ID
)

def compute_md5(password: str) -> str:
    """Compute standard MD5 hex digest."""
    return hashlib.md5(password.encode("utf-8")).hexdigest()

def compute_sha256(password: str) -> str:
    """Compute standard SHA-256 hex digest."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def compute_bcrypt(password: str, cost: int = BCRYPT_COST) -> str:
    """Compute genuine bcrypt hash with configurable salt work factor."""
    salt = bcrypt.gensalt(rounds=cost)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def compute_argon2id(password: str) -> str:
    """Compute genuine Argon2id hash."""
    return argon2_hasher.hash(password)

def compute_all_hashes(password: str) -> dict:
    """Compute all 4 hashes for an account password."""
    return {
        "hash_md5": compute_md5(password),
        "hash_sha256": compute_sha256(password),
        "hash_bcrypt": compute_bcrypt(password),
        "hash_argon2id": compute_argon2id(password)
    }

def verify_hash(password: str, hash_type: str, hash_value: str) -> bool:
    """Verify a candidate password against a target hash."""
    hash_type = hash_type.lower()
    if hash_type == "md5":
        return compute_md5(password) == hash_value
    elif hash_type == "sha256" or hash_type == "sha-256":
        return compute_sha256(password) == hash_value
    elif hash_type == "bcrypt":
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hash_value.encode("utf-8"))
        except Exception:
            return False
    elif hash_type == "argon2" or hash_type == "argon2id":
        try:
            return argon2_hasher.verify(hash_value, password)
        except Exception:
            return False
    return False
