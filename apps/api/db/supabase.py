import os
from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in apps/api/.env")
        _client = create_client(url, key)
    return _client
