from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.db.postgres import PostgresDB
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def cleanup_old_data():
    logger.info("Running cleanup task")
    try:
        # Delete data older than 90 days
        await PostgresDB.execute("DELETE FROM sensor_data WHERE time < NOW() - INTERVAL '90 days'")
        logger.info("Cleanup complete")
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")

def start_scheduler():
    # Run every day at 3 AM
    scheduler.add_job(cleanup_old_data, 'cron', hour=3, minute=0)
    scheduler.start()
    logger.info("Scheduler started")
