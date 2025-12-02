import asyncpg
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class PostgresDB:
    _pool = None

    _query_count = 0
    _total_query_time = 0.0
    _last_query_time = 0.0

    @classmethod
    async def connect(cls):
        if cls._pool is None:
            try:
                dsn = settings.app_config.database.postgres_dsn
                cls._pool = await asyncpg.create_pool(dsn)
                logger.info("Connected to PostgreSQL")
            except Exception as e:
                logger.error(f"Failed to connect to PostgreSQL: {e}")
                raise

    @classmethod
    async def close(cls):
        if cls._pool:
            await cls._pool.close()
            logger.info("Closed PostgreSQL connection")

    @classmethod
    async def _track_performance(cls, start_time):
        import time
        duration = time.time() - start_time
        cls._query_count += 1
        cls._total_query_time += duration
        cls._last_query_time = duration

    @classmethod
    def get_stats(cls):
        avg_time = (cls._total_query_time / cls._query_count) if cls._query_count > 0 else 0
        return {
            "query_count": cls._query_count,
            "avg_query_time": avg_time,
            "last_query_time": cls._last_query_time
        }

    @classmethod
    async def execute(cls, query: str, *args):
        import time
        start = time.time()
        if not cls._pool:
            raise ConnectionError("PostgreSQL pool is not initialized")
        async with cls._pool.acquire() as conn:
            res = await conn.execute(query, *args)
            await cls._track_performance(start)
            return res

    @classmethod
    async def fetch(cls, query: str, *args):
        import time
        start = time.time()
        if not cls._pool:
            raise ConnectionError("PostgreSQL pool is not initialized")
        async with cls._pool.acquire() as conn:
            res = await conn.fetch(query, *args)
            await cls._track_performance(start)
            return res

    @classmethod
    async def fetchrow(cls, query: str, *args):
        import time
        start = time.time()
        if not cls._pool:
            raise ConnectionError("PostgreSQL pool is not initialized")
        async with cls._pool.acquire() as conn:
            res = await conn.fetchrow(query, *args)
            await cls._track_performance(start)
            return res
