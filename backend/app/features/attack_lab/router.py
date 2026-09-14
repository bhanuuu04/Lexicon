import json
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from backend.app.models import AttackResultPayload, AttackRunResponse
from backend.app.features.risk_engine.scoring import calculate_attack_adjustment, calculate_final_risk
from backend.app.features.dataset_api.router import get_accounts, save_accounts
from backend.app.features.attack_lab.attack_runner import (
    run_attack,
    get_hardware_benchmark_matrix,
    estimate_hardware_crack_times
)

router = APIRouter(prefix="/api/attack", tags=["attack"])


class RunAttackSimulationRequest(BaseModel):
    account_id: Optional[str] = Field(default=None, description="Optional target account ID (e.g. ACC-00042)")
    target_hash: Optional[str] = Field(default=None, description="Optional explicit hash to crack")
    algorithm: str = Field(default="MD5", description="Hash algorithm: MD5, SHA-256, NTLM, Bcrypt, Argon2id")
    org_name: Optional[str] = Field(default="Lexicon", description="Target organization name for contextual dictionary generation")
    max_candidates: int = Field(default=50000, le=100000, description="Hard cap on candidate search space")
    time_budget_seconds: float = Field(default=30.0, le=60.0, description="Hard timeout in seconds")


@router.post("/run")
def execute_attack_simulation(req: RunAttackSimulationRequest):
    """
    Execute on-demand bounded attack simulation against an account hash or custom hash.
    Provides complete empirical cracking metrics and GPU/cluster telemetry.
    """
    target_hash = req.target_hash
    user_ctx = None
    account_id = req.account_id

    if account_id:
        accounts = get_accounts()
        target_account = next((a for a in accounts if a["id"] == account_id), None)
        if not target_account:
            raise HTTPException(status_code=404, detail=f"Account {account_id} not found")
        
        user_ctx = {
            "username": target_account.get("username", ""),
            "first_name": target_account.get("first_name", ""),
            "last_name": target_account.get("last_name", ""),
            "department": target_account.get("department", ""),
            "role": target_account.get("role", "")
        }

        if not target_hash:
            algo_lower = req.algorithm.lower().replace("-", "")
            if "ntlm" in algo_lower:
                target_hash = target_account.get("hash_ntlm")
            elif "md5" in algo_lower:
                target_hash = target_account.get("hash_md5")
            elif "sha256" in algo_lower:
                target_hash = target_account.get("hash_sha256")
            elif "bcrypt" in algo_lower:
                target_hash = target_account.get("hash_bcrypt")
            elif "argon" in algo_lower:
                target_hash = target_account.get("hash_argon2id")
            else:
                target_hash = target_account.get("hash_md5")

    if not target_hash:
        raise HTTPException(
            status_code=400,
            detail="Either account_id with valid hash or target_hash must be provided."
        )

    result = run_attack(
        account_id=account_id or "CUSTOM-TARGET",
        target_hash=target_hash,
        algorithm=req.algorithm,
        org_name=req.org_name,
        max_candidates=req.max_candidates,
        time_budget_seconds=req.time_budget_seconds,
        user_context=user_ctx
    )

    return result


@router.get("/hardware-benchmarks")
def get_benchmarks():
    """
    Retrieve hardware cracking performance matrix across CPU, RTX 4090, and enterprise GPU clusters.
    """
    return get_hardware_benchmark_matrix()


@router.post("/result", response_model=AttackRunResponse)
def record_attack_result(payload: AttackResultPayload):
    """
    Receive summarized attack result and deterministically adjust account risk.
    """
    accounts = get_accounts()
    target_account = None
    
    for acc in accounts:
        if acc["id"] == payload.account_id:
            target_account = acc
            break
            
    if not target_account:
        raise HTTPException(status_code=404, detail=f"Account {payload.account_id} not found")
        
    baseline_risk = target_account.get("baseline_risk", 0.5)
    
    adjustment = calculate_attack_adjustment(
        matched=payload.matched,
        candidates_tested=payload.candidates_tested,
        elapsed_ms=payload.elapsed_ms
    )
    
    final_risk, final_tier = calculate_final_risk(baseline_risk, adjustment)
    
    target_account["attack_adjustment"] = adjustment
    target_account["final_risk"] = final_risk
    target_account["final_tier"] = final_tier
    target_account["attack_evidence"] = {
        "algorithm": payload.algorithm,
        "candidates_tested": payload.candidates_tested,
        "elapsed_ms": payload.elapsed_ms,
        "matched": payload.matched,
        "matched_rule": payload.matched_rule
    }
    
    try:
        save_accounts(accounts)
    except Exception as e:
        print(f"[AttackRouter] Warning: Failed to persist updated account: {e}")
        
    status_msg = (
        f"Empirical match found ({payload.candidates_tested:,} candidates in {payload.elapsed_ms:.1f}ms). "
        f"Risk increased from {baseline_risk:.2f} ({target_account['baseline_tier']}) to {final_risk:.2f} ({final_tier})."
        if payload.matched
        else f"No match within bounded search budget ({payload.candidates_tested:,} candidates tested). Baseline risk maintained."
    )
    
    return AttackRunResponse(
        account_id=payload.account_id,
        matched=payload.matched,
        baseline_risk=baseline_risk,
        attack_adjustment=adjustment,
        final_risk=final_risk,
        final_tier=final_tier,
        message=status_msg
    )
