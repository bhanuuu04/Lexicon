from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class SingleBreachCheckRequest(BaseModel):
    password: str = Field(..., min_length=1, description="Plaintext password to check against breach corpus")
    check_hibp: bool = Field(default=False, description="Whether to also perform live HIBP k-anonymity query")

class SingleBreachCheckResponse(BaseModel):
    password_sha1_prefix: str
    is_breached: bool
    breach_source: Optional[str] = None
    prevalence_count: int = 0
    hibp_checked: bool = False
    hibp_found: bool = False
    hibp_count: int = 0
    severity: str = "low"  # critical, high, medium, low
    recommendation: str

class BatchBreachCheckRequest(BaseModel):
    passwords: List[str] = Field(..., max_length=500, description="List of passwords to batch-check")
    check_hibp: bool = Field(default=False, description="Whether to query live HIBP for uncached items")

class BatchBreachCheckItemResult(BaseModel):
    password: str
    is_breached: bool
    breach_source: Optional[str] = None
    prevalence: int = 0
    severity: str

class BatchBreachCheckResponse(BaseModel):
    total_checked: int
    breached_count: int
    clean_count: int
    processing_time_ms: float
    results: List[BatchBreachCheckItemResult]

class BreachCorpusStats(BaseModel):
    source: str
    total_compromised_passwords: int
    total_sha1_entries: int
    categories: Dict[str, int]
    last_updated: str
    description: str

class HIBPCheckResult(BaseModel):
    status: str
    prefix: Optional[str] = None
    message: str
    count: Optional[int] = None
    suffixes: Optional[Dict[str, int]] = None

class CustomBreachImportRequest(BaseModel):
    passwords: List[str] = Field(..., min_length=1, max_length=10000, description="List of compromised passwords to import")
    source_label: str = Field(default="Custom Enterprise Breach Dump", description="Origin/source label for imported entries")

class CustomBreachImportResponse(BaseModel):
    imported_count: int
    total_corpus_size: int
    message: str
