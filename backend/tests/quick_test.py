import asyncio
import httpx
import os
import sys

# Ensure current dir is in sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.app.main import app

async def test():
    print("Initializing transport...", flush=True)
    transport = httpx.ASGITransport(app=app)
    print("Created transport, opening client...", flush=True)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("Sending GET /api/health...", flush=True)
        resp = await client.get("/api/health")
        print(f"Status: {resp.status_code}, Body: {resp.json()}", flush=True)

if __name__ == "__main__":
    asyncio.run(test())
