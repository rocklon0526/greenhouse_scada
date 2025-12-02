import asyncio
import websockets
import json
import sys
import os

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.redis_service import RedisService

async def verify_websocket():
    print("--- Starting WebSocket Verification ---")
    
    # 1. Start a listener (Client)
    uri = "ws://localhost:8000/ws/realtime"
    
    async with websockets.connect(uri) as websocket:
        print("✅ WebSocket Connected.")
        
        # 2. Simulate a backend update (Producer)
        print("  > Simulating Redis Update...")
        redis_service = RedisService(host="localhost", port=6379)
        
        test_message = {
            "param_id": "test_param",
            "value": 123.45,
            "timestamp": 1234567890
        }
        
        # Publish to a channel the backend listens to (updates:*)
        redis_service.publish_update("updates:device:test_device", test_message)
        
        # 3. Wait for message
        try:
            message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"  ✅ Received Message: {message}")
            
            data = json.loads(message)
            if data["value"] == 123.45:
                print("  ✅ Data Match Verified.")
            else:
                print("  ❌ Data Mismatch.")
                
        except asyncio.TimeoutError:
            print("  ❌ Timeout: No message received.")

if __name__ == "__main__":
    # Install websockets if needed: pip install websockets
    try:
        asyncio.run(verify_websocket())
    except Exception as e:
        print(f"❌ Error: {e}")
