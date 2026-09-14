import pytest
from backend.app.risk_scoring import (
    calculate_baseline_risk,
    calculate_attack_adjustment,
    calculate_final_risk,
    get_risk_tier,
    compute_normalized_reuse,
    compute_policy_violation_score,
)
from backend.app.features.risk_engine.scoring import (
    calculate_baseline_risk_detailed,
    compute_risk_radar_vector,
    get_risk_weights,
    WEIGHT_WEAKNESS,
    WEIGHT_BREACH,
    WEIGHT_REUSE,
    WEIGHT_PRIVILEGE,
    WEIGHT_POLICY,
)
from backend.app.features.risk_engine.policy import (
    check_policy_violations,
    check_nist_sp800_63b_violations,
    check_dual_policy_compliance,
    normalize_leetspeak,
    is_multiword_passphrase,
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
    assert score >= 0.75
    assert tier == "Critical"

def test_detailed_factor_breakdown():
    """Verify granular factor breakdown mathematics match the baseline score."""
    score, tier, factors = calculate_baseline_risk_detailed(
        zxcvbn_score=2,
        is_breached=True,
        reuse_cluster_size=16,
        is_privileged=True,
        policy_violations=["Length < 12", "No Special Char"]
    )
    assert factors["password_weakness_contribution"] == 0.15
    assert factors["breach_match_contribution"] == 0.25
    assert factors["privilege_tier_contribution"] == 0.15
    
    sum_factors = round(sum(factors.values()), 4)
    assert abs(sum_factors - score) < 0.001

def test_risk_radar_vector_generation():
    """Verify 5-axis SIEM dimensional radar vector produces coordinates in [0, 1]."""
    radar = compute_risk_radar_vector(
        zxcvbn_score=1,
        is_breached=True,
        reuse_cluster_size=15,
        is_privileged=True,
        policy_violations=["Length < 12"]
    )
    assert 0.0 <= radar["entropy_deficit"] <= 1.0
    assert radar["breach_exposure"] == 1.0
    assert radar["privilege_exposure"] == 1.0
    assert 0.0 <= radar["lateral_blast_radius"] <= 1.0
    assert 0.0 <= radar["policy_noncompliance"] <= 1.0
    assert 0.0 <= radar["composite_risk"] <= 1.0

def test_lateral_movement_blast_radius():
    """Verify that cross-department reuse and privileged accounts amplify reuse score."""
    single_dept_reuse = compute_normalized_reuse(cluster_size=10, department_count=1, privileged_count=0)
    cross_dept_reuse = compute_normalized_reuse(cluster_size=10, department_count=4, privileged_count=2)
    assert cross_dept_reuse > single_dept_reuse

def test_attack_adjustment_and_final_risk():
    """Verify attack adjustment increments score upon empirical crack."""
    adj = calculate_attack_adjustment(matched=True, candidates_tested=500, elapsed_ms=250.0)
    assert adj == 0.20
    
    baseline = 0.65
    final_score, final_tier = calculate_final_risk(baseline, adj)
    assert final_score == 0.85
    assert final_tier == "Critical"

    no_adj = calculate_attack_adjustment(matched=False, candidates_tested=50000, elapsed_ms=30000.0)
    assert no_adj == 0.0
    f_score, f_tier = calculate_final_risk(baseline, no_adj)
    assert f_score == 0.65

def test_leetspeak_deobfuscation_and_detection():
    """Verify that leetspeak substitutions are de-obfuscated to detect hidden corporate keywords."""
    deobf = normalize_leetspeak("F1n@nc32026!")
    assert "finance" in deobf

    v_leet = check_policy_violations("F1n@nc32026!", username="user", department="Finance")
    assert any("department" in v.lower() for v in v_leet)

def test_multiword_passphrase_intelligence():
    """Verify that long multi-word passphrases are recognized under NIST SP 800-63B."""
    assert is_multiword_passphrase("correct-horse-battery-staple-2026") is True
    assert is_multiword_passphrase("short-pass") is False

    dual = check_dual_policy_compliance(
        password="correct-horse-battery-staple-2026",
        username="alex.morgan",
        department="Engineering",
        role="Developer",
        breach_match=False
    )
    assert dual["is_passphrase"] is True
    assert dual["is_nist_compliant"] is True

def test_policy_contextual_department_and_keyboard_walks():
    """Verify detection of department keywords, keyboard walks, and repeated runs."""
    v_dept = check_policy_violations("Finance2026!Sec", username="john.doe", department="Finance")
    assert any("department" in v.lower() for v in v_dept)

    v_walk = check_policy_violations("Qwerty123456!", username="user", department="General")
    assert any("keyboard" in v.lower() or "walk" in v.lower() for v in v_walk)

    v_run = check_policy_violations("Passwordaaaa!", username="user", department="General")
    assert any("repeated" in v.lower() for v in v_run)

def test_zxcvbn_enterprise_analysis():
    from backend.app.features.risk_engine.zxcvbn_service import analyze_password_zxcvbn, evaluate_password_comprehensive
    
    res = analyze_password_zxcvbn("Password123!", user_inputs=["user", "Lexicon"])
    assert "score" in res
    assert "guesses" in res
    assert "crack_times_display" in res
    assert "hardware_crack_times" in res
    assert "sequence" in res
    assert res["score"] <= 2
    
    comp_res = evaluate_password_comprehensive(
        password="LexiconMarketing2024!",
        username="alex.morgan",
        department="Marketing",
        role="Lead"
    )
    assert "zxcvbn" in comp_res
    assert "policy_violations" in comp_res
    assert "compliance" in comp_res

def test_risk_api_endpoints_and_batch():
    """Verify dedicated /api/risk/* router endpoints including batch evaluation and radar."""
    from fastapi.testclient import TestClient
    from backend.app.main import app

    client = TestClient(app)

    # 1. POST /api/risk/calculate-score
    calc_resp = client.post("/api/risk/calculate-score", json={
        "zxcvbn_score": 1,
        "is_breached": True,
        "reuse_cluster_size": 20,
        "is_privileged": True,
        "policy_violations": ["Length < 12"]
    })
    assert calc_resp.status_code == 200
    calc_data = calc_resp.json()
    assert "baseline_risk" in calc_data
    assert "factors" in calc_data
    assert "radar" in calc_data

    # 2. POST /api/risk/radar
    radar_resp = client.post("/api/risk/radar", json={
        "zxcvbn_score": 3,
        "is_breached": False,
        "reuse_cluster_size": 5,
        "is_privileged": False,
        "policy_violations": []
    })
    assert radar_resp.status_code == 200
    radar_data = radar_resp.json()
    assert "entropy_deficit" in radar_data
    assert "lateral_blast_radius" in radar_data

    # 3. POST /api/risk/batch-evaluate
    batch_resp = client.post("/api/risk/batch-evaluate", json={
        "items": [
            {"password": "Company2026!", "username": "alice", "department": "Finance"},
            {"password": "correct-horse-battery-staple-2026", "username": "bob", "department": "Engineering"},
            {"password": "123456789012", "username": "charlie", "department": "Sales"}
        ]
    })
    assert batch_resp.status_code == 200
    batch_data = batch_resp.json()
    assert batch_data["total_evaluated"] == 3
    assert len(batch_data["results"]) == 3
    assert "processing_time_ms" in batch_data

    # 4. POST /api/risk/deobfuscate
    deobf_resp = client.post("/api/risk/deobfuscate", json={"text": "F1n@nc32026!"})
    assert deobf_resp.status_code == 200
    assert "finance" in deobf_resp.json()["deobfuscated"]

    # 5. GET /api/risk/weights
    weights_resp = client.get("/api/risk/weights")
    assert weights_resp.status_code == 200
    weights_data = weights_resp.json()
    assert weights_data["weights"]["password_weakness"] == 0.30
