import asyncio
import psutil
import logging
from datetime import datetime
from app.db.postgres import PostgresDB

logger = logging.getLogger(__name__)

async def system_monitor_loop():
    logger.info("System Monitor worker started")
    while True:
        try:
            cpu = psutil.cpu_percent()
            ram = psutil.virtual_memory().percent
            disk = psutil.disk_usage('/').percent
            # For active users, we might need a way to count active sessions or websocket connections.
            # For now, we can leave it as null or implement a counter in websocket manager.
            # Let's just log system stats for now.
            
            query = """
                INSERT INTO system_metrics (time, cpu_usage, ram_usage, disk_usage)
                VALUES ($1, $2, $3, $4)
            """
            await PostgresDB.execute(query, datetime.now(), cpu, ram, disk)
            
        except Exception as e:
            logger.error(f"Error in system monitor loop: {e}")
        
        await asyncio.sleep(5)
