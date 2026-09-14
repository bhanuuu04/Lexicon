import sys
import argparse
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.dataset_generator import generate_and_save_dataset
from backend.app.supabase_client import supabase_service

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic Active Directory accounts and replace Supabase DB data.")
    parser.add_argument("--count", type=int, default=50000, help="Number of accounts to generate (default: 50,000)")
    parser.add_argument("--org-name", type=str, default="Lexicon Enterprise Systems", help="Enterprise organization name")
    parser.add_argument("--org-id", type=str, default="lexicon-corp", help="Enterprise ID")
    parser.add_argument("--domain", type=str, default="lexicon.corp", help="Active Directory domain")
    parser.add_argument("--archetype", type=str, default="Fortune 500 Enterprise", help="Enterprise archetype")
    parser.add_argument("--skip-supabase", action="store_true", help="Skip replacing Supabase database")
    args = parser.parse_args()

    accounts, breach_corpus, metadata, audit_summary = generate_and_save_dataset(total_accounts=args.count)

    if not args.skip_supabase:
        print(f"[Supabase] Replacing all data in Supabase PostgreSQL database for '{args.org_name}'...")
        res = supabase_service.replace_all_data(
            accounts=accounts,
            metadata=metadata,
            audit_summary=audit_summary,
            enterprise_id=args.org_id,
            enterprise_name=args.org_name,
            domain=args.domain,
            archetype=args.archetype
        )
        print(f"[Supabase] Result: {res}")
