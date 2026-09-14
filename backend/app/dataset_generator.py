"""Feature re-export for backward compatibility."""
from backend.app.features.dataset_generator.generator import (
    generate_accounts,
    generate_and_save_dataset,
    build_reuse_groups,
    generate_distinct_password_pools,
)
from backend.app.features.dataset_generator.constants import (
    FIRST_NAMES,
    LAST_NAMES,
    DEPARTMENTS,
    REUSE_ROOT_WORDS,
    COMMON_WEAK_PASSWORDS,
)

__all__ = [
    "generate_accounts",
    "generate_and_save_dataset",
    "build_reuse_groups",
    "generate_distinct_password_pools",
    "FIRST_NAMES",
    "LAST_NAMES",
    "DEPARTMENTS",
    "REUSE_ROOT_WORDS",
    "COMMON_WEAK_PASSWORDS",
]
