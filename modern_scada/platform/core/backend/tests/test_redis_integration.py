import time
import json
import sys
import os
import redis

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from logic.logic_engine import LogicEngine
from services.redis_service import RedisService
from domain_models import AlarmRule, AlarmType

def run_integration_test():
    print("--- Starting Redis Integration Test ---")
    
    # 1. Connect to Redis (Ensure docker-compose up is running or use local redis)
    # NOTE: This test assumes Redis is running on localhost:6379
    try:
        redis_service = RedisService(host="localhost", port=6379)
        if not redis_service.health_check():
            print("❌ Redis Connection Failed. Is Redis running?")
            return
        print("✅ Redis Connected.")
    except Exception as e:
        print(f"❌ Redis Error: {e}")
        return

    # 2. Initialize Engine
    engine = LogicEngine(redis_service)
    
    # 3. Test Parameter Write (Deadband)
    print("\n[Test 1] Parameter Write with Deadband")
    equip_id = "test_fan"
    param_id = "speed"
    
    # Initial Write
    val1 = 100.0
    engine.check_deadband(equip_id, param_id, val1, 0.5)
    print(f"  > Wrote {val1}")
    
    # Verify in Redis
    stored_data = redis_service.get_parameter(equip_id, param_id)
    if stored_data and stored_data['value'] == val1:
        print(f"  ✅ Redis Read Verified: {stored_data['value']}")
    else:
        print(f"  ❌ Redis Read Failed: Got {stored_data}")

    # Small change (Noise) - Should NOT update Redis
    val2 = 100.2
    updated = engine.check_deadband(equip_id, param_id, val2, 0.5)
    if not updated:
        print(f"  ✅ Noise Ignored ({val2})")
    else:
        print(f"  ❌ Noise NOT Ignored!")
        
    # Check Redis again - should still be val1
    stored_data = redis_service.get_parameter(equip_id, param_id)
    if stored_data['value'] == val1:
         print(f"  ✅ Redis Value Unchanged (Correct)")
    else:
         print(f"  ❌ Redis Value Changed to {stored_data['value']} (Incorrect)")

    # 4. Test Alarm Write
    print("\n[Test 2] Active Alarm Write")
    rule = AlarmRule(
        id="test_alarm",
        type=AlarmType.HI,
        setpoint=50.0,
        severity="Critical",
        onDelaySeconds=0,
        message="Test Alarm"
    )
    
    # Trigger Alarm
    engine.check_alarms(equip_id, param_id, 60.0, [rule])
    print(f"  > Triggered Alarm (Val: 60.0)")
    
    # Verify in Redis
    active_alarms = redis_service.get_all_active_alarms()
    if "test_alarm" in active_alarms:
        print(f"  ✅ Alarm Found in Redis: {active_alarms['test_alarm']['status']}")
    else:
        print(f"  ❌ Alarm NOT Found in Redis")

    # Clear Alarm
    engine.check_alarms(equip_id, param_id, 40.0, [rule])
    print(f"  > Cleared Alarm (Val: 40.0)")
    
    # Verify Removed from Redis
    active_alarms = redis_service.get_all_active_alarms()
    if "test_alarm" not in active_alarms:
        print(f"  ✅ Alarm Removed from Redis")
    else:
        print(f"  ❌ Alarm Still in Redis")

if __name__ == "__main__":
    run_integration_test()
