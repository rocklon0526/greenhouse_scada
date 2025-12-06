def process_tags(tags):
    """
    Project specific logic hook.
    """
    # print("Executing Safety Rules...")
    
    # Check for high temperature
    temp_sensor = tags.get("temp_sensor_01", {})
    temp = temp_sensor.get("value", 0)
    
    if temp > 30:
        print(f"⚠️ [LOGIC HOOK] High Temperature detected ({temp}°C)! Turning ON Fan.")
        if "fan_01" in tags:
            tags["fan_01"]["status"] = "ON"
            # In a real system, we might set a 'command' flag or similar
            # Here we just modify the tag state for simulation
