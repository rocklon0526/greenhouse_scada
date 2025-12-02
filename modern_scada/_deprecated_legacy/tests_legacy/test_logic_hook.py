import sys
import os
import asyncio

# Add platform/core/backend to path
sys.path.append(os.path.abspath("platform/core/backend"))

from app.services.logic_loader import LogicLoader

async def test_hook():
    print("Testing Logic Hook...")
    
    # Initialize LogicLoader with the project path
    project_path = os.path.abspath("projects/greenhouse")
    os.environ["SCADA_PROJECT_PATH"] = project_path
    
    loader = LogicLoader()
    loader.load_scripts(os.path.join(project_path, "logic"))
    
    # Simulate data
    tags = {
        "temp_sensor_01": {"value": 35.0}, # High temp to trigger rule
        "fan_01": {"status": "OFF"}
    }
    
    print(f"Input Tags: {tags}")
    
    # Execute hooks (synchronous)
    loader.execute_hooks(tags)
    
    print(f"Processed Tags: {tags}")
    
    # Check if fan was turned on by safety_rules.py
    if tags.get("fan_01", {}).get("status") == "ON":
        print("SUCCESS: Fan turned ON by safety rule!")
    else:
        print("FAILURE: Fan NOT turned ON.")

if __name__ == "__main__":
    asyncio.run(test_hook())
