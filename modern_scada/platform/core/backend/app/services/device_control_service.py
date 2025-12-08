import logging
import httpx
from app.config import settings
from pymodbus.client import AsyncModbusTcpClient

logger = logging.getLogger(__name__)

class DeviceControlService:
    """
    Unified service for controlling devices via various protocols.
    Supports:
    1. Modbus TCP (for PLCs)
    2. HTTP REST (for Vendor APIs)
    """

    @staticmethod
    async def send_control_command(device_id: str, command: str, parameter: str, value: float):
        """
        Send control command to device.
        
        Args:
            device_id: Device identifier
            command: Command type (e.g., "SET_SETPOINT", "TOGGLE")
            parameter: Parameter to control (e.g., "temperature", "fan_speed")
            value: Target value
        """
        
        # 1. Vendor HTTP Control
        if settings.app_config.vendor_control:
            vendor_config = settings.app_config.vendor_control
            if device_id.startswith(vendor_config.device_prefix):
                return await DeviceControlService._send_vendor_http_command(
                    vendor_config, device_id, command, parameter, value
                )
        
        # 2. Modbus Control (Fallback)
        return await DeviceControlService._send_modbus_command(device_id, value)

    @staticmethod
    async def _send_vendor_http_command(config, device_id, command, parameter, value):
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "device_id": device_id,
                    "command": command,
                    "parameter": parameter,
                    "value": value
                }
                
                headers = config.headers or {}
                
                logger.info(f"Sending HTTP control to vendor: {device_id} -> {command} {parameter}={value}")
                
                response = await client.post(
                    config.url,
                    json=payload,
                    headers=headers,
                    timeout=config.timeout
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

    @staticmethod
    async def _send_modbus_command(device_id: str, value: float):
        # Map device_id to Modbus address
        # TODO: Move this mapping to config or database
        target_address = None
        if device_id == "mixer_valve":
            target_address = 300
        elif device_id == "mixer_pump":
            target_address = 301
        elif device_id == "fan_1":
            target_address = 400
        
        if target_address is None:
            logger.warning(f"No control mapping found for device: {device_id}")
            return {"status": "error", "message": "Device mapping not found"}

        # Get PLC Connection Config
        if not settings.app_config.plc.connections:
            logger.error("No PLC connections configured")
            return {"status": "error", "message": "No PLC configured"}
            
        # Use first connection for now (MVP)
        plc_config = settings.app_config.plc.connections[0]
        
        client = AsyncModbusTcpClient(plc_config.host, port=plc_config.port)
        try:
            await client.connect()
            if client.connected:
                # Pack float to 2 words (Big Endian)
                import struct
                b = struct.pack('>f', float(value))
                regs = list(struct.unpack('>HH', b))
                # Removed slave=1 to avoid potential issues with pyModbusTCP
                await client.write_registers(target_address, regs) 
                logger.info(f"Modbus control: Wrote {value} to {target_address} for {device_id}")
                return {"status": "success", "device_id": device_id, "value": value}
            else:
                logger.error("Modbus client connection failed")
                return {"status": "error", "message": "PLC connection failed"}
        except Exception as e:
            logger.error(f"Modbus control failed: {e}")
            raise
        finally:
            client.close()
