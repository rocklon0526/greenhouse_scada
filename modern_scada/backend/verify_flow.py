import asyncio
import httpx
import sys

# Simple script to verify the flow against a RUNNING server
# Usage: python verify_flow.py

BASE_URL = "http://localhost:8000"

async def main():
    print(">>> Starting Verification Flow")
    
    async with httpx.AsyncClient() as client:
        # 1. Check Health
        try:
            r = await client.get(f"{BASE_URL}/")
            print(f"[1] Health Check: {r.status_code} {r.json()}")
        except Exception as e:
            print(f"[!] Server not running? {e}")
            return

        # 2. Login
        print("[2] Attempting Login...")
        r = await client.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin123"})
        if r.status_code != 200:
            print(f"[!] Login Failed: {r.text}")
            return
        
        token = r.json()["access_token"]
        print(f"    Login Success. Token: {token[:10]}...")
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Get Data
        print("[3] Fetching Latest Data...")
        r = await client.get(f"{BASE_URL}/api/latest", headers=headers)
        if r.status_code == 200:
            data = r.json()
            print(f"    Got {len(data)} tags.")
            if data:
                print(f"    Sample: {data[0]}")
        else:
            print(f"[!] Fetch Failed: {r.text}")

        # 4. Check Alarms
        print("[4] Checking Active Alarms...")
        r = await client.get(f"{BASE_URL}/api/alarms/active", headers=headers)
        if r.status_code == 200:
            alarms = r.json()
            print(f"    Active Alarms: {len(alarms)}")
        else:
            print(f"[!] Alarm Check Failed: {r.text}")

    print(">>> Verification Complete")

if __name__ == "__main__":
    asyncio.run(main())
