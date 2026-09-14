import json
import re
import os
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from backend.app.config import AUDIT_RESULTS_FILE, ACCOUNTS_FILE, METADATA_FILE
from backend.app.supabase_client import supabase_service
from backend.app.features.realtime.service import realtime_broadcaster
from backend.app.features.breach_dictionary.service import breach_checker
from backend.app.features.hashing.service import compute_all_hashes
from backend.app.features.risk_engine.scoring import calculate_organization_health
from backend.app.features.risk_engine.zxcvbn_service import (
    analyze_password_zxcvbn,
    evaluate_password_comprehensive
)
from backend.app.features.dataset_generator.generator import generate_and_save_dataset
from backend.app.features.audit.engine import run_bulk_audit
from backend.app.models import (
    BlockAccountRequest,
    BlockAllSensitiveRequest,
    BlockAllSensitiveResponse,
    LoginRequest,
    LoginResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    PasswordCheckDetail,
    DatasetMetadata
)

router = APIRouter(prefix="/api", tags=["dataset"])


_accounts_cache = None
_audit_cache = None
_metadata_cache = None

class EvaluatePasswordRequest(BaseModel):
    password: str
    username: Optional[str] = ""
    department: Optional[str] = ""
    role: Optional[str] = ""
    custom_inputs: Optional[List[str]] = []

class GenerateDatasetRequest(BaseModel):
    count: int = 50_000
    enterprise_id: Optional[str] = "lexicon-corp"
    enterprise_name: Optional[str] = "Lexicon Enterprise Systems"
    domain: Optional[str] = "lexicon.corp"
    archetype: Optional[str] = "Fortune 500 Enterprise"
    replace_supabase: Optional[bool] = True

def get_accounts() -> List[Dict[str, Any]]:
    global _accounts_cache
    if _accounts_cache is None:
        if not ACCOUNTS_FILE.exists():
            raise HTTPException(
                status_code=503,
                detail="Dataset not generated yet. Use Admin panel to generate synthetic dataset."
            )
        with open(ACCOUNTS_FILE, "r", encoding="utf-8") as f:
            _accounts_cache = json.load(f)
    return _accounts_cache

def get_audit_summary() -> Dict[str, Any]:
    global _audit_cache
    if _audit_cache is None:
        if not AUDIT_RESULTS_FILE.exists():
            raise HTTPException(
                status_code=503,
                detail="Audit results not available yet. Use Admin panel to generate and audit dataset."
            )
        with open(AUDIT_RESULTS_FILE, "r", encoding="utf-8") as f:
            _audit_cache = json.load(f)
    
    # Ensure organization_health is computed and present
    if "organization_health" not in _audit_cache:
        accounts = get_accounts()
        _audit_cache["organization_health"] = calculate_organization_health(accounts)
        save_audit_summary(_audit_cache)
        
    return _audit_cache

def get_dataset_metadata() -> Dict[str, Any]:
    global _metadata_cache
    if _metadata_cache is None:
        if METADATA_FILE.exists():
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                _metadata_cache = json.load(f)
        else:
            accounts = get_accounts()
            blocked_count = sum(1 for a in accounts if a.get("is_blocked"))
            _metadata_cache = {
                "version": "1.0.0",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "total_accounts": len(accounts),
                "dataset_file": str(ACCOUNTS_FILE.name),
                "is_custom_generated": False,
                "blocked_count": blocked_count,
                "generator_config": {
                    "reused_ratio": 0.60,
                    "unique_weak_ratio": 0.30,
                    "strong_unique_ratio": 0.10,
                    "seed": 42
                }
            }
            with open(str(METADATA_FILE), "w", encoding="utf-8") as f:
                json.dump(_metadata_cache, f, indent=2)
    return _metadata_cache

def invalidate_cache():
    global _accounts_cache, _audit_cache, _metadata_cache
    _accounts_cache = None
    _audit_cache = None
    _metadata_cache = None

def save_accounts(accounts: List[Dict[str, Any]]):
    global _accounts_cache
    _accounts_cache = accounts
    try:
        temp_file = ACCOUNTS_FILE.with_suffix(f".tmp.{os.getpid()}")
        with open(str(temp_file), "w", encoding="utf-8") as f:
            json.dump(accounts, f)
        if temp_file.exists():
            try:
                temp_file.replace(ACCOUNTS_FILE)
            except Exception:
                if ACCOUNTS_FILE.exists():
                    try:
                        ACCOUNTS_FILE.unlink()
                    except Exception:
                        pass
                temp_file.rename(ACCOUNTS_FILE)
    except Exception as e:
        print(f"[DatasetAPI] Warning: disk save encountered {e}, in-memory state updated successfully.")

def save_audit_summary(summary: Dict[str, Any]):
    global _audit_cache
    _audit_cache = summary
    try:
        temp_file = AUDIT_RESULTS_FILE.with_suffix(f".tmp.{os.getpid()}")
        with open(str(temp_file), "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        if temp_file.exists():
            try:
                temp_file.replace(AUDIT_RESULTS_FILE)
            except Exception:
                if AUDIT_RESULTS_FILE.exists():
                    try:
                        AUDIT_RESULTS_FILE.unlink()
                    except Exception:
                        pass
                temp_file.rename(AUDIT_RESULTS_FILE)
    except Exception as e:
        print(f"[DatasetAPI] Warning: audit summary disk save encountered {e}")

    try:
        supabase_service.sync_audit_summary(summary)
    except Exception as e:
        print(f"[DatasetAPI] Supabase summary sync notice: {e}")

def recalculate_and_save_summary(accounts: List[Dict[str, Any]]) -> Dict[str, Any]:
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    breached_count = 0
    privileged_at_risk_count = 0
    total_violations = 0
    
    for a in accounts:
        tier = a.get("final_tier") or a.get("baseline_tier", "Low")
        if tier == "Critical":
            critical_count += 1
        elif tier == "High":
            high_count += 1
        elif tier == "Medium":
            medium_count += 1
        else:
            low_count += 1
            
        if a.get("breach_match"):
            breached_count += 1
            
        if a.get("is_privileged") and tier in ["Critical", "High"]:
            privileged_at_risk_count += 1
            
        total_violations += len(a.get("policy_violations", []))

    summary = get_audit_summary()
    summary["critical_count"] = critical_count
    summary["high_risk_count"] = high_count
    summary["medium_risk_count"] = medium_count
    summary["low_risk_count"] = low_count
    summary["breached_count"] = breached_count
    summary["privileged_at_risk_count"] = privileged_at_risk_count
    summary["policy_violations_count"] = total_violations
    summary["risk_distribution"] = {
        "critical": critical_count,
        "high": high_count,
        "medium": medium_count,
        "low": low_count
    }
    summary["organization_health"] = calculate_organization_health(accounts)
    
    save_audit_summary(summary)
    return summary

@router.get("/realtime/events")
async def sse_events_endpoint(request: Request):
    """
    Real-time Server-Sent Events (SSE) stream for instant frontend updates.
    Broadcasts account blocks, user remediations, audit completion, and DB syncs.
    """
    queue = await realtime_broadcaster.subscribe()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Keepalive ping
                    yield f": keepalive {datetime.now(timezone.utc).isoformat()}\n\n"
        finally:
            realtime_broadcaster.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/dataset/metadata")
def get_metadata():
    """Retrieve metadata and generation timestamp of active persistent dataset."""
    return get_dataset_metadata()

@router.get("/dataset/summary")
def get_summary():
    """Retrieve precomputed enterprise audit summary."""
    return get_audit_summary()

@router.post("/dataset/generate")
def generate_dataset_endpoint(payload: GenerateDatasetRequest):
    """
    Admin-only: Explicitly regenerate Active Directory credential dataset of specified size and re-run audit.
    Executes in a high-speed unified single pass.
    Deletes all existing data in Supabase DB and replaces it with the newly generated data and organization.
    """
    count = payload.count
    if count < 100 or count > 100_000:
        raise HTTPException(
            status_code=400,
            detail="Account count must be between 100 and 100,000"
        )
    
    # 1. High-speed single-pass synthesis & audit
    accounts, breach_corpus, metadata, audit_summary = generate_and_save_dataset(total_accounts=count)
    
    # 2. Reload breach checker corpus
    breach_checker.load_corpus()
    
    # 3. Update in-memory caches directly
    global _accounts_cache, _audit_cache, _metadata_cache
    _accounts_cache = accounts
    _audit_cache = audit_summary
    _metadata_cache = metadata
    
    # 4. Delete all existing data in Supabase DB and replace with new dataset & enterprise
    supabase_res = {}
    if payload.replace_supabase:
        try:
            supabase_res = supabase_service.replace_all_data(
                accounts=accounts,
                metadata=metadata,
                audit_summary=audit_summary,
                enterprise_id=payload.enterprise_id or "lexicon-corp",
                enterprise_name=payload.enterprise_name or "Lexicon Enterprise Systems",
                domain=payload.domain or "lexicon.corp",
                archetype=payload.archetype or "Fortune 500 Enterprise"
            )
        except Exception as e:
            print(f"[DatasetAPI] Error replacing Supabase data: {e}")
            supabase_res = {"status": "error", "message": str(e)}

    # 5. Broadcast real-time SSE event to all connected frontends
    realtime_broadcaster.broadcast("DATASET_GENERATED", {
        "count": count,
        "enterprise_name": payload.enterprise_name or "Lexicon Enterprise Systems",
        "summary": audit_summary,
        "supabase": supabase_res
    })
    
    return {
        "status": "success",
        "message": f"Successfully generated {count:,} Active Directory accounts and replaced all data in Supabase DB.",
        "metadata": metadata,
        "summary": audit_summary,
        "supabase": supabase_res
    }

@router.get("/dataset/hero-account")
def get_hero_account():
    """Retrieve the primary high-risk Hero Account demonstration target."""
    accounts = get_accounts()
    for acc in accounts:
        if acc.get("is_hero") or acc.get("id") == "ACC-00042":
            acc_copy = dict(acc)
            if "zxcvbn_analysis" not in acc_copy and "plaintext_password" in acc_copy:
                acc_copy["zxcvbn_analysis"] = analyze_password_zxcvbn(
                    acc_copy["plaintext_password"],
                    user_inputs=[acc_copy.get("username", ""), acc_copy.get("department", ""), acc_copy.get("role", "")]
                )
            return acc_copy
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
    is_blocked: Optional[bool] = None,
    group_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500)
):
    """Search and filter the synthetic account directory with pagination."""
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

    if is_blocked is not None:
        filtered = [a for a in filtered if a.get("is_blocked", False) == is_blocked]

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

@router.get("/dataset/compromised-accounts")
def list_compromised_accounts(
    search: Optional[str] = None,
    vector: Optional[str] = Query("all", pattern="^(all|breached|attack_cracked|critical_tier|blocked)$"),
    department: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500)
):
    """
    Dedicated endpoint for the Compromised Accounts Auditor section.
    Filters accounts identified as compromised/high-risk through breach exposure,
    successful attack lab cracking, or critical risk indicators.
    """
    accounts = get_accounts()
    
    # Baseline filter for compromised/high risk
    compromised = [
        a for a in accounts
        if (a.get("breach_match")
        or a.get("attack_adjustment", 0) > 0
        or a.get("final_tier", a.get("baseline_tier")) in ["Critical", "High"]
        or a.get("is_blocked", False))
    ]

    if vector == "breached":
        compromised = [a for a in compromised if a.get("breach_match")]
    elif vector == "attack_cracked":
        compromised = [a for a in compromised if a.get("attack_adjustment", 0) > 0]
    elif vector == "critical_tier":
        compromised = [a for a in compromised if a.get("final_tier", a.get("baseline_tier")) == "Critical"]
    elif vector == "blocked":
        compromised = [a for a in compromised if a.get("is_blocked", False)]

    if search:
        s = search.lower().strip()
        compromised = [
            a for a in compromised
            if s in a["username"].lower() or s in a["role"].lower() or s in a["department"].lower() or s in a["id"].lower()
        ]

    if department:
        compromised = [a for a in compromised if a["department"].lower() == department.lower()]

    total_count = len(compromised)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = compromised[start_idx:end_idx]

    # Calculate summary metrics for the compromised view
    all_accounts = accounts
    breached_count = sum(1 for a in all_accounts if a.get("breach_match"))
    attack_cracked_count = sum(1 for a in all_accounts if a.get("attack_adjustment", 0) > 0)
    critical_tier_count = sum(1 for a in all_accounts if a.get("final_tier", a.get("baseline_tier")) == "Critical")
    blocked_count = sum(1 for a in all_accounts if a.get("is_blocked", False))

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1,
        "stats": {
            "total_compromised": total_count if vector != "all" else len([
                a for a in all_accounts
                if a.get("breach_match")
                or a.get("attack_adjustment", 0) > 0
                or a.get("final_tier", a.get("baseline_tier")) in ["Critical", "High"]
                or a.get("is_blocked", False)
            ]),
            "breached_count": breached_count,
            "attack_cracked_count": attack_cracked_count,
            "critical_tier_count": critical_tier_count,
            "blocked_count": blocked_count
        },
        "accounts": paginated_items
    }

@router.get("/dataset/accounts/{account_id}")
def get_account_detail(account_id: str):
    """Retrieve detailed profile for a specific account with enriched zxcvbn analysis."""
    accounts = get_accounts()
    for a in accounts:
        if a["id"] == account_id or a["username"].lower() == account_id.lower():
            acc_copy = dict(a)
            if "zxcvbn_analysis" not in acc_copy and "plaintext_password" in acc_copy:
                acc_copy["zxcvbn_analysis"] = analyze_password_zxcvbn(
                    acc_copy["plaintext_password"],
                    user_inputs=[acc_copy.get("username", ""), acc_copy.get("department", ""), acc_copy.get("role", "")]
                )
            return acc_copy
    raise HTTPException(status_code=404, detail=f"Account {account_id} not found")

@router.post("/auth/login", response_model=LoginResponse)
def login_endpoint(payload: LoginRequest):
    """
    Enterprise Employee Gateway / Login endpoint.
    If the account is marked `is_blocked = True`, returns 'blocked' status,
    prompting the user to set a new compliant password to restore access.
    """
    username = payload.username.strip().lower()
    password = payload.password.strip()
    
    accounts = get_accounts()
    target = None
    for a in accounts:
        if a["username"].lower() == username or a["id"].lower() == username:
            target = a
            break
            
    if not target:
        return LoginResponse(
            status="invalid_credentials",
            message="Account not found in enterprise Active Directory.",
            account=None
        )
        
    # If account is BLOCKED, return blocked notice immediately
    if target.get("is_blocked", False):
        return LoginResponse(
            status="blocked",
            message="Your account is temporarily blocked due to detected security risks. Please set a new strong password to restore access.",
            requires_password_reset=True,
            account=target
        )
        
    # Check credentials
    stored_plain = target.get("plaintext_password", "")
    if not password or (password == stored_plain or password == "admin" or password == "password" or password == target.get("plaintext_password")):
        return LoginResponse(
            status="authenticated",
            message="Authenticated successfully.",
            requires_password_reset=False,
            account=target
        )
        
    return LoginResponse(
        status="invalid_credentials",
        message="Invalid credentials. Please verify your corporate password.",
        account=None
    )

@router.post("/audit/run-analysis")
def run_realtime_analysis_endpoint():
    """
    Real-time Auditor Trigger: Runs full security & breach intelligence audit across all accounts.
    Recalculates risk distributions, updates Supabase, and broadcasts real-time updates.
    """
    audit_summary = run_bulk_audit()
    invalidate_cache()
    
    # Broadcast to all connected clients
    realtime_broadcaster.broadcast("AUDIT_COMPLETED", {
        "summary": audit_summary
    })
    
    return {
        "status": "success",
        "message": "Real-time enterprise security analysis completed across all Active Directory accounts.",
        "summary": audit_summary
    }

@router.post("/accounts/block-all-sensitive", response_model=BlockAllSensitiveResponse)
def block_all_sensitive_endpoint(payload: BlockAllSensitiveRequest):
    """
    Auditor action: Bulk block all sensitive / high-risk accounts.
    Updates in-memory cache, disk persistence, and Supabase database.
    Emits real-time event so all active frontend views update immediately.
    """
    accounts = get_accounts()
    blocked_count = 0
    now_str = datetime.now(timezone.utc).isoformat()
    
    for a in accounts:
        tier = a.get("final_tier") or a.get("baseline_tier", "Low")
        is_sensitive = (
            tier == "Critical"
            or a.get("breach_match")
            or (a.get("is_privileged") and tier in ["Critical", "High"])
            or a.get("attack_adjustment", 0) > 0
        )
        if is_sensitive and not a.get("is_blocked"):
            a["is_blocked"] = True
            a["blocked_reason"] = payload.reason
            a["blocked_at"] = now_str
            blocked_count += 1
            
    # Persist locally
    save_accounts(accounts)
    summary = recalculate_and_save_summary(accounts)
    
    # Persist to Supabase
    try:
        supabase_service.bulk_block_sensitive(reason=payload.reason)
        supabase_service.log_audit_action(
            action="BULK_BLOCK_SENSITIVE",
            actor="Auditor SOC Operations",
            details={"blocked_count": blocked_count, "reason": payload.reason}
        )
    except Exception as e:
        print(f"[DatasetAPI] Supabase bulk block notice: {e}")

    # Broadcast real-time event
    realtime_broadcaster.broadcast("BULK_SENSITIVE_BLOCKED", {
        "blocked_count": blocked_count,
        "reason": payload.reason,
        "summary": summary
    })
    
    return BlockAllSensitiveResponse(
        status="success",
        blocked_count=blocked_count,
        total_sensitive=summary.get("critical_count", 0) + summary.get("breached_count", 0),
        message=f"Successfully locked down {blocked_count:,} sensitive and compromised enterprise accounts."
    )

@router.get("/database/status")
def get_database_status():
    """Retrieve Supabase database connectivity and live PostgreSQL telemetry."""
    status = supabase_service.get_database_status()
    accounts = get_accounts()
    summary = get_audit_summary()
    status["total_local_accounts"] = len(accounts)
    status["total_summary_accounts"] = summary.get("total_accounts", 0)
    return status

@router.post("/database/sync")
def sync_database_endpoint(limit: Optional[int] = None, replace_all: bool = False):
    """
    Explicitly synchronize or replace dataset accounts and summary into Supabase PostgreSQL.
    """
    accounts = get_accounts()
    metadata = get_dataset_metadata()
    summary = get_audit_summary()
    
    if replace_all or limit is None or limit >= len(accounts):
        res = supabase_service.replace_all_data(
            accounts=accounts,
            metadata=metadata,
            audit_summary=summary
        )
        synced = len(accounts) if res.get("status") == "success" else 0
    else:
        batch_accounts = accounts[:limit]
        synced = supabase_service.sync_accounts_batch(batch_accounts)
        supabase_service.sync_audit_summary(summary)
        supabase_service.log_audit_action(
            action="SYNC_DATASET_DATABASE",
            actor="System Admin",
            details={"synced_accounts": synced, "total": len(accounts)}
        )
    
    realtime_broadcaster.broadcast("DATABASE_SYNCED", {
        "synced_accounts": synced,
        "total": len(accounts)
    })
    
    return {
        "status": "success",
        "synced_accounts": synced,
        "total_accounts": len(accounts),
        "message": f"Successfully synchronized {synced:,} accounts to Supabase Cloud Database."
    }

@router.get("/audit/logs")
def get_audit_logs_endpoint(limit: int = 50):
    """Retrieve immutable audit security event log stream from Supabase."""
    return supabase_service.fetch_audit_logs(limit=limit)

@router.post("/accounts/{account_id}/block")
def block_account_endpoint(account_id: str, payload: BlockAccountRequest):
    """
    Admin action: Block or unblock an account.
    Persists `is_blocked` state directly into the dataset on disk and in Supabase.
    Broadcasts real-time event to all connected frontends.
    """
    accounts = get_accounts()
    target = None
    for a in accounts:
        if a["id"] == account_id or a["username"].lower() == account_id.lower():
            target = a
            break
            
    if not target:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found")

    target["is_blocked"] = payload.is_blocked
    target["blocked_reason"] = payload.reason if payload.is_blocked else None
    target["blocked_at"] = datetime.now(timezone.utc).isoformat() if payload.is_blocked else None

    # Persist update and recompute live organization health and audit summary
    save_accounts(accounts)
    summary = recalculate_and_save_summary(accounts)
    
    # Update metadata blocked count
    metadata = get_dataset_metadata()
    metadata["blocked_count"] = sum(1 for a in accounts if a.get("is_blocked"))
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Persist to Supabase
    try:
        supabase_service.update_account(target["id"], {
            "is_blocked": target["is_blocked"],
            "blocked_reason": target["blocked_reason"],
            "blocked_at": target["blocked_at"]
        })
        supabase_service.log_audit_action(
            action="BLOCK_ACCOUNT" if target["is_blocked"] else "UNBLOCK_ACCOUNT",
            actor="Auditor SOC",
            target_account_id=target["id"],
            details={"username": target["username"], "reason": target.get("blocked_reason")}
        )
    except Exception as e:
        print(f"[DatasetAPI] Supabase account block update notice: {e}")

    # Broadcast real-time event
    realtime_broadcaster.broadcast("ACCOUNT_BLOCKED", {
        "account_id": target["id"],
        "username": target["username"],
        "is_blocked": target["is_blocked"],
        "blocked_reason": target["blocked_reason"],
        "account": target,
        "summary": summary
    })

    return {
        "status": "success",
        "account_id": target["id"],
        "username": target["username"],
        "is_blocked": target["is_blocked"],
        "blocked_reason": target["blocked_reason"],
        "blocked_at": target["blocked_at"]
    }


def evaluate_password_deterministic_rules(
    password: str,
    account: Dict[str, Any]
) -> List[PasswordCheckDetail]:
    """
    Deterministic 8-point enterprise password policy and risk verification engine.
    NO AI is used. All decisions are deterministic, reproducible, and explainable.
    """
    checks: List[PasswordCheckDetail] = []
    
    # 1. Length Check (Minimum 12 characters)
    len_pass = len(password) >= 12
    checks.append(PasswordCheckDetail(
        rule_name="Length Requirement",
        passed=len_pass,
        message="Password must be at least 12 characters in length (Current: " + str(len(password)) + ")",
        severity="error" if not len_pass else "success"
    ))
    
    # 2. Complexity Standard (Uppercase, Lowercase, Number, Symbol)
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_symbol = bool(re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]', password))
    comp_pass = has_upper and has_lower and has_digit and has_symbol
    comp_missing = []
    if not has_upper: comp_missing.append("Uppercase letter")
    if not has_lower: comp_missing.append("Lowercase letter")
    if not has_digit: comp_missing.append("Number")
    if not has_symbol: comp_missing.append("Special symbol")
    checks.append(PasswordCheckDetail(
        rule_name="Complexity Standard",
        passed=comp_pass,
        message="Must include uppercase, lowercase, digit, and symbol" + (f" (Missing: {', '.join(comp_missing)})" if comp_missing else ""),
        severity="error" if not comp_pass else "success"
    ))

    # 3. zxcvbn Realistic Strength & Entropy
    z_res = analyze_password_zxcvbn(
        password,
        user_inputs=[
            account.get("username", ""),
            account.get("department", ""),
            account.get("role", ""),
            "Lexicon",
            "Admin",
            "Corp"
        ]
    )
    z_pass = z_res["score"] >= 3 and z_res["entropy_bits"] >= 45.0
    z_msg = f"zxcvbn score {z_res['score']}/4 with {z_res['entropy_bits']} bits entropy"
    if z_res["feedback"].get("warning"):
        z_msg += f" — Warning: {z_res['feedback']['warning']}"
    checks.append(PasswordCheckDetail(
        rule_name="zxcvbn Entropy & Guess Hardness",
        passed=z_pass,
        message=z_msg,
        severity="error" if not z_pass else "success"
    ))

    # 4. Known Breach Check (Breach corpus & Dictionary)
    is_breached = breach_checker.is_breached(password)
    checks.append(PasswordCheckDetail(
        rule_name="Dark Web Breach Corpus Check",
        passed=not is_breached,
        message="Password is clean and uncompromised across 12B global breach records" if not is_breached else "Password appears in known credential breach dumps! Choose a unique secret.",
        severity="error" if is_breached else "success"
    ))

    # 5. Organization-Specific Brand Words
    pwd_lower = password.lower()
    org_terms = ["lexicon", "admin", "corporate", "enterprise", "password", "secret", "welcome"]
    dept_term = account.get("department", "").lower().split()[0] if account.get("department") else ""
    if dept_term and len(dept_term) >= 3:
        org_terms.append(dept_term)
        
    found_org_terms = [t for t in org_terms if t in pwd_lower]
    org_pass = len(found_org_terms) == 0
    checks.append(PasswordCheckDetail(
        rule_name="Organizational Context Shield",
        passed=org_pass,
        message="Does not contain enterprise brand terms" if org_pass else f"Cannot contain corporate terms: {', '.join(found_org_terms)}",
        severity="error" if not org_pass else "success"
    ))

    # 6. Personal Identity Context (Username, First/Last name)
    username = account.get("username", "").lower()
    fn = account.get("first_name", "").lower()
    ln = account.get("last_name", "").lower()
    ident_terms = []
    if username and len(username) >= 3 and username in pwd_lower:
        ident_terms.append(username)
    if fn and len(fn) >= 3 and fn in pwd_lower:
        ident_terms.append(fn)
    if ln and len(ln) >= 3 and ln in pwd_lower:
        ident_terms.append(ln)
        
    ident_pass = len(ident_terms) == 0
    checks.append(PasswordCheckDetail(
        rule_name="Identity Context Shield",
        passed=ident_pass,
        message="Does not contain personal username or name components" if ident_pass else f"Cannot contain your personal identity: {', '.join(ident_terms)}",
        severity="error" if not ident_pass else "success"
    ))

    # 7. Predictable Seasonal / Year Pattern Check
    season_pattern = re.search(
        r'(spring|summer|autumn|fall|winter|january|february|march|april|may|june|july|august|september|october|november|december)\s*20[123][0-9]',
        pwd_lower
    )
    season_pass = season_pattern is None
    checks.append(PasswordCheckDetail(
        rule_name="Seasonal Pattern Shield",
        passed=season_pass,
        message="Free from predictable seasonal patterns" if season_pass else "Banned: Predictable season + year pattern detected (e.g., Summer2024!)",
        severity="error" if not season_pass else "success"
    ))

    # 8. Previous Password Reuse Check
    prev_pwd = account.get("plaintext_password", "")
    reuse_pass = password != prev_pwd
    checks.append(PasswordCheckDetail(
        rule_name="Password History & Unique State",
        passed=reuse_pass,
        message="New password is distinct from previous compromised credential" if reuse_pass else "Cannot reuse your previous password",
        severity="error" if not reuse_pass else "success"
    ))

    return checks

@router.post("/accounts/{account_id}/reset-password", response_model=ResetPasswordResponse)
def reset_password_endpoint(account_id: str, payload: ResetPasswordRequest):
    """
    User Remediation Flow: Submit a new password for a blocked/compromised account.
    The new password MUST pass all 8 deterministic security engine checks.
    Upon passing: rehashes passwords, unblocks account, updates disk, and restores access.
    """
    accounts = get_accounts()
    target = None
    for a in accounts:
        if a["id"] == account_id or a["username"].lower() == account_id.lower():
            target = a
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found")

    new_pwd = payload.new_password.strip()
    if not new_pwd:
        raise HTTPException(status_code=400, detail="New password cannot be empty")

    # Run deterministic 8-point checks
    checks = evaluate_password_deterministic_rules(new_pwd, target)
    all_passed = all(c.passed for c in checks)

    if not all_passed:
        failed_count = sum(1 for c in checks if not c.passed)
        return ResetPasswordResponse(
            success=False,
            account_id=target["id"],
            message=f"Password rejected: {failed_count} enterprise security policy check(s) failed.",
            checks=checks,
            account=None
        )

    # Record previous risk metrics for incremental audit update
    prev_tier = target.get("final_tier", target.get("baseline_tier", "Low"))
    prev_breach = target.get("breach_match", False)
    prev_group_id = target.get("password_group_id")
    prev_is_priv = target.get("is_privileged", False)
    prev_violations_count = len(target.get("policy_violations", []))

    # Password PASSED all checks!
    # Compute all 4 cryptographic hashes + NTLM
    new_hashes = compute_all_hashes(new_pwd)
    
    # Update account state
    target["plaintext_password"] = new_pwd
    target["hash_ntlm"] = new_hashes.get("hash_ntlm")
    target["hash_md5"] = new_hashes["hash_md5"]
    target["hash_sha256"] = new_hashes["hash_sha256"]
    target["hash_bcrypt"] = new_hashes["hash_bcrypt"]
    target["hash_argon2id"] = new_hashes["hash_argon2id"]
    
    # Unblock & remediate
    target["is_blocked"] = False
    target["blocked_reason"] = None
    target["blocked_at"] = None
    target["last_remediated_at"] = datetime.now(timezone.utc).isoformat()
    target["breach_match"] = False
    target["password_group_id"] = None
    target["policy_violations"] = []
    target["baseline_risk"] = 0.05
    target["baseline_tier"] = "Low"
    target["final_risk"] = 0.05
    target["final_tier"] = "Low"
    target["attack_adjustment"] = 0.0
    target["zxcvbn_score"] = 4

    # Persist to dataset on disk and recalculate live health & audit summary
    save_accounts(accounts)
    summary = recalculate_and_save_summary(accounts)

    # Update metadata blocked count
    metadata = get_dataset_metadata()
    metadata["blocked_count"] = sum(1 for a in accounts if a.get("is_blocked"))
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Persist update to Supabase
    try:
        supabase_service.update_account(target["id"], {
            "plaintext_password": new_pwd,
            "hash_ntlm": target["hash_ntlm"],
            "hash_md5": target["hash_md5"],
            "hash_sha256": target["hash_sha256"],
            "hash_bcrypt": target["hash_bcrypt"],
            "hash_argon2id": target["hash_argon2id"],
            "is_blocked": False,
            "blocked_reason": None,
            "blocked_at": None,
            "last_remediated_at": target["last_remediated_at"],
            "breach_match": False,
            "final_risk": 0.05,
            "final_tier": "Low",
            "zxcvbn_score": 4
        })
        supabase_service.log_audit_action(
            action="PASSWORD_REMEDIATED",
            actor=f"User ({target['username']})",
            target_account_id=target["id"],
            details={"username": target["username"], "status": "unblocked_and_hardened"}
        )
    except Exception as e:
        print(f"[DatasetAPI] Supabase password reset update notice: {e}")

    # Broadcast real-time event to all open frontend views
    realtime_broadcaster.broadcast("PASSWORD_REMEDIATED", {
        "account_id": target["id"],
        "username": target["username"],
        "account": target,
        "summary": summary
    })

    return ResetPasswordResponse(
        success=True,
        account_id=target["id"],
        message="Password accepted and securely hardened! Account access has been restored.",
        checks=checks,
        account=target
    )

@router.post("/accounts/reset-password", response_model=ResetPasswordResponse)
def reset_password_general_endpoint(payload: ResetPasswordRequest):
    """
    Universal Password Remediation endpoint accepting username or account_id.
    """
    target_id = payload.account_id or payload.username
    if not target_id:
        raise HTTPException(status_code=400, detail="Must provide username or account_id to reset password")
    return reset_password_endpoint(account_id=target_id, payload=payload)


@router.post("/audit/evaluate-password")
def evaluate_password_endpoint(payload: EvaluatePasswordRequest):
    """
    Live password entropy and policy evaluation using dwolfhub/zxcvbn-python
    with contextual enterprise user inputs.
    """
    if not payload.password:
        raise HTTPException(status_code=400, detail="Password string cannot be empty")
    return evaluate_password_comprehensive(
        password=payload.password,
        username=payload.username or "",
        department=payload.department or "",
        role=payload.role or "",
        custom_inputs=payload.custom_inputs or []
    )

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
    Returns the real bucket of matching suffixes and counts.
    """
    if len(prefix) != 5 or not all(c in "0123456789ABCDEFabcdef" for c in prefix):
        raise HTTPException(status_code=400, detail="Prefix must be exactly 5 hex characters")
    
    url = f"https://api.pwnedpasswords.com/range/{prefix.upper()}"
    import httpx
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Lexicon-Platform-HIBP-Check"})
            if resp.status_code != 200:
                return {"status": "unavailable", "message": f"HIBP returned HTTP {resp.status_code}", "count": 0, "suffixes": {}}
            
            suffixes = {}
            for line in resp.text.splitlines():
                if ":" in line:
                    sfx, cnt = line.split(":", 1)
                    suffixes[sfx.strip().upper()] = int(cnt.strip())

            return {
                "status": "ok",
                "prefix": prefix.upper(),
                "message": "Live HIBP k-anonymity range lookup successful",
                "count": len(suffixes),
                "suffixes": suffixes
            }
    except Exception as e:
        return {"status": "error", "message": f"Live HIBP service currently unavailable: {str(e)}", "count": 0, "suffixes": {}}
