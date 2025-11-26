// src/types/devices.ts
export interface DeviceState {
  status: 'ON' | 'OFF';
  params: Record<string, any>;
  lastChanged?: number | null;
}
