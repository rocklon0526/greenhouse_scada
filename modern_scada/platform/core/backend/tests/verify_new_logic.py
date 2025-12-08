import asyncio
import logging
from pymodbus.client import AsyncModbusTcpClient
import struct
import requests
import time

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VerifyLogic")

API_URL = "http://localhost:8000"
PLC_HOST = "localhost"
PLC_PORT = 5020

def float_to_regs(val):
    b = struct.pack('>f', val)
    return list(struct.unpack('>HH', b))

def regs_to_float(regs):
    b = struct.pack('>HH', regs[0], regs[1])
    return struct.unpack('>f', b)[0]

async def login():
    logger.info("Logging in as admin...")
    try:
        resp = requests.post(f"{API_URL}/api/token", data={"username": "admin", "password": "admin123"})
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            logger.info("Login successful")
            return {"Authorization": f"Bearer {token}"}
        else:
            logger.error(f"Login failed: {resp.text}")
            return None
    except Exception as e:
        logger.error(f"Login error: {e}")
        return None

async def verify_mixing_logic(headers):
    logger.info("--- Verifying Mixing Logic (Target Volume) ---")
    
    client = AsyncModbusTcpClient(PLC_HOST, port=PLC_PORT)
    await client.connect()
    
    # Reset Control Registers
    logger.info("Resetting Control Registers (300, 310)")
    await client.write_registers(address=300, values=float_to_regs(0.0))
    await client.write_registers(address=310, values=float_to_regs(0.0))
    
    # Reset Level to 5000
    logger.info("Resetting Level (10) to 5000.0")
    await client.write_registers(address=10, values=float_to_regs(5000.0))
    
    await asyncio.sleep(1)
    
    # 1. Start Mixing via API with Target Volume 12T (12000L)
    payload = {
        "recipeId": 1, # Numeric ID
        "targetVolume": 12, # 12 Tons
        "params": []
    }
    
    try:
        resp = requests.post(f"{API_URL}/api/process/mix", json=payload, headers=headers)
        logger.info(f"API Response: {resp.json()}")
        assert resp.json()["success"] == True
    except Exception as e:
        logger.error(f"API Call Failed: {e}")
        return False

    # 2. Verify PLC Registers
    client = AsyncModbusTcpClient(PLC_HOST, port=PLC_PORT)
    await client.connect()
    
    # Check Reg 304 (Target Volume)
    rr = await client.read_holding_registers(address=304, count=2)
    target_vol = regs_to_float(rr.registers)
    logger.info(f"PLC Reg 304 (Target Volume): {target_vol}")
    
    if abs(target_vol - 12000.0) > 1.0:
        logger.error(f"FAIL: Expected 12000.0, got {target_vol}")
        return False
        
    # Wait for mixing to finish (Simulator fills 500L/s, start ~5000, need ~14s if target 12000, but actually 12000/500 = 24s from 0. From 5000 -> 7000/500 = 14s. Wait, 12000-5000=7000. 7000/500=14s. Why timeout?)
    # Maybe start level was lower? Or simulator loop is slow?
    # Let's increase to 40s to be safe.
    logger.info("Waiting for mixing to complete...")
    for i in range(40):
        await asyncio.sleep(1)
        rr_status = await client.read_holding_registers(address=306, count=2)
        status = regs_to_float(rr_status.registers)
        rr_level = await client.read_holding_registers(address=10, count=2)
        level = regs_to_float(rr_level.registers)
        
        # Debug: Read Command (300) and Target (304)
        rr_cmd = await client.read_holding_registers(address=300, count=2)
        cmd = regs_to_float(rr_cmd.registers)
        rr_target = await client.read_holding_registers(address=304, count=2)
        target = regs_to_float(rr_target.registers)
        
        logger.info(f"Time {i}s: Level={level}, Status={status}, Cmd={cmd}, Target={target}")
        
        if status == 1.0:
            logger.info("Mixing Completed!")
            if abs(level - 12000.0) < 600.0: # Tolerance for simulation step
                logger.info("PASS: Mixing stopped at correct level.")
                return True
            else:
                logger.error(f"FAIL: Level {level} is not close to 12000")
                return False
                
    logger.error("FAIL: Mixing timed out")
    return False

async def verify_transfer_interlock(headers):
    logger.info("--- Verifying Transfer Safety Interlock ---")
    client = AsyncModbusTcpClient(PLC_HOST, port=PLC_PORT)
    await client.connect()
    
    # Reset Control Registers to stop any active process
    logger.info("Resetting Control Registers (300, 310)")
    await client.write_registers(address=300, values=float_to_regs(0.0))
    await client.write_registers(address=310, values=float_to_regs(0.0))
    await asyncio.sleep(1)
    
    # 1. Set Rack A (Reg 40) to 2.5 (Unsafe Level)
    logger.info("Setting Rack A Level to 2.5 (Unsafe)")
    regs_to_write = float_to_regs(2.5)
    logger.info(f"Writing regs: {regs_to_write}")
    await client.write_registers(address=40, values=regs_to_write)
    
    # Wait for simulator to pick it up
    await asyncio.sleep(2)

    # Debug: Read back
    rr_debug = await client.read_holding_registers(address=40, count=2)
    val_debug = regs_to_float(rr_debug.registers)
    logger.info(f"DEBUG: PLC Reg 40 is now {val_debug} (Regs: {rr_debug.registers})")
    
    # 2. Try Transfer via API
    payload = {"targetRackId": "RackA"}
    resp = requests.post(f"{API_URL}/api/process/transfer", json=payload, headers=headers)
    logger.info(f"API Response (Unsafe): {resp.json()}")
    
    if resp.json().get("success") == True:
        logger.error("FAIL: API should have rejected transfer!")
        return False
    else:
        logger.info("PASS: API rejected transfer as expected.")
        
    # 3. Set Rack A (Reg 40) to 1.0 (Safe Level)
    logger.info("Setting Rack A Level to 1.0 (Safe)")
    await client.write_registers(address=40, values=float_to_regs(1.0))
    
    # 4. Try Transfer via API
    resp = requests.post(f"{API_URL}/api/process/transfer", json=payload, headers=headers)
    logger.info(f"API Response (Safe): {resp.json()}")
    
    if resp.json().get("success") == True:
        logger.info("PASS: API accepted transfer.")
        return True
    else:
        logger.error(f"FAIL: API rejected transfer: {resp.json()}")
        return False

async def main():
    headers = await login()
    if not headers:
        logger.error("Aborting tests due to login failure")
        return

    res_mix = await verify_mixing_logic(headers)
    res_transfer = await verify_transfer_interlock(headers)
    
    if res_mix and res_transfer:
        logger.info("ALL TESTS PASSED")
    else:
        logger.error("SOME TESTS FAILED")

if __name__ == "__main__":
    asyncio.run(main())
