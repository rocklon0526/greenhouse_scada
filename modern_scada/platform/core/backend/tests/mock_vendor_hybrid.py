"""
Mock Vendor Hybrid Integration Simulator

This script simulates a third-party vendor system that:
1. Receives control commands from SCADA (HTTP POST)
2. Pushes data updates to SCADA webhook (HTTP POST)

Usage:
    python tests/mock_vendor_hybrid.py

Then configure SCADA with:
    vendor_control:
        url: "http://localhost:8888/vendor/control"
"""

import asyncio
import httpx
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from typing import Dict, Any
import random

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mock Vendor System")

# Simulated device state
device_state = {
    "nursery_greenhouse_01_temperature": 24.5,
    "nursery_greenhouse_01_humidity": 65.0,
    "nursery_greenhouse_01_co2": 450,
    "nursery_greenhouse_01_light_level": 8500,
}


class ControlCommand(BaseModel):
    """Control command from SCADA"""
    device_id: str
    command: str
    parameter: str
    value: float


@app.post("/vendor/control")
async def receive_control(cmd: ControlCommand):
    """
    Receive control command from SCADA.
    
    Example:
        POST /vendor/control
        {
            "device_id": "nursery_greenhouse_01",
            "command": "SET_SETPOINT",
            "parameter": "temperature",
            "value": 26.5
        }
    """
    logger.info(f"📥 Received control command: {cmd.device_id} -> {cmd.parameter} = {cmd.value}")
    
    # Simulate applying the control
    tag_name = f"{cmd.device_id}_{cmd.parameter}"
    
    if cmd.command == "SET_SETPOINT":
        # Update target setpoint (simulated)
        device_state[f"{tag_name}_setpoint"] = cmd.value
        logger.info(f"✓ Set {cmd.parameter} setpoint to {cmd.value}")
        
        return {
            "status": "success",
            "device_id": cmd.device_id,
            "parameter": cmd.parameter,
            "new_setpoint": cmd.value,
            "message": f"Setpoint updated successfully"
        }
    elif cmd.command == "TOGGLE":
        # Toggle on/off
        current = device_state.get(tag_name, 0)
        new_value = 0 if current else 1
        device_state[tag_name] = new_value
        logger.info(f"✓ Toggled {cmd.parameter}: {current} -> {new_value}")
        
        return {
            "status": "success",
            "device_id": cmd.device_id,
            "parameter": cmd.parameter,
            "new_value": new_value
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unknown command: {cmd.command}")


@app.get("/vendor/status")
async def get_status():
    """Get current vendor device status (for polling)"""
    return {
        "data": {
            "temperature": device_state.get("nursery_greenhouse_01_temperature", 24.5),
            "humidity": device_state.get("nursery_greenhouse_01_humidity", 65.0),
            "co2": device_state.get("nursery_greenhouse_01_co2", 450),
            "light_level": device_state.get("nursery_greenhouse_01_light_level", 8500),
        }
    }


async def push_webhook_updates():
    """
    Background task to push data updates to SCADA webhook.
    Simulates Change-of-Value (COV) notifications.
    """
    scada_webhook_url = "http://localhost:8000/api/hooks/nursery/update"
    
    async with httpx.AsyncClient() as client:
        while True:
            try:
                # Simulate sensor value changes
                device_state["nursery_greenhouse_01_temperature"] += random.uniform(-0.5, 0.5)
                device_state["nursery_greenhouse_01_humidity"] += random.uniform(-1.0, 1.0)
                device_state["nursery_greenhouse_01_co2"] += random.uniform(-5, 5)
                
                # Clamp values to realistic ranges
                device_state["nursery_greenhouse_01_temperature"] = max(20, min(30, device_state["nursery_greenhouse_01_temperature"]))
                device_state["nursery_greenhouse_01_humidity"] = max(40, min(80, device_state["nursery_greenhouse_01_humidity"]))
                device_state["nursery_greenhouse_01_co2"] = max(400, min(600, device_state["nursery_greenhouse_01_co2"]))
                
                # Push webhook to SCADA
                payload = {
                    "device_id": "nursery_greenhouse_01",
                    "data": {
                        "temperature": round(device_state["nursery_greenhouse_01_temperature"], 2),
                        "humidity": round(device_state["nursery_greenhouse_01_humidity"], 2),
                        "co2": round(device_state["nursery_greenhouse_01_co2"], 1),
                        "light_level": device_state["nursery_greenhouse_01_light_level"]
                    }
                }
                
                logger.info(f"📤 Pushing webhook to SCADA: temp={payload['data']['temperature']}, hum={payload['data']['humidity']}")
                
                response = await client.post(scada_webhook_url, json=payload, timeout=5.0)
                
                if response.status_code == 200:
                    logger.info(f"✓ Webhook delivered successfully")
                else:
                    logger.warning(f"⚠️ Webhook failed: {response.status_code}")
                    
            except httpx.RequestError as e:
                logger.error(f"❌ Webhook connection error: {e}")
            except Exception as e:
                logger.error(f"❌ Webhook error: {e}")
            
            # Push updates every 10 seconds (configurable)
            await asyncio.sleep(10)


@app.on_event("startup")
async def startup_event():
    """Start background webhook pusher on startup"""
    logger.info("🚀 Mock Vendor System starting...")
    logger.info("📡 Control endpoint: http://localhost:8888/vendor/control")
    logger.info("📊 Status endpoint: http://localhost:8888/vendor/status")
    logger.info("📤 Webhook push task starting (10s interval)...")
    
    # Start background task
    asyncio.create_task(push_webhook_updates())


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8888,
        log_level="info"
    )
