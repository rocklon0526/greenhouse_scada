from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.event_processor import EventProcessor
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    processor = EventProcessor()
    processor.add_subscriber(websocket)
    try:
        while True:
            # Keep connection open
            # We can also listen for client messages if needed (e.g. subscribe to specific tags)
            await websocket.receive_text()
    except WebSocketDisconnect:
        processor.remove_subscriber(websocket)
