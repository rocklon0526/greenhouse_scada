// src/types/store.ts
import { LayoutConfig } from '../configs/layoutConfig';
import { SensorData } from './sensors';
import { DeviceState } from './devices';
import { Rule } from './rules';

export interface AppState {
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  sensors: SensorData[];
  weatherStation: { temp: number; hum: number; uv: number };
  devices: Record<string, DeviceState>;
  rules: Rule[];
  settings: { autoMode: boolean; tempThreshold: number };
  selectedSensorId: string | null;
  history: Array<{ time: string; temp: number; hum: number; co2: number }>;
}

export interface AppActions {
  initSystem: (layout: LayoutConfig) => void;
  controlDevice: (deviceId: string, command: Partial<DeviceState>) => Promise<void>;
  toggleDevice: (deviceId: string) => void;
  setSetting: (key: string, value: any) => void;
  toggleRule: (id: number) => void;
  addRule: (newRule: Partial<Rule>) => void;
  selectSensor: (id: string | null) => void;
  clearSelection: () => void;
}

export type StoreState = AppState & AppActions;
