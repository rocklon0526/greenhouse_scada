import asyncio
import asyncpg
import os

async def update_password():
    dsn = os.getenv("DATABASE_URL", "postgresql://postgres:password@timeseries-db:5432/scada")
    print(f"Connecting to {dsn}...")
    try:
        conn = await asyncpg.connect(dsn)
        print("Connected.")
        
        # New hash for 'admin'
        new_hash = "$2b$12$Sx4m5bPdJsS32crvhWP7DerZ83VSbFFwfV8P5WCUSAIN4AmpCkNWO"
        
        await conn.execute("UPDATE users SET hashed_password = $1 WHERE username = 'admin'", new_hash)
        print("Password updated successfully.")
        
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(update_password())
