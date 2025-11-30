import asyncio
import logging
from pymodbus.client import AsyncModbusTcpClient
from app.config import settings
from app.services.event_processor import EventProcessor
from app.services.websocket_manager import manager
from app.services.state_builder import StateBuilder

logger = logging.getLogger(__name__)

async def poll_single_plc(connection_config, processor):
    client = AsyncModbusTcpClient(connection_config.host, port=connection_config.port)
    
    try:
        await client.connect()
        if client.connected:
            # Filter tags for this connection
            connection_tags = [
                tag for tag in settings.app_config.tags 
                if tag.connection_name == connection_config.name
            ]
            
            if not connection_tags:
                # If no tags assigned, skip or read nothing
                # logger.debug(f"No tags configured for {connection_config.name}")
                return

            # Find max address to read enough registers
            max_addr = 0
            for tag in connection_tags:
                # float32 takes 2 registers
                end_addr = tag.address + 2
                if end_addr > max_addr:
                    max_addr = end_addr
            
            # Read in chunks of 100 registers to avoid Modbus limit (usually 125)
            all_registers = []
            CHUNK_SIZE = 100
            
            # We need to read up to max_addr
            # But we can't just append, we need to place them correctly or just read the whole range in chunks
            # Simpler: Initialize a list of None or 0 up to max_addr, then fill it
            # Even simpler: Just read 0-100, 100-200, 200-300... and concatenate
            
            current_addr = 0
            read_error = False
            
            while current_addr < max_addr:
                count = min(CHUNK_SIZE, max_addr - current_addr)
                rr = await client.read_holding_registers(current_addr, count=count, device_id=1)
                
                if rr.isError():
                    logger.error(f"Modbus Error on {connection_config.name} at addr {current_addr}: {rr}")
                    read_error = True
                    break
                
                all_registers.extend(rr.registers)
                current_addr += count
            
            if not read_error:
                import struct
                for tag in connection_tags:
                    # Check if we have enough data for this tag
                    if tag.address + 1 < len(all_registers):
                        regs = all_registers[tag.address:tag.address+2]
                        b = struct.pack('>HH', regs[0], regs[1])
                        val = struct.unpack('>f', b)[0]
                        await processor.process_data(tag.name, val)
        else:
            logger.warning(f"PLC {connection_config.name} disconnected")
            
    except Exception as e:
        logger.error(f"Polling error on {connection_config.name}: {e}")
    finally:
        client.close()

async def polling_loop():
    logger.info("Starting Polling Worker")
    processor = EventProcessor()

    while True:
        try:
            connections = settings.app_config.plc.connections
            if not connections:
                logger.warning("No PLC connections configured")
                await asyncio.sleep(5)
                continue

            tasks = [poll_single_plc(conn, processor) for conn in connections]
            await asyncio.gather(*tasks)
            
            # Broadcast updates after polling all PLCs
            system_state = StateBuilder.build_system_state()
            await manager.broadcast({"type": "update", "data": system_state})
                
        except Exception as e:
            logger.error(f"Global polling loop error: {e}")
        
        # Use the poll interval from the first connection or default
        interval = 1.0
        if settings.app_config.plc.connections:
            interval = settings.app_config.plc.connections[0].poll_interval
            
        await asyncio.sleep(interval)
