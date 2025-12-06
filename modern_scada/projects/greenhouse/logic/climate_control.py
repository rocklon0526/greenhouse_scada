import logging
from app.services.device_control_service import DeviceControlService

logger = logging.getLogger(__name__)

async def run(context):
    """
    Climate Control Logic
    Triggers fans and water walls if temp > 28 and humidity < 80.
    """
    # 1. Get Sensor Data
    # Calculate average temp from available sensors
    temps = []
    hums = []
    
    # Try to get data for sensor 1 (top/mid/bot)
    for level in ['top', 'mid', 'bot']:
        t = context.get_tag_value(f"sensor_01_{level}_temp")
        h = context.get_tag_value(f"sensor_01_{level}_hum")
        if t is not None: temps.append(t)
        if h is not None: hums.append(h)

    if not temps:
        return

    avg_temp = sum(temps) / len(temps)
    avg_hum = sum(hums) / len(hums) if hums else 0
    
    logger.info(f"Climate Control: Avg Temp={avg_temp:.1f}, Avg Hum={avg_hum:.1f}")

    # 2. Logic
    target_state = 0.0
    if avg_temp > 28.0 and avg_hum < 80.0:
        target_state = 1.0 # ON
        logger.info("Climate Control: High Temp & Low Hum -> Cooling ON")
    else:
        logger.info("Climate Control: Conditions OK -> Cooling OFF")

    # 3. Execute Control
    # Control Fans
    await DeviceControlService.send_control_command("fan_01", "SET", "status", target_state)
    await DeviceControlService.send_control_command("fan_02", "SET", "status", target_state)
    
    # Control Water Walls
    await DeviceControlService.send_control_command("ww_01", "SET", "status", target_state)
    await DeviceControlService.send_control_command("ww_02", "SET", "status", target_state)
