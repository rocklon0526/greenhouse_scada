from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.auth.security import get_current_admin_user, get_password_hash
from app.db.postgres import PostgresDB
from app.schemas.models import User, UserCreate, UserUpdate

router = APIRouter()

@router.get("/users", response_model=List[User])
async def list_users(current_user: User = Depends(get_current_admin_user)):
    query = """
        SELECT u.id, u.username, r.name as role, u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.id
    """
    users = await PostgresDB.fetch(query)
    return [User(**user) for user in users]

@router.get("/roles")
async def list_roles(current_user: User = Depends(get_current_admin_user)):
    query = "SELECT id, name, description FROM roles ORDER BY id"
    roles = await PostgresDB.fetch(query)
    return [dict(role) for role in roles]

@router.post("/users", response_model=User)
async def create_user(user: UserCreate, current_user: User = Depends(get_current_admin_user)):
    # Check if user exists
    existing = await PostgresDB.fetchrow("SELECT id FROM users WHERE username = $1", user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Get role ID
    role_record = await PostgresDB.fetchrow("SELECT id FROM roles WHERE name = $1", user.role)
    if not role_record:
        raise HTTPException(status_code=400, detail=f"Role '{user.role}' not found")
    
    hashed_pw = get_password_hash(user.password)
    
    query = """
        INSERT INTO users (username, hashed_password, role_id)
        VALUES ($1, $2, $3)
        RETURNING id, username, created_at
    """
    new_user = await PostgresDB.fetchrow(query, user.username, hashed_pw, role_record['id'])
    
    return User(
        id=new_user['id'],
        username=new_user['username'],
        role=user.role,
        created_at=new_user['created_at']
    )

@router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: int, user_update: UserUpdate, current_user: User = Depends(get_current_admin_user)):
    # Check if user exists
    current_user_record = await PostgresDB.fetchrow(
        "SELECT u.id, u.username, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1", 
        user_id
    )
    if not current_user_record:
        raise HTTPException(status_code=404, detail="User not found")
    
    updates = []
    values = []
    idx = 1
    
    if user_update.role:
        role_record = await PostgresDB.fetchrow("SELECT id FROM roles WHERE name = $1", user_update.role)
        if not role_record:
            raise HTTPException(status_code=400, detail=f"Role '{user_update.role}' not found")
        updates.append(f"role_id = ${idx}")
        values.append(role_record['id'])
        idx += 1
        
    if user_update.password:
        hashed_pw = get_password_hash(user_update.password)
        updates.append(f"hashed_password = ${idx}")
        values.append(hashed_pw)
        idx += 1
        
    if not updates:
        return User(
            id=current_user_record['id'],
            username=current_user_record['username'],
            role=current_user_record['role']
        )
        
    values.append(user_id)
    query = f"UPDATE users SET {', '.join(updates)} WHERE id = ${idx} RETURNING id, username, role_id, created_at"
    
    updated_record = await PostgresDB.fetchrow(query, *values)
    
    # Fetch role name again
    role_name = user_update.role if user_update.role else current_user_record['role']
    
    return User(
        id=updated_record['id'],
        username=updated_record['username'],
        role=role_name,
        created_at=updated_record['created_at']
    )

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(get_current_admin_user)):
    # Prevent deleting self
    # We need to fetch current user ID first, but `current_user` from dependency only has username/role.
    # So we fetch ID by username.
    admin_record = await PostgresDB.fetchrow("SELECT id FROM users WHERE username = $1", current_user.username)
    if admin_record and admin_record['id'] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await PostgresDB.execute("DELETE FROM users WHERE id = $1", user_id)
    if result == "DELETE 0":
         raise HTTPException(status_code=404, detail="User not found")
         
    return {"message": "User deleted successfully"}
