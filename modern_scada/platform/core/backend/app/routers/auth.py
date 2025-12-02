from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.security import verify_password, create_access_token
from app.db.postgres import PostgresDB
from app.schemas.models import Token

router = APIRouter()
import logging
logger = logging.getLogger(__name__)

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user_record = await PostgresDB.fetchrow(
        "SELECT u.username, u.hashed_password, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = $1", 
        form_data.username
    )
    
    if not user_record or not verify_password(form_data.password, user_record['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user_record['username'], "role": user_record['role']}
    )
    return {"access_token": access_token, "token_type": "bearer"}
