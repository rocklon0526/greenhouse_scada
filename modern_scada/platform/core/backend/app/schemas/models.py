from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    role: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None

class UserInDB(User):
    hashed_password: str

class SensorData(BaseModel):
    tag_name: str
    value: float
    timestamp: datetime

class Alarm(BaseModel):
    id: int
    tag_name: str
    alarm_type: str
    start_time: datetime
    end_time: Optional[datetime]
    start_value: float
    end_value: Optional[float]
    message: str

class PLCWrite(BaseModel):
    address: int
    value: float
    connection_name: Optional[str] = None
