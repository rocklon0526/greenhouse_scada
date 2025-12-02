import asyncio
import aiohttp
import sys
import json

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin"
            print("Login successful.")

        # 2. Check /api/system/status for DB stats
        print("\nChecking /api/system/status for DB stats...")
        async with session.get(f"{BASE_URL}/api/system/status", headers=headers) as resp:
            if resp.status != 200:
                print(f"Failed to get status: {await resp.text()}")
                return False
            status = await resp.json()
            print(f"Status: {json.dumps(status, indent=2)}")
            if "db_stats" not in status:
                print("Missing 'db_stats' in status response.")
                return False
            if "query_count" not in status["db_stats"]:
                print("Missing 'query_count' in db_stats.")
                return False

        # 3. Check /api/config/tags for connection_name
        print("\nChecking /api/config/tags...")
        async with session.get(f"{BASE_URL}/api/config/tags", headers=headers) as resp:
            if resp.status != 200:
                print(f"Failed to get tags: {await resp.text()}")
                return False
            tags = await resp.json()
            # print(f"Tags: {json.dumps(tags, indent=2)}")
            # We just need to verify the endpoint works and returns a list
            if not isinstance(tags, list):
                print("Tags response is not a list.")
                return False

        # 4. Check /api/system/buffer/retry endpoint existence
        print("\nChecking /api/system/buffer/retry...")
        # We don't want to actually retry if buffer is empty, but we can check if endpoint exists (405 or 200)
        # Actually POSTing with empty buffer should return processed: 0
        async with session.post(f"{BASE_URL}/api/system/buffer/retry", headers=headers) as resp:
            if resp.status != 200:
                print(f"Failed to retry buffer: {await resp.text()}")
                return False
            result = await resp.json()
            print(f"Retry Result: {json.dumps(result, indent=2)}")
            if "processed" not in result:
                print("Missing 'processed' in retry response.")
                return False

        print("\nVerification Successful!")
        return True

if __name__ == "__main__":
    try:
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        success = asyncio.run(verify_productization())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
