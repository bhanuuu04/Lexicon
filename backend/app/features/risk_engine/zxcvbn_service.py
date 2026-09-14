import zxcvbn
from typing import List, Optional, Dict, Any
from backend.app.features.risk_engine.policy import check_policy_violations

def analyze_password_zxcvbn(password: str, user_inputs: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Perform deep pattern and entropy analysis using dwolfhub/zxcvbn-python.
    Injects enterprise contextual inputs (username, department, company name)
    to penalize structured corporate patterns.
    """
    inputs = [i.strip() for i in (user_inputs or []) if i and len(i.strip()) >= 2]
    
    # Always include baseline enterprise terms
    base_terms = ["lexicon", "company", "admin", "corp", "pass", "root"]
    for t in base_terms:
        if t not in inputs:
            inputs.append(t)
            
    raw_res = zxcvbn.zxcvbn(password, user_inputs=inputs)
    
    # Format sequence pattern breakdown
    sequence_matches = []
    for item in raw_res.get("sequence", []):
        match_info = {
            "pattern": item.get("pattern", "unknown"),
            "token": item.get("token", ""),
            "matched_word": item.get("matched_word", ""),
            "dictionary_name": item.get("dictionary_name", ""),
            "guesses_log10": round(float(item.get("guesses_log10", 0.0)), 2),
        }
        sequence_matches.append(match_info)
        
    guesses_log10 = float(raw_res.get("guesses_log10", 0.0))
    entropy_bits = round(guesses_log10 * 3.321928, 1)  # log2(10) conversion
    
    crack_times_display = raw_res.get("crack_times_display", {})
    crack_times_seconds = raw_res.get("crack_times_seconds", {})
    
    # Ensure all seconds are json serializable floats/ints
    sanitized_seconds = {}
    for k, v in crack_times_seconds.items():
        try:
            sanitized_seconds[k] = float(v)
        except (ValueError, TypeError):
            sanitized_seconds[k] = 0.0

    feedback = raw_res.get("feedback", {})
    warning = feedback.get("warning", "")
    suggestions = feedback.get("suggestions", [])
    
    return {
        "score": int(raw_res.get("score", 0)),
        "guesses": str(raw_res.get("guesses", "0")),
        "guesses_log10": round(guesses_log10, 2),
        "entropy_bits": entropy_bits,
        "sequence": sequence_matches,
        "crack_times_display": crack_times_display,
        "crack_times_seconds": sanitized_seconds,
        "feedback": {
            "warning": warning,
            "suggestions": suggestions
        }
    }

def evaluate_password_comprehensive(
    password: str,
    username: str = "",
    department: str = "",
    role: str = "",
    custom_inputs: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Comprehensive password evaluation combining zxcvbn-python entropy +
    Active Directory enterprise policy violation checks.
    """
    user_inputs = list(custom_inputs or [])
    if username:
        user_inputs.extend(username.lower().replace(".", " ").replace("_", " ").split())
    if department:
        user_inputs.append(department.lower())
    if role:
        user_inputs.extend(role.lower().split())
        
    zxcvbn_data = analyze_password_zxcvbn(password, user_inputs=user_inputs)
    policy_violations = check_policy_violations(password, username or "user", department or "General")
    
    # Calculate weakness and estimated risk
    score = zxcvbn_data["score"]
    normalized_zxcvbn = max(0, min(4, score)) / 4.0
    password_weakness = round(1.0 - normalized_zxcvbn, 3)
    
    return {
        "password": password,
        "zxcvbn": zxcvbn_data,
        "policy_violations": policy_violations,
        "password_weakness": password_weakness,
        "is_policy_compliant": len(policy_violations) == 0 and score >= 3
    }
