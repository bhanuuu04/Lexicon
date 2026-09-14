from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import CORS_ORIGINS
from backend.app.features.dataset_api.router import router as dataset_router
from backend.app.features.attack_lab.router import router as attack_router
from backend.app.features.remediation.router import router as remediation_router

app = FastAPI(
    title="Lexicon — Enterprise Password Risk Intelligence API",
    description="Deterministic enterprise credential risk analysis, bounded attack telemetry, and remediation API.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register Feature Routers
app.include_router(dataset_router)
app.include_router(attack_router)
app.include_router(remediation_router)

@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "Lexicon Enterprise Risk API"}

@app.get("/", tags=["system"])
def root():
    return {
        "platform": "Lexicon",
        "description": "Enterprise Password Risk Intelligence Platform",
        "features": {
            "hashing": "backend/app/features/hashing",
            "breach_dictionary": "backend/app/features/breach_dictionary",
            "risk_engine": "backend/app/features/risk_engine",
            "dataset_generator": "backend/app/features/dataset_generator",
            "audit": "backend/app/features/audit",
            "attack_lab": "backend/app/features/attack_lab",
            "remediation": "backend/app/features/remediation",
            "dataset_api": "backend/app/features/dataset_api"
        },
        "endpoints": {
            "health": "/health",
            "summary": "/api/dataset/summary",
            "accounts": "/api/dataset/accounts",
            "hero_account": "/api/dataset/hero-account",
            "attack_result": "/api/attack/result",
            "remediation_report": "/api/remediation/report"
        }
    }
