from app.services.event_processor import EventProcessor
from app.config import settings

class StateBuilder:
    @staticmethod
    def build_system_state():
        processor = EventProcessor()
        tags = processor.tag_values
        
        def get_val(name, default=0.0):
            return tags.get(name, default)

        # 1. Weather
        weather = {
            "temp": get_val("weather_temp"),
            "hum": get_val("weather_hum"),
            "uv": get_val("weather_uv")
        }

        # 2. Sensors
        sensors = []
        for i in range(1, 7):
            sid = f"sensor_{i:02d}"
            # Calculate sensor averages
            s_temps = [get_val(f"{sid}_top_temp"), get_val(f"{sid}_mid_temp"), get_val(f"{sid}_bot_temp")]
            s_hums = [get_val(f"{sid}_top_hum"), get_val(f"{sid}_mid_hum"), get_val(f"{sid}_bot_hum")]
            s_co2s = [get_val(f"{sid}_top_co2"), get_val(f"{sid}_mid_co2"), get_val(f"{sid}_bot_co2")]

            sensors.append({
                "id": sid,
                "avgTemp": round(sum(s_temps) / 3, 2),
                "avgHum": round(sum(s_hums) / 3, 2),
                "avgCo2": round(sum(s_co2s) / 3, 0),
                "details": {
                    "top": {
                        "temp": s_temps[0],
                        "hum": s_hums[0],
                        "co2": s_co2s[0]
                    },
                    "mid": {
                        "temp": s_temps[1],
                        "hum": s_hums[1],
                        "co2": s_co2s[1]
                    },
                    "bot": {
                        "temp": s_temps[2],
                        "hum": s_hums[2],
                        "co2": s_co2s[2]
                    }
                }
            })

        # Calculate Averages
        total_temp = sum(s["details"]["mid"]["temp"] for s in sensors)
        total_hum = sum(s["details"]["mid"]["hum"] for s in sensors)
        total_co2 = sum(s["details"]["mid"]["co2"] for s in sensors)
        count = len(sensors) or 1

        # 3. Devices
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
            "status": "RUNNING" if get_val("process_mix_cmd") == 1.0 else "IDLE",
            "mixStatus": get_val("process_mix_status"),
            "targetVolume": get_val("process_target_volume"),
            "valveOpen": bool(get_val("mixer_valve")),
            "pumpActive": bool(get_val("mixer_pump"))
        }

        # 5. Rack Tanks
        rack_tanks = {}
        for i in ["A", "B", "C"]:
            rack_id = f"rack_{i.lower()}" 
            rack_tanks[f"Rack{i}"] = {
                "rackId": f"Rack{i}",
                "level": int(get_val(f"{rack_id}_level")),
                "ph": get_val(f"{rack_id}_ph"),
                "ec": get_val(f"{rack_id}_ec"),
                "valveOpen": bool(get_val(f"{rack_id}_valve")),
                "status": "RUNNING" if get_val("process_transfer_cmd") == 1.0 and get_val("process_transfer_target") == (1 if i=="A" else 2 if i=="B" else 3) else "IDLE"
            }

        return {
            "avgTemp": round(total_temp / count, 1),
            "avgHum": round(total_hum / count, 1),
            "avgCo2": round(total_co2 / count, 0),
            "sensors": sensors,
            "devices": devices,
            "weather": weather,
            "mixer": mixer,
            "rackTanks": rack_tanks,
            "rawTags": tags
        }
