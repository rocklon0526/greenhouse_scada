from enum import Enum
from typing import List, Optional, Dict, Union, Any
from pydantic import BaseModel, Field

# --- Enums (Mapping to TypeScript Union Types) ---

class Severity(str, Enum):
    CRITICAL = 'Critical'
    WARNING = 'Warning'
    INFO = 'Info'

class DataType(str, Enum):
    BOOLEAN = 'boolean'
    NUMBER = 'number'
    STRING = 'string'

class Protocol(str, Enum):
    MODBUS_TCP = 'ModbusTCP'
    OPC_UA = 'OPCUA'
    MQTT = 'MQTT'

class ReadWriteMode(str, Enum):
    READ = 'R'
    WRITE = 'W'
    READ_WRITE = 'RW'

class AlarmType(str, Enum):
    HIHI = 'HiHi'
    HI = 'Hi'
    LO = 'Lo'
    LOLO = 'LoLo'
    DIGITAL_TRUE = 'Digital_True'
    DIGITAL_FALSE = 'Digital_False'

class AlarmStatus(str, Enum):
    ACTIVE_UNACKED = 'Active_Unacked'
    ACTIVE_ACKED = 'Active_Acked'
    CLEARED_UNACKED = 'Cleared_Unacked'
    CLEARED_ACKED = 'Cleared_Acked'

# --- Sub-Models ---

class IOConfig(BaseModel):
    protocol: Protocol
    address: str
    read_write_mode: ReadWriteMode = Field(..., alias="readWriteMode")

class Scaling(BaseModel):
    raw_min: float = Field(..., alias="rawMin")
    raw_max: float = Field(..., alias="rawMax")
    eng_min: float = Field(..., alias="engMin")
    eng_max: float = Field(..., alias="engMax")

class AlarmRule(BaseModel):
    id: str
    type: AlarmType
    setpoint: float
    severity: Severity
    on_delay_seconds: int = Field(default=0, alias="onDelaySeconds")
    hysteresis: Optional[float] = 0.0
    message: str
    enabled: bool = True

# --- Core Parameter Config ---

class ParameterConfig(BaseModel):
    id: str
    name: str
    data_type: DataType = Field(..., alias="dataType")
    unit: Optional[str] = None
    
    # Optional Hardware Config
    io_config: Optional[IOConfig] = Field(None, alias="ioConfig")
    scaling: Optional[Scaling] = None
    
    # Value Mapping (for Enums like 0=Off, 1=Run)
    # Using Dict[str, str] to handle JSON keys which are always strings
    value_map: Optional[Dict[str, str]] = Field(None, alias="valueMap")

    # Logic Config
    deadband: float = 0.0
    scan_rate_ms: Optional[int] = Field(1000, alias="scanRateMs")
    is_read_only: bool = Field(True, alias="isReadOnly")

# --- Maintenance & Runtime ---

class MaintenanceStats(BaseModel):
    total_runtime_hours: float = Field(0.0, alias="totalRuntimeHours")
    cycle_count: int = Field(0, alias="cycleCount")
    last_maintenance_date: Optional[str] = Field(None, alias="lastMaintenanceDate")
    next_maintenance_due_hours: Optional[float] = Field(None, alias="nextMaintenanceDueHours")

class RuntimeValue(BaseModel):
    value: Any  # Can be float, bool, or string
    timestamp: float
    quality: str = "Good"

class ActiveAlarmState(BaseModel):
    rule_id: str = Field(..., alias="ruleId")
    trigger_time: float = Field(..., alias="triggerTime")
    ack_time: Optional[float] = Field(None, alias="ackTime")
    ack_user: Optional[str] = Field(None, alias="ackUser")
    clear_time: Optional[float] = Field(None, alias="clearTime")
    value_at_trigger: float = Field(..., alias="valueAtTrigger")
    status: AlarmStatus

# --- Main Equipment Model ---

class Equipment(BaseModel):
    id: str
    name: str
    type_id: str = Field(..., alias="typeId")
    zone_id: str = Field(..., alias="zoneId")
    
    # Config Data
    parameters: Dict[str, ParameterConfig]
    alarms: Dict[str, List[AlarmRule]] = {}
    
    # Metadata
    maintenance: MaintenanceStats = Field(default_factory=MaintenanceStats)

    # Runtime State (Optional in Config, populated in Runtime)
    state: Dict[str, RuntimeValue] = {}
    
    # Active Alarms
    active_alarms: List[ActiveAlarmState] = Field(default_factory=list, alias="activeAlarms")
    
    class Config:
        # Allows populating models by field name or alias (e.g. readWriteMode)
        populate_by_name = True
