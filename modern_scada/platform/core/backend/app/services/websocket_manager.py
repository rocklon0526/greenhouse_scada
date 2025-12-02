from fastapi import WebSocket
from typing import List, Dict
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_details: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, ip: str = "unknown", username: str = "anonymous"):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_details[websocket] = {
            "ip": ip,
            "username": username,
            "connected_at": datetime.utcnow().isoformat()
        }
        logger.info(f"WebSocket connected: {username}@{ip}. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            if websocket in self.connection_details:
                del self.connection_details[websocket]
            logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        # Iterate over a copy to avoid modification issues during iteration
        for connection in self.active_connections[:]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                self.disconnect(connection)

    def get_active_users(self) -> List[dict]:
        return list(self.connection_details.values())

manager = ConnectionManager()
