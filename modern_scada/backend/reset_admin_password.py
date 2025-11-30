import asyncio
import asyncpg
from app.auth.security import get_password_hash

# DSN from docker-compose.yml
DSN = "postgresql://postgres:password@timeseries-db:5432/scada"

async def reset_password():
    print("Connecting to database...")
    try:
        conn = await asyncpg.connect(DSN)
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    username = "admin"
    new_password = "admin123"
    
    print(f"Generating new hash for user '{username}'...")
    # We still use get_password_hash to ensure compatibility with the app's verification
    hashed_pw = get_password_hash(new_password)
    
    print(f"Updating database...")
    query = "UPDATE users SET hashed_password = $1 WHERE username = $2"
    result = await conn.execute(query, hashed_pw, username)
    
    print(f"Result: {result}")
    await conn.close()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(reset_password())
