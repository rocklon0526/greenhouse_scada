import asyncio
import asyncpg
from app.config import settings

# DSN from docker-compose.yml
DSN = "postgresql://postgres:password@timeseries-db:5432/scada"

async def migrate_roles():
    print("Connecting to database...")
    try:
        conn = await asyncpg.connect(DSN)
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    print("Migrating roles...")
    
    # 1. Ensure new roles exist
    await conn.execute("INSERT INTO roles (name) VALUES ('sysadmin'), ('user') ON CONFLICT (name) DO NOTHING")
    
    # 2. Get IDs
    roles = await conn.fetch("SELECT id, name FROM roles")
    role_map = {r['name']: r['id'] for r in roles}
    
    print(f"Current roles: {role_map}")
    
    # 3. Migrate users
    # admin -> sysadmin
    if 'admin' in role_map and 'sysadmin' in role_map:
        await conn.execute("UPDATE users SET role_id = $1 WHERE role_id = $2", role_map['sysadmin'], role_map['admin'])
        print("Migrated admin -> sysadmin")
        
    # operator -> admin (keep admin role name but it means Project Admin now)
    # Wait, 'admin' role already exists in DB. 
    # If we mapped old 'admin' users to 'sysadmin', now 'admin' role is empty of users?
    # No, we just moved them.
    # Now we want old 'operator' users to be 'admin' (Project Admin).
    if 'operator' in role_map and 'admin' in role_map:
        await conn.execute("UPDATE users SET role_id = $1 WHERE role_id = $2", role_map['admin'], role_map['operator'])
        print("Migrated operator -> admin")
        
    # viewer -> user
    if 'viewer' in role_map and 'user' in role_map:
        await conn.execute("UPDATE users SET role_id = $1 WHERE role_id = $2", role_map['user'], role_map['viewer'])
        print("Migrated viewer -> user")

    # 4. Cleanup old roles (optional, might fail if constraints exist, but we moved users so should be fine)
    # We keep 'admin' as it is reused.
    await conn.execute("DELETE FROM roles WHERE name IN ('operator', 'viewer')")
    print("Cleaned up old roles")
    
    await conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(migrate_roles())
