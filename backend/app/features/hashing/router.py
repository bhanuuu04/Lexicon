import time
from typing import List
from fastapi import APIRouter, HTTPException
from zxcvbn import zxcvbn

from backend.app.features.hashing.service import (
    compute_all_hashes,
    verify_password,
    estimate_crack_time,
    get_algorithms_metadata,
    hash_password,
)
from backend.app.features.hashing.models import (
    HashComputeRequest,
    HashVerificationRequest,
    HashVerificationResponse,
    CrackTimeEstimateRequest,
    CrackTimeEstimateResponse,
    AlgorithmMetadata,
    HashPasswordResponse,
)

router = APIRouter(prefix="/api/hashing", tags=["hashing"])

@router.post("/compute")
def compute_hashes(req: HashComputeRequest):
    """Generate all cryptographic hash variants for a candidate password."""
    return compute_all_hashes(req.password)

@router.post("/hash", response_model=HashPasswordResponse)
def generate_single_hash(password: str, algorithm: str):
    """Generate a single hash with execution time benchmarking."""
    try:
        res = hash_password(password, algorithm)
        return HashPasswordResponse(**res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify", response_model=HashVerificationResponse)
def verify_hash_endpoint(req: HashVerificationRequest):
    """Verify password against target hash with timing measurement."""
    start = time.perf_counter()
    matched = verify_password(req.password, req.hash_value, req.algorithm)
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    return HashVerificationResponse(
        matched=matched,
        algorithm=req.algorithm,
        verification_time_ms=round(elapsed_ms, 3),
    )

@router.post("/estimate-crack-time", response_model=CrackTimeEstimateResponse)
def calculate_crack_time(req: CrackTimeEstimateRequest):
    """
    Calculate theoretical offline crack time based on password entropy
    and realistic GPU/ASIC hash rates.
    """
    entropy = req.entropy_bits
    if entropy is None and req.password:
        res = zxcvbn(req.password)
        guesses_log10 = float(res.get("guesses_log10", 1.0))
        entropy = guesses_log10 * 3.321928  # log2(10) conversion
    if entropy is None:
        entropy = 40.0

    result = estimate_crack_time(entropy, req.algorithm, req.hardware_rig)
    return CrackTimeEstimateResponse(**result)

@router.get("/algorithms", response_model=List[AlgorithmMetadata])
def get_algorithms():
    """Retrieve cryptographic algorithm comparison metadata and standards."""
    return get_algorithms_metadata()
