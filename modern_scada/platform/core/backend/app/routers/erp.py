from fastapi import APIRouter, BackgroundTasks
from app.services.erp_sync_service import ERPSyncService

router = APIRouter(
    prefix="/erp",
    tags=["ERP Integration"]
)

@router.post("/sync")
async def trigger_sync(background_tasks: BackgroundTasks):
    """
    Triggers an asynchronous ERP synchronization.
    """
    background_tasks.add_task(ERPSyncService.sync_orders)
    return {"message": "ERP Sync started in background"}

@router.get("/status")
async def get_sync_status():
    """
    Returns the status of the last sync operation (Mock).
    """
    return {
        "last_sync": "2023-10-27 10:00:00",
        "status": "Success",
        "orders_synced": 2
    }
