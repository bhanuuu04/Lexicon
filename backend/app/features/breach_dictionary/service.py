import json
import hashlib
from typing import Set, Tuple, Optional
import httpx
from backend.app.config import BREACH_CORPUS_FILE

class BreachChecker:
    """Synthetic breach corpus checker with optional live HIBP k-anonymity lookup."""

    def __init__(self, corpus_path=BREACH_CORPUS_FILE):
        self.corpus_path = corpus_path
        self._synthetic_breach_set: Set[str] = set()
        self._loaded = False

    def load_corpus(self) -> None:
        """Load synthetic breach corpus into memory."""
        if self.corpus_path.exists():
            try:
                with open(self.corpus_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self._synthetic_breach_set = set(data)
                    elif isinstance(data, dict) and "passwords" in data:
                        self._synthetic_breach_set = set(data["passwords"])
            except Exception as e:
                print(f"[BreachChecker] Warning: Failed to load breach corpus: {e}")
                self._synthetic_breach_set = set()
        else:
            self._synthetic_breach_set = set()
        self._loaded = True

    def is_breached(self, password: str) -> bool:
        """Check if password exists in the synthetic breach corpus."""
        if not self._loaded:
            self.load_corpus()
        return password in self._synthetic_breach_set

    def get_corpus_stats(self) -> dict:
        """Return metadata about the synthetic breach corpus."""
        if not self._loaded:
            self.load_corpus()
        return {
            "source": "Synthetic Compromised Password Corpus",
            "total_compromised_passwords": len(self._synthetic_breach_set),
            "description": "Deterministic synthetic password dictionary simulating known enterprise breach dumps (RockYou/AD breaches)."
        }

    async def check_hibp_k_anonymity(self, password: str) -> Tuple[bool, int, Optional[str]]:
        """
        Live HIBP k-anonymity single password check.
        Never transmits plaintext or full SHA-1 hash.
        Sends only the first 5 hex characters of SHA-1 to api.pwnedpasswords.com/range/{prefix}.
        """
        sha1_hash = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]

        url = f"https://api.pwnedpasswords.com/range/{prefix}"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                headers = {"User-Agent": "Lexicon-Password-Risk-Platform-Demo"}
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    return False, 0, f"HIBP API returned status {response.status_code}"

                lines = response.text.splitlines()
                for line in lines:
                    parts = line.split(":")
                    if len(parts) == 2:
                        ret_suffix, count_str = parts[0].strip(), parts[1].strip()
                        if ret_suffix == suffix:
                            return True, int(count_str), None
                return False, 0, None
        except Exception as e:
            return False, 0, f"HIBP check error: {str(e)}"

# Global singleton
breach_checker = BreachChecker()
