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

    async def process_data(self, tag_name: str, value: float):
        timestamp = datetime.utcnow()
        
        # 1. Check for change
        last_value = self.tag_values.get(tag_name)
        if last_value != value:
            self.tag_values[tag_name] = value
            # Save to DB
            await DataService.save_sensor_data(tag_name, value, timestamp)
            # Notify WebSockets
            await self.broadcast({"type": "data", "tag": tag_name, "value": value, "time": timestamp.isoformat()})
        
        # 2. Check Alarms
        await self.check_alarms(tag_name, value, timestamp)

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
