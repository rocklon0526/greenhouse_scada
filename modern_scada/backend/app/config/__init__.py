import yaml
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class DatabaseConfig(BaseModel):
    postgres_dsn: str
    sqlite_path: str

class PLCConnection(BaseModel):
    name: str
    host: str
    port: int
    poll_interval: float

class PLCConfig(BaseModel):
    connections: List[PLCConnection]

class SecurityConfig(BaseModel):
    algorithm: str
    access_token_expire_minutes: int

class TagConfig(BaseModel):
    name: str
    address: int
    type: str
    unit: str
    connection_name: Optional[str] = None

class AlarmConfig(BaseModel):
    tag_name: str
    type: str
    threshold: float
    message: str

class AppConfig(BaseModel):
    database: DatabaseConfig
    plc: PLCConfig
    security: SecurityConfig
    tags: List[TagConfig]
    alarms: List[AlarmConfig]

class Settings(BaseSettings):
    SECRET_KEY: str
    DB_PASSWORD: str
    
    # Placeholder for loaded config
    app_config: Optional[AppConfig] = None

    model_config = {"env_file": ".env", "extra": "ignore"}

def load_config(path: str = "config.yaml") -> AppConfig:
    with open(path, "r") as f:
        config_data = yaml.safe_load(f)
    return AppConfig(**config_data)

settings = Settings()
settings.app_config = load_config()
