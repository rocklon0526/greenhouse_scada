import time
import math
import random
import sys
import os
from typing import Dict, Any, List, Optional

# Add parent directory to path to allow imports if running standalone
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from domain_models import Equipment, ParameterConfig, AlarmRule, AlarmType, ActiveAlarmState, AlarmStatus
from services.redis_service import RedisService

class LogicEngine:
    def __init__(self, redis_service: Optional[RedisService] = None):
        # State storage
        self.last_logged_values: Dict[str, float] = {} # Key: param_id
        self.alarm_start_times: Dict[str, float] = {} # Key: rule_id (for On-Delay)
        self.active_alarms: Dict[str, ActiveAlarmState] = {} # Key: rule_id
        
        # Redis Integration
        self.redis = redis_service

    def check_deadband(self, equipment_id: str, param_id: str, current_val: float, deadband: float) -> bool:
        """
        Returns True if value should be updated (exceeds deadband vs last logged).
        Updates last_logged_values and writes to Redis if True.
        """
        # Unique key for storage needs to include equipment_id to avoid collisions if multiple devices share param names
        # But for this simple engine, we assume param_id is unique enough or handled by caller context
        # Let's use a composite key for internal state
        state_key = f"{equipment_id}:{param_id}"
        
        last_val = self.last_logged_values.get(state_key)
        should_update = False
        
        if last_val is None:
            should_update = True
        else:
            delta = abs(current_val - last_val)
            if delta > deadband:
                should_update = True
        
        if should_update:
            self.last_logged_values[state_key] = current_val
            
            # Write to Redis if available
            if self.redis:
                value_data = {
                    "value": current_val,
                    "timestamp": time.time(),
                    "quality": "Good"
                }
                self.redis.set_parameter(equipment_id, param_id, value_data)
                
        return should_update

    def check_alarms(self, equipment_id: str, param_id: str, current_val: float, rules: List[AlarmRule]) -> List[ActiveAlarmState]:
        """
        Evaluates alarm rules for a parameter.
        Handles On-Delay and Hysteresis.
        Updates Redis with active alarms.
        """
        current_time = time.time()
        triggered_events = []

        for rule in rules:
            if not rule.enabled:
                continue

            # 1. Check Trigger Condition
            is_triggered = False
            if rule.type == AlarmType.HIHI or rule.type == AlarmType.HI:
                is_triggered = current_val > rule.setpoint
            elif rule.type == AlarmType.LOLO or rule.type == AlarmType.LO:
                is_triggered = current_val < rule.setpoint
            
            # 2. Handle On-Delay
            if is_triggered:
                if rule.id not in self.alarm_start_times:
                    self.alarm_start_times[rule.id] = current_time
                
                duration = current_time - self.alarm_start_times[rule.id]
                
                if duration >= rule.on_delay_seconds:
                    # Condition met for long enough -> Raise Alarm
                    if rule.id not in self.active_alarms:
                        new_alarm = ActiveAlarmState(
                            ruleId=rule.id,
                            triggerTime=current_time,
                            valueAtTrigger=current_val,
                            status=AlarmStatus.ACTIVE_UNACKED
                        )
                        self.active_alarms[rule.id] = new_alarm
                        triggered_events.append(new_alarm)
                        
                        # Sync to Redis
                        if self.redis:
                            # Convert Pydantic model to dict (using alias)
                            self.redis.set_active_alarms(rule.id, new_alarm.model_dump(by_alias=True))
                            
            else:
                # Condition NOT met (or cleared)
                
                # Check Hysteresis for Clearing
                should_clear = False
                hysteresis = rule.hysteresis or 0.0
                
                if rule.id in self.active_alarms:
                    # It was active, check if it clears based on hysteresis
                    if rule.type in [AlarmType.HI, AlarmType.HIHI]:
                        if current_val < (rule.setpoint - hysteresis):
                            should_clear = True
                    elif rule.type in [AlarmType.LO, AlarmType.LOLO]:
                        if current_val > (rule.setpoint + hysteresis):
                            should_clear = True
                    else:
                        should_clear = True
                        
                    if should_clear:
                        # Clear the alarm
                        alarm = self.active_alarms.pop(rule.id)
                        alarm.clear_time = current_time
                        alarm.status = AlarmStatus.CLEARED_UNACKED
                        
                        # Sync to Redis (Remove from active list)
                        if self.redis:
                            self.redis.clear_active_alarm(rule.id)
                        
                # Reset Timer if condition is not met
                if rule.id in self.alarm_start_times:
                     del self.alarm_start_times[rule.id]

        return triggered_events
