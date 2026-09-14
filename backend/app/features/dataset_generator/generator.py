import json
import random
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Tuple, Any, Set
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

from backend.app.config import (
    TOTAL_ACCOUNTS, REUSED_RATIO, UNIQUE_WEAK_RATIO, STRONG_UNIQUE_RATIO,
    DATA_DIRECTORY, ACCOUNTS_FILE, BREACH_CORPUS_FILE, METADATA_FILE, AUDIT_RESULTS_FILE
)
from backend.app.features.hashing.service import compute_all_hashes
from backend.app.features.risk_engine.scoring import (
    calculate_baseline_risk_detailed,
    compute_risk_radar_vector,
    calculate_baseline_risk,
    compute_normalized_reuse
)
from backend.app.features.risk_engine.policy import check_policy_violations
from backend.app.features.risk_engine.zxcvbn_service import analyze_password_zxcvbn
from backend.app.features.dataset_generator.constants import (
    FIRST_NAMES, LAST_NAMES, DEPARTMENTS, REUSE_ROOT_WORDS,
    PASSPHRASE_WORDS, KEYBOARD_WALKS, DEFAULT_PROVISIONED_PREFIXES,
    COMMON_WEAK_PASSWORDS, DOMAIN_NAME
)

def _generate_weak_password(seed_index: int, used_set: Set[str]) -> str:
    """Generate a unique, realistic weak/medium enterprise password across diverse archetypes."""
    years = [2023, 2024, 2025, 2026]
    specials = ["!", "@", "#", "$", "%", "*", "123", "123!", "!", "?"]
    
    for _ in range(50):
        mode = random.randint(0, 5)
        if mode == 0:
            # Corporate root + year + special
            root = random.choice(REUSE_ROOT_WORDS)
            year = random.choice(years)
            special = random.choice(specials)
            cand = f"{root}{year}{special}"
        elif mode == 1:
            # Leetspeak corporate root + year + symbol
            root = random.choice(REUSE_ROOT_WORDS)
            leet = root.replace("e", "3").replace("a", "@").replace("o", "0").replace("i", "1").replace("s", "$")
            year = random.choice(years)
            special = random.choice(specials)
            cand = f"{leet}{year}{special}"
        elif mode == 2:
            # Default onboarding provisioned
            prefix = random.choice(DEFAULT_PROVISIONED_PREFIXES)
            year = random.choice(years)
            special = random.choice(specials)
            cand = f"{prefix}{year}{special}"
        elif mode == 3:
            # Keyboard walk + numbers / symbol
            walk = random.choice(KEYBOARD_WALKS)
            special = random.choice(["!", "123!", "2026!", "$"])
            cand = f"{walk}{special}"
        elif mode == 4:
            # Department keyword + year + symbol
            dept_key = random.choice(["Finance", "Admin", "HR", "Sales", "DevOps", "IT", "Sec", "Exec", "Ops"])
            year = random.choice(years)
            special = random.choice(specials)
            cand = f"{dept_key}{year}{special}"
        else:
            # Short passphrase variant
            w1 = random.choice(PASSPHRASE_WORDS)
            w2 = random.choice(PASSPHRASE_WORDS)
            cand = f"{w1}-{w2}-{random.choice(years)}"

        if cand not in used_set:
            used_set.add(cand)
            return cand

    # Fallback with entropy counter
    fallback = f"LexiconPass{seed_index}{random.choice(specials)}"
    used_set.add(fallback)
    return fallback

def _generate_strong_password(seed_index: int, used_set: Set[str]) -> str:
    """Generate a high-entropy compliant password or NIST multi-word passphrase."""
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+"
    
    for _ in range(50):
        if random.random() < 0.40:
            # NIST SP 800-63B Multi-word Passphrase (4 words)
            words = random.sample(PASSPHRASE_WORDS, 4)
            cand = "-".join(words)
            if random.random() < 0.50:
                cand += f"-{random.choice([2025, 2026])}"
        else:
            # High-entropy random administrative string (16-24 chars)
            length = random.randint(16, 24)
            cand = "".join(random.choice(chars) for _ in range(length))

        if cand not in used_set:
            used_set.add(cand)
            return cand

    fallback = "".join(random.choice(chars) for _ in range(20))
    used_set.add(fallback)
    return fallback

def generate_distinct_password_pools(weak_count: int = 600, strong_count: int = 300) -> Tuple[List[str], List[str]]:
    """Generate pools of distinct weak and strong passwords for benchmark testing."""
    used_set: Set[str] = set()
    weak_pool = [_generate_weak_password(i, used_set) for i in range(weak_count)]
    strong_pool = [_generate_strong_password(i, used_set) for i in range(strong_count)]
    return weak_pool, strong_pool

def build_reuse_groups(total_reused_accounts: int, used_passwords: Set[str] = None) -> List[Dict[str, Any]]:
    """
    Build password reuse groups with strictly unique passwords per group.
    Guarantees Hero Group #42 has exactly 31 accounts and Company2026!.
    """
    if used_passwords is None:
        used_passwords = set()
    groups = []
    
    # 1. Hero Group #42
    hero_pwd = "Company2026!"
    used_passwords.add(hero_pwd)
    hero_group = {
        "group_id": 42,
        "password": hero_pwd,
        "target_size": 31,
        "is_hero": True,
        "is_breached": True
    }
    groups.append(hero_group)
    
    allocated = 31
    group_id = 1
    
    while allocated < total_reused_accounts:
        if group_id == 42:
            group_id += 1
            continue
            
        remaining = total_reused_accounts - allocated
        size = min(remaining, random.randint(8, 65))
        if remaining < 8:
            size = remaining
            
        pwd = _generate_weak_password(group_id, used_passwords)
        is_breached = random.random() < 0.60
        
        groups.append({
            "group_id": group_id,
            "password": pwd,
            "target_size": size,
            "is_hero": False,
            "is_breached": is_breached
        })
        
        allocated += size
        group_id += 1
        
    return groups

def generate_accounts(total_accounts: int = TOTAL_ACCOUNTS) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, Any]]:
    """
    Generate complete enterprise Active Directory accounts with single-pass audit metrics.
    Guarantees 0 unintended duplicate passwords, strict group isolation, and valid hashes.
    """
    random.seed(42)
    
    num_reused = int(total_accounts * REUSED_RATIO)           # 60%
    num_weak_unique = int(total_accounts * UNIQUE_WEAK_RATIO)  # 30%
    num_strong_unique = total_accounts - num_reused - num_weak_unique  # 10%
    
    used_passwords: Set[str] = set()
    reuse_groups = build_reuse_groups(num_reused, used_passwords)
    
    # Build complete breach corpus
    breach_set = set(COMMON_WEAK_PASSWORDS)
    for g in reuse_groups:
        if g.get("is_breached"):
            breach_set.add(g["password"])
    
    dept_names = list(DEPARTMENTS.keys())
    dept_weights = [DEPARTMENTS[d]["weight"] for d in dept_names]
    
    accounts: List[Dict[str, Any]] = []
    used_usernames: Set[str] = set()
    
    def get_unique_username_and_email(fn: str, ln: str, idx: int) -> Tuple[str, str]:
        base = f"{fn.lower()}.{ln.lower()}"
        if base not in used_usernames:
            used_usernames.add(base)
            return base, f"{base}@{DOMAIN_NAME}"
        cand = f"{fn[0].lower()}{ln.lower()}{idx}"
        used_usernames.add(cand)
        return cand, f"{cand}@{DOMAIN_NAME}"

    account_counter = 1
    
    # 1. Reused Accounts
    for group in reuse_groups:
        grp_id = group["group_id"]
        pwd = group["password"]
        size = group["target_size"]
        is_hero_group = group["is_hero"]
        
        for member_idx in range(size):
            fn = random.choice(FIRST_NAMES)
            ln = random.choice(LAST_NAMES)
            
            if is_hero_group and member_idx == 0:
                fn = "Alex"
                ln = "Morgan"
                dept = "Information Technology"
                role = "Enterprise Active Directory Admin"
                is_privileged = True
                username = "alex.morgan"
                email = f"alex.morgan@{DOMAIN_NAME}"
                used_usernames.add(username)
                account_id = "ACC-00042"
                sid = "S-1-5-21-3829104-2918392-1042"
            else:
                dept = random.choices(dept_names, weights=dept_weights, k=1)[0]
                role_info = random.choice(DEPARTMENTS[dept]["roles"])
                role = role_info[0]
                is_privileged = role_info[1]
                username, email = get_unique_username_and_email(fn, ln, account_counter)
                account_id = f"ACC-{account_counter:05d}"
                sid = f"S-1-5-21-3829104-{random.randint(1000000, 9999999)}-{1000 + account_counter}"
                
            accounts.append({
                "id": account_id,
                "username": username,
                "email": email,
                "first_name": fn,
                "last_name": ln,
                "department": dept,
                "role": role,
                "is_privileged": is_privileged,
                "sid": sid,
                "password_age_days": random.randint(15, 365),
                "mfa_enabled": is_privileged and random.random() < 0.35,
                "failed_login_count": random.choices([0, 1, 2, 3, 5], weights=[0.80, 0.12, 0.05, 0.02, 0.01])[0],
                "password_group_id": grp_id,
                "plaintext_password": pwd,
                "is_hero": (is_hero_group and member_idx == 0),
                "is_blocked": False,
                "blocked_reason": None,
                "blocked_at": None,
                "last_remediated_at": None
            })
            account_counter += 1

    # 2. Weak Unique Accounts Pool (Scales up to 2,500 distinct weak templates)
    weak_pool_size = min(num_weak_unique, 2500) if num_weak_unique > 0 else 0
    weak_unique_pool = [_generate_weak_password(i + 10000, used_passwords) for i in range(weak_pool_size)]
    for p in weak_unique_pool[:int(weak_pool_size * 0.25)]:
        breach_set.add(p)

    for idx in range(num_weak_unique):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        dept = random.choices(dept_names, weights=dept_weights, k=1)[0]
        role_info = random.choice(DEPARTMENTS[dept]["roles"])
        role = role_info[0]
        is_privileged = role_info[1]
        username, email = get_unique_username_and_email(fn, ln, account_counter)
        account_id = f"ACC-{account_counter:05d}"
        sid = f"S-1-5-21-3829104-{random.randint(1000000, 9999999)}-{1000 + account_counter}"
        pwd = weak_unique_pool[idx % len(weak_unique_pool)]
        
        accounts.append({
            "id": account_id,
            "username": username,
            "email": email,
            "first_name": fn,
            "last_name": ln,
            "department": dept,
            "role": role,
            "is_privileged": is_privileged,
            "sid": sid,
            "password_age_days": random.randint(10, 360),
            "mfa_enabled": is_privileged and random.random() < 0.40,
            "failed_login_count": random.choices([0, 1, 2], weights=[0.88, 0.09, 0.03])[0],
            "password_group_id": None,
            "plaintext_password": pwd,
            "is_hero": False,
            "is_blocked": False,
            "blocked_reason": None,
            "blocked_at": None,
            "last_remediated_at": None
        })
        account_counter += 1

    # 3. Strong Unique Accounts Pool (Scales up to 1,000 distinct high-entropy templates)
    strong_pool_size = min(num_strong_unique, 1000) if num_strong_unique > 0 else 0
    strong_unique_pool = [_generate_strong_password(i + 20000, used_passwords) for i in range(strong_pool_size)]

    for idx in range(num_strong_unique):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        dept = random.choices(dept_names, weights=dept_weights, k=1)[0]
        role_info = random.choice(DEPARTMENTS[dept]["roles"])
        role = role_info[0]
        is_privileged = role_info[1]
        username, email = get_unique_username_and_email(fn, ln, account_counter)
        account_id = f"ACC-{account_counter:05d}"
        sid = f"S-1-5-21-3829104-{random.randint(1000000, 9999999)}-{1000 + account_counter}"
        pwd = strong_unique_pool[idx % len(strong_unique_pool)]
        
        accounts.append({
            "id": account_id,
            "username": username,
            "email": email,
            "first_name": fn,
            "last_name": ln,
            "department": dept,
            "role": role,
            "is_privileged": is_privileged,
            "sid": sid,
            "password_age_days": random.randint(5, 120),
            "mfa_enabled": True if is_privileged else random.random() < 0.65,
            "failed_login_count": 0,
            "password_group_id": None,
            "plaintext_password": pwd,
            "is_hero": False,
            "is_blocked": False,
            "blocked_reason": None,
            "blocked_at": None,
            "last_remediated_at": None
        })
        account_counter += 1

    # Ensure hero account is at index 0
    hero_acc = next((a for a in accounts if a.get("is_hero")), None)
    other_accs = [a for a in accounts if not a.get("is_hero")]
    random.shuffle(other_accs)
    final_accounts = ([hero_acc] if hero_acc else []) + other_accs

    breach_corpus = sorted(list(breach_set))
    breach_lookup = set(breach_corpus)

    # 4. Fast Hash Precomputation across distinct passwords
    unique_passwords = list(set(a["plaintext_password"] for a in final_accounts))
    print(f"[DatasetGenerator] Precomputing hashes for {len(unique_passwords)} distinct passwords...")
    
    hash_cache = {}
    with ThreadPoolExecutor(max_workers=min(32, (os.cpu_count() or 4) * 4)) as executor:
        results = executor.map(lambda p: (p, compute_all_hashes(p, fast_mode=True)), unique_passwords)
        for pwd, hashes in results:
            hash_cache[pwd] = hashes

    # 5. Fast zxcvbn evaluation across distinct passwords
    zxcvbn_score_cache = {}
    with ThreadPoolExecutor(max_workers=min(32, (os.cpu_count() or 4) * 4)) as executor:
        z_results = executor.map(lambda p: (p, analyze_password_zxcvbn(p)["score"]), unique_passwords)
        for pwd, score in z_results:
            zxcvbn_score_cache[pwd] = score

    # 6. Single-pass Audit Metrics Synthesis
    group_sizes = defaultdict(int)
    group_members = defaultdict(list)
    group_privileged = defaultdict(int)
    group_departments = defaultdict(lambda: defaultdict(int))
    
    for acc in final_accounts:
        grp_id = acc.get("password_group_id")
        if grp_id is not None:
            group_sizes[grp_id] += 1
            group_members[grp_id].append(acc["id"])
            if acc.get("is_privileged"):
                group_privileged[grp_id] += 1
            group_departments[grp_id][acc["department"]] += 1

    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    breached_count = 0
    privileged_at_risk_count = 0
    total_violations_count = 0
    
    dept_summary = defaultdict(lambda: {
        "total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0,
        "privileged": 0, "breached": 0, "avg_risk": 0.0, "total_risk_sum": 0.0
    })

    for a in final_accounts:
        pwd = a["plaintext_password"]
        hashes = hash_cache[pwd]
        a["hash_ntlm"] = hashes.get("hash_ntlm", "")
        a["hash_md5"] = hashes["hash_md5"]
        a["hash_sha256"] = hashes["hash_sha256"]
        a["hash_bcrypt"] = hashes["hash_bcrypt"]
        a["hash_argon2id"] = hashes["hash_argon2id"]

        grp_id = a.get("password_group_id")
        cluster_size = group_sizes[grp_id] if grp_id is not None else 1
        dept_count = len(group_departments[grp_id]) if grp_id is not None else 1
        priv_in_cluster = group_privileged[grp_id] if grp_id is not None else (1 if a["is_privileged"] else 0)

        violations = check_policy_violations(pwd, username=a["username"], department=a["department"], role=a["role"])
        a["policy_violations"] = violations
        total_violations_count += len(violations)

        z_score = zxcvbn_score_cache[pwd]
        a["zxcvbn_score"] = z_score

        is_breach = pwd in breach_lookup
        a["breach_match"] = is_breach
        if is_breach:
            breached_count += 1

        b_score, b_tier, factors = calculate_baseline_risk_detailed(
            zxcvbn_score=z_score,
            is_breached=is_breach,
            reuse_cluster_size=cluster_size,
            is_privileged=a["is_privileged"],
            policy_violations=violations,
            department_count=dept_count,
            privileged_in_cluster=priv_in_cluster,
            password_age_days=a.get("password_age_days")
        )
        radar = compute_risk_radar_vector(
            zxcvbn_score=z_score,
            is_breached=is_breach,
            reuse_cluster_size=cluster_size,
            is_privileged=a["is_privileged"],
            policy_violations=violations,
            department_count=dept_count,
            privileged_in_cluster=priv_in_cluster
        )

        a["baseline_risk"] = b_score
        a["baseline_tier"] = b_tier
        a["attack_adjustment"] = 0.0
        a["final_risk"] = b_score
        a["final_tier"] = b_tier
        a["factors"] = factors
        a["radar"] = radar

        if b_tier == "Critical":
            critical_count += 1
        elif b_tier == "High":
            high_count += 1
        elif b_tier == "Medium":
            medium_count += 1
        else:
            low_count += 1

        if a["is_privileged"] and (b_tier in ["Critical", "High"]):
            privileged_at_risk_count += 1

        d_stat = dept_summary[a["department"]]
        d_stat["total"] += 1
        d_stat[b_tier.lower()] += 1
        if a["is_privileged"]:
            d_stat["privileged"] += 1
        if is_breach:
            d_stat["breached"] += 1
        d_stat["total_risk_sum"] += b_score

    for d, s in dept_summary.items():
        s["avg_risk"] = round(s["total_risk_sum"] / max(1, s["total"]), 4)
        del s["total_risk_sum"]

    top_clusters = []
    sorted_group_ids = sorted(group_sizes.keys(), key=lambda gid: (gid == 42, group_sizes[gid]), reverse=True)
    
    for gid in sorted_group_ids[:20]:
        sample_acc_id = group_members[gid][0]
        sample_acc = next(a for a in final_accounts if a["id"] == sample_acc_id)
        top_clusters.append({
            "group_id": gid,
            "password_sample": sample_acc["plaintext_password"],
            "total_accounts": group_sizes[gid],
            "privileged_count": group_privileged[gid],
            "departments": dict(group_departments[gid]),
            "account_ids": group_members[gid][:15]
        })

    audit_summary = {
        "total_accounts": len(final_accounts),
        "critical_count": critical_count,
        "high_risk_count": high_count,
        "medium_risk_count": medium_count,
        "low_risk_count": low_count,
        "breached_count": breached_count,
        "reuse_cluster_count": len(group_sizes),
        "total_reused_accounts": sum(group_sizes.values()),
        "privileged_count": sum(1 for a in final_accounts if a["is_privileged"]),
        "privileged_at_risk_count": privileged_at_risk_count,
        "policy_violations_count": total_violations_count,
        "risk_distribution": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count
        },
        "department_risk_summary": dict(dept_summary),
        "top_reuse_clusters": top_clusters,
        "hero_account_id": "ACC-00042"
    }

    return final_accounts, breach_corpus, audit_summary

def _atomic_write_json(file_path: Path, data: Any, indent: int = None):
    """Write JSON data atomically to prevent concurrent access locking."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = file_path.with_name(f"{file_path.name}.{uuid.uuid4().hex[:8]}.tmp")
    
    with open(str(tmp_path), "w", encoding="utf-8") as f:
        if indent:
            json.dump(data, f, indent=indent)
        else:
            json.dump(data, f)
            
    try:
        tmp_path.replace(file_path)
    except Exception:
        # On Windows, fallback to remove + rename if replace encounters transient locks
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass
        tmp_path.rename(file_path)

def generate_and_save_dataset(total_accounts: int = TOTAL_ACCOUNTS) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, Any], Dict[str, Any]]:
    """
    Generate and atomically persist Active Directory accounts dataset, breach corpus, metadata, and audit summary.
    """
    DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)
    
    print(f"[DatasetGenerator] Synthesizing {total_accounts:,} enterprise Active Directory accounts...")
    accounts, breach_corpus, audit_summary = generate_accounts(total_accounts=total_accounts)
    
    metadata = {
        "version": "1.0.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "total_accounts": len(accounts),
        "dataset_file": str(ACCOUNTS_FILE.name),
        "is_custom_generated": total_accounts != TOTAL_ACCOUNTS,
        "blocked_count": sum(1 for a in accounts if a.get("is_blocked")),
        "generator_config": {
            "reused_ratio": REUSED_RATIO,
            "unique_weak_ratio": UNIQUE_WEAK_RATIO,
            "strong_unique_ratio": STRONG_UNIQUE_RATIO,
            "seed": 42
        }
    }
    
    print(f"[DatasetGenerator] Persisting breach corpus ({len(breach_corpus)} items)...")
    _atomic_write_json(BREACH_CORPUS_FILE, breach_corpus, indent=2)
    
    print(f"[DatasetGenerator] Persisting accounts dataset ({len(accounts)} accounts)...")
    _atomic_write_json(ACCOUNTS_FILE, accounts)
    
    print(f"[DatasetGenerator] Persisting audit results...")
    _atomic_write_json(AUDIT_RESULTS_FILE, audit_summary, indent=2)
    
    print(f"[DatasetGenerator] Persisting dataset metadata...")
    _atomic_write_json(METADATA_FILE, metadata, indent=2)
    
    print(f"[DatasetGenerator] Dataset generation & audit complete ({len(accounts)} accounts).")
    return accounts, breach_corpus, metadata, audit_summary
