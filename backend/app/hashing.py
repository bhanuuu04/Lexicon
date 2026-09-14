"""Feature re-export for backward compatibility."""
from backend.app.features.hashing.service import (
    hash_password,
    verify_password,
    compute_ntlm,
    compute_md5,
    compute_sha256,
    compute_bcrypt,
    compute_argon2id,
    compute_all_hashes,
    verify_hash,
    argon2_hasher,
)

__all__ = [
    "hash_password",
    "verify_password",
    "compute_ntlm",
    "compute_md5",
    "compute_sha256",
    "compute_bcrypt",
    "compute_argon2id",
    "compute_all_hashes",
    "verify_hash",
    "argon2_hasher",
]

