from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
import time
import logging
from services.redis_service import RedisService

router = APIRouter()
logger = logging.getLogger(__name__)

class WriteRequest(BaseModel):
    device_id: str
    tag_id: str
    value: Any

@router.post("/control/write")
async def write_tag(cmd: WriteRequest):
    """
    Receives control commands from frontend, validates them, and writes to Redis.
    This simulates writing to a PLC.
    """
    logger.info(f"🎮 Control Command: {cmd.device_id}.{cmd.tag_id} -> {cmd.value}")
    
    try:
        # Initialize Redis Service (Sync)
        redis_service = RedisService()
        
        # Construct data payload
        data_payload = {
            "value": cmd.value,
            "timestamp": time.time(),
            "quality": "Good (Manual)"
        }
        
        # Write to Redis and Publish Update
        # This uses the existing set_parameter method which handles both SET and PUBLISH
        redis_service.set_parameter(cmd.device_id, cmd.tag_id, data_payload)
        
        return {"status": "success", "message": "Command sent", "data": data_payload}
        
    except Exception as e:
        logger.error(f"Control Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
