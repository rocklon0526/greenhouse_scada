import time
import requests
import sys

# Configuration
API_URL = "http://localhost:8000/api"
USERNAME = "admin"
PASSWORD = "admin123"

def login():
    print(f"Logging in as {USERNAME}...")
    try:
        response = requests.post(f"{API_URL}/token", data={"username": USERNAME, "password": PASSWORD})
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("Login successful.")
            return token
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Login error: {e}")
        sys.exit(1)

def get_status(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{API_URL}/status", headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to get status: {response.status_code}")
            return None
    except Exception as e:
        print(f"Status error: {e}")
        return None

def control_device(token, device_id, value):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"device_id": device_id, "value": value}
    print(f"Controlling {device_id} -> {value}...")
    try:
        response = requests.post(f"{API_URL}/control", json=payload, headers=headers)
        if response.status_code == 200:
            print("Control command sent.")
            return True
        else:
            print(f"Control failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Control error: {e}")
        return False

def start_process(token, process_type, params):
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Starting process: {process_type} with {params}...")
    try:
        response = requests.post(f"{API_URL}/process/{process_type}", json=params, headers=headers)
        if response.status_code == 200:
            print("Process started.")
            return True
        else:
            print(f"Process start failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Process error: {e}")
        return False

def run_test():
    token = login()
    
    # --- Test 1: Device Control (Mixer Valve) ---
    print("\n--- Test 1: Device Control (Mixer Valve) ---")
    # Open Valve
    if control_device(token, "mixer_valve", 1.0):
        time.sleep(2)
        status = get_status(token)
        valve_status = status.get("mixer", {}).get("valveOpen", False)
        if valve_status:
            print("SUCCESS: Mixer valve is OPEN.")
        else:
            print("FAILURE: Mixer valve reported CLOSED after open command.")
    
    # Close Valve
    if control_device(token, "mixer_valve", 0.0):
        time.sleep(2)
        status = get_status(token)
        valve_status = status.get("mixer", {}).get("valveOpen", False)
        if not valve_status:
            print("SUCCESS: Mixer valve is CLOSED.")
        else:
            print("FAILURE: Mixer valve reported OPEN after close command.")

    # --- Test 2: Production Process (Mixing) ---
    print("\n--- Test 2: Production Process (Mixing) ---")
    # Start Mixing Recipe A
    if start_process(token, "mix", {"recipe_id": 1, "target_volume": 5000}): # Reduced volume for faster test
        print("Waiting for mixing to start...")
        time.sleep(2)
        status = get_status(token)
        mixer_status = status.get("mixer", {}).get("status", "IDLE")
        print(f"Mixer Status: {mixer_status}")
        
        # We expect status to be FILLING or MIXING depending on logic speed
        if mixer_status in ["FILLING", "MIXING"]:
             print("SUCCESS: Mixing process started.")
        else:
             print(f"WARNING: Mixer status is {mixer_status}, expected FILLING/MIXING.")

    # --- Test 3: Sensor Data Check ---
    print("\n--- Test 3: Sensor Data Check ---")
    status = get_status(token)
    sensors = status.get("sensors", [])
    if sensors:
        s1 = sensors[0]
        print(f"Sensor 1 Avg Temp: {s1.get('avgTemp')}")
        if s1.get("avgTemp", 0) > 0:
            print("SUCCESS: Sensor data is valid.")
        else:
            print("FAILURE: Sensor data is zero.")
    else:
        print("FAILURE: No sensors found.")

if __name__ == "__main__":
    run_test()
