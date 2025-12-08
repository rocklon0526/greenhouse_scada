import requests
import json
import os

BASE_URL = "http://localhost:8000"
LAYOUT_FILE = "projects/greenhouse/config/layout.json"

def login():
    print("Logging in as admin...")
    try:
        resp = requests.post(f"{BASE_URL}/api/token", data={"username": "admin", "password": "admin123"})
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            print("Login successful")
            return {"Authorization": f"Bearer {token}"}
        else:
            print(f"Login failed: {resp.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def verify_persistence():
    headers = login()
    if not headers:
        return

    print("Verifying Dosing Configuration Persistence...")

    # 1. Construct payload
    print("Constructing payload...")
    payload = [
        {
            "id": i + 1,
            "name": f"Tank {i + 1}" + (" (Modified)" if i == 0 else ""),
            "capacity": 1200 if i == 0 else 1000,
            "currentLevel": 80,
            "chemicalId": f"chem_{i+1}",
            "chemicalType": "Test Chem",
            "ph": 6.0,
            "ec": 1.2
        } for i in range(6)
    ]

    # 2. Send Update
    print("Sending update to /api/config/dosing...")
    try:
        res = requests.post(f"{BASE_URL}/api/config/dosing", json=payload, headers=headers)
        res.raise_for_status()
        print("Update response:", res.json())
    except Exception as e:
        print(f"Failed to update dosing config: {e}")
        if 'res' in locals():
            print("Response text:", res.text)
        return

    # 3. Verify persistence in file
    print(f"Checking {LAYOUT_FILE}...")
    try:
        # Adjust path if running from a different directory
        # Assuming running from repo root
        if not os.path.exists(LAYOUT_FILE):
             # Try absolute path based on known structure
             base_path = "c:/greenhouse/greenhouse-scada/modern_scada"
             layout_path = os.path.join(base_path, LAYOUT_FILE)
        else:
            layout_path = LAYOUT_FILE

        with open(layout_path, "r") as f:
            saved_layout = json.load(f)
            
        hoppers = saved_layout["zones"]["nutrient"]["hoppers"]
        tank1 = hoppers[0]
        
        if tank1["capacity"] == 1200 and "Modified" in tank1["label"]:
            print("SUCCESS: Configuration persisted to layout.json")
        else:
            print("FAILURE: Configuration NOT persisted.")
            print("Saved Tank 1:", tank1)
            
    except Exception as e:
        print(f"Failed to verify layout.json: {e}")

if __name__ == "__main__":
    verify_persistence()
