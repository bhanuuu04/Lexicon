from pydantic import BaseModel
from typing import Optional

class BreachCorpusStats(BaseModel):
    source: str
    total_compromised_passwords: int
    description: str

class HIBPCheckResult(BaseModel):
    status: str
    prefix: Optional[str] = None
    message: str
    count: Optional[int] = None
