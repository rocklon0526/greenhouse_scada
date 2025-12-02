import asyncio
import sys
import os
from datetime import datetime

# Add project root to path
# Assuming we run from modern_scada/backend
sys.path.append(os.path.abspath('.'))
# Also add the path if running from root
sys.path.append(os.path.abspath('modern_scada/backend'))

# Mock Env Vars for Config
os.environ["SECRET_KEY"] = "test_secret"
os.environ["DB_PASSWORD"] = "test_password"

from app.services.logic_engine import LogicEngine

async def test_logic():
    engine = LogicEngine()
    
    # Mock DataService to avoid real Modbus calls
    from app.services.data_service import DataService
    DataService.send_control_command = AsyncMock()

    print("--- Test 1: Dynamic Comparison (Indoor > Outdoor + 2) ---")
    rule_dynamic = {
        "id": "rule_dyn",
        "enabled": True,
        "condition": {
            "tag": "indoor_temp",
            "operator": ">",
            "compareTo": "ref",
            "value": "outdoor_temp", # Ref tag
            "offset": 2.0
        },
        "actions": [{"device_id": "fan_1", "value": 1.0}]
    }
    engine.rules = [rule_dynamic]
    
    # Set Outdoor Temp
    await engine.evaluate("outdoor_temp", 25.0)
    
    # Case A: Indoor = 26.0 (26 < 25+2) -> Should NOT start
    print(f"Case A: Indoor=26.0, Outdoor=25.0 (Target=27.0)")
    await engine.evaluate("indoor_temp", 26.0)
    assert not engine.rule_states.get("rule_dyn", {}).get("active", False), "Rule should NOT be active"
    print("PASS: Rule inactive")

    # Case B: Indoor = 27.5 (27.5 > 25+2) -> Should START
    print(f"Case B: Indoor=27.5, Outdoor=25.0 (Target=27.0)")
    await engine.evaluate("indoor_temp", 27.5)
    assert engine.rule_states.get("rule_dyn", {}).get("active", False), "Rule SHOULD be active"
    print("PASS: Rule active")

    print("\n--- Test 2: Time Schedule ---")
    rule_schedule = {
        "id": "rule_sched",
        "enabled": True,
        "condition": {
            "tag": "indoor_temp",
            "operator": ">",
            "value": 30.0 # Default High
        },
        "schedules": [
            {"start": "00:00", "end": "23:59", "threshold": 20.0} # All day low threshold for testing
        ],
        "actions": [{"device_id": "fan_1", "value": 1.0}]
    }
    engine.rules = [rule_schedule]
    
    # Case A: Temp = 25.0. Default (30) would fail, but Schedule (20) should pass.
    print(f"Case A: Temp=25.0, Default=30.0, Schedule=20.0")
    await engine.evaluate("indoor_temp", 25.0)
    assert engine.rule_states.get("rule_sched", {}).get("active", False), "Rule SHOULD be active due to schedule"
    print("PASS: Rule active (Schedule applied)")

    print("\n--- Test 3: Global Schedule ---")
    # Rule using Global Reference
    rule_global = {
        "id": "rule_glob",
        "enabled": True,
        "condition": {
            "tag": "indoor_temp",
            "operator": ">",
            "global_ref": "temp_threshold", # Uses global setting
            "value": 0 # Fallback
        },
        "actions": [{"device_id": "fan_1", "value": 1.0}]
    }
    
    engine.rules = [rule_global]
    engine.global_settings = {
        "temp_threshold": 28.0,
        "schedules": [
            {"start": "00:00", "end": "23:59", "tempThreshold": 30.0} # Override to 30
        ]
    }
    
    # Case A: Temp = 29.0. 
    # Default (28) -> Active. 
    # Schedule (30) -> Inactive.
    print(f"Case A: Temp=29.0, Default=28.0, Schedule=30.0")
    await engine.evaluate("indoor_temp", 29.0)
    assert not engine.rule_states.get("rule_glob", {}).get("active", False), "Rule should be INACTIVE due to schedule override (29 < 30)"
    print("PASS: Rule inactive (Schedule override worked)")

    # Case B: Temp = 31.0.
    # Schedule (30) -> Active.
    print(f"Case B: Temp=31.0, Default=28.0, Schedule=30.0")
    await engine.evaluate("indoor_temp", 31.0)
    assert engine.rule_states.get("rule_glob", {}).get("active", False), "Rule should be ACTIVE (31 > 30)"
    print("PASS: Rule active")

class AsyncMock:
    async def __call__(self, *args, **kwargs):
        print(f"MOCK CALL: {args}")

if __name__ == "__main__":
    asyncio.run(test_logic())
