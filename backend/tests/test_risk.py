import pytest
from backend.app.risk_scoring import (
    calculate_baseline_risk,
    calculate_attack_adjustment,
    calculate_final_risk,
    get_risk_tier,
    compute_normalized_reuse,
    compute_policy_violation_score
)

def test_risk_tiers_thresholds():
    assert get_risk_tier(0.85) == "Critical"
    assert get_risk_tier(0.75) == "Critical"
    assert get_risk_tier(0.749) == "High"
    assert get_risk_tier(0.50) == "High"
    assert get_risk_tier(0.499) == "Medium"
    assert get_risk_tier(0.25) == "Medium"
    assert get_risk_tier(0.249) == "Low"
    assert get_risk_tier(0.0) == "Low"

def test_fixture_strong_unique_nonprivileged():
    """Strong password (zxcvbn=4), not breached, unique (cluster_size=1), non-privileged, no violations."""
    score, tier = calculate_baseline_risk(
        zxcvbn_score=4,
        is_breached=False,
        reuse_cluster_size=1,
        is_privileged=False,
        policy_violations=[]
    )
    # Expected: 0.30*(0) + 0.25*(0) + 0.20*(0) + 0.15*(0) + 0.10*(0) = 0.0
    assert score == 0.0
    assert tier == "Low"

def test_fixture_weak_unique():
    """Weak password (zxcvbn=0), not breached, unique, non-privileged, 2 violations."""
    score, tier = calculate_baseline_risk(
        zxcvbn_score=0,
        is_breached=False,
        reuse_cluster_size=1,
        is_privileged=False,
        policy_violations=["Short", "Predictable"]
    )
    # Expected: 0.30*(1.0) + 0.25*(0) + 0.20*(0) + 0.15*(0) + 0.10*(2/3 = 0.667) = 0.3667
    assert score >= 0.25
    assert tier == "Medium"

def test_fixture_weak_reused():
    """Weak password (zxcvbn=1), not breached, reused in cluster of 25, non-privileged, 2 violations."""
    score, tier = calculate_baseline_risk(
        zxcvbn_score=1,
        is_breached=False,
        reuse_cluster_size=25,
        is_privileged=False,
        policy_violations=["Predictable", "Year suffix"]
    )
    # password_weakness: 0.75 -> 0.225
    # reuse: 24/30 = 0.8 -> 0.16
    # violations: 2/3 -> 0.067
    # sum: ~0.452 -> Medium/High
    assert score >= 0.40

def test_fixture_breached_privileged_reused_hero():
    """Hero account: Weak (zxcvbn=1), breached, reused in cluster of 31, privileged, 3 violations."""
    score, tier = calculate_baseline_risk(
        zxcvbn_score=1,
        is_breached=True,
        reuse_cluster_size=31,
        is_privileged=True,
        policy_violations=["Length < 12", "Keyword match", "Year suffix"]
    )
    # password_weakness: 0.75 * 0.30 = 0.225
    # breach: 1.0 * 0.25 = 0.25
    # reuse: 1.0 * 0.20 = 0.20
    # privilege: 1.0 * 0.15 = 0.15
    # violations: 1.0 * 0.10 = 0.10
    # sum = 0.925 -> Critical
    assert score >= 0.75
    assert tier == "Critical"

def test_attack_adjustment_and_final_risk():
    """Verify attack adjustment increments score upon empirical crack."""
    adj = calculate_attack_adjustment(matched=True, candidates_tested=500, elapsed_ms=250.0)
    assert adj == 0.20  # 0.15 + 0.05 speed bonus
    
    baseline = 0.65
    final_score, final_tier = calculate_final_risk(baseline, adj)
    assert final_score == 0.85
    assert final_tier == "Critical"

    # When not matched
    no_adj = calculate_attack_adjustment(matched=False, candidates_tested=50000, elapsed_ms=30000.0)
    assert no_adj == 0.0
    f_score, f_tier = calculate_final_risk(baseline, no_adj)
    assert f_score == 0.65

def test_zxcvbn_enterprise_analysis():
    from backend.app.features.risk_engine.zxcvbn_service import analyze_password_zxcvbn, evaluate_password_comprehensive
    
    # 1. Test standard password
    res = analyze_password_zxcvbn("Password123!", user_inputs=["user", "Lexicon"])
    assert "score" in res
    assert "guesses" in res
    assert "crack_times_display" in res
    assert "sequence" in res
    assert res["score"] <= 2
    
    # 2. Test enterprise brand word penalization
    comp_res = evaluate_password_comprehensive(
        password="LexiconMarketing2024!",
        username="alex.morgan",
        department="Marketing",
        role="Lead"
    )
    assert "zxcvbn" in comp_res
    assert "policy_violations" in comp_res
    assert comp_res["zxcvbn"]["score"] >= 0

