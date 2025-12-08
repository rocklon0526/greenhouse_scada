from fastapi import APIRouter, HTTPException, Body, Depends
from app.services.event_processor import EventProcessor
from app.config import settings
from pymodbus.client import AsyncModbusTcpClient
from app.auth.security import get_current_active_user
from app.schemas.models import User
import struct
from app.utils import decode_float
from app.services.state_builder import StateBuilder
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/status")
async def get_system_status(current_user: User = Depends(get_current_active_user)):
    return StateBuilder.build_system_state()

@router.post("/control")
async def control_device(payload: dict = Body(...), current_user: User = Depends(get_current_active_user)):
    device_id = payload.get("deviceId")
    
    command = "SET"
    parameter = "status"
    value = 0.0
    
    if "isOn" in payload:
        parameter = "status"
        value = 1.0 if payload["isOn"] else 0.0
    elif "isOpen" in payload:
        parameter = "position" 
        value = 1.0 if payload["isOpen"] else 0.0
    elif "intensity" in payload:
        parameter = "intensity"
        value = float(payload["intensity"])
    
    if not device_id:
        return {"success": False, "error": "Missing deviceId"}

    try:
        from app.services.device_control_service import DeviceControlService
        await DeviceControlService.send_control_command(device_id, command, parameter, value)
        
        tag_name = f"{device_id}_{parameter}"
        EventProcessor().tag_values[tag_name] = value
        
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/process/mix")
async def start_mixing(payload: dict = Body(...), current_user: User = Depends(get_current_active_user)):
    recipe_id = payload.get("recipeId", 1)
    
    if not settings.app_config.plc.connections:
        return {"success": False, "error": "No PLC configured"}
        
    config = settings.app_config.plc.connections[0]
    client = AsyncModbusTcpClient(config.host, port=config.port)
    await client.connect()
    try:
        # [修正] 使用關鍵字參數 address, count (pymodbus 3.x 規範)
        rr = await client.read_holding_registers(address=20, count=6)
        if rr.isError():
            raise HTTPException(status_code=500, detail="Failed to read PLC status")
        
        tank1 = decode_float(rr.registers[0:2])
        tank2 = decode_float(rr.registers[2:4])
        tank3 = decode_float(rr.registers[4:6])
        
        # [修正] 寫入 Start Command (Reg 300)
        b_cmd = struct.pack('>f', 1.0)
        regs_cmd = list(struct.unpack('>HH', b_cmd))
        logger.info(f"DEBUG: Writing 1.0 to 300. Regs: {regs_cmd}")
        await client.write_registers(address=300, values=regs_cmd)
        
        # [修正] 寫入 Recipe ID (Reg 302)
        b_id = struct.pack('>f', float(recipe_id))
        regs_id = list(struct.unpack('>HH', b_id))
        logger.info(f"DEBUG: Writing {recipe_id} to 302. Regs: {regs_id}")
        await client.write_registers(address=302, values=regs_id)

        # [新增] 寫入 Target Volume (Reg 304)
        target_vol = float(payload.get("targetVolume", 15.0)) * 1000 # Tons -> Liters
        b_vol = struct.pack('>f', target_vol)
        regs_vol = list(struct.unpack('>HH', b_vol))
        logger.info(f"DEBUG: Writing {target_vol} to 304. Regs: {regs_vol}")
        await client.write_registers(address=304, values=regs_vol)
        
        EventProcessor().tag_values["process_mix_cmd"] = 1.0
        
        return {"success": True, "message": "Mixing started"}
    except Exception as e:
        logger.error(f"Mixing process error: {e}")
        return {"success": False, "error": str(e)}
    finally:
        client.close()

@router.post("/process/transfer")
async def start_transfer(payload: dict = Body(...), current_user: User = Depends(get_current_active_user)):
    rack_map = {"RackA": 1.0, "RackB": 2.0, "RackC": 3.0}
    target_rack = payload.get("targetRackId")
    rack_val = rack_map.get(target_rack, 1.0)
    
    if not settings.app_config.plc.connections:
        return {"success": False, "error": "No PLC configured"}
        
    config = settings.app_config.plc.connections[0]
    client = AsyncModbusTcpClient(config.host, port=config.port)
    await client.connect()
    try:
        if target_rack == "RackA":
            # [修正] 讀取目標液位
            rr = await client.read_holding_registers(address=40, count=2)
            if rr.isError():
                logger.error(f"Failed to read Rack A level: {rr}")
                return {"success": False, "error": "Failed to verify Rack A level (Safety Interlock)"}
            
            logger.info(f"DEBUG: Raw Regs 40-41: {rr.registers}")
            level = decode_float(rr.registers)
            logger.info(f"DEBUG: Rack A Level = {level}")
            if level > 1.5: 
                    return {"success": False, "error": f"Target Rack A is full (Level: {level:.1f} > 1.5)"}

        # [修正] 寫入 Start Transfer (Reg 310)
        b_cmd = struct.pack('>f', 1.0)
        regs_cmd = list(struct.unpack('>HH', b_cmd))
        logger.info(f"DEBUG: Writing 1.0 to 310. Regs: {regs_cmd}")
        await client.write_registers(address=310, values=regs_cmd)
        
        # [修正] 寫入 Target Rack ID (Reg 312)
        b_id = struct.pack('>f', rack_val)
        regs_id = list(struct.unpack('>HH', b_id))
        logger.info(f"DEBUG: Writing {rack_val} to 312. Regs: {regs_id}")
        await client.write_registers(address=312, values=regs_id)
        
        EventProcessor().tag_values["process_transfer_cmd"] = 1.0
        EventProcessor().tag_values["process_transfer_target"] = rack_val
        
        return {"success": True, "message": "Transfer started"}
    except Exception as e:
        logger.error(f"Transfer process error: {e}")
        return {"success": False, "error": str(e)}
    finally:
        client.close()

@router.post("/rules/update")
async def update_rules(payload: dict = Body(...), current_user: User = Depends(get_current_active_user)):
    from app.services.logic_engine import LogicEngine
    rules = payload.get("rules", [])
    globals_settings = payload.get("globals", {})
    
    engine = LogicEngine()
    engine.rules = rules
    engine.global_settings = globals_settings
    engine.save_rules()
    
    return {"success": True, "message": "Rules updated"}