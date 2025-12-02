import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from api.websocket_manager import manager
from services.redis_service import RedisService

router = APIRouter()
logger = logging.getLogger(__name__)

# Global task reference to prevent garbage collection
redis_subscriber_task = None

async def redis_subscriber():
    """
    Background task that subscribes to Redis channels and broadcasts to WebSockets.
    """
    redis_service = RedisService()
    redis_client = await redis_service.get_async_client()
    pubsub = redis_client.pubsub()
    
    # Subscribe to all device updates
    await pubsub.psubscribe("updates:*")
    
    logger.info("Redis Subscriber started. Listening for updates...")

    try:
        async for message in pubsub.listen():
            if message["type"] == "pmessage":
                # message['data'] is the JSON string from LogicEngine
                await manager.broadcast(message["data"])
    except Exception as e:
        logger.error(f"Redis Subscriber Error: {e}")
    finally:
        await redis_client.close()

@router.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, maybe handle client messages (e.g. subscribe to specific topics)
            # For now, just wait for disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        manager.disconnect(websocket)

# Startup Event Handler to launch the subscriber
async def start_redis_subscriber():
    global redis_subscriber_task
    redis_subscriber_task = asyncio.create_task(redis_subscriber())
