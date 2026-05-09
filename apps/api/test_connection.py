"""
Throwaway DB connection test.
Run from repo root: python apps/api/test_connection.py
Delete this file once it prints SUCCESS.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv(dotenv_path="apps/api/.env")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("FAILED — missing env vars")
    print(f"  VITE_SUPABASE_URL: {'set' if SUPABASE_URL else 'MISSING'}")
    print(f"  SUPABASE_SERVICE_ROLE_KEY: {'set' if SUPABASE_SERVICE_ROLE_KEY else 'MISSING'}")
    sys.exit(1)

try:
    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    result = client.table("ideas").select("id, title, grade").limit(5).execute()
    print(f"SUCCESS — connected to Supabase")
    print(f"  ideas table: {len(result.data)} rows found")

    result2 = client.table("idea_sources").select("id, author_username").limit(5).execute()
    print(f"  idea_sources table: {len(result2.data)} rows found")

    result3 = client.table("crawl_jobs").select("id, status").limit(5).execute()
    print(f"  crawl_jobs table: {len(result3.data)} rows found")

    print("\nAll 3 tables reachable. DB connection is healthy.")
    print("Next step: run the seed file if rows are 0, then delete this script.")

except Exception as e:
    print(f"FAILED — {type(e).__name__}: {e}")
    sys.exit(1)
