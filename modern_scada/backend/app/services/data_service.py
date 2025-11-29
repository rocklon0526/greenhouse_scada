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
