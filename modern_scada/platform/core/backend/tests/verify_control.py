import requests
import time
import json

CONTROL_URL = "http://localhost:8000/api/control/write"

def test_control():
    print("--- Starting Control Verification ---")
    
    # Test Data
    payload = {
        "device_id": "test_fan",
        "tag_id": "speed",
        "value": 1500
    }
    
    try:
        print(f"  > Sending Command: {payload}")
        response = requests.post(CONTROL_URL, json=payload)
        
        if response.status_code == 200:
            print("  ✅ Command Sent Successfully")
            print(f"  Response: {response.json()}")
        else:
            print(f"  ❌ Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"  ❌ Exception: {e}")

if __name__ == "__main__":
    test_control()
