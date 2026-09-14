import json
import random
import os
from pathlib import Path
from typing import List, Dict, Tuple, Any
from concurrent.futures import ThreadPoolExecutor

from backend.app.config import (
    TOTAL_ACCOUNTS, REUSED_RATIO, UNIQUE_WEAK_RATIO, STRONG_UNIQUE_RATIO,
    DATA_DIRECTORY, ACCOUNTS_FILE, BREACH_CORPUS_FILE
)
from backend.app.features.hashing.service import compute_all_hashes
from backend.app.features.dataset_generator.constants import (
    FIRST_NAMES, LAST_NAMES, DEPARTMENTS, REUSE_ROOT_WORDS, COMMON_WEAK_PASSWORDS
)

def build_reuse_groups(total_reused_accounts: int) -> List[Dict[str, Any]]:
    """Build password reuse groups, guaranteeing Hero Group 42 has exactly 31 accounts."""
    groups = []
    
    # Hero Group #42
    hero_group = {
        "group_id": 42,
        "password": "Company2026!",
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
            
        root = random.choice(REUSE_ROOT_WORDS)
        year = random.choice([2024, 2025, 2026])
        special = random.choice(["!", "@", "#", "$", "123!", "123"])
        
        mode = random.randint(0, 3)
        if mode == 0:
            pwd = f"{root}{year}{special}"
        elif mode == 1:
            pwd = f"{root.lower()}{year}{special}"
        elif mode == 2:
            pwd = f"{root.upper()}{year}{special}"
        else:
            leet = root.replace("e", "3").replace("a", "@").replace("o", "0").replace("i", "1")
            pwd = f"{leet}{year}{special}"
            
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

def generate_distinct_password_pools():
    """Pre-generate pools of weak and strong passwords for rapid authentic hashing."""
    weak_pool = []
    for _ in range(600):
        root = random.choice(REUSE_ROOT_WORDS)
        year = random.choice([2023, 2024, 2025, 2026])
        special = random.choice(["!", "@", "#", "$", "%", "*", "123", "123!"])
        mode = random.randint(0, 3)
        if mode == 0:
            weak_pool.append(f"{root}{year}{special}")
        elif mode == 1:
            weak_pool.append(f"{root.lower()}{year}{special}")
        elif mode == 2:
            weak_pool.append(f"{root}@{year}")
        else:
            weak_pool.append(f"{root}{special}{random.randint(10, 999)}")
            
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+"
    strong_pool = []
    for _ in range(300):
        length = random.randint(16, 22)
        strong_pool.append("".join(random.choice(chars) for _ in range(length)))
        
    return list(set(weak_pool)), list(set(strong_pool))

def generate_accounts() -> Tuple[List[Dict[str, Any]], List[str]]:
    """Generate 50,000 synthetic Active Directory accounts."""
    random.seed(42)
    
    num_reused = int(TOTAL_ACCOUNTS * REUSED_RATIO)           # 30,000 (60%)
    num_weak_unique = int(TOTAL_ACCOUNTS * UNIQUE_WEAK_RATIO)  # 15,000 (30%)
    num_strong_unique = TOTAL_ACCOUNTS - num_reused - num_weak_unique  # 5,000 (10%)
    
    reuse_groups = build_reuse_groups(num_reused)
    weak_pool, strong_pool = generate_distinct_password_pools()
    
    # Synthetic breach corpus
    breach_set = set(COMMON_WEAK_PASSWORDS)
    for g in reuse_groups:
        if g.get("is_breached"):
            breach_set.add(g["password"])
    for p in weak_pool[:200]:
        breach_set.add(p)
    breach_corpus = sorted(list(breach_set))
    
    dept_names = list(DEPARTMENTS.keys())
    dept_weights = [DEPARTMENTS[d]["weight"] for d in dept_names]
    
    accounts: List[Dict[str, Any]] = []
    used_usernames = set()
    
    def get_unique_username(fn: str, ln: str, idx: int) -> str:
        base = f"{fn.lower()}.{ln.lower()}"
        if base not in used_usernames:
            used_usernames.add(base)
            return base
        cand = f"{fn[0].lower()}{ln.lower()}{idx}"
        used_usernames.add(cand)
        return cand

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
                used_usernames.add(username)
                account_id = "ACC-00042"
            else:
                dept = random.choices(dept_names, weights=dept_weights, k=1)[0]
                role_info = random.choice(DEPARTMENTS[dept]["roles"])
                role = role_info[0]
                is_privileged = role_info[1]
                username = get_unique_username(fn, ln, account_counter)
                account_id = f"ACC-{account_counter:05d}"
                
            accounts.append({
                "id": account_id,
                "username": username,
                "first_name": fn,
                "last_name": ln,
                "department": dept,
                "role": role,
                "is_privileged": is_privileged,
                "password_group_id": grp_id,
                "plaintext_password": pwd,
                "is_hero": (is_hero_group and member_idx == 0)
            })
            account_counter += 1

    # 2. Weak Unique Accounts
    for idx in range(num_weak_unique):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        dept = random.choices(dept_names, weights=dept_weights, k=1)[0]
        role_info = random.choice(DEPARTMENTS[dept]["roles"])
        role = role_info[0]
        is_privileged = role_info[1]
        username = get_unique_username(fn, ln, account_counter)
        account_id = f"ACC-{account_counter:05d}"
        pwd = weak_pool[idx % len(weak_pool)]
        
        accounts.append({
            "id": account_id,
            "username": username,
            "first_name": fn,
            "last_name": ln,
            "department": dept,
            "role": role,
            "is_privileged": is_privileged,
            "password_group_id": None,
            "plaintext_password": pwd,
            "is_hero": False
        })
        account_counter += 1

    # 3. Strong Unique Accounts
    for idx in range(num_strong_unique):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        dept = random.choices(dept_names, weights=dept_weights, k=1)[0]
        role_info = random.choice(DEPARTMENTS[dept]["roles"])
        role = role_info[0]
        is_privileged = role_info[1]
        username = get_unique_username(fn, ln, account_counter)
        account_id = f"ACC-{account_counter:05d}"
        pwd = strong_pool[idx % len(strong_pool)]
        
        accounts.append({
            "id": account_id,
            "username": username,
            "first_name": fn,
            "last_name": ln,
            "department": dept,
            "role": role,
            "is_privileged": is_privileged,
            "password_group_id": None,
            "plaintext_password": pwd,
            "is_hero": False
        })
        account_counter += 1

    hero_acc = next(a for a in accounts if a.get("is_hero"))
    other_accs = [a for a in accounts if not a.get("is_hero")]
    random.shuffle(other_accs)
    final_accounts = [hero_acc] + other_accs

    unique_passwords = list(set(a["plaintext_password"] for a in final_accounts))
    print(f"[DatasetGenerator] Precomputing hashes for {len(unique_passwords)} distinct passwords...")
    
    hash_cache = {}
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
        results = executor.map(lambda p: (p, compute_all_hashes(p)), unique_passwords)
        for pwd, hashes in results:
            hash_cache[pwd] = hashes

    for a in final_accounts:
        hashes = hash_cache[a["plaintext_password"]]
        a["hash_md5"] = hashes["hash_md5"]
        a["hash_sha256"] = hashes["hash_sha256"]
        a["hash_bcrypt"] = hashes["hash_bcrypt"]
        a["hash_argon2id"] = hashes["hash_argon2id"]

    return final_accounts, breach_corpus

def generate_and_save_dataset():
    """Save accounts_50k.json and breach_corpus.json."""
    DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)
    
    print("[DatasetGenerator] Generating 50,000 synthetic Active Directory accounts...")
    accounts, breach_corpus = generate_accounts()
    
    print(f"[DatasetGenerator] Writing {len(breach_corpus)} breach corpus items to {BREACH_CORPUS_FILE}...")
    with open(BREACH_CORPUS_FILE, "w", encoding="utf-8") as f:
        json.dump(breach_corpus, f, indent=2)
        
    print(f"[DatasetGenerator] Writing {len(accounts)} accounts to {ACCOUNTS_FILE}...")
    with open(ACCOUNTS_FILE, "w", encoding="utf-8") as f:
        json.dump(accounts, f)
        
    print(f"[DatasetGenerator] Dataset generation complete ({len(accounts)} accounts).")
    return accounts, breach_corpus
