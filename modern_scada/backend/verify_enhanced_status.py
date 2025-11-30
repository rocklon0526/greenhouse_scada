import asyncio
import aiohttp
import sys
import json

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "admin123"

async def verify_enhanced_status():
    async with aiohttp.ClientSession() as session:
        # 1. Login
        print(f"Logging in as {USERNAME}...")
        async with session.post(f"{BASE_URL}/api/token", data={"username": USERNAME, "password": PASSWORD}) as resp:
            if resp.status != 200:
                print(f"Login failed: {await resp.text()}")
                return False
            data = await resp.json()
            token = data["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("Login successful.")

        # 2. Check /api/system/status structure
        print("\nChecking /api/system/status...")
        async with session.get(f"{BASE_URL}/api/system/status", headers=headers) as resp:
            if resp.status != 200:
                print(f"Failed to get status: {await resp.text()}")
                return False
            status = await resp.json()
            print(f"Status: {json.dumps(status, indent=2)}")
            if "active_users" not in status or "store_forward_count" not in status:
                print("Missing fields in status response.")
                return False

        # 3. Check /api/system/users
        print("\nChecking /api/system/users...")
        async with session.get(f"{BASE_URL}/api/system/users", headers=headers) as resp:
            if resp.status != 200:
                print(f"Failed to get users: {await resp.text()}")
                return False
            users = await resp.json()
            print(f"Active Users: {json.dumps(users, indent=2)}")
            if not isinstance(users, list):
                print("Users response is not a list.")
                return False

        # 4. Check /api/system/buffer
        print("\nChecking /api/system/buffer...")
        async with session.get(f"{BASE_URL}/api/system/buffer", headers=headers) as resp:
            if resp.status != 200:
                print(f"Failed to get buffer: {await resp.text()}")
                return False
            buffer = await resp.json()
            print(f"Buffer Status: {json.dumps(buffer, indent=2)}")
            if "count" not in buffer or "items" not in buffer:
                print("Missing fields in buffer response.")
                return False

        print("\nVerification Successful!")
        return True

if __name__ == "__main__":
    try:
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        success = asyncio.run(verify_enhanced_status())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
