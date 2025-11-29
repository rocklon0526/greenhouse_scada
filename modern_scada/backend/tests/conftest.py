import pytest
from httpx import AsyncClient
from app.main import app
from app.db.postgres import PostgresDB
from app.db.sqlite import SQLiteDB

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="module")
async def client():
    # Mock DB connections or use a test DB
    # For simplicity in this environment, we might mock the DB methods
    # But let's assume we want to test the API logic.
    # We can patch PostgresDB to avoid actual connection if no DB is running.
    
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c
