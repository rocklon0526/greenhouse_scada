from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.db.postgres import PostgresDB

router = APIRouter()

@router.get("/history")
async def get_history(
    tag_id: str = Query(..., description="Tag ID (e.g. fan_01:speed)"),
    start_time: Optional[datetime] = Query(None, description="Start time (ISO format)"),
    end_time: Optional[datetime] = Query(None, description="End time (ISO format)"),
    limit: int = Query(100, description="Max records to return")
):
    """
    Fetch historical data for a specific tag.
    """
    query = """
        SELECT time, value 
        FROM sensor_data 
        WHERE tag_name = $1
    """
    params = [tag_id]
    
    if start_time:
        query += " AND time >= $2"
        params.append(start_time)
        
    if end_time:
        # Adjust parameter index based on whether start_time was present
        idx = len(params) + 1
        query += f" AND time <= ${idx}"
        params.append(end_time)
        
    query += " ORDER BY time DESC LIMIT $" + str(len(params) + 1)
    params.append(limit)
    
    try:
        rows = await PostgresDB.fetch(query, *params)
        return [
            {"time": row["time"], "value": row["value"]}
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
