from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class HashResult(BaseModel):
    hash_ntlm: str = ""
    hash_md5: str = ""
    hash_sha256: str
    hash_bcrypt: str
    hash_argon2id: str

class HashComputeRequest(BaseModel):
    password: str = Field(..., min_length=1)

class HashVerificationRequest(BaseModel):
    password: str
    algorithm: str
    hash_value: str

class HashVerificationResponse(BaseModel):
    matched: bool
    algorithm: str
    verification_time_ms: float

class HashPasswordResponse(BaseModel):
    algorithm: str
    hash: str
    time_taken_ms: float

class CrackTimeEstimateRequest(BaseModel):
    password: Optional[str] = None
    entropy_bits: Optional[float] = None
    algorithm: str = "ntlm"
    hardware_rig: str = "8x_rtx_4090"

class CrackTimeEstimateResponse(BaseModel):
    entropy_bits: float
    total_combinations: str
    hardware_rig: str
    hash_rate_per_sec: float
    estimated_seconds: float
    human_readable: str

class AlgorithmMetadata(BaseModel):
    name: str
    category: str
    work_factor: str
    memory_cost: str
    gpu_resistance: str
    standard: str
    description: str


