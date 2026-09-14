"""
Lexicon Attack Lab — Bounded Attack Runner & Hardware Cracking Simulator.

Executes a bounded, time-boxed dictionary attack against an account's password hash
to empirically demonstrate crack resistance. Enforces strict candidate and time budgets.
Provides simulated GPU/Cluster cracking speed telemetry and offline dump risk projections.
"""

import time
import math
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


HARDWARE_BENCHMARKS = {
    "cpu_single_core": {
        "name": "Standard CPU (1 Core x86_64)",
        "type": "CPU",
        "hash_rates_per_sec": {
            "MD5": 15_000_000,
            "NTLM": 20_000_000,
            "SHA-256": 10_000_000,
            "SHA256": 10_000_000,
            "Bcrypt": 2_000,
            "Argon2id": 50,
        },
        "description": "Baseline commodity endpoint or single-threaded attacker probe."
    },
    "gpu_single_rtx4090": {
        "name": "Workstation GPU (1x NVIDIA RTX 4090 24GB)",
        "type": "GPU",
        "hash_rates_per_sec": {
            "MD5": 160_000_000_000,
            "NTLM": 220_000_000_000,
            "SHA-256": 80_000_000_000,
            "SHA256": 80_000_000_000,
            "Bcrypt": 120_000,
            "Argon2id": 4_000,
        },
        "description": "High-end consumer/workstation GPU standard in penetration testing rigs."
    },
    "gpu_cluster_8x_4090": {
        "name": "Enterprise Cluster (8x NVIDIA RTX 4090 Hashcat Rig)",
        "type": "Cluster",
        "hash_rates_per_sec": {
            "MD5": 1_280_000_000_000,
            "NTLM": 1_760_000_000_000,
            "SHA-256": 640_000_000_000,
            "SHA256": 640_000_000_000,
            "Bcrypt": 960_000,
            "Argon2id": 32_000,
        },
        "description": "State-sponsored or organized cybercrime dedicated hash-cracking cluster."
    }
}


def format_duration(seconds: float) -> str:
    """Format seconds into a human-readable duration."""
    if seconds < 0.001:
        return "Instant (< 1 ms)"
    elif seconds < 1.0:
        return f"{seconds * 1000.0:.1f} ms"
    elif seconds < 60.0:
        return f"{seconds:.2f} seconds"
    elif seconds < 3600.0:
        return f"{seconds / 60.0:.1f} minutes"
    elif seconds < 86400.0:
        return f"{seconds / 3600.0:.1f} hours"
    elif seconds < 31536000.0:
        return f"{seconds / 86400.0:.1f} days"
    elif seconds < 31536000000.0:
        return f"{seconds / 31536000.0:,.1f} years"
    else:
        return "> 1,000 Centuries"


def estimate_hardware_crack_times(algorithm: str, candidates_tested: int) -> Dict[str, Any]:
    """
    Compute estimated time to test candidate space across hardware profiles.
    """
    norm_algo = algorithm.upper().replace("-", "")
    lookup_key = "SHA-256" if "SHA256" in norm_algo or "SHA-256" in norm_algo else (
        "MD5" if "MD5" in norm_algo else (
            "NTLM" if "NTLM" in norm_algo else (
                "Bcrypt" if "BCRYPT" in norm_algo else "Argon2id"
            )
        )
    )

    estimates = {}
    for profile_id, profile in HARDWARE_BENCHMARKS.items():
        rate = profile["hash_rates_per_sec"].get(lookup_key, 1000)
        est_seconds = candidates_tested / max(1, rate)
        estimates[profile_id] = {
            "name": profile["name"],
            "hash_rate_per_sec": rate,
            "estimated_seconds": est_seconds,
            "formatted_time": format_duration(est_seconds)
        }

    return estimates


def get_hardware_benchmark_matrix() -> Dict[str, Any]:
    """Return all hardware benchmark profiles and algorithm rate matrix."""
    return {
        "profiles": HARDWARE_BENCHMARKS,
        "supported_algorithms": ["MD5", "NTLM", "SHA-256", "Bcrypt", "Argon2id"],
        "summary": "Hashcat GPU cracking benchmarks showing resistance differential between fast unsalted hashes (MD5, NTLM) vs slow memory-hard hashes (Bcrypt, Argon2id)."
    }


def run_attack(
    account_id: str,
    target_hash: str,
    algorithm: str,
    org_name: Optional[str] = None,
    max_candidates: int = 50000,
    time_budget_seconds: float = 30.0,
    user_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute a bounded dictionary attack loop against a target password hash.

    State machine lifecycle:
    idle -> account_selected -> running -> (matched | budget_exhausted) -> result_displayed

    Stops immediately if:
    1. verify_hash returns True (match found)
    2. elapsed wall-clock time exceeds time_budget_seconds
    3. candidate generator reaches max_candidates
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
        user_context=user_context
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
    elapsed_total_sec = max(0.000001, end_time - start_time)
    elapsed_ms = round(elapsed_total_sec * 1000.0, 2)
    hash_rate = round(candidates_tested / elapsed_total_sec, 2)

    result_status = "matched" if matched else "budget_exhausted"
    state = AttackState.RESULT_DISPLAYED

    # Calculate simulated GPU cracking telemetry
    hardware_estimates = estimate_hardware_crack_times(algorithm, candidates_tested)

    # Determine attack classification
    attack_vector = "Targeted Identity & Dictionary Mask Attack" if user_context or org_name else "Standard Dictionary & Spatial Mask"

    return {
        "account_id": account_id,
        "algorithm": algorithm,
        "candidates_tested": candidates_tested,
        "elapsed_ms": elapsed_ms,
        "hash_rate_cps": hash_rate,
        "matched": matched,
        "matched_rule": matched_candidate,
        "time_budget_ms": int(time_budget_seconds * 1000),
        "result_status": result_status,
        "state": state.value,
        "attack_vector": attack_vector,
        "hardware_estimates": hardware_estimates,
        "message": (
            f"Empirical match found ({candidates_tested:,} candidates in {elapsed_ms:.1f}ms)."
            if matched
            else f"Search completed: password was not found within this bounded attempt ({candidates_tested:,} candidates tested)."
        ),
    }
