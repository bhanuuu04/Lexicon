import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from backend.app.config import AUDIT_RESULTS_FILE, ACCOUNTS_FILE
from backend.app.features.breach_dictionary.service import breach_checker

router = APIRouter(prefix="/api", tags=["dataset"])

_accounts_cache = None
_audit_cache = None

def get_accounts():
    global _accounts_cache
    if _accounts_cache is None:
        if not ACCOUNTS_FILE.exists():
            raise HTTPException(status_code=503, detail="Dataset not generated yet. Please run generate_dataset.py and run_audit.py")
        with open(ACCOUNTS_FILE, "r", encoding="utf-8") as f:
            _accounts_cache = json.load(f)
    return _accounts_cache

def get_audit_summary():
    global _audit_cache
    if _audit_cache is None:
        if not AUDIT_RESULTS_FILE.exists():
            raise HTTPException(status_code=503, detail="Audit results not available yet. Please run run_audit.py")
        with open(AUDIT_RESULTS_FILE, "r", encoding="utf-8") as f:
            _audit_cache = json.load(f)
    return _audit_cache

def invalidate_cache():
    global _accounts_cache, _audit_cache
    _accounts_cache = None
    _audit_cache = None

@router.get("/dataset/summary")
def get_summary():
    """Retrieve precomputed enterprise 50K audit summary."""
    return get_audit_summary()

@router.get("/dataset/hero-account")
def get_hero_account():
    """Retrieve the primary high-risk Hero Account demonstration target."""
    accounts = get_accounts()
    for acc in accounts:
        if acc.get("is_hero") or acc.get("id") == "ACC-00042":
            return acc
    for acc in accounts:
        if acc.get("is_privileged") and acc.get("baseline_tier") == "Critical":
            return acc
    return accounts[0] if accounts else {}

@router.get("/dataset/accounts")
def list_accounts(
    search: Optional[str] = None,
    tier: Optional[str] = None,
    department: Optional[str] = None,
    is_privileged: Optional[bool] = None,
    is_breached: Optional[bool] = None,
    group_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500)
):
    """
    Search and filter the 50,000 synthetic account directory with pagination.
    """
    accounts = get_accounts()
    filtered = accounts

    if search:
        s = search.lower().strip()
        filtered = [
            a for a in filtered
            if s in a["username"].lower() or s in a["role"].lower() or s in a["department"].lower() or s in a["id"].lower()
        ]

    if tier:
        filtered = [a for a in filtered if a.get("final_tier", a.get("baseline_tier")).lower() == tier.lower()]

    if department:
        filtered = [a for a in filtered if a["department"].lower() == department.lower()]

    if is_privileged is not None:
        filtered = [a for a in filtered if a.get("is_privileged") == is_privileged]

    if is_breached is not None:
        filtered = [a for a in filtered if a.get("breach_match") == is_breached]

    if group_id is not None:
        filtered = [a for a in filtered if a.get("password_group_id") == group_id]

    total_count = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = filtered[start_idx:end_idx]

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1,
        "accounts": paginated_items
    }

@router.get("/dataset/accounts/{account_id}")
def get_account_detail(account_id: str):
    """Retrieve detailed profile for a specific account."""
    accounts = get_accounts()
    for a in accounts:
        if a["id"] == account_id or a["username"].lower() == account_id.lower():
            return a
    raise HTTPException(status_code=404, detail=f"Account {account_id} not found")

@router.get("/dataset/reuse-clusters/{group_id}")
def get_reuse_cluster_details(group_id: int):
    """Retrieve full blast-radius members for a specific password reuse group."""
    accounts = get_accounts()
    members = [a for a in accounts if a.get("password_group_id") == group_id]
    if not members:
        raise HTTPException(status_code=404, detail=f"Reuse cluster {group_id} not found")

    dept_counts = {}
    priv_count = 0
    for m in members:
        dept_counts[m["department"]] = dept_counts.get(m["department"], 0) + 1
        if m.get("is_privileged"):
            priv_count += 1

    return {
        "group_id": group_id,
        "total_accounts": len(members),
        "privileged_count": priv_count,
        "departments": dept_counts,
        "sample_password": members[0]["plaintext_password"],
        "accounts": members
    }

@router.get("/breach-corpus/stats")
def get_breach_corpus_stats():
    """Retrieve synthetic breach corpus metadata."""
    return breach_checker.get_corpus_stats()

@router.get("/hibp/check-range/{prefix}")
async def check_hibp_range(prefix: str):
    """
    Live HIBP k-anonymity check proxy.
    Only forwards the 5-character SHA-1 prefix to Have I Been Pwned.
    """
    if len(prefix) != 5 or not all(c in "0123456789ABCDEFabcdef" for c in prefix):
        raise HTTPException(status_code=400, detail="Prefix must be exactly 5 hex characters")
    
    url = f"https://api.pwnedpasswords.com/range/{prefix.upper()}"
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Lexicon-Platform-HIBP-Check"})
            if resp.status_code != 200:
                return {"status": "unavailable", "message": f"HIBP returned HTTP {resp.status_code}", "hashes": []}
            return {
                "status": "ok",
                "prefix": prefix.upper(),
                "message": "Live HIBP k-anonymity range lookup successful",
                "count": len(resp.text.splitlines())
            }
    except Exception as e:
        return {"status": "error", "message": f"Live HIBP service currently unavailable: {str(e)}"}
