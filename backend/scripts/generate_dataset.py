import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.dataset_generator import generate_and_save_dataset

if __name__ == "__main__":
    generate_and_save_dataset()
