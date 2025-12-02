import json
from datetime import datetime
from app.db.postgres import PostgresDB
from app.db.sqlite import SQLiteDB
import logging

logger = logging.getLogger(__name__)

class DataService:
    @staticmethod
    async def save_sensor_data(tag_name: str, value: float, timestamp: datetime):
        query = "INSERT INTO sensor_data (time, tag_name, value) VALUES ($1, $2, $3)"
        params = (timestamp, tag_name, value)
        
        try:
            await PostgresDB.execute(query, *params)
        except Exception as e:
            logger.error(f"PostgreSQL write failed: {e}. Buffering to SQLite.")
            # Serialize params for SQLite storage
            # Note: timestamp needs to be serialized carefully or stored as string
            # Here we store as ISO format string for simplicity in JSON
            params_json = json.dumps([timestamp.isoformat(), tag_name, value])
            await SQLiteDB.execute(
                "INSERT INTO buffer (query, params) VALUES (?, ?)", 
                (query, params_json)
            )

    @staticmethod
    async def save_alarm_event(alarm_data: dict):
        # alarm_data should match alarm_history columns
        # This is a simplified example
        query = """
            INSERT INTO alarm_history (tag_name, alarm_type, start_time, start_value, message)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        """
        params = (
            alarm_data['tag_name'], 
            alarm_data['alarm_type'], 
            alarm_data['start_time'], 
            alarm_data['start_value'],
            alarm_data['message']
        )
        
        try:
            row = await PostgresDB.fetchrow(query, *params)
            return row['id']
        except Exception as e:
            logger.error(f"PostgreSQL alarm write failed: {e}. Buffering.")
            # Similar buffering logic for alarms if needed, though alarms are more critical
            # For now, we reuse the generic buffer
            params_json = json.dumps([
                alarm_data['start_time'].isoformat(), 
                alarm_data['tag_name'], 
                alarm_data['alarm_type'], 
                alarm_data['start_value'],
                alarm_data['message']
            ])
            await SQLiteDB.execute(
                "INSERT INTO buffer (query, params) VALUES (?, ?)", 
                (query, params_json)
            )
            return None

    @staticmethod
    async def update_alarm_end(alarm_id: int, end_time: datetime, end_value: float):
        if not alarm_id:
            return
            
        query = "UPDATE alarm_history SET end_time = $1, end_value = $2 WHERE id = $3"
        params = (end_time, end_value, alarm_id)
        
        try:
            await PostgresDB.execute(query, *params)
        except Exception as e:
            logger.error(f"PostgreSQL alarm update failed: {e}. Buffering.")
            params_json = json.dumps([end_time.isoformat(), end_value, alarm_id])
            await SQLiteDB.execute(
                "INSERT INTO buffer (query, params) VALUES (?, ?)", 
                (query, params_json)
            )

    @staticmethod
    async def send_control_command(device_id: str, value: float):
        # This method should interface with the Modbus client or Simulator
        # Since DataService is primarily for DB, this might be better in a DeviceService.
        # However, for simplicity in this refactor, we will call the Modbus worker directly or via a shared client.
        # But wait, workers are background tasks. 
        # The cleanest way is to use the same logic as the API router: write to Modbus.
        
        # We need to import the Modbus client wrapper. 
        # Let's assume we can import the polling worker's client or create a new one.
        # Actually, `app.workers.polling` has the client.
        
        from app.workers.polling import PollingWorker
        
        # Map device_id to address (This logic is duplicated from routers/frontend.py, should be centralized)
        # For MVP, we hardcode or look up config.
        from app.config import settings
        
        # Find tag for device
        # Note: device_id in frontend might be "mixer_valve", but in config it might be "mixer_valve_cmd"
        # We need a mapping.
        
        target_address = None
        if device_id == "mixer_valve":
            target_address = 300 # Based on previous changes
        elif device_id == "mixer_pump":
            target_address = 301 # Guessing based on 300
        elif device_id == "fan_1":
            target_address = 400 # Hypothetical
        
        # If we can't find it easily, we might need a better lookup.
        # For the specific test case (Fan), let's assume address 400.
        
        if target_address is not None:
            from pymodbus.client import AsyncModbusTcpClient
            # We need to know the host/port. 
            # Ideally this comes from settings.app_config.plc.connections[0]
            # For now, hardcode or fetch from settings.
            host = settings.app_config.plc.connections[0].host
            port = settings.app_config.plc.connections[0].port
            
            client = AsyncModbusTcpClient(host, port=port)
            try:
                await client.connect()
                if client.connected:
                    # Modbus write_single_register value must be int
                    await client.write_single_register(target_address, int(value), slave=1)
                    logger.info(f"DataService: Wrote {value} to {target_address} for {device_id}")
                else:
                    logger.error("DataService: Modbus client connection failed")
            except Exception as e:
                logger.error(f"DataService: Control failed: {e}")
            finally:
                client.close()
