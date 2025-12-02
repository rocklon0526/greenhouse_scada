import json
import redis
import os
from typing import Any, Dict, Optional

class RedisService:
    def __init__(self, host: str = "redis", port: int = 6379, db: int = 0):
        # Allow overriding via environment variables
        self.host = os.getenv("REDIS_HOST", host)
        self.port = int(os.getenv("REDIS_PORT", port))
        self.db = int(os.getenv("REDIS_DB", db))
        self.client = redis.Redis(host=self.host, port=self.port, db=self.db, decode_responses=True)

    def set_parameter(self, equipment_id: str, param_id: str, value_data: Dict[str, Any]):
        """
        Writes a parameter value to Redis.
        Key: device:{equipment_id}:{param_id}
        Value: JSON string
        """
        key = f"device:{equipment_id}:{param_id}"
        self.client.set(key, json.dumps(value_data))
        
        # Publish update for real-time subscribers
        channel = f"updates:device:{equipment_id}"
        message = {"param_id": param_id, **value_data}
        self.client.publish(channel, json.dumps(message))

    def get_parameter(self, equipment_id: str, param_id: str) -> Optional[Dict[str, Any]]:
        """
        Reads a parameter value from Redis.
        """
        key = f"device:{equipment_id}:{param_id}"
        data = self.client.get(key)
        if data:
            return json.loads(data)
        return None

    def set_active_alarms(self, rule_id: str, alarm_data: Dict[str, Any]):
        """
        Updates an active alarm in the hash.
        Key: alarms:active
        Field: rule_id
        """
        self.client.hset("alarms:active", rule_id, json.dumps(alarm_data))

    def clear_active_alarm(self, rule_id: str):
        """
        Removes an alarm from the active hash.
        """
        self.client.hdel("alarms:active", rule_id)

    def get_all_active_alarms(self) -> Dict[str, Any]:
        """
        Returns all active alarms.
        """
        all_alarms = self.client.hgetall("alarms:active")
        return {k: json.loads(v) for k, v in all_alarms.items()}

    def acknowledge_alarm(self, rule_id: str, ack_user: str = "operator"):
        """
        Updates an active alarm to acknowledged state.
        """
        data_str = self.client.hget("alarms:active", rule_id)
        if data_str:
            data = json.loads(data_str)
            data["status"] = "ACTIVE_ACKED"
            data["ack_time"] = __import__("time").time()
            data["ack_user"] = ack_user
            
            self.client.hset("alarms:active", rule_id, json.dumps(data))
            
            # Publish update
            self.client.publish("updates:alarms", json.dumps({
                "type": "alarm_ack",
                "rule_id": rule_id,
                "data": data
            }))

    def publish_update(self, channel: str, message: Dict[str, Any]):
        """
        Publishes a message to a Redis channel.
        """
        self.client.publish(channel, json.dumps(message))

    async def get_async_client(self):
        """
        Returns an async Redis client for FastAPI/AsyncIO context.
        """
        import redis.asyncio as aioredis
        return aioredis.Redis(host=self.host, port=self.port, db=self.db, decode_responses=True)

    def health_check(self) -> bool:
        try:
            return self.client.ping()
        except redis.ConnectionError:
            return False
