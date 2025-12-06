import logging
import asyncio
from app.services.device_control_service import DeviceControlService

logger = logging.getLogger(__name__)

async def run(context):
    """
    Nutrient Control Logic
    Simulates a recipe mixing process.
    """
    # Check for start command (simulated by a virtual tag or just a global flag)
    # For demo, we check if mixer level is low and we are in 'auto' mode (mocked)
    
    mixer_level = context.get_tag_value("mixer_level")
    if mixer_level is None: return

    if mixer_level < 1000:
        logger.info("Nutrient Control: Mixer level low. Starting batch...")
        
        # 1. Open Dosing Valves (Simulated by writing to simulator registers if they existed)
        # The simulator logic increases mixer level if register 300 is 1.0
        
        await DeviceControlService.send_control_command("mixer_main", "SET", "cmd_mix_start", 1.0)
        
        # Wait for a bit (in a real logic engine, we might not want to block, 
        # but this script runs in a background task so it's okay for short durations)
        # However, better to set state and return.
        
    elif mixer_level > 15000:
        logger.info("Nutrient Control: Mixer full. Stopping batch.")
        await DeviceControlService.send_control_command("mixer_main", "SET", "cmd_mix_start", 0.0)
