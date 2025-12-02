import asyncio
import sys
import os
import time

# Add backend to path
sys.path.append(os.path.abspath("."))

from services.redis_service import RedisService
from logic.logic_engine import LogicEngine
from domain_models import AlarmRule, AlarmType, Severity

async def verify_alarms():
    print("🚀 Starting Alarm Verification...")
    
    # 1. Setup
    redis = RedisService()
    engine = LogicEngine(redis)
    
    # 2. Define Rule (Simulating config.yaml)
    rule = AlarmRule(
        id="rule_mixer_ph_high",
        tag_name="mixer_ph",
        type=AlarmType.HI,
        setpoint=8.0,
        severity=Severity.CRITICAL,
        message="Mixer pH High!",
        enabled=True,
        on_delay_seconds=0
    )
    
    # 3. Trigger Alarm (Value 9.0 > 8.0)
    print("🔥 Triggering Alarm for mixer_ph = 9.0...")
    engine.check_alarms("mixer_01", "ph", 9.0, [rule])
    
    # 4. Verify Redis
    print("🔍 Checking Redis for Active Alarms...")
    active_alarms = redis.get_all_active_alarms()
    
    if "rule_mixer_ph_high" in active_alarms:
        alarm = active_alarms["rule_mixer_ph_high"]
        print(f"✅ Alarm Found in Redis: {alarm['status']}")
        
        if alarm['status'] == 'ACTIVE_UNACKED':
            print("✅ Status is ACTIVE_UNACKED")
        else:
            print(f"❌ Unexpected Status: {alarm['status']}")
            sys.exit(1)
    else:
        print("❌ Alarm NOT found in Redis!")
        print(f"Active Alarms: {active_alarms}")
        sys.exit(1)

    print("🎉 Verification Successful!")

if __name__ == "__main__":
    asyncio.run(verify_alarms())
