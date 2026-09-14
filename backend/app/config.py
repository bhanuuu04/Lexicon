import os
from pathlib import Path

# Base Directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIRECTORY = BASE_DIR / "data"

# Data Files
ACCOUNTS_FILE = DATA_DIRECTORY / "accounts_50k.json"
AUDIT_RESULTS_FILE = DATA_DIRECTORY / "audit_results.json"
BREACH_CORPUS_FILE = DATA_DIRECTORY / "breach_corpus.json"

# Dataset Generation Config
TOTAL_ACCOUNTS = 50_000
REUSED_RATIO = 0.60
UNIQUE_WEAK_RATIO = 0.30
STRONG_UNIQUE_RATIO = 0.10

# Cryptographic Config for Synthetic Generation
BCRYPT_COST = 11
ARGON2_MEMORY = 19 * 1024  # 19 MiB in KiB
ARGON2_ITERATIONS = 2
ARGON2_PARALLELISM = 1

# Attack Lab Limits
ATTACK_MAX_CANDIDATES = 50_000
ATTACK_TIME_BUDGET_MS = 30_000

# Server Config
HOST = os.getenv("LEXICON_HOST", "0.0.0.0")
PORT = int(os.getenv("LEXICON_PORT", "8000"))
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

# AI Remediation Key (Optional)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
