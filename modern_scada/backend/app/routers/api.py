from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.auth.dependencies import get_current_user, RoleChecker
from app.schemas.models import User, SensorData, Alarm, PLCWrite
from app.services.event_processor import EventProcessor
from app.db.postgres import PostgresDB
from app.config import settings
from pymodbus.client import AsyncModbusTcpClient

router = APIRouter()

@router.get("/latest", response_model=List[SensorData])
async def get_latest_data(user: User = Depends(get_current_user)):
    processor = EventProcessor()
    results = []
    for tag_name, value in processor.tag_values.items():
        # Note: In a real app, we'd want the timestamp of the last update.
        # The processor might need to store (value, timestamp) tuples.
        # For now, we return current time or fetch from DB if strict.
        # Let's fetch the absolute latest from DB for accuracy or modify processor.
        # To keep it fast, we'll use the processor's cache but we need timestamps.
        # Let's query DB for the "latest" view if we want strict history, 
        # or just return what we have in memory.
        # Given the requirement "GET /api/latest", memory is fastest.
        from datetime import datetime
        results.append(SensorData(tag_name=tag_name, value=value, timestamp=datetime.utcnow()))
    return results

@router.get("/alarms/active", dependencies=[Depends(RoleChecker(["admin", "operator"]))])
async def get_active_alarms():
    # Query DB for alarms with no end_time
    rows = await PostgresDB.fetch(
        "SELECT * FROM alarm_history WHERE end_time IS NULL ORDER BY start_time DESC"
    )
    return [Alarm(**dict(row)) for row in rows]

@router.post("/plc/control", dependencies=[Depends(RoleChecker(["admin"]))])
async def write_plc(command: PLCWrite):
    config = settings.app_config.plc
    client = AsyncModbusTcpClient(config.host, port=config.port)
    await client.connect()
    if not client.connected:
        raise HTTPException(status_code=503, detail="PLC unreachable")
    
    try:
        # Write float (2 registers)
        # Write float (2 registers)
        import struct
        # Pack float to bytes (Big Endian)
        b = struct.pack('>f', command.value)
        # Unpack to 2 unsigned shorts (Big Endian)
        payload = list(struct.unpack('>HH', b))
        
        await client.write_registers(command.address, payload, device_id=1)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        client.close()
    
    return {"status": "success", "message": f"Wrote {command.value} to address {command.address}"}
