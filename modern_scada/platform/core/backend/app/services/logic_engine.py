import logging
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.services.data_service import DataService
from services.redis_service import RedisService

logger = logging.getLogger(__name__)

class LogicEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LogicEngine, cls).__new__(cls)
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        self.rules = []
        self.rule_states = {}  # {rule_id: {"active": bool, "last_run": timestamp, "start_time": timestamp}}
        self.global_settings = {"temp_threshold": 28.0, "hum_threshold": 80.0}
        self.tag_values = {} # Cache of latest sensor values
        
        # Redis Integration
        try:
            self.redis = RedisService()
            if self.redis.health_check():
                logger.info("LogicEngine: Redis connected.")
                self.load_states_from_redis()
            else:
                logger.warning("LogicEngine: Redis health check failed. Running in memory-only mode.")
                self.redis = None
        except Exception as e:
            logger.error(f"LogicEngine: Failed to connect to Redis: {e}. Running in memory-only mode.")
            self.redis = None
            
        self.load_rules()

    def load_states_from_redis(self):
        """Load persisted rule states from Redis."""
        if not self.redis:
            return
            
        try:
            # Assuming we store states in a Hash named "scada:logic:states"
            states = self.redis.client.hgetall("scada:logic:states")
            for rule_id, state_json in states.items():
                # Handle Redis Bytes type
                if isinstance(rule_id, bytes):
                    rule_id = rule_id.decode('utf-8')
                if isinstance(state_json, bytes):
                    state_json = state_json.decode('utf-8')

                try:
                    self.rule_states[rule_id] = json.loads(state_json)
                except json.JSONDecodeError:
                    logger.error(f"Failed to decode state for rule {rule_id}")
            logger.info(f"Loaded {len(self.rule_states)} rule states from Redis.")
        except Exception as e:
            logger.error(f"Failed to load states from Redis: {e}")

    def save_state_to_redis(self, rule_id: str, state: Dict):
        """Save a single rule state to Redis."""
        if not self.redis:
            return
            
        try:
            self.redis.client.hset("scada:logic:states", rule_id, json.dumps(state))
        except Exception as e:
            logger.error(f"Failed to save state for rule {rule_id} to Redis: {e}")

    def load_rules(self):
        try:
            with open("logic_rules.json", "r") as f:
                data = json.load(f)
                self.rules = data.get("rules", [])
                self.global_settings = data.get("globals", self.global_settings)
            logger.info(f"Loaded {len(self.rules)} logic rules.")
        except FileNotFoundError:
            logger.warning("logic_rules.json not found. Starting with empty rules.")
            self.rules = []
        except Exception as e:
            logger.error(f"Failed to load rules: {e}")

    def save_rules(self):
        try:
            with open("logic_rules.json", "w") as f:
                json.dump({"globals": self.global_settings, "rules": self.rules}, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save rules: {e}")

    async def evaluate(self, tag_name: str, value: float):
        # Update cache
        self.tag_values[tag_name] = value
        
        for rule in self.rules:
            if not rule.get("enabled", True):
                continue
                
            condition = rule.get("condition", {})
            if condition.get("tag") != tag_name:
                # Also check if this rule uses this tag as a REFERENCE
                # If so, we might need to re-evaluate even if the primary tag didn't change?
                # For simplicity, we only trigger on the primary tag for now.
                continue

            await self.process_rule(rule, value)

    async def process_rule(self, rule: Dict, value: float):
        rule_id = rule["id"]
        state = self.rule_states.get(rule_id, {"active": False, "last_run": 0, "start_time": 0})
        
        # 1. Check Start Condition
        should_start = self.check_condition(rule, value)
        
        # 2. Check Stop Condition (if active)
        should_stop = False
        if state["active"]:
            stop_logic = rule.get("stop_condition", {})
            stop_type = stop_logic.get("type", "standard")
            
            if stop_type == "standard":
                should_stop = not should_start
            elif stop_type == "hysteresis":
                trigger_val = self.get_active_threshold(rule)
                hysteresis = stop_logic.get("value", 0)
                # Assuming > condition
                if value < (trigger_val - hysteresis):
                    should_stop = True
        
        # 3. Apply Constraints (Min Run Time)
        constraints = rule.get("constraints", {})
        min_run_time = constraints.get("min_run_time", 0) * 60 # convert mins to seconds
        now = time.time()
        
        if state["active"] and should_stop:
            # Check if we CAN stop
            run_duration = now - state["start_time"]
            if run_duration < min_run_time:
                logger.info(f"Rule {rule_id} wants to stop but min_run_time ({run_duration:.1f}/{min_run_time}s) not met.")
                should_stop = False # Force keep running
 
        # 4. Execute Actions
        state_changed = False
        if should_start and not state["active"]:
            # START
            logger.info(f"Rule {rule_id} STARTED. Value: {value}")
            await self.execute_actions(rule["actions"], 1.0)
            state["active"] = True
            state["start_time"] = now
            self.rule_states[rule_id] = state
            state_changed = True
            
        elif should_stop and state["active"]:
            # STOP
            logger.info(f"Rule {rule_id} STOPPED. Value: {value}")
            await self.execute_actions(rule["actions"], 0.0)
            state["active"] = False
            self.rule_states[rule_id] = state
            state_changed = True
            
        if state_changed:
            self.save_state_to_redis(rule_id, state)

    def get_active_threshold(self, rule: Dict) -> float:
        """
        Determine the threshold value, considering time schedules.
        """
        base_threshold = self.resolve_value(rule["condition"])
        
        schedules = rule.get("schedules", [])
        if not schedules:
            return base_threshold
            
        now = datetime.now().time()
        current_time_str = now.strftime("%H:%M")
        
        for schedule in schedules:
            start = schedule.get("start", "00:00")
            end = schedule.get("end", "23:59")
            threshold = float(schedule.get("threshold", base_threshold))
            
            # Handle overnight schedules (e.g. 22:00 to 06:00)
            if start <= end:
                if start <= current_time_str <= end:
                    return threshold
            else:
                # Overnight
                if current_time_str >= start or current_time_str <= end:
                    return threshold
                    
        return base_threshold

    def check_condition(self, rule: Dict, current_value: float) -> bool:
        condition = rule.get("condition", {})
        target_value = self.get_active_threshold(rule)
        operator = condition.get("operator", ">")
        
        if operator == ">":
            return current_value > target_value
        elif operator == "<":
            return current_value < target_value
        elif operator == "=":
            return current_value == target_value
        return False

    def resolve_value(self, condition: Dict) -> float:
        """
        Resolve the comparison value. 
        Can be a static number, a global reference, or another sensor value (Ref).
        """
        # 1. Check for Global Reference
        if "global_ref" in condition and condition["global_ref"]:
            ref_key = condition["global_ref"]
            # Use scheduled value if available
            return self.get_active_global_value(ref_key)
            
        # 2. Check for Sensor Reference (compareTo='ref')
        if condition.get("compareTo") == "ref":
            ref_tag = condition.get("value") # In ref mode, 'value' holds the tag name
            offset = float(condition.get("offset", 0))
            ref_value = self.tag_values.get(ref_tag, 0.0) # Default to 0 if not found
            return ref_value + offset

        # 3. Static Value
        return float(condition.get("value", 0))

    def get_active_global_value(self, key: str) -> float:
        """
        Get global setting value, respecting time schedules.
        """
        base_value = float(self.global_settings.get(key, 0))
        schedules = self.global_settings.get("schedules", [])
        
        if not schedules:
            return base_value
            
        now = datetime.now().time()
        current_time_str = now.strftime("%H:%M")
        
        for schedule in schedules:
            start = schedule.get("start", "00:00")
            end = schedule.get("end", "23:59")
            
            # Check if time matches
            is_active = False
            if start <= end:
                if start <= current_time_str <= end:
                    is_active = True
            else:
                if current_time_str >= start or current_time_str <= end:
                    is_active = True
            
            if is_active:
                # Check if this schedule has an override for the requested key
                # Map key names to schedule fields if necessary
                # key: "temp_threshold" -> schedule field: "tempThreshold"
                # key: "hum_threshold" -> schedule field: "humThreshold"
                
                if key == "temp_threshold" and "tempThreshold" in schedule:
                    return float(schedule["tempThreshold"])
                if key == "hum_threshold" and "humThreshold" in schedule:
                    return float(schedule["humThreshold"])
                    
        return base_value

    async def execute_actions(self, actions: List[Dict], value: float):
        # Ideally, LogicEngine emits events or calls a DeviceService.
        # For now, we'll simulate or call a helper.
        
        for action in actions:
            device_id = action["device_id"]
            # If action has specific value (e.g. set speed to 50%), use it. 
            # Otherwise use the on/off value (1.0/0.0) passed in.
            cmd_value = action.get("value", value) 
            
            # If we are stopping (value=0.0), force 0.0 unless action defines a "off_value"
            if value == 0.0:
                cmd_value = 0.0
            
            logger.info(f"EXECUTE: {device_id} -> {cmd_value}")
            # We need a way to send this command. 
            # Since we are in `services`, we shouldn't import `routers`.
            # We should use `DataService` or a new `DeviceService`.
            # For this MVP, I will assume a `DataService.send_control` exists or I'll add it.
            await DataService.send_control_command(device_id, cmd_value)

