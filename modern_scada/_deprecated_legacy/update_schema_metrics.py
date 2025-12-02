import asyncio
import asyncpg
import os

DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
DB_NAME = os.getenv("POSTGRES_DB", "scada")
DB_HOST = "timeseries-db"  # Use container name for internal connection
DB_PORT = "5432"

async def update_schema():
    print(f"Connecting to database {DB_NAME} at {DB_HOST}:{DB_PORT}...")
    try:
        conn = await asyncpg.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            host=DB_HOST,
            port=DB_PORT
        )
        
        print("Creating system_metrics table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS system_metrics (
                time TIMESTAMP WITH TIME ZONE NOT NULL,
                cpu_usage DOUBLE PRECISION,
                ram_usage DOUBLE PRECISION,
                disk_usage DOUBLE PRECISION,
                active_users INTEGER,
                PRIMARY KEY (time)
            );
            CREATE INDEX IF NOT EXISTS idx_system_metrics_time ON system_metrics (time DESC);
        """)
        
        print("Schema update completed successfully.")
        await conn.close()
        
    except Exception as e:
        print(f"Error updating schema: {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
