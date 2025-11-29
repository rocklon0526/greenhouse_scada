from fastapi import APIRouter, HTTPException, Body
from app.services.event_processor import EventProcessor
from app.config import settings
from pymodbus.client import AsyncModbusTcpClient
import struct

router = APIRouter()

@router.get("/status")
async def get_system_status():
    processor = EventProcessor()
    tags = processor.tag_values
    
    # Helper to safely get float value
    def get_val(name, default=0.0):
        return tags.get(name, default)

    # 1. Weather
    weather = {
        "temp": get_val("weather_temp"),
        "hum": get_val("weather_hum"),
        "uv": get_val("weather_uv")
    }

    # 2. Sensors (Grouped by ID)
    # Assuming naming convention: sensor_{id}_{type} e.g. sensor_1_temp
    # But config.yaml has: sensor_1_top_temp, etc.
    # Let's map based on known structure in config.yaml
    
    # We'll construct the list dynamically or hardcode based on knowledge
    # For this demo, let's map the specific sensors we know exist
    sensors = []
    # We have 6 sensors in config.yaml: sensor_1 to sensor_6
    for i in range(1, 7):
        sid = f"sensor_{i}"
        sensors.append({
            "id": sid,
            "details": {
                "top": {
                    "temp": get_val(f"{sid}_top_temp"),
                    "hum": get_val(f"{sid}_top_hum"),
                    "co2": get_val(f"{sid}_top_co2")
                },
                "mid": {
                    "temp": get_val(f"{sid}_mid_temp"),
                    "hum": get_val(f"{sid}_mid_hum"),
                    "co2": get_val(f"{sid}_mid_co2")
                },
                "bot": {
                    "temp": get_val(f"{sid}_bot_temp"),
                    "hum": get_val(f"{sid}_bot_hum"),
                    "co2": get_val(f"{sid}_bot_co2")
                }
            }
        })

    # Calculate Averages
    total_temp = sum(s["details"]["mid"]["temp"] for s in sensors)
    total_hum = sum(s["details"]["mid"]["hum"] for s in sensors)
    total_co2 = sum(s["details"]["mid"]["co2"] for s in sensors)
    count = len(sensors) or 1

    # 3. Devices
    # Map backend tags to frontend device IDs
    devices = {
        "fan_1": {"isOn": bool(get_val("fan_1_status"))},
        "fan_2": {"isOn": bool(get_val("fan_2_status"))},
        "pump_main": {"isOn": bool(get_val("pump_main_status"))},
        "valve_1": {"isOpen": bool(get_val("valve_1_status"))},
        "led_grow": {"intensity": get_val("led_grow_intensity")}
    }

    # 4. Mixer
    mixer = {
        "level": get_val("mixer_level"),
        "ph": get_val("mixer_ph"),
        "ec": get_val("mixer_ec"),
        "status": "IDLE", # Logic needed to determine status
        "valveOpen": bool(get_val("mixer_valve")),
        "pumpActive": bool(get_val("mixer_pump"))
    }

    # 5. Rack Tanks
    rack_tanks = {}
    for i in ["A", "B", "C"]:
        rack_id = f"rack_{i.lower()}" # rack_a
        rack_tanks[f"Rack{i}"] = {
            "rackId": f"Rack{i}",
            "level": int(get_val(f"{rack_id}_level")),
            "ph": get_val(f"{rack_id}_ph"),
            "ec": get_val(f"{rack_id}_ec"),
            "valveOpen": bool(get_val(f"{rack_id}_valve")),
            "status": "IDLE"
        }

    return {
        "avgTemp": round(total_temp / count, 1),
        "avgHum": round(total_hum / count, 1),
        "avgCo2": round(total_co2 / count, 0),
        "sensors": sensors,
        "devices": devices,
        "weather": weather,
        "mixer": mixer,
        "rackTanks": rack_tanks
    }

@router.post("/control")
async def control_device(payload: dict = Body(...)):
    # payload: { deviceId: "fan_1", isOn: true } or { deviceId: "valve_1", isOpen: true }
    device_id = payload.get("deviceId")
    
    # Map deviceId to tag name and value
    tag_name = None
    value = 0.0
    
    if "isOn" in payload:
        tag_name = f"{device_id}_status" if "status" not in device_id else device_id
        value = 1.0 if payload["isOn"] else 0.0
    elif "isOpen" in payload:
        tag_name = f"{device_id}_status" if "status" not in device_id else device_id
        value = 1.0 if payload["isOpen"] else 0.0
    elif "intensity" in payload:
        tag_name = f"{device_id}_intensity"
        value = float(payload["intensity"])
    
    if not tag_name:
        return {"success": False, "error": "Unknown command"}

    # Find address for tag
    target_tag = next((t for t in settings.app_config.tags if t.name == tag_name), None)
    if not target_tag:
        # Try appending _status if not found (simple heuristic)
        target_tag = next((t for t in settings.app_config.tags if t.name == f"{device_id}_status"), None)
    
    if not target_tag:
        return {"success": False, "error": f"Tag not found for {device_id}"}

    # Write to PLC
    config = settings.app_config.plc
    client = AsyncModbusTcpClient(config.host, port=config.port)
    await client.connect()
    try:
        # Write float
        b = struct.pack('>f', value)
        payload_regs = list(struct.unpack('>HH', b))
        await client.write_registers(target_tag.address, payload_regs, device_id=1)
        
        # Optimistically update local cache
        EventProcessor().tag_values[target_tag.name] = value
        
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        client.close()

@router.post("/process/mix")
async def start_mixing(payload: dict = Body(...)):
    return {"success": True, "message": "Mixing started (Stub)"}

@router.post("/process/transfer")
async def start_transfer(payload: dict = Body(...)):
    return {"success": True, "message": "Transfer started (Stub)"}

@router.post("/rules/update")
async def update_rules(payload: dict = Body(...)):
    return {"success": True, "message": "Rules updated (Stub)"}
