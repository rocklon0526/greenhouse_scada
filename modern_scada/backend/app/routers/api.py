from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.auth.dependencies import get_current_user, RoleChecker
from app.schemas.models import User, SensorData, Alarm, PLCWrite
from app.services.event_processor import EventProcessor
from app.db.postgres import PostgresDB
from app.config import settings
from pymodbus.client import AsyncModbusTcpClient

router = APIRouter()

@router.get("/config/db")
async def get_db_config():
    return settings.app_config.database

@router.post("/config/db", dependencies=[Depends(RoleChecker(["admin"]))])
async def update_db_config(config: dict):
    # We accept dict to avoid Pydantic validation issues if partial
    # But ideally we use the model. Let's use dict for flexibility in this patch.
    import yaml
    
    # Update file
    with open("config.yaml", "r") as f:
        data = yaml.safe_load(f)
    
    if 'postgres_dsn' in config:
        data['database']['postgres_dsn'] = config['postgres_dsn']
        settings.app_config.database.postgres_dsn = config['postgres_dsn']
        
    with open("config.yaml", "w") as f:
        yaml.safe_dump(data, f)
        
    return {"status": "success"}

@router.get("/config/modbus")
async def get_modbus_config():
    return settings.app_config.plc

@router.post("/config/modbus", dependencies=[Depends(RoleChecker(["admin"]))])
async def update_modbus_config(config: dict):
    import yaml
    
    with open("config.yaml", "r") as f:
        data = yaml.safe_load(f)
    
    # Expecting config to be {'connections': [...]}
    if 'connections' in config:
        data['plc']['connections'] = config['connections']
        # Update in-memory settings
        # We need to reconstruct the objects
        from app.config import PLCConnection
        new_conns = [PLCConnection(**c) for c in config['connections']]
        settings.app_config.plc.connections = new_conns
        
    with open("config.yaml", "w") as f:
        yaml.safe_dump(data, f)
        
@router.get("/config/tags")
async def get_tags_config():
    return settings.app_config.tags

@router.post("/config/tags", dependencies=[Depends(RoleChecker(["admin"]))])
async def update_tags_config(tags: List[dict]):
    import yaml
    
    with open("config.yaml", "r") as f:
        data = yaml.safe_load(f)
    
    data['tags'] = tags
    
    # Update in-memory
    from app.config import TagConfig
    new_tags = [TagConfig(**t) for t in tags]
    settings.app_config.tags = new_tags
        
    with open("config.yaml", "w") as f:
        yaml.safe_dump(data, f)
        
    return {"status": "success"}

@router.get("/system/status")
async def get_system_status(current_user: User = Depends(get_current_user)):
    import psutil
    import time
    from app.services.websocket_manager import manager
    
    # Active users (Real)
    active_users = manager.get_active_users()
    
    # DB Connection
    db_status = "connected"
    db_stats = {}
    try:
        await PostgresDB.execute("SELECT 1")
        db_stats = PostgresDB.get_stats()
    except Exception:
        db_status = "disconnected"
        
    # Store & Forward
    from app.db.sqlite import SQLiteDB
    sf_data = await SQLiteDB.get_buffer_status()
    sf_status = "buffering" if sf_data["count"] > 0 else "idle"
    
    mem = psutil.virtual_memory()
    
    return {
        "cpu_usage": psutil.cpu_percent(),
        "ram_usage": mem.percent,
        "ram_total": mem.total,
        "ram_used": mem.used,
        "disk_usage": psutil.disk_usage('/').percent,
        "uptime": int(time.time() - psutil.boot_time()),
        "active_users": active_users,
        "db_status": db_status,
        "db_stats": db_stats,
        "store_forward_status": sf_status,
        "store_forward_count": sf_data["count"]
    }

@router.post("/system/buffer/retry", dependencies=[Depends(RoleChecker(["admin"]))])
async def retry_buffer():
    from app.workers.forwarder import process_buffer
    count = await process_buffer(limit=1000)
    return {"status": "success", "processed": count}

@router.post("/plc/control", dependencies=[Depends(RoleChecker(["admin"]))])
async def write_plc(command: PLCWrite):
    # Find the target connection
    target_conn = None
    if command.connection_name:
        for conn in settings.app_config.plc.connections:
            if conn.name == command.connection_name:
                target_conn = conn
                break
        if not target_conn:
            raise HTTPException(status_code=404, detail=f"PLC connection '{command.connection_name}' not found")
    else:
        # Default to first connection if exists
        if settings.app_config.plc.connections:
            target_conn = settings.app_config.plc.connections[0]
        else:
            raise HTTPException(status_code=503, detail="No PLC connections configured")

    client = AsyncModbusTcpClient(target_conn.host, port=target_conn.port)
    await client.connect()
    if not client.connected:
        raise HTTPException(status_code=503, detail=f"PLC {target_conn.name} unreachable")
    
    try:
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
        
    return {"status": "success"}

@router.get("/system/history")
async def get_system_history(range: str = '24h', current_user: User = Depends(get_current_user)):
    # Default to 24h aggregation
    # We aggregate by minute to avoid sending too much data
    query = """
        SELECT 
            date_trunc('minute', time) as time,
            AVG(cpu_usage) as cpu_usage,
            AVG(ram_usage) as ram_usage,
            AVG(disk_usage) as disk_usage
        FROM system_metrics 
        WHERE time > NOW() - INTERVAL '24 hours'
        GROUP BY 1
        ORDER BY 1 ASC
    """
    
    try:
        rows = await PostgresDB.fetch(query)
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"History fetch error: {e}")
        return []
