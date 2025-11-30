import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.db.postgres import PostgresDB
from app.db.sqlite import SQLiteDB
from app.routers import auth, api, websocket
from app.workers.polling import polling_loop
from app.workers.forwarder import forwarder_loop
from app.workers.scheduler import start_scheduler
from app.workers.system_monitor import system_monitor_loop
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting SCADA Backend...")
    await PostgresDB.connect()
    await SQLiteDB.init()
    
    # Start Background Workers
    # We use asyncio.create_task to run them in the background
    polling_task = asyncio.create_task(polling_loop())
    forwarder_task = asyncio.create_task(forwarder_loop())
    monitor_task = asyncio.create_task(system_monitor_loop())
    start_scheduler()
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    polling_task.cancel()
    forwarder_task.cancel()
    monitor_task.cancel()
    await PostgresDB.close()

app = FastAPI(title="Modern SCADA Backend", lifespan=lifespan)

app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(api.router, prefix="/api", tags=["API"])
from app.routers import frontend
app.include_router(frontend.router, prefix="/api", tags=["Frontend Adapter"])
from app.routers import users
app.include_router(users.router, prefix="/api", tags=["User Management"])
app.include_router(websocket.router, tags=["Realtime"])

@app.get("/")
async def root():
    return {"message": "SCADA Backend Online"}
