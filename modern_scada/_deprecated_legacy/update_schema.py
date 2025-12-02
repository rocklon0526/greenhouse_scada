import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@timeseries-db:5432/scada")

async def update_schema():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Check if description column exists
        row = await conn.fetchrow("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='roles' AND column_name='description'
        """)
        
        if not row:
            print("Adding 'description' column to 'roles' table...")
            await conn.execute("ALTER TABLE roles ADD COLUMN description TEXT")
            
            # Update descriptions for existing roles
            await conn.execute("UPDATE roles SET description = 'System Administrator' WHERE name = 'sysadmin'")
            await conn.execute("UPDATE roles SET description = 'Administrator' WHERE name = 'admin'")
            await conn.execute("UPDATE roles SET description = 'Standard User' WHERE name = 'user'")
            
            print("Schema updated successfully.")
        else:
            print("'description' column already exists.")
            
        await conn.close()
    except Exception as e:
        print(f"Error updating schema: {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
