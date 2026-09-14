"""
Dataset Router - Backward compatibility re-export wrapper.
Main implementation moved to backend.app.features.dataset_api.
"""
from backend.app.features.dataset_api.router import (
    router,
    get_accounts,
    get_audit_summary,
    invalidate_cache,
    get_summary,
    get_hero_account,
    list_accounts,
    get_account_detail,
    get_reuse_cluster_details,
    get_breach_corpus_stats,
    check_hibp_range
)

__all__ = [
    "router",
    "get_accounts",
    "get_audit_summary",
    "invalidate_cache",
    "get_summary",
    "get_hero_account",
    "list_accounts",
    "get_account_detail",
    "get_reuse_cluster_details",
    "get_breach_corpus_stats",
    "check_hibp_range"
]

