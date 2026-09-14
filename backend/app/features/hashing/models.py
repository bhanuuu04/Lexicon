from pydantic import BaseModel

class HashResult(BaseModel):
    hash_ntlm: str = ""
    hash_md5: str = ""
    hash_sha256: str
    hash_bcrypt: str
    hash_argon2id: str

class HashVerificationRequest(BaseModel):
    password: str
    algorithm: str
    hash_value: str

class HashPasswordResponse(BaseModel):
    algorithm: str
    hash: str
    time_taken_ms: float

