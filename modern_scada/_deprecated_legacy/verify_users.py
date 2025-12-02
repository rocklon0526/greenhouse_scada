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

def test_user_management():
    print("1. Logging in as admin...")
    token = login("admin", "admin123")
    if not token:
        sys.exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    with httpx.Client() as client:
        print("2. Listing users...")
        response = client.get(f"{BASE_URL}/users", headers=headers)
        if response.status_code != 200:
            print(f"Failed to list users: {response.text}")
            sys.exit(1)
        users = response.json()
        print(f"Found {len(users)} users.")
        
        print("3. Creating a new user 'testuser'...")
        new_user = {
            "username": "testuser",
            "password": "password123",
            "role": "admin"  # Project Admin
        }
        response = client.post(f"{BASE_URL}/users", json=new_user, headers=headers)
        if response.status_code != 200:
            print(f"Failed to create user: {response.text}")
            # It might already exist, try to delete it first
            for u in users:
                if u['username'] == 'testuser':
                    print("User already exists, deleting...")
                    client.delete(f"{BASE_URL}/users/{u['id']}", headers=headers)
                    # Try creating again
                    response = client.post(f"{BASE_URL}/users", json=new_user, headers=headers)
                    if response.status_code != 200:
                        print(f"Failed to create user again: {response.text}")
                        sys.exit(1)
                    break
        
        created_user = response.json()
        print(f"User created: {created_user['id']}")
        
        print("4. Updating user role...")
        update_data = {"role": "user"}  # Viewer
        response = client.put(f"{BASE_URL}/users/{created_user['id']}", json=update_data, headers=headers)
        if response.status_code != 200:
            print(f"Failed to update user: {response.text}")
            sys.exit(1)
        print("User updated.")
        
        print("5. Deleting user...")
        response = client.delete(f"{BASE_URL}/users/{created_user['id']}", headers=headers)
        if response.status_code != 200:
            print(f"Failed to delete user: {response.text}")
            sys.exit(1)
        print("User deleted.")
        
    print("User Management Verification Passed!")

if __name__ == "__main__":
    test_user_management()
