import asyncpg
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class PostgresDB:
    _pool = None

    @classmethod
    async def connect(cls):
        if cls._pool is None:
            try:
                dsn = settings.app_config.database.postgres_dsn
                # Inject password from env if needed, or assume it's in DSN
                # Here we assume DSN in config.yaml might need password replacement or is complete.
                # For simplicity, we trust the DSN or env vars.
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
    async def execute(cls, query: str, *args):
        if not cls._pool:
            raise ConnectionError("PostgreSQL pool is not initialized")
        async with cls._pool.acquire() as conn:
            return await conn.execute(query, *args)

    @classmethod
    async def fetch(cls, query: str, *args):
        if not cls._pool:
            raise ConnectionError("PostgreSQL pool is not initialized")
        async with cls._pool.acquire() as conn:
            return await conn.fetch(query, *args)

    @classmethod
    async def fetchrow(cls, query: str, *args):
        if not cls._pool:
            raise ConnectionError("PostgreSQL pool is not initialized")
        async with cls._pool.acquire() as conn:
            return await conn.fetchrow(query, *args)
