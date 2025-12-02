import time
import math
import random
from typing import Dict, Any, List
from datetime import datetime
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from domain_models import Equipment, ParameterConfig, AlarmRule, AlarmType, ActiveAlarmState, AlarmStatus

# --- Logic Engine Class ---

class LogicEngine:
    def __init__(self):
        # State storage
        self.last_logged_values: Dict[str, float] = {} # Key: param_id
        self.alarm_start_times: Dict[str, float] = {} # Key: rule_id (for On-Delay)
        self.active_alarms: Dict[str, ActiveAlarmState] = {} # Key: rule_id

    def check_deadband(self, param_id: str, current_val: float, deadband: float) -> bool:
        """
        Returns True if value should be updated (exceeds deadband vs last logged).
        Updates last_logged_values if True.
        """
        last_val = self.last_logged_values.get(param_id)
        
        if last_val is None:
            self.last_logged_values[param_id] = current_val
            return True
        
        delta = abs(current_val - last_val)
        if delta > deadband:
            self.last_logged_values[param_id] = current_val
            return True
            
        return False

    def check_alarms(self, param_id: str, current_val: float, rules: List[AlarmRule]) -> List[ActiveAlarmState]:
        """
        Evaluates alarm rules for a parameter.
        Handles On-Delay and Hysteresis.
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
                    # print(f"  [Timer Start] Rule {rule.id} condition met.")
                
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
                        print(f"  🚨 [ALARM RAISED] {rule.message} (Val: {current_val:.2f})")
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
                        print(f"  ✅ [ALARM CLEARED] {rule.message} (Val: {current_val:.2f})")
                        
                # Reset Timer if condition is not met (regardless of hysteresis for clearing active alarms, 
                # the timer for *new* alarms should reset if condition is momentarily lost)
                # NOTE: This is a design choice. Usually if condition dips, timer resets.
                if rule.id in self.alarm_start_times:
                     del self.alarm_start_times[rule.id]

        return triggered_events

# --- Simulation Setup ---

def run_simulation():
    print("--- Starting Mock Driver & Logic Engine Simulation ---")

    # 1. Define Equipment (Ventilation Fan)
    fan_config = {
        "id": "fan_01",
        "name": "Exhaust Fan 01",
        "typeId": "var_speed_fan",
        "zoneId": "zone_a",
        "parameters": {
            "vibration": {
                "id": "vibration",
                "name": "Vibration",
                "dataType": "number",
                "deadband": 0.5, # Significant change only
                "unit": "mm/s"
            }
        },
        "alarms": {
            "vibration": [
                {
                    "id": "alm_vib_hi",
                    "type": "Hi",
                    "setpoint": 5.0,
                    "severity": "Critical",
                    "onDelaySeconds": 3, # 3 seconds delay
                    "hysteresis": 1.0,   # Must drop to 4.0 to clear
                    "message": "High Vibration Alert"
                }
            ]
        }
    }

    # 2. Validate with Pydantic
    try:
        fan = Equipment(**fan_config)
        print("✅ Configuration Loaded & Validated successfully.")
    except Exception as e:
        print(f"❌ Configuration Error: {e}")
        return

    engine = LogicEngine()
    
    # 3. Simulate Data Loop (Sine Wave to simulate vibration)
    # We want to go from 0 -> 6 -> 3 -> 6 -> 0 to test Trigger, Delay, Hysteresis
    
    print("\n--- Simulation Start (Time step: 1s) ---")
    print(f"Config: Deadband=0.5, Setpoint=5.0, Delay=3s, Hysteresis=1.0 (Clear at 4.0)")
    
    # Simulated values over time (seconds)
    # 0-2s: Normal
    # 3-6s: High (>5) but transient or just starting
    # 7-10s: Sustained High -> Alarm should trigger
    # 11-13s: Dipping to 4.5 (Still > 4.0, should NOT clear due to hysteresis)
    # 14s: Drop to 3.0 (Clears)
    
    simulated_values = [
        2.0, 2.2, 2.1,       # Normal
        5.2, 5.5, 5.1,       # High (Transient/Start)
        5.8, 6.0, 6.2, 6.1,  # Sustained High -> Alarm!
        4.5, 4.2, 4.8,       # Dipping (Hysteresis check) -> Alarm stays?
        3.5, 2.0, 1.0        # Cleared
    ]

    for i, val in enumerate(simulated_values):
        print(f"\n[T={i}s] Raw Value: {val:.2f}")
        
        # A. Deadband Check
        if engine.check_deadband("vibration", val, fan.parameters["vibration"].deadband):
            print(f"  💾 [DB] Value Logged: {val:.2f} (Changed > 0.5)")
        else:
            print(f"  zzz [DB] Ignored (Noise)")

        # B. Alarm Check
        engine.check_alarms("vibration", val, fan.alarms["vibration"])
        
        time.sleep(0.5) # Fast forward

if __name__ == "__main__":
    run_simulation()
