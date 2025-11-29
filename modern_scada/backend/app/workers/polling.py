import asyncio
import logging
from pymodbus.client import AsyncModbusTcpClient
from app.config import settings
from app.services.event_processor import EventProcessor

logger = logging.getLogger(__name__)

async def polling_loop():
    logger.info("Starting Polling Worker")
    config = settings.app_config.plc
    client = AsyncModbusTcpClient(config.host, port=config.port)
    processor = EventProcessor()

    while True:
        try:
            if not client.connected:
                await client.connect()
            
            if client.connected:
                # Read Holding Registers (Function Code 3)
                # Assuming all tags are floats (2 registers each) and contiguous for simplicity
                # In a real scenario, we'd optimize reading blocks based on addresses
                
                # Find max address to read enough registers
                max_addr = 0
                for tag in settings.app_config.tags:
                    # float32 takes 2 registers
                    end_addr = tag.address + 2
                    if end_addr > max_addr:
                        max_addr = end_addr
                
                # Read block
                rr = await client.read_holding_registers(0, count=max_addr, device_id=1)
                
                if not rr.isError():
                    # Parse data
                    # Manual decoding using struct
                    import struct
                    
                    for tag in settings.app_config.tags:
                        if tag.address + 1 < len(rr.registers):
                            # Big Endian / Big Endian
                            regs = rr.registers[tag.address:tag.address+2]
                            # Pack to bytes (Big Endian unsigned shorts)
                            b = struct.pack('>HH', regs[0], regs[1])
                            # Unpack to float (Big Endian)
                            val = struct.unpack('>f', b)[0]
                            await processor.process_data(tag.name, val)
                            await processor.process_data(tag.name, val)
                else:
                    logger.error(f"Modbus Error: {rr}")
            else:
                logger.warning("PLC disconnected, retrying...")
                
        except Exception as e:
            logger.error(f"Polling error: {e}")
            # Force reconnect logic if needed
            client.close()
        
        await asyncio.sleep(config.poll_interval)
