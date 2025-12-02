import asyncio
import json
import logging
from datetime import datetime
from services.redis_service import RedisService
from app.services.data_service import DataService

logger = logging.getLogger(__name__)

async def historian_loop():
    """
    Background worker that subscribes to Redis updates and persists them to the database.
    """
    logger.info("Starting Historian Worker...")
    redis_service = RedisService()
    redis_client = await redis_service.get_async_client()
    pubsub = redis_client.pubsub()

    # Subscribe to all device updates
    await pubsub.psubscribe("updates:*")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "pmessage":
                try:
                    # message['data'] is the JSON string: {"param_id": "speed", "value": 1200, "timestamp": ...}
                    # message['channel'] is "updates:device:{equipment_id}"
                    
                    data = json.loads(message["data"])
                    channel = message["channel"]
                    
                    # Extract equipment_id from channel
                    # Channel format: updates:device:{equipment_id}
                    parts = channel.split(":")
                    if len(parts) >= 3:
                        equipment_id = parts[2]
                        param_id = data.get("param_id")
                        value = data.get("value")
                        timestamp_ts = data.get("timestamp")
                        
                        if equipment_id and param_id and value is not None:
                            # Construct tag_name for DB (e.g., "fan_01:speed")
                            tag_name = f"{equipment_id}:{param_id}"
                            
                            # Convert timestamp
                            if timestamp_ts:
                                timestamp = datetime.fromtimestamp(timestamp_ts)
                            else:
                                timestamp = datetime.utcnow()
                                
                            # Save to DB
                            await DataService.save_sensor_data(tag_name, value, timestamp)
                            # logger.debug(f"Historian saved {tag_name}={value}")
                            
                except Exception as e:
                    logger.error(f"Historian processing error: {e}")
                    
    except Exception as e:
        logger.error(f"Historian connection error: {e}")
    finally:
        await redis_client.close()
