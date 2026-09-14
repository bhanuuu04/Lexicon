import pytest
import time
from backend.app.features.hashing.service import compute_md5, compute_sha256, compute_bcrypt
from backend.app.features.attack_lab.mutation_engine import (
    generate_candidates,
    generate_leetspeak_variants,
    DEFAULT_SEEDS,
    YEARS,
    SPECIALS,
)
from backend.app.features.attack_lab.attack_runner import run_attack, AttackState
from backend.app.models import AttackResultPayload


def test_mutation_engine_candidate_generation():
    """Verify mutation engine yields case variations, year suffixes, and specials."""
    candidates = list(generate_candidates(max_candidates=500))
    assert len(candidates) == 500

    # Ensure all yielded candidates are unique
    assert len(set(candidates)) == len(candidates)

    # Check key expected patterns are generated
    assert "welcome" in [c.lower() for c in candidates]
    assert "Welcome2026!" in candidates
    assert "Password2026!" in candidates
    assert "Admin2026@" in candidates


def test_mutation_engine_respects_hard_cap():
    """Ensure generator terminates precisely at max_candidates."""
    gen = generate_candidates(max_candidates=42)
    items = list(gen)
    assert len(items) == 42


def test_mutation_engine_includes_org_name():
    """Ensure optional org_name is prioritized in candidate stream."""
    candidates = list(generate_candidates(org_name="LexiconOrg", max_candidates=200))
    assert "LexiconOrg" in candidates or "Lexiconorg" in candidates
    assert "LexiconOrg2026!" in candidates or "Lexiconorg2026!" in candidates


def test_leetspeak_variant_capping():
    """Ensure leetspeak generation is bounded to prevent explosion."""
    variants = generate_leetspeak_variants("password", max_variants=8)
    assert len(variants) <= 8
    assert all(isinstance(v, str) for v in variants)


def test_attack_runner_finds_known_password_md5():
    """Confirm run_attack cracks a known password with MD5 algorithm."""
    target_pwd = "Welcome2026!"
    target_hash = compute_md5(target_pwd)

    result = run_attack(
        account_id="ACC-TEST-001",
        target_hash=target_hash,
        algorithm="MD5",
        max_candidates=5000,
        time_budget_seconds=10.0,
    )

    assert result["account_id"] == "ACC-TEST-001"
    assert result["algorithm"] == "MD5"
    assert result["matched"] is True
    assert result["matched_rule"] == target_pwd
    assert result["result_status"] == "matched"
    assert result["candidates_tested"] > 0
    assert result["elapsed_ms"] >= 0.0
    assert result["state"] == AttackState.RESULT_DISPLAYED.value


def test_attack_runner_finds_known_password_sha256():
    """Confirm run_attack cracks a known password with SHA-256 algorithm."""
    target_pwd = "Admin2026!"
    target_hash = compute_sha256(target_pwd)

    result = run_attack(
        account_id="ACC-TEST-002",
        target_hash=target_hash,
        algorithm="SHA-256",
        max_candidates=5000,
        time_budget_seconds=10.0,
    )

    assert result["matched"] is True
    assert result["matched_rule"] == target_pwd
    assert result["result_status"] == "matched"


def test_attack_runner_finds_org_name_password():
    """Confirm run_attack cracks an organization-specific password."""
    target_pwd = "Company2026!"
    target_hash = compute_sha256(target_pwd)

    result = run_attack(
        account_id="ACC-TEST-003",
        target_hash=target_hash,
        algorithm="SHA-256",
        org_name="Company",
        max_candidates=5000,
        time_budget_seconds=10.0,
    )

    assert result["matched"] is True
    assert result["matched_rule"] == target_pwd
    assert result["result_status"] == "matched"


def test_attack_runner_strong_random_password_budget_exhausted():
    """
    Confirm that a random high-entropy password is NOT matched and correctly
    returns 'budget_exhausted' without framing the password as 'safe'.
    """
    target_pwd = "X9#kLm9@vP2zQ!wR"
    target_hash = compute_sha256(target_pwd)

    result = run_attack(
        account_id="ACC-TEST-004",
        target_hash=target_hash,
        algorithm="SHA-256",
        max_candidates=300,
        time_budget_seconds=5.0,
    )

    assert result["matched"] is False
    assert result["matched_rule"] is None
    assert result["result_status"] == "budget_exhausted"
    assert result["candidates_tested"] == 300
    assert "not found within this bounded attempt" in result["message"]


def test_attack_runner_time_budget_enforcement():
    """Verify that exceeding the wall-clock time budget halts execution gracefully."""
    target_pwd = "ExtremelyComplexNonExistentPassword_982374198273"
    target_hash = compute_sha256(target_pwd)

    # Set very small time budget (e.g. 0.005s)
    result = run_attack(
        account_id="ACC-TEST-005",
        target_hash=target_hash,
        algorithm="SHA-256",
        max_candidates=100000,
        time_budget_seconds=0.005,
    )

    assert result["matched"] is False
    assert result["result_status"] == "budget_exhausted"


def test_attack_result_payload_contract_compatibility():
    """Ensure run_attack result is directly consumable by AttackResultPayload."""
    target_pwd = "Welcome2026!"
    target_hash = compute_md5(target_pwd)

    result = run_attack(
        account_id="ACC-00042",
        target_hash=target_hash,
        algorithm="MD5",
        max_candidates=1000,
    )

    # Validate against Pydantic model
    payload = AttackResultPayload(
        account_id=result["account_id"],
        algorithm=result["algorithm"],
        candidates_tested=result["candidates_tested"],
        elapsed_ms=result["elapsed_ms"],
        matched=result["matched"],
        matched_rule=result["matched_rule"],
        time_budget_ms=result["time_budget_ms"],
    )
    assert payload.account_id == "ACC-00042"
    assert payload.matched is True
    assert payload.matched_rule == "Welcome2026!"
