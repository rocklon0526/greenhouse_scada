from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional
from services.redis_service import RedisService
from app.db.postgres import PostgresDB
from pydantic import BaseModel

router = APIRouter()
redis_service = RedisService()

class AcknowledgeRequest(BaseModel):
    rule_id: str
    user: str = "operator"

@router.get("/alarms/active")
async def get_active_alarms():
    """
    Get all currently active alarms from Redis.
    """
    try:
        alarms = redis_service.get_all_active_alarms()
        # Convert dict to list for frontend
        return [
            {"rule_id": k, **v} 
            for k, v in alarms.items()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alarms/acknowledge")
async def acknowledge_alarm(request: AcknowledgeRequest):
    """
    Acknowledge an active alarm.
    """
    try:
        redis_service.acknowledge_alarm(request.rule_id, request.user)
        return {"status": "success", "message": f"Alarm {request.rule_id} acknowledged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alarms/history")
async def get_alarm_history(
    limit: int = Query(100, description="Max records"),
    offset: int = Query(0, description="Offset")
):
    """
    Get historical alarms from PostgreSQL.
    """
    query = """
        SELECT id, tag_name, alarm_type, start_time, end_time, start_value, message
        FROM alarm_history
        ORDER BY start_time DESC
        LIMIT $1 OFFSET $2
    """
    try:
        rows = await PostgresDB.fetch(query, limit, offset)
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
