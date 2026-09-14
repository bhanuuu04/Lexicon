# Lexicon — Enterprise Password Risk Intelligence Platform

**Lexicon** is an enterprise-grade Identity & Access Risk Intelligence platform that analyzes a fully synthetic 50,000-account Active Directory-style environment. It identifies which credentials create the greatest organizational risk, demonstrates controlled client-side exploitability in an interactive Attack Lab, benchmarks password-hashing resistance in a real-time Hash Race, and provides actionable AI remediation advisory.

> **"Don't just determine whether a password is weak. Determine which accounts create the greatest enterprise risk, demonstrate controlled exploitability, compare password-hashing resistance, and provide actionable remediation."**

---

## High-Level Architecture

```text
                                  LEXICON
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
               SERVER-SIDE                      CLIENT-SIDE
                     │                               │
             50,000 Accounts Audit             Interactive Analysis
             Deterministic Risk Engine         Attack Lab (Web Worker)
             Synthetic Breach Checker          Hash Race (hash-wasm)
             AI Remediation Advisory           Dynamic UI / Recharts
                     │                               │
             audit_results.json                      │
                     │                               │
                     └───────────────┬───────────────┘
                                     │
                                 FRONTEND
                                     │
                       Next.js Enterprise SOC Dashboard
```

---

## Core Capabilities

1. **Deterministic 50,000-Account Enterprise Audit**:
   - Analyzes password weakness (zxcvbn entropy), synthetic breach correlation, ground-truth reuse clusters, administrative privilege weighting, and Active Directory policy violations.
   - Formula:
     $$\text{baseline\_risk} = 0.30 \times \text{weakness} + 0.25 \times \text{breach} + 0.20 \times \text{reuse} + 0.15 \times \text{privilege} + 0.10 \times \text{policy}$$
   - Precomputes index into `data/audit_results.json` for instantaneous dashboard performance.

2. **Hero Account & Blast Radius Visualization**:
   - Traces shared credentials across departments (e.g. Cluster #42 with 31 accounts across IT, Finance, Operations, including Enterprise Active Directory Admin `alex.morgan`).

3. **Client-Side Bounded Attack Lab**:
   - Executes inside dedicated browser Web Workers with strict budget caps ($\le 50,000$ candidates, $\le 30$ seconds).
   - Never sends candidate streams over the network; only reports summarized empirical metadata back to the backend.

4. **WASM Hash Race Arena**:
   - True on-device measured performance across MD5, SHA-256, bcrypt, and Argon2id using `hash-wasm`.
   - Never fabricates benchmarks; captures real empirical throughput.

5. **AI Remediation Studio**:
   - Purely advisory role; receives structured deterministic findings JSON and generates prioritized interventions, custom password filter blocklists, and FIDO2 MFA roadmaps.

---

## Quick Start & Running Locally

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment and install dependencies
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt

# Generate the 50,000 synthetic dataset and precompute audit results
python scripts/generate_dataset.py
python scripts/run_audit.py

# Run test suite
pytest -v

# Start FastAPI server on port 8000
.\venv\Scripts\uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies and build
npm install
npm run build

# Start Next.js development server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the Lexicon Enterprise SOC platform.
