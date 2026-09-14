import re
from typing import List

COMMON_PATTERNS = [
    "123", "1234", "12345", "123456", "abc", "qwerty", "admin", "welcome", "company",
    "password", "lexicon", "summer", "winter", "spring", "autumn", "access", "secure"
]

def check_policy_violations(password: str, username: str, department: str) -> List[str]:
    """
    Perform deterministic enterprise password policy checks.
    Returns list of human-readable policy violation strings.
    """
    violations = []
    
    # 1. Length Policy: Minimum 12 characters
    if len(password) < 12:
        violations.append("Password length below minimum 12 characters requirement")
        
    # 2. Complexity Policy
    has_lower = bool(re.search(r"[a-z]", password))
    has_upper = bool(re.search(r"[A-Z]", password))
    has_digit = bool(re.search(r"\d", password))
    has_special = bool(re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password))
    
    complexity_categories = sum([has_lower, has_upper, has_digit, has_special])
    if complexity_categories < 3:
        violations.append("Fails character complexity requirement (needs 3 of lower/upper/number/special)")
        
    # 3. Contextual / Dictionary Patterns
    pwd_lower = password.lower()
    for pat in COMMON_PATTERNS:
        if pat in pwd_lower:
            violations.append(f"Contains predictable enterprise dictionary keyword or sequence ('{pat}')")
            break
            
    # 4. Identity / Username reuse in password
    user_parts = username.lower().replace(".", " ").replace("_", " ").split()
    for part in user_parts:
        if len(part) >= 3 and part in pwd_lower:
            violations.append("Contains user identity or username fragment")
            break
            
    # 5. Predictable Year / Season Suffix
    if re.search(r"(202[0-9]|2030)[\!@#\$%^&*]?$", password):
        violations.append("Contains predictable current/upcoming calendar year suffix")
        
    return violations
