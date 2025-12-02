# Redis Real-time Data Schema

This document defines the key structure and data format for storing real-time SCADA data in Redis.

## 1. Key Namespaces

We use a hierarchical key structure separated by colons (`:`).

### 1.1. Device State (Hot Data)
Stores the current value of every parameter. This is the "Live" view of the system.

-   **Key Pattern**: `device:{equipment_id}:{parameter_id}`
-   **Value**: JSON String (or simple string/number if preferred, but JSON allows metadata)
-   **Example**:
    -   Key: `device:fan_01:speed_pv`
    -   Value: `{"value": 1200.5, "timestamp": 1701440000.123, "quality": "Good"}`

### 1.2. Active Alarms
Stores the list of currently active alarms.

-   **Key Pattern**: `alarms:active`
-   **Type**: Redis Hash (HSET)
    -   **Field**: `{rule_id}`
    -   **Value**: JSON String of `ActiveAlarmState`
-   **Example**:
    -   Field: `alm_vib_hi`
    -   Value: `{"ruleId": "alm_vib_hi", "triggerTime": ..., "status": "Active_Unacked", ...}`

### 1.3. System Health
Stores the heartbeat of the backend services.

-   **Key Pattern**: `system:health:{service_name}`
-   **Value**: Timestamp (float)
-   **TTL**: 10 seconds (Service must update frequently)

## 2. Data Structures

### 2.1. Parameter Value (JSON)
```json
{
  "val": 1200.5,       // The actual value (shortened key for bandwidth)
  "ts": 1701440000.123, // Timestamp
  "q": "Good"          // Quality
}
```

### 2.2. Alarm State (JSON)
Matches `ActiveAlarmState` from Pydantic model.

## 3. Operations

### 3.1. Update Parameter
```python
redis.set(f"device:{equip_id}:{param_id}", json.dumps(value_dict))
```

### 3.2. Publish Update (Pub/Sub)
To notify the API/Frontend immediately, we also publish to a channel.

-   **Channel**: `updates:device:{equipment_id}`
-   **Message**: JSON `{"param_id": "speed_pv", "value": ...}`
