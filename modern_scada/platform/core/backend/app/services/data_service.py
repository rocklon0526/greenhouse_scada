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
    async def send_control_command(device_id: str, command: str, parameter: str, value: float):
        """
        Send control command to device.
        Supports both Modbus (PLCs) and HTTP (Vendor APIs).
        
        Args:
            device_id: Device identifier
            command: Command type (e.g., "SET_SETPOINT", "TOGGLE")
            parameter: Parameter to control (e.g., "temperature", "fan_speed")
            value: Target value
        """
        from app.config import settings
        
        # Check if this is a vendor device (HTTP control)
        if settings.app_config.vendor_control:
            vendor_config = settings.app_config.vendor_control
            if device_id.startswith(vendor_config.device_prefix):
                # Use HTTP control for vendor devices
                import httpx
                
                try:
                    async with httpx.AsyncClient() as client:
                        payload = {
                            "device_id": device_id,
                            "command": command,
                            "parameter": parameter,
                            "value": value
                        }
                        
                        headers = vendor_config.headers or {}
                        
                        logger.info(f"Sending HTTP control to vendor: {device_id} -> {command} {parameter}={value}")
                        
                        response = await client.post(
                            vendor_config.url,
                            json=payload,
                            headers=headers,
                            timeout=vendor_config.timeout
                        )
                        
                        response.raise_for_status()
                        logger.info(f"✓ Vendor control successful: {device_id}")
                        return response.json()
                        
                except httpx.HTTPStatusError as e:
                    logger.error(f"Vendor control HTTP error {e.response.status_code}: {e.response.text}")
                    raise
                except httpx.RequestError as e:
                    logger.error(f"Vendor control request error: {e}")
                    raise
                except Exception as e:
                    logger.error(f"Vendor control failed: {e}", exc_info=True)
                    raise
        
        # Fall back to Modbus control for non-vendor devices
        # Map device_id to Modbus address
        target_address = None
        if device_id == "mixer_valve":
            target_address = 300
        elif device_id == "mixer_pump":
            target_address = 301
        elif device_id == "fan_1":
            target_address = 400
        
        if target_address is not None:
            from pymodbus.client import AsyncModbusTcpClient
            
            host = settings.app_config.plc.connections[0].host
            port = settings.app_config.plc.connections[0].port
            
            client = AsyncModbusTcpClient(host, port=port)
            try:
                await client.connect()
                if client.connected:
                    await client.write_single_register(target_address, int(value), slave=1)
                    logger.info(f"Modbus control: Wrote {value} to {target_address} for {device_id}")
                else:
                    logger.error("Modbus client connection failed")
            except Exception as e:
                logger.error(f"Modbus control failed: {e}")
                raise
            finally:
                client.close()
        else:
            logger.warning(f"No control mapping found for device: {device_id}")
