import asyncio
import os
import json
import yaml
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.postgres import PostgresDB
from app.db.sqlite import SQLiteDB
from app.routers import auth, api, websocket
from app.workers.polling import polling_loop
from app.workers.http_poller import http_polling_loop  # HTTP REST API Poller
from app.workers.forwarder import forwarder_loop
from app.workers.scheduler import start_scheduler
from app.workers.system_monitor import system_monitor_loop
from app.workers.historian import historian_loop
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
    http_polling_task = asyncio.create_task(http_polling_loop())  # HTTP REST API Poller
    forwarder_task = asyncio.create_task(forwarder_loop())
    monitor_task = asyncio.create_task(system_monitor_loop())
    historian_task = asyncio.create_task(historian_loop())
    start_scheduler()
    
    # Initialize Logic Loader
    import os
    from app.services.logic_loader import LogicLoader
    
    project_config_path = os.getenv("SCADA_PROJECT_PATH")
    if project_config_path:
        # Assuming structure: projects/greenhouse/config -> projects/greenhouse/logic
        # config_path is .../config, so logic is .../logic
        project_root = os.path.dirname(project_config_path)
        logic_path = os.path.join(project_root, "logic")
        LogicLoader().load_scripts(logic_path)
    else:
        logger.warning("SCADA_PROJECT_PATH not set. Logic Loader skipped.")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    polling_task.cancel()
    http_polling_task.cancel()
    forwarder_task.cancel()
    monitor_task.cancel()
    historian_task.cancel()
    await PostgresDB.close()

app = FastAPI(title="Modern SCADA Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(api.router, prefix="/api", tags=["API"])
from app.routers import frontend
app.include_router(frontend.router, prefix="/api", tags=["Frontend Adapter"])
from app.routers import users
app.include_router(users.router, prefix="/api", tags=["User Management"])
app.include_router(websocket.router, tags=["Realtime"])
# Vendor Webhook Receiver
from app.routers import webhook
app.include_router(webhook.router, tags=["Webhooks"])
# from api.routes import realtime, control, history, alarms
# app.include_router(realtime.router, tags=["Realtime (Redis)"])
# app.include_router(control.router, prefix="/api", tags=["Control"])
# app.include_router(history.router, prefix="/api", tags=["History"])
# app.include_router(alarms.router, prefix="/api", tags=["Alarms"])
# from app.routers import reports
# app.include_router(reports.router, prefix="/api", tags=["Reports"])
# from app.routers import erp
# app.include_router(erp.router, prefix="/api", tags=["ERP Integration"])

# Register Modules (Manual Registration for now)
from modules.mod_recipe.backend import router as recipe_router
app.include_router(recipe_router.router, prefix="/api", tags=["Recipe Module"])

@app.get("/api/config/layout", tags=["Configuration"])
async def get_layout():
    """
    Get the site layout configuration from config.yaml.
    """
    config_path = os.getenv("SCADA_PROJECT_PATH", "projects/greenhouse/config")
    yaml_path = os.path.join(config_path, "config.yaml")
    
    try:
        if os.path.exists(yaml_path):
            with open(yaml_path, "r") as f:
                config = yaml.safe_load(f)
                if "layout" in config:
                    layout_data = config["layout"]
                    # Merge visualization config if present, so frontend receives it
                    if "visualization" in config:
                        layout_data["visualization"] = config["visualization"]
                    return layout_data
    except Exception as e:
        print(f"Error loading config.yaml: {e}")

    # Fallback to site_config.json if yaml fails or layout missing
    json_path = os.path.join(config_path, "site_config.json")
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            return json.load(f)
            
    return {"error": "Layout configuration not found"}

# Start Redis Subscriber
# from api.routes import realtime
# asyncio.create_task(realtime.start_redis_subscriber())

@app.get("/")
async def root():
    return {"message": "SCADA Backend Online"}
