import aiosqlite
from app.config import settings
import logging
import os

logger = logging.getLogger(__name__)

class SQLiteDB:
    _db_path = None

    @classmethod
    async def init(cls):
        cls._db_path = settings.app_config.database.sqlite_path
        # Ensure directory exists
        os.makedirs(os.path.dirname(cls._db_path), exist_ok=True)
        
        async with aiosqlite.connect(cls._db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS buffer (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT NOT NULL,
                    params TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.commit()
        logger.info(f"Initialized SQLite buffer at {cls._db_path}")

    @classmethod
    async def execute(cls, query: str, params: tuple):
        async with aiosqlite.connect(cls._db_path) as db:
            await db.execute(query, params)
            await db.commit()

    @classmethod
    async def fetch_all(cls, query: str, params: tuple = ()):
        async with aiosqlite.connect(cls._db_path) as db:
            async with db.execute(query, params) as cursor:
                return await cursor.fetchall()
