from fastapi import APIRouter, HTTPException, Body, Depends
from app.services.event_processor import EventProcessor
from app.config import settings
from pymodbus.client import AsyncModbusTcpClient
# from pymodbus.payload import BinaryPayloadDecoder # Removed due to version issues
# from pymodbus.constants import Endian
from app.auth.security import get_current_active_user
from app.schemas.models import User
import struct
from app.utils import decode_float
from app.services.state_builder import StateBuilder

router = APIRouter()

@router.get("/status")
async def get_system_status(current_user: User = Depends(get_current_active_user)):
    return StateBuilder.build_system_state()

@router.post("/control")
async def control_device(payload: dict = Body(...), current_user: User = Depends(get_current_active_user)):
    # payload: { deviceId: "fan_1", isOn: true } or { deviceId: "valve_1", isOpen: true }
    device_id = payload.get("deviceId")
    
    # Map payload to command/value
    command = "SET"
    parameter = "status"
    value = 0.0
    
    if "isOn" in payload:
        parameter = "status"
        value = 1.0 if payload["isOn"] else 0.0
    elif "isOpen" in payload:
        parameter = "position" # or status
        value = 1.0 if payload["isOpen"] else 0.0
    elif "intensity" in payload:
        parameter = "intensity"
        value = float(payload["intensity"])
    
    if not device_id:
        return {"success": False, "error": "Missing deviceId"}

    try:
        from app.services.device_control_service import DeviceControlService
        
        # Use Unified Control Service
        # Note: Frontend currently doesn't send "command" or "parameter" explicitly,
        # so we infer them. Ideally frontend should send standard command structure.
        await DeviceControlService.send_control_command(device_id, command, parameter, value)
        
        # Optimistically update local cache (EventProcessor)
        # This is strictly for UI responsiveness; the real feedback comes from polling/webhook
        tag_name = f"{device_id}_{parameter}"
        # Try to match tag naming convention
        if parameter == "status" and not device_id.endswith("_status"):
             # Simple heuristic: if device_id is "fan_1", tag might be "fan_1_status" or just "fan_1"
             # But DeviceControlService handles the actual control.
             # Here we just want to update the cache.
             pass

        EventProcessor().tag_values[tag_name] = value
        
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/process/mix")
async def start_mixing(payload: dict = Body(...), current_user: User = Depends(get_current_active_user)):
    # payload: { recipeId: 1, params: {...} }
    recipe_id = payload.get("recipeId", 1)
    
    config = settings.app_config.plc
    client = AsyncModbusTcpClient(config.host, port=config.port)
    await client.connect()
    try:
        # Safety Check: Check Dosing Tank Levels (Registers 20, 22, 24)
        # Read 6 registers starting at 20 (3 floats)
        rr = await client.read_holding_registers(20, 6, device_id=1)
        if rr.isError():
            raise HTTPException(status_code=500, detail="Failed to read PLC status for safety check")
        
        tank1 = decode_float(rr.registers[0:2])
        tank2 = decode_float(rr.registers[2:4])
        tank3 = decode_float(rr.registers[4:6])
        
        if tank1 < 10.0 or tank2 < 10.0 or tank3 < 10.0:
             return {"success": False, "error": "Safety Interlock: Dosing tank levels too low (< 10.0)"}

        # Write 1.0 to address 300 (Start Mixing)
        b_cmd = struct.pack('>f', 1.0)
        regs_cmd = list(struct.unpack('>HH', b_cmd))
        await client.write_registers(300, regs_cmd, device_id=1)
        
        # Write recipe_id to address 301
        b_id = struct.pack('>f', float(recipe_id))
        regs_id = list(struct.unpack('>HH', b_id))
        await client.write_registers(301, regs_id, device_id=1)
        
        # Optimistic update
        EventProcessor().tag_values["process_mix_cmd"] = 1.0
        
        return {"success": True, "message": "Mixing started"}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        client.close()

@router.post("/process/transfer")
async def start_transfer(payload: dict = Body(...), current_user: User = Depends(get_current_active_user)):
    # payload: { targetRackId: "RackA" }
    rack_map = {"RackA": 1.0, "RackB": 2.0, "RackC": 3.0}
    target_rack = payload.get("targetRackId")
    rack_val = rack_map.get(target_rack, 1.0)
    
    config = settings.app_config.plc
    client = AsyncModbusTcpClient(config.host, port=config.port)
    await client.connect()
    try:
        # Safety Check: Check Target Rack Level
        # Rack A Level is at 40. Rack B/C not fully mapped in sim but let's check Rack A if selected.
        if target_rack == "RackA":
            rr = await client.read_holding_registers(40, 2, device_id=1)
            if not rr.isError():
                level = decode_float(rr.registers)
                if level > 15.0: # Assuming max is 20
                     return {"success": False, "error": "Safety Interlock: Target Rack A is nearly full (> 15.0)"}

        # Write 1.0 to address 310 (Start Transfer)
        b_cmd = struct.pack('>f', 1.0)
        regs_cmd = list(struct.unpack('>HH', b_cmd))
        await client.write_registers(310, regs_cmd, device_id=1)
        
        # Write rack_val to address 311
        b_id = struct.pack('>f', rack_val)
        regs_id = list(struct.unpack('>HH', b_id))
        await client.write_registers(311, regs_id, device_id=1)
        
        # Optimistic update
        EventProcessor().tag_values["process_transfer_cmd"] = 1.0
        EventProcessor().tag_values["process_transfer_target"] = rack_val
        
        return {"success": True, "message": "Transfer started"}
    except Exception as e:
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
    
    return {"success": True, "message": "Rules and Global Settings updated"}
