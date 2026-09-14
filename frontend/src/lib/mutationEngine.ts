/**
 * Lexicon Deterministic Mutation Engine
 * Generates rule-based candidate passwords for bounded client-side Attack Lab simulation.
 */

export const BASE_SEED_WORDS = [
  "Company", "Lexicon", "Enterprise", "Welcome", "Summer", "Winter", "Spring", "Autumn",
  "Admin", "Password", "Finance", "Engineering", "Operations", "Access", "Secure", "Login",
  "Office", "Server", "Portal", "Master", "System", "Domain", "Global", "Cyber", "Cloud",
  "Support", "Corporate", "November", "December", "January", "ChangeMe", "LetMeIn", "Testing"
];

export const YEARS = ["2026", "2025", "2024", "2023", "2022", "26", "25", "24"];
export const SPECIALS = ["!", "@", "#", "$", "%", "*", "123", "123!", "1234", "12345", "1!", "!@#", "@123", "2026!"];

export interface MutationCandidate {
  candidate: string;
  rule: string;
}

/**
 * Apply Leet-speak transformation
 */
export function applyLeet(word: string): string[] {
  const variations: string[] = [];
  
  // Standard Leet
  let v1 = word
    .replace(/[aA]/g, "@")
    .replace(/[eE]/g, "3")
    .replace(/[oO]/g, "0")
    .replace(/[iI]/g, "1")
    .replace(/[sS]/g, "$");
  variations.push(v1);

  // Soft Leet (only e->3 and a->@)
  let v2 = word.replace(/[eE]/g, "3").replace(/[aA]/g, "@");
  if (v2 !== v1) variations.push(v2);

  // Symbol substitution (i->!)
  let v3 = word.replace(/[iI]/g, "!");
  if (!variations.includes(v3)) variations.push(v3);

  return variations;
}

/**
 * Generator producing bounded deterministic mutation candidates.
 * Yields up to maxCandidates items.
 */
export function* generateCandidateStream(
  contextKeywords: string[] = [],
  maxCandidates: number = 50000
): Generator<MutationCandidate, void, unknown> {
  let count = 0;
  const emitted = new Set<string>();

  function* emit(cand: string, rule: string): Generator<MutationCandidate, boolean, unknown> {
    if (count >= maxCandidates) return true; // Signal stop
    if (!emitted.has(cand)) {
      emitted.add(cand);
      count++;
      yield { candidate: cand, rule };
    }
    return false;
  }

  // Combine contextual terms (e.g. username fragment, department) with base dictionary
  const seeds = Array.from(new Set([...contextKeywords.filter(k => k && k.length >= 3), ...BASE_SEED_WORDS]));

  // Tier 1: Direct Dictionary & Simple Casing
  for (const seed of seeds) {
    if (yield* emit(seed, "dictionary_exact")) return;
    if (yield* emit(seed.toLowerCase(), "lowercase_exact")) return;
    if (yield* emit(seed.toUpperCase(), "uppercase_exact")) return;
  }

  // Tier 2: Seed + Year Suffixes (e.g. Company2026, Summer2025)
  for (const seed of seeds) {
    const title = seed.charAt(0).toUpperCase() + seed.slice(1).toLowerCase();
    const lower = seed.toLowerCase();
    const upper = seed.toUpperCase();

    for (const year of YEARS) {
      if (yield* emit(`${title}${year}`, "year_suffix")) return;
      if (yield* emit(`${lower}${year}`, "year_suffix_lower")) return;
      if (yield* emit(`${upper}${year}`, "year_suffix_upper")) return;
    }
  }

  // Tier 3: Seed + Year + Special Character (e.g. Company2026!, Welcome2025@)
  for (const seed of seeds) {
    const title = seed.charAt(0).toUpperCase() + seed.slice(1).toLowerCase();
    const lower = seed.toLowerCase();
    const upper = seed.toUpperCase();

    for (const year of YEARS) {
      for (const spec of SPECIALS) {
        if (yield* emit(`${title}${year}${spec}`, "year_and_special_suffix")) return;
        if (yield* emit(`${lower}${year}${spec}`, "year_and_special_suffix_lower")) return;
        if (yield* emit(`${upper}${year}${spec}`, "year_and_special_suffix_upper")) return;
        if (yield* emit(`${title}${spec}${year}`, "special_and_year_suffix")) return;
      }
    }
  }

  // Tier 4: Leet-speak Mutations + Years + Specials (e.g. C0mp@ny2026!, W3lc0m32025$)
  for (const seed of seeds) {
    const leetVariants = applyLeet(seed);
    for (const leet of leetVariants) {
      if (yield* emit(leet, "leet_exact")) return;
      for (const year of YEARS) {
        if (yield* emit(`${leet}${year}`, "leet_year_suffix")) return;
        for (const spec of SPECIALS) {
          if (yield* emit(`${leet}${year}${spec}`, "leet_year_special")) return;
          if (yield* emit(`${leet}${spec}${year}`, "leet_special_year")) return;
        }
      }
    }
  }

  // Tier 5: Direct Special Suffixes (e.g. Company123!, Welcome!, Admin@123)
  for (const seed of seeds) {
    const title = seed.charAt(0).toUpperCase() + seed.slice(1).toLowerCase();
    for (const spec of SPECIALS) {
      if (yield* emit(`${title}${spec}`, "special_suffix")) return;
      if (yield* emit(`${title.toLowerCase()}${spec}`, "special_suffix_lower")) return;
      if (yield* emit(`${title}@${spec}`, "at_special_suffix")) return;
    }
  }

  // Tier 6: Multi-number and padding variations (e.g. Company1, Company2... Company999)
  for (const seed of seeds) {
    const title = seed.charAt(0).toUpperCase() + seed.slice(1).toLowerCase();
    for (let i = 1; i <= 300; i++) {
      if (yield* emit(`${title}${i}`, "numeric_increment")) return;
      if (yield* emit(`${title}${i}!`, "numeric_increment_special")) return;
      if (yield* emit(`${title}@${i}`, "at_numeric_increment")) return;
    }
  }
}
