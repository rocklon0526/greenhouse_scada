import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000/api"

def verify():
    # 1. Login
    print("Logging in...")
    data = urllib.parse.urlencode({"username": "admin", "password": "admin123"}).encode()
    req = urllib.request.Request(f"{BASE_URL}/token", data=data, method="POST")
    
    try:
        with urllib.request.urlopen(req) as response:
            resp_data = json.loads(response.read().decode())
            token = resp_data["access_token"]
            print("Login successful.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # 2. Get Status
    print("Fetching status...")
    req = urllib.request.Request(f"{BASE_URL}/status")
    req.add_header("Authorization", f"Bearer {token}")
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            sensors = data.get("sensors", [])
            print(f"Found {len(sensors)} sensors.")
            
            non_zero_count = 0
            for s in sensors:
                avg_temp = s.get("avgTemp")
                print(f"Sensor {s['id']} Avg Temp: {avg_temp}")
                if avg_temp is not None and avg_temp > 0:
                    non_zero_count += 1
                    
            if non_zero_count > 0:
                print("SUCCESS: Found sensor averages.")
            else:
                print("FAILURE: Sensor averages missing or zero.")
    except Exception as e:
        print(f"Status fetch failed: {e}")

if __name__ == "__main__":
    verify()
