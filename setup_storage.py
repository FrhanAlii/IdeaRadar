"""One-time setup: creates the Supabase 'avatars' storage bucket."""
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "apps/api/.env"))

URL = os.getenv("VITE_SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
REF = os.getenv("VITE_SUPABASE_PROJECT_ID")

if not URL or not KEY:
    print("ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in apps/api/.env")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {KEY}",
    "apikey": KEY,
    "Content-Type": "application/json",
}

resp = requests.post(
    f"{URL}/storage/v1/bucket",
    headers=headers,
    json={"id": "avatars", "name": "avatars", "public": True},
)

body = resp.text
is_duplicate = resp.status_code == 409 or (resp.status_code == 400 and "Duplicate" in body)

if resp.status_code in (200, 201):
    print("[setup] 'avatars' bucket created successfully.")
elif is_duplicate:
    print("[setup] 'avatars' bucket already exists - skipping creation.")
else:
    print(f"[setup] ERROR creating bucket: {resp.status_code} {body}")
    sys.exit(1)

ref = REF or "<your-project-ref>"
SQL = f"""\
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public avatar access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
"""

print(f"""
[setup] NEXT STEP - paste the SQL below into the Supabase SQL editor and click Run:

  https://supabase.com/dashboard/project/{ref}/sql/new

{'-' * 60}
{SQL}{'-' * 60}
""")
