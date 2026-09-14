import time
from fastapi import APIRouter, HTTPException
from backend.app.features.breach_dictionary.service import breach_checker
from backend.app.features.breach_dictionary.models import (
    SingleBreachCheckRequest, SingleBreachCheckResponse,
    BatchBreachCheckRequest, BatchBreachCheckResponse, BatchBreachCheckItemResult,
    BreachCorpusStats, HIBPCheckResult,
    CustomBreachImportRequest, CustomBreachImportResponse
)

router = APIRouter(prefix="/api/breach", tags=["breach_dictionary"])

@router.post("/check", response_model=SingleBreachCheckResponse)
async def check_single_password(req: SingleBreachCheckRequest):
    """
    Check a single credential against the local enterprise breach dictionary
    and optionally against the live HIBP k-anonymity database.
    """
    pwd = req.password
    is_local_breach, prefix, suffix = breach_checker.check_local_k_anonymity(pwd)
    
    hibp_checked = False
    hibp_found = False
    hibp_count = 0
    
    if req.check_hibp:
        hibp_checked = True
        found, count, err = await breach_checker.check_hibp_k_anonymity(pwd)
        hibp_found = found
        hibp_count = count

    is_breached = is_local_breach or hibp_found
    source = "Enterprise Active Directory Breach Corpus" if is_local_breach else ("HaveIBeenPwned Global DB" if hibp_found else None)
    
    if is_breached:
        severity = "critical"
        rec = "Revoke credential immediately. This password is known to threat actors in public/corporate breach dumps."
    else:
        severity = "low"
        rec = "Credential is clean and does not match any known enterprise breach corpora."

    return SingleBreachCheckResponse(
        password_sha1_prefix=prefix,
        is_breached=is_breached,
        breach_source=source,
        prevalence_count=hibp_count if hibp_found else (1 if is_local_breach else 0),
        hibp_checked=hibp_checked,
        hibp_found=hibp_found,
        hibp_count=hibp_count,
        severity=severity,
        recommendation=rec
    )

@router.post("/check-bulk", response_model=BatchBreachCheckResponse)
def check_bulk_passwords(req: BatchBreachCheckRequest):
    """
    Perform high-speed batch lookup of up to 500 passwords against the in-memory breach corpus.
    """
    t0 = time.perf_counter()
    raw_results = breach_checker.check_bulk(req.passwords)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    items = [
        BatchBreachCheckItemResult(
            password=r["password"],
            is_breached=r["is_breached"],
            breach_source=r["breach_source"],
            prevalence=r["prevalence"],
            severity=r["severity"]
        )
        for r in raw_results
    ]
    
    breached_c = sum(1 for r in raw_results if r["is_breached"])
    clean_c = len(raw_results) - breached_c

    return BatchBreachCheckResponse(
        total_checked=len(req.passwords),
        breached_count=breached_c,
        clean_count=clean_c,
        processing_time_ms=round(elapsed_ms, 2),
        results=items
    )

@router.get("/stats", response_model=BreachCorpusStats)
def get_breach_corpus_stats():
    """Return active breach corpus metadata, total hashes, and category breakdowns."""
    stats = breach_checker.get_corpus_stats()
    return BreachCorpusStats(**stats)

@router.get("/hibp-range/{prefix}")
async def proxy_hibp_range(prefix: str):
    """
    Query live HIBP k-anonymity SHA-1 prefix endpoint with local caching.
    Ensures complete client privacy (zero plaintext passwords or full hashes sent).
    """
    return await breach_checker.get_hibp_range_suffixes(prefix)

@router.post("/import", response_model=CustomBreachImportResponse)
def import_custom_breaches(req: CustomBreachImportRequest):
    """
    Admin-only: Ingest new compromised passwords into the live in-memory breach dictionary.
    """
    imported = breach_checker.import_custom_passwords(req.passwords, source_label=req.source_label)
    stats = breach_checker.get_corpus_stats()
    
    return CustomBreachImportResponse(
        imported_count=imported,
        total_corpus_size=stats["total_compromised_passwords"],
        message=f"Successfully imported {imported} unique credentials into active breach corpus."
    )
