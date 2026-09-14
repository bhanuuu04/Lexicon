"""
Lexicon Attack Lab — Deterministic Mutation Engine.

Generates rule-based candidate passwords for bounded dictionary attack simulation.
Uses a Python generator (yield) to allow early termination upon match without
pre-allocating large memory structures.
"""

from typing import Generator, List, Optional, Set
import itertools

DEFAULT_SEEDS = ["password", "welcome", "admin", "letmein", "qwerty"]
YEARS = ["2026", "2025", "2024", "2023", "2022"]
SEASONS = ["Spring", "Summer", "Autumn", "Winter"]
SPECIALS = ["!", "@", "#", "$"]

LEET_MAP = {
    "a": ["4", "@"],
    "e": ["3"],
    "i": ["1", "!"],
    "o": ["0"],
    "s": ["5", "$"],
}


def generate_leetspeak_variants(word: str, max_variants: int = 8) -> List[str]:
    """
    Generate bounded leetspeak substitution variants for a given word.
    Caps combinatorial expansion to `max_variants` per word.
    """
    word_lower = word.lower()
    indices = [i for i, c in enumerate(word_lower) if c in LEET_MAP]
    if not indices:
        return []

    variants: List[str] = []
    seen: Set[str] = set()

    # Generate standard holistic transformations first
    # Transform 1: Primary leet (first mapping for all chars)
    t1 = list(word)
    for i in indices:
        t1[i] = LEET_MAP[word_lower[i]][0]
    cand1 = "".join(t1)
    if cand1.lower() != word_lower and cand1 not in seen:
        seen.add(cand1)
        variants.append(cand1)

    # Transform 2: Alternate leet (second mapping if available)
    t2 = list(word)
    for i in indices:
        opts = LEET_MAP[word_lower[i]]
        t2[i] = opts[1] if len(opts) > 1 else opts[0]
    cand2 = "".join(t2)
    if cand2.lower() != word_lower and cand2 not in seen:
        seen.add(cand2)
        variants.append(cand2)

    # Transform 3: Single character substitutions
    for i in indices:
        for sub in LEET_MAP[word_lower[i]]:
            t = list(word)
            t[i] = sub
            cand = "".join(t)
            if cand.lower() != word_lower and cand not in seen:
                seen.add(cand)
                variants.append(cand)
                if len(variants) >= max_variants:
                    return variants

    return variants[:max_variants]


def generate_candidates(
    org_name: Optional[str] = None,
    max_candidates: int = 50000,
) -> Generator[str, None, None]:
    """
    Yield mutation candidates deterministically up to `max_candidates`.

    Candidate generation order:
    1. Base case variants (lowercase, capitalized, uppercase)
    2. Words + Special character appends (!, @, #, $)
    3. Words + Year suffixes (2026..2022, recent first)
    4. Words + Year + Special character combinations (e.g. 2026!, 2026@, !2026)
    5. Words + Seasons + Year + Specials (e.g. Summer2026!, Spring2025@)
    6. Leetspeak base words + Year / Special combinations
    7. Number increments and common patterns up to budget cap.
    """
    count = 0
    emitted: Set[str] = set()

    # Collect seed words
    seeds: List[str] = []
    if org_name and org_name.strip():
        cleaned_org = org_name.strip()
        seeds.append(cleaned_org)
    for s in DEFAULT_SEEDS:
        if s.lower() not in [x.lower() for x in seeds]:
            seeds.append(s)

    # Helper generator to yield unique candidates with hard cap
    def emit(candidate: str) -> Generator[str, None, bool]:
        nonlocal count
        if count >= max_candidates:
            return True  # Stop signal
        if candidate and candidate not in emitted:
            emitted.add(candidate)
            count += 1
            yield candidate
        return count >= max_candidates

    # Precompute case variants for each seed
    base_words: List[str] = []
    for seed in seeds:
        lower = seed.lower()
        cap = seed.capitalize()
        upper = seed.upper()
        for w in [cap, lower, upper]:
            if w not in base_words:
                base_words.append(w)

    # Precompute leet variants
    leet_words: List[str] = []
    for seed in seeds:
        for lv in generate_leetspeak_variants(seed, max_variants=8):
            for w in [lv, lv.capitalize(), lv.upper()]:
                if w not in base_words and w not in leet_words:
                    leet_words.append(w)

    # 1. Base Words (Exact & Case variants)
    for w in base_words:
        if (yield from emit(w)):
            return

    # 2. Base Words + Single Special Appends
    for w in base_words:
        for sp in SPECIALS:
            if (yield from emit(f"{w}{sp}")):
                return

    # 3. Base Words + Year Suffixes (recent first)
    for w in base_words:
        for yr in YEARS:
            if (yield from emit(f"{w}{yr}")):
                return

    # 4. Base Words + Combined Year & Special Characters (e.g. Welcome2026!, Admin2026@)
    for w in base_words:
        for yr in YEARS:
            for sp in SPECIALS:
                if (yield from emit(f"{w}{yr}{sp}")):
                    return
                if (yield from emit(f"{w}{sp}{yr}")):
                    return

    # 5. Season Words & Suffixes with Years & Specials
    for season in SEASONS:
        season_variants = [season.capitalize(), season.lower(), season.upper()]
        for sv in season_variants:
            if (yield from emit(sv)):
                return
            for yr in YEARS:
                if (yield from emit(f"{sv}{yr}")):
                    return
                for sp in SPECIALS:
                    if (yield from emit(f"{sv}{yr}{sp}")):
                        return
                    if (yield from emit(f"{sv}{sp}{yr}")):
                        return

        # Seed + Season combos (e.g. WelcomeSummer, CompanySpring2026!)
        for w in base_words:
            for sv in season_variants:
                if (yield from emit(f"{w}{sv}")):
                    return
                for yr in YEARS:
                    for sp in SPECIALS:
                        if (yield from emit(f"{w}{sv}{yr}{sp}")):
                            return

    # 6. Leetspeak Base Words + Exact, Specials, Years, Year+Specials
    for lw in leet_words:
        if (yield from emit(lw)):
            return
        for sp in SPECIALS:
            if (yield from emit(f"{lw}{sp}")):
                return
        for yr in YEARS:
            if (yield from emit(f"{lw}{yr}")):
                return
            for sp in SPECIALS:
                if (yield from emit(f"{lw}{yr}{sp}")):
                    return
                if (yield from emit(f"{lw}{sp}{yr}")):
                    return

    # 7. Common numeric sequences & padding expansions up to max_candidates
    common_num_suffixes = ["1", "12", "123", "1234", "12345", "123456", "01", "007", "99"]
    for w in itertools.chain(base_words, leet_words):
        for num in common_num_suffixes:
            if (yield from emit(f"{w}{num}")):
                return
            for sp in SPECIALS:
                if (yield from emit(f"{w}{num}{sp}")):
                    return
                if (yield from emit(f"{w}{sp}{num}")):
                    return

    # 8. Numeric range increments (e.g., Word001 .. Word999) if budget remains
    for i in range(1, 2000):
        for w in base_words:
            if (yield from emit(f"{w}{i}")):
                return
            if (yield from emit(f"{w}{i:03d}")):
                return
            if (yield from emit(f"{w}{i}!")):
                return
