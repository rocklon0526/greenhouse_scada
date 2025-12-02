from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager
from app.config import settings
from jose import jwt, JWTError

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    username = "anonymous"
    ip = websocket.client.host if websocket.client else "unknown"
    
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.app_config.security.algorithm])
            username = payload.get("sub", "anonymous")
        except JWTError:
            # Invalid token, we can choose to reject or allow as anonymous
            # For now, let's allow but log
            pass

    await manager.connect(websocket, ip=ip, username=username)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
