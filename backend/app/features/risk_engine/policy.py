import re
from typing import List, Dict, Any, Optional

# Standard predictable enterprise passwords and keyboard patterns
COMMON_PATTERNS = [
    "123", "1234", "12345", "123456", "abc", "qwerty", "admin", "welcome", "company",
    "password", "lexicon", "summer", "winter", "spring", "autumn", "access", "secure"
]

KEYBOARD_WALKS = [
    "qwerty", "qwertz", "asdfgh", "zxcvbn", "1qaz", "2wsx", "3edc", "4rfv",
    "!q@w", "qazwsx", "poiuyt", "lkjhgf", "mnbvcx"
]

DEPARTMENT_KEYWORDS = {
    "finance": ["finance", "payroll", "audit", "tax", "ledger", "billing", "invoice"],
    "engineering": ["engine", "dev", "devops", "code", "deploy", "build", "git", "stack"],
    "marketing": ["market", "brand", "social", "campaign", "growth", "media"],
    "human resources": ["hr", "people", "talent", "recruit", "onboard", "benefits"],
    "sales": ["sales", "deal", "quota", "lead", "pipeline", "client"],
    "it": ["it", "helpdesk", "support", "network", "sysadmin", "server", "infra"],
    "security": ["sec", "soc", "infosec", "cyber", "defense", "protect", "firewall"],
    "executive": ["exec", "cfo", "ceo", "cto", "board", "director", "vp"]
}

LEET_MAP = {
    "@": "a", "4": "a",
    "3": "e",
    "1": "i", "!": "i", "|": "i",
    "0": "o",
    "5": "s", "$": "s",
    "7": "t", "+": "t",
    "8": "b",
    "9": "g"
}

def normalize_leetspeak(text: str) -> str:
    """
    De-obfuscate common leetspeak substitutions to reveal hidden corporate keywords.
    Example: 'F1n@nc3' -> 'finance', 'C0mp@ny' -> 'company', '@dm1n' -> 'admin'.
    """
    res = text.lower()
    for leet_char, standard_char in LEET_MAP.items():
        res = res.replace(leet_char, standard_char)
    return res

def is_multiword_passphrase(password: str) -> bool:
    """
    Detect whether password follows modern multi-word passphrase architecture
    (e.g., 'correct-horse-battery-staple' or 'winter blue ocean tree 2026').
    Criteria: Length >= 16 with 3+ distinct words separated by standard delimiters.
    """
    if len(password) < 16:
        return False
    # Split on space, dash, underscore, dot
    tokens = re.split(r"[\s\-_.]+", password.strip())
    valid_tokens = [t for t in tokens if len(t) >= 3 and t.isalpha()]
    return len(valid_tokens) >= 3

def check_policy_violations(
    password: str,
    username: str = "",
    department: str = "",
    role: str = ""
) -> List[str]:
    """
    Perform deterministic enterprise Active Directory password policy checks.
    Includes contextual department leak, spatial walks, and leetspeak de-obfuscation.
    Returns list of human-readable policy violation strings.
    """
    violations = []
    pwd_lower = password.lower()
    pwd_deobfuscated = normalize_leetspeak(password)
    
    # Check if recognized as secure long multi-word passphrase
    is_passphrase = is_multiword_passphrase(password)
    
    # 1. Length Policy: Minimum 12 characters
    if len(password) < 12:
        violations.append("Password length below minimum 12 characters requirement")
        
    # 2. Complexity Policy
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)
    
    complexity_categories = sum([has_lower, has_upper, has_digit, has_special])
    if complexity_categories < 3 and not (is_passphrase and len(password) >= 16):
        violations.append("Fails character complexity requirement (needs 3 of lower/upper/number/special)")
        
    # 3. Contextual / Dictionary Patterns (raw and de-obfuscated)
    for pat in COMMON_PATTERNS:
        if pat in pwd_lower or pat in pwd_deobfuscated:
            violations.append(f"Contains predictable enterprise dictionary keyword or sequence ('{pat}')")
            break
            
    # 4. Identity / Username reuse in password
    if username:
        user_parts = username.lower().replace(".", " ").replace("_", " ").split()
        for part in user_parts:
            if len(part) >= 3 and (part in pwd_lower or part in pwd_deobfuscated):
                violations.append(f"Contains user identity or username fragment ('{part}')")
                break

    # 5. Department & Role Contextual Leak
    if department:
        dept_clean = department.lower().strip()
        dept_terms = DEPARTMENT_KEYWORDS.get(dept_clean, [dept_clean])
        if len(dept_clean) >= 3 and (dept_clean in pwd_lower or dept_clean in pwd_deobfuscated):
            violations.append(f"Contains organizational department identifier ('{department}')")
        else:
            for term in dept_terms:
                if len(term) >= 4 and (term in pwd_lower or term in pwd_deobfuscated):
                    violations.append(f"Contains department contextual keyword ('{term}')")
                    break

    if role:
        role_parts = role.lower().replace(".", " ").replace("_", " ").split()
        for rpart in role_parts:
            if len(rpart) >= 4 and (rpart in pwd_lower or rpart in pwd_deobfuscated):
                violations.append(f"Contains organizational role fragment ('{rpart}')")
                break

    # 6. Spatial / Keyboard Walks
    for walk in KEYBOARD_WALKS:
        if walk in pwd_lower:
            violations.append(f"Contains predictable keyboard spatial walk sequence ('{walk}')")
            break

    # 7. Repeated Character Runs (e.g. 'aaaa', '1111')
    if re.search(r"(.)\1{3,}", password):
        violations.append("Contains repeated single character run of 4 or more characters")
            
    # 8. Predictable Year / Season Suffix
    if re.search(r"(202[0-9]|2030)[\!@#\$%^&*]?$", password):
        violations.append("Contains predictable current/upcoming calendar year suffix")
        
    return violations

def check_nist_sp800_63b_violations(
    password: str,
    username: str = "",
    department: str = "",
    breach_match: bool = False
) -> List[str]:
    """
    Evaluate compliance against NIST SP 800-63B modern password guidelines:
    - Minimum 8 characters (15+ recommended for privileged credentials)
    - Prohibits breached / compromised credentials
    - Prohibits repetitive and sequential keyboard walks
    - Prohibits context-specific user or organizational keywords
    - Does NOT penalize long multi-word passphrases for lack of arbitrary symbols
    """
    violations = []
    pwd_lower = password.lower()
    pwd_deobfuscated = normalize_leetspeak(password)
    is_passphrase = is_multiword_passphrase(password)

    if len(password) < 8:
        violations.append("NIST 800-63B: Password must be at least 8 characters long")
        
    if breach_match:
        violations.append("NIST 800-63B: Password appears in known compromised breach corpus")

    # Repetitive sequences
    if re.search(r"(.)\1{3,}", password):
        violations.append("NIST 800-63B: Repetitive character sequences are prohibited")

    # Sequential characters
    for walk in KEYBOARD_WALKS:
        if walk in pwd_lower:
            violations.append(f"NIST 800-63B: Sequential keyboard patterns ('{walk}') are prohibited")
            break

    # Contextual data
    if username:
        user_parts = username.lower().replace(".", " ").replace("_", " ").split()
        for part in user_parts:
            if len(part) >= 3 and (part in pwd_lower or part in pwd_deobfuscated):
                violations.append("NIST 800-63B: Context-specific user identifiers must not be included")
                break

    if department and len(department) >= 3 and (department.lower() in pwd_lower or department.lower() in pwd_deobfuscated):
        violations.append("NIST 800-63B: Context-specific organizational keywords must not be included")

    return violations

def check_dual_policy_compliance(
    password: str,
    username: str = "",
    department: str = "",
    role: str = "",
    breach_match: bool = False
) -> Dict[str, Any]:
    """
    Evaluate against both Active Directory GPO and NIST SP 800-63B standards.
    """
    ad_violations = check_policy_violations(password, username, department, role)
    nist_violations = check_nist_sp800_63b_violations(password, username, department, breach_match)
    is_passphrase = is_multiword_passphrase(password)
    deobfuscated = normalize_leetspeak(password)

    return {
        "is_ad_compliant": len(ad_violations) == 0,
        "ad_violations": ad_violations,
        "is_nist_compliant": len(nist_violations) == 0,
        "nist_violations": nist_violations,
        "is_passphrase": is_passphrase,
        "leetspeak_deobfuscated": deobfuscated if deobfuscated != password.lower() else None
    }
