PS-11
Track: Identity & Access Security
Password Security & Dictionary Attack Analyzer
Problem Overview & Scope
STORYLINE & REAL-WORLD CONTEXT:
An enterprise Active Directory domain with 50,000 corporate user accounts undergoes a security audit after an internal penetration test reveals widespread credential reuse and weak password patterns. Threat actors frequently exploit compromised credential dumps from public breaches (e.g., RockYou, HaveIBeenPwned dumps), combined with rule-based permutations (leetspeak, seasonal year suffixes), to compromise enterprise single sign-on (SSO) portals in minutes.

CHALLENGES WITH CURRENT-DAY ALTERNATIVES:
Traditional Active Directory password policies enforce simplistic, outdated complexity rules (e.g., min 8 characters, 1 uppercase, 1 special character) which lead users to adopt predictable, formulaic patterns (e.g., Password123!, Welcome2026!). Standard auditing tools are slow, generate unencrypted plain-text audit artifacts, and lack real-time password strength entropy calculation or comprehensive breach database hash lookups.

MISSION & ARCHITECTURAL GOAL:
Build an advanced password security evaluation and dictionary attack simulation platform. Implement multi-algorithm hashing (MD5, SHA-256, Bcrypt, Argon2), entropy and pattern analysis (Zxcvbn-inspired heuristics), rule-based mutation dictionary testing, and breach database hash matching. Provide an interactive enterprise password strength dashboard with actionable remediation insights and policy enforcement guidelines.

Key Objectives & Functional Requirements
1
Multi-algorithm password hashing engine (MD5, SHA-256, Bcrypt, Argon2id)
2
High-speed dictionary attack simulator with rule-based mutations (leetspeak, year suffixes, capitalization)
3
Information-entropy and pattern-based password strength evaluation engine
4
Breached password hash lookup integration against simulated compromised credential dumps
5
Interactive enterprise password audit dashboard with password policy compliance metrics

Evaluation Criteria & Weightage Breakdown
Our grand finale jury will assess your project based on the following weighted standards.

1
Technical Depth & Cryptographic Implementation
30% Weight
Correctness of hashing algorithms, salting, and cracking simulation speed.

2
Entropy Scoring & Mutation Logic
25% Weight
Sophistication of pattern detection, dictionary mutations, and strength evaluation.

3
UI/UX & Audit Dashboard
25% Weight
Visual password strength gauges, vulnerability breakdowns, and compliance reports.

4
Presentation Deck & Deliverables
20% Weight
Demonstration clarity, presentation structure, and code documentation.