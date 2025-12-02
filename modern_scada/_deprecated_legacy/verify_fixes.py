import httpx
import sys
import time

BASE_URL = "http://localhost:8000/api"

def login(username, password):
    try:
        with httpx.Client() as client:
            response = client.post(f"{BASE_URL}/token", data={"username": username, "password": password})
            if response.status_code != 200:
                print(f"Login failed: {response.text}")
                return None
            return response.json()["access_token"]
    except Exception as e:
        print(f"Login error: {e}")
        return None

def verify_tags_config(token):
    print("\nVerifying Tags Config...")
    headers = {"Authorization": f"Bearer {token}"}
    with httpx.Client() as client:
        # GET
        resp = client.get(f"{BASE_URL}/config/tags", headers=headers)
        if resp.status_code != 200:
            print(f"GET /config/tags failed: {resp.text}")
            return False
        tags = resp.json()
        print(f"Current tags: {len(tags)}")
        
        # POST
        new_tags = tags + [{"name": "test_tag", "address": 999, "type": "float", "unit": "test"}]
        resp = client.post(f"{BASE_URL}/config/tags", json=new_tags, headers=headers)
        if resp.status_code != 200:
            print(f"POST /config/tags failed: {resp.text}")
            return False
            
        # Verify update
        resp = client.get(f"{BASE_URL}/config/tags", headers=headers)
        updated_tags = resp.json()
        if len(updated_tags) != len(new_tags):
            print("Tags update verification failed")
            return False
            
        # Cleanup
        resp = client.post(f"{BASE_URL}/config/tags", json=tags, headers=headers)
        print("Tags Config Verified!")
        return True

def verify_system_status():
    print("\nVerifying System Status...")
    with httpx.Client() as client:
        resp = client.get(f"{BASE_URL}/system/status")
        if resp.status_code != 200:
            print(f"GET /system/status failed: {resp.text}")
            return False
        data = resp.json()
        print(f"Status: {data}")
        if 'cpu_usage' not in data:
            print("Missing cpu_usage")
            return False
        print("System Status Verified!")
        return True

if __name__ == "__main__":
    print("Starting Verification...")
    token = login("admin", "admin123")
    if not token:
        sys.exit(1)
        
    if not verify_tags_config(token):
        sys.exit(1)
        
    if not verify_system_status():
        sys.exit(1)
        
    print("\nALL CHECKS PASSED!")
