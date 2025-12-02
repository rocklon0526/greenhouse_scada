import logging
from datetime import datetime
from app.config import settings
from app.services.data_service import DataService

logger = logging.getLogger(__name__)

class EventProcessor:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventProcessor, cls).__new__(cls)
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        self.tag_values = {}  # {tag_name: value}
        self.active_alarms = {}  # {tag_name: {alarm_type: alarm_id}}
        self.subscribers = [] # WebSocket connections
        self.data_buffer = [] # Store and Forward Buffer

    async def process_data(self, tag_name: str, value: float):
        timestamp = datetime.utcnow()
        
        # 1. Check for change
        last_value = self.tag_values.get(tag_name)
        if last_value != value:
            self.tag_values[tag_name] = value
            
            # Try to save to DB (Store and Forward)
            try:
                # First, try to flush any buffered data if we think we are online
                if self.data_buffer:
                    await self.flush_buffer()
                
                await DataService.save_sensor_data(tag_name, value, timestamp)
            except Exception as e:
                logger.error(f"DB Write Failed: {e}. Buffering data.")
                self.data_buffer.append({
                    "tag_name": tag_name,
                    "value": value,
                    "timestamp": timestamp
                })

            # Notify WebSockets
            await self.broadcast({"type": "data", "tag": tag_name, "value": value, "time": timestamp.isoformat()})
        
        # 2. Check Alarms
        await self.check_alarms(tag_name, value, timestamp)

        # 3. Evaluate Logic Rules (New)
        from app.services.logic_engine import LogicEngine
        await LogicEngine().evaluate(tag_name, value)
        
        # 4. Execute Project Specific Logic Hooks
        from app.services.logic_loader import LogicLoader
        # Pass a copy of tag_values to avoid mutation issues, or pass the current update
        # For simplicity, passing the full state
        LogicLoader().execute_hooks(self.tag_values)

    async def flush_buffer(self):
        """
        Attempt to write buffered data to the database.
        """
        if not self.data_buffer:
            return

        logger.info(f"Attempting to flush {len(self.data_buffer)} buffered items...")
        
        # Copy buffer to avoid modification during iteration if new errors occur
        # (Though we are async, so single threaded, but safe practice)
        pending_items = list(self.data_buffer)
        self.data_buffer = [] # Clear buffer, re-add on failure
        
        failed_items = []
        
        for item in pending_items:
            try:
                await DataService.save_sensor_data(item["tag_name"], item["value"], item["timestamp"])
            except Exception as e:
                logger.error(f"Flush failed for item {item}: {e}")
                failed_items.append(item)
        
        if failed_items:
            # Put back failed items (preserve order if possible, or just append)
            # Here we prepend to keep order relative to new data if we want strict ordering,
            # but for simplicity, we just put them back.
            self.data_buffer = failed_items + self.data_buffer
            raise Exception("Flush incomplete") # Signal that we are still offline
        
        logger.info("Buffer flushed successfully.")

    async def check_alarms(self, tag_name: str, value: float, timestamp: datetime):
        # Find rules for this tag
        rules = [r for r in settings.app_config.alarms if r.tag_name == tag_name]
        
        for rule in rules:
            is_triggered = False
            if rule.type == "high" and value > rule.threshold:
                is_triggered = True
            elif rule.type == "low" and value < rule.threshold:
                is_triggered = True
            
            # Check state
            current_alarm_id = self.active_alarms.get(tag_name, {}).get(rule.type)
            
            if is_triggered and not current_alarm_id:
                # New Alarm
                logger.warning(f"ALARM TRIGGERED: {rule.message}")
                alarm_id = await DataService.save_alarm_event({
                    "tag_name": tag_name,
                    "alarm_type": rule.type,
                    "start_time": timestamp,
                    "start_value": value,
                    "message": rule.message
                })
                if tag_name not in self.active_alarms:
                    self.active_alarms[tag_name] = {}
                self.active_alarms[tag_name][rule.type] = alarm_id
                
                await self.broadcast({
                    "type": "alarm_start", 
                    "tag": tag_name, 
                    "msg": rule.message,
                    "value": value
                })

            elif not is_triggered and current_alarm_id:
                # Alarm Cleared
                logger.info(f"ALARM CLEARED: {rule.message}")
                await DataService.update_alarm_end(current_alarm_id, timestamp, value)
                del self.active_alarms[tag_name][rule.type]
                
                await self.broadcast({
                    "type": "alarm_end", 
                    "tag": tag_name, 
                    "msg": rule.message,
                    "value": value
                })

    async def broadcast(self, message: dict):
        # Simple loop over subscribers
        # In a real app, handle disconnects gracefully here or in the router
        for ws in self.subscribers:
            try:
                await ws.send_json(message)
            except Exception:
                # Connection might be closed, removal handled in router
                pass

    def add_subscriber(self, websocket):
        self.subscribers.append(websocket)

    def remove_subscriber(self, websocket):
        if websocket in self.subscribers:
            self.subscribers.remove(websocket)
