import json
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from backend.app.models import AttackResultPayload, AttackRunResponse
from backend.app.features.risk_engine.scoring import calculate_attack_adjustment, calculate_final_risk
from backend.app.features.dataset_api.router import get_accounts, save_accounts

router = APIRouter(prefix="/api/attack", tags=["attack"])

@router.post("/result", response_model=AttackRunResponse)
def record_attack_result(payload: AttackResultPayload):
    """
    Receive summarized ore deterministically.
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
