import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.audit_engine import run_bulk_audit

if __name__ == "__main__":
    run_bulk_audit()
