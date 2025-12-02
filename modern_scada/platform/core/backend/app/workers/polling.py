import asyncio
import logging
from pymodbus.client import AsyncModbusTcpClient
from app.config import settings
from app.services.event_processor import EventProcessor
from app.services.websocket_manager import manager
from app.services.state_builder import StateBuilder

logger = logging.getLogger(__name__)

import struct

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
                return

            # 1. Sort tags by address
            connection_tags.sort(key=lambda x: x.address)

            # 2. Dynamic Grouping
            groups = []
            if connection_tags:
                current_group_tags = [connection_tags[0]]
                current_start = connection_tags[0].address
                # Assuming float32 takes 2 registers
                current_end = current_start + 2
                
                for tag in connection_tags[1:]:
                    tag_start = tag.address
                    tag_end = tag_start + 2
                    
                    # Calculate gap from the end of the previous tag
                    prev_tag = current_group_tags[-1]
                    prev_end = prev_tag.address + 2
                    gap = tag_start - prev_end
                    
                    # Calculate potential new length of the group
                    new_group_end = max(current_end, tag_end)
                    total_len = new_group_end - current_start
                    
                    # Grouping rules: Gap <= 20 AND Total Length <= 100
                    if gap <= 20 and total_len <= 100:
                        current_group_tags.append(tag)
                        current_end = new_group_end
                    else:
                        # Finalize current group
                        groups.append((current_start, current_end - current_start, current_group_tags))
                        # Start new group
                        current_group_tags = [tag]
                        current_start = tag_start
                        current_end = tag_end
                
                # Append the last group
                groups.append((current_start, current_end - current_start, current_group_tags))

            # 3. Optimized Reading
            for start_addr, count, group_tags in groups:
                try:
                    rr = await client.read_holding_registers(start_addr, count=count, device_id=1)
                    
                    if rr.isError():
                        logger.error(f"Modbus Error on {connection_config.name} group {start_addr}-{start_addr+count}: {rr}")
                        continue
                    
                    registers = rr.registers
                    
                    # 4. Map Data
                    for tag in group_tags:
                        # Calculate relative offset in the read buffer
                        offset = tag.address - start_addr
                        
                        # Ensure we have enough data for this tag (2 registers for float32)
                        if offset >= 0 and offset + 1 < len(registers):
                            regs = registers[offset:offset+2]
                            try:
                                b = struct.pack('>HH', regs[0], regs[1])
                                val = struct.unpack('>f', b)[0]
                                await processor.process_data(tag.name, val)
                            except Exception as e:
                                logger.error(f"Error decoding tag {tag.name}: {e}")
                                
                except Exception as e:
                    logger.error(f"Error reading group starting at {start_addr} on {connection_config.name}: {e}")
                    # Continue to next group instead of breaking
                    
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
