"""Feature re-export for backward compatibility."""
from backend.app.features.hashing.service import (
    compute_md5,
    compute_sha256,
    compute_bcrypt,
    compute_argon2id,
    compute_all_hashes,
    verify_hash,
    argon2_hasher,
)

__all__ = [
    "compute_md5",
    "compute_sha256",
    "compute_bcrypt",
    "compute_argon2id",
    "compute_all_hashes",
    "verify_hash",
    "argon2_hasher",
]
