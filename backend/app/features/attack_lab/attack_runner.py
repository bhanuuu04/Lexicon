"""
Lexicon Attack Lab — Bounded Attack Runner.

Executes a bounded, time-boxed dictionary attack against an account's password hash
to empirically demonstrate crack resistance. Enforces strict candidate and time budgets.
"""

import time
from typing import Dict, Any, Optional
from enum import Enum

from backend.app.features.hashing.service import verify_hash
from backend.app.features.attack_lab.mutation_engine import generate_candidates


class AttackState(str, Enum):
    IDLE = "idle"
    ACCOUNT_SELECTED = "account_selected"
    RUNNING = "running"
    MATCHED = "matched"
    BUDGET_EXHAUSTED = "budget_exhausted"
    RESULT_DISPLAYED = "result_displayed"


def run_attack(
    account_id: str,
    target_hash: str,
    algorithm: str,
    org_name: Optional[str] = None,
    max_candidates: int = 50000,
    time_budget_seconds: float = 30.0,
) -> Dict[str, Any]:
    """
    Execute a bounded dictionary attack loop against a target password hash.

    State machine lifecycle:
    idle -> account_selected -> running -> (matched | budget_exhausted) -> result_displayed

    Stops immediately if:
    1. verify_hash returns True (match found)
    2. elapsed wall-clock time exceeds time_budget_seconds
    3. candidate generator reaches max_candidates

    Note: A 'budget_exhausted' outcome strictly means 'not found within this
    bounded attempt', NOT that the password is mathematically safe.
    """
    state = AttackState.IDLE
    if account_id and target_hash:
        state = AttackState.ACCOUNT_SELECTED

    state = AttackState.RUNNING
    start_time = time.perf_counter()

    candidates_tested = 0
    matched = False
    matched_candidate: Optional[str] = None

    generator = generate_candidates(
        org_name=org_name,
        max_candidates=max_candidates,
    )

    for candidate in generator:
        candidates_tested += 1

        # Check candidate against target hash via hashing service
        if verify_hash(candidate, algorithm, target_hash):
            matched = True
            matched_candidate = candidate
            state = AttackState.MATCHED
            break

        # Check wall-clock time budget
        elapsed_seconds = time.perf_counter() - start_time
        if elapsed_seconds >= time_budget_seconds:
            state = AttackState.BUDGET_EXHAUSTED
            break

    # If generator exhausted without match
    if not matched and state != AttackState.BUDGET_EXHAUSTED:
        state = AttackState.BUDGET_EXHAUSTED

    end_time = time.perf_counter()
    elapsed_ms = round((end_time - start_time) * 1000.0, 2)

    result_status = "matched" if matched else "budget_exhausted"
    state = AttackState.RESULT_DISPLAYED

    return {
        "account_id": account_id,
        "algorithm": algorithm,
        "candidates_tested": candidates_tested,
        "elapsed_ms": elapsed_ms,
        "matched": matched,
        "matched_rule": matched_candidate,
        "time_budget_ms": int(time_budget_seconds * 1000),
        "result_status": result_status,
        "state": state.value,
        "message": (
            f"Empirical match found ({candidates_tested:,} candidates in {elapsed_ms:.1f}ms)."
            if matched
            else f"Search completed: password was not found within this bounded attempt ({candidates_tested:,} candidates tested)."
        ),
    }
