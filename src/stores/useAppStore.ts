import create from 'zustand';
import { StoreState, DeviceState, Rule } from '../types';
import { APP_CONFIG } from '../configs/constants';
import { LayoutConfig } from '../configs/layoutConfig';
import { api } from '../services/api';
import { generateMockData, generateInitialDevices } from '../mocks';

export const useAppStore = create<StoreState>((set, get) => ({
  connectionStatus: 'disconnected',
  lastUpdate: null,
  sensors: [],
  weatherStation: { temp: 0, hum: 0, uv: 0 },
  devices: {},
  rules: [
    { id: 1, name: 'High Temp Alert', condition: '[AND] Indoor Temp > 28°C', action: 'Fans ON', active: true },
  ],
  settings: { autoMode: true, tempThreshold: 28 },
  selectedSensorId: null,
  history: [],

  initSystem: (layoutConfig) => {
    set({ devices: generateInitialDevices(layoutConfig) });

    const fetchData = async () => {
      const state = get();
      if (APP_CONFIG.USE_MOCK) {
        const newSensors = generateMockData(layoutConfig);
        const now = new Date();
        const avgTemp = newSensors.length > 0 ? (newSensors.reduce((acc, s) => acc + s.avgTemp, 0) / newSensors.length) : 0;
        const avgHum = newSensors.length > 0 ? (newSensors.reduce((acc, s) => acc + s.avgHum, 0) / newSensors.length) : 0;
        const avgCo2 = newSensors.length > 0 ? (newSensors.reduce((acc, s) => acc + s.avgCo2, 0) / newSensors.length) : 400;

        const newEntry = {
          time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: avgTemp, hum: avgHum, co2: avgCo2
        };

        set({
          connectionStatus: 'connected',
          lastUpdate: now,
          sensors: newSensors,
          history: [...state.history, newEntry].slice(-20),
          weatherStation: {
            temp: +(30 + Math.random()).toFixed(1),
            hum: +(75 + Math.random() * 5).toFixed(0),
            uv: +(5 + Math.random()).toFixed(1)
          }
        });
      } else {
        const result = await api.fetchStatus(layoutConfig);
        if (result.status === 'success' && result.data) {
          const now = new Date();
          set({
            connectionStatus: 'connected',
            lastUpdate: now,
            sensors: result.data.sensors,
            devices: result.data.devices,
            weatherStation: result.data.weatherStation,
            history: [...state.history, result.data.history].slice(-20)
          });
        } else {
          set({ connectionStatus: 'error' });
        }
      }
    };
    fetchData();
    const interval = setInterval(fetchData, APP_CONFIG.POLLING_INTERVAL || 2000);
    return () => clearInterval(interval);
  },

  controlDevice: async (deviceId, command) => {
    const state = get();
    const originalDevice = state.devices[deviceId];
    if (!originalDevice) return;

    const nextDeviceState: DeviceState = {
      ...originalDevice,
      ...command,
      params: { ...originalDevice.params, ...(command.params || {}) }
    };

    // Optimistic update
    set(state => ({ devices: { ...state.devices, [deviceId]: nextDeviceState } }));

    if (!APP_CONFIG.USE_MOCK) {
      const result = await api.controlDevice(deviceId, command);
      if (!result.success) {
        // Revert on failure
        set(state => ({ devices: { ...state.devices, [deviceId]: originalDevice } }));
        alert(`Control failed for ${deviceId}`);
      }
    }
  },

  toggleDevice: (deviceId) => {
    const state = get();
    const currentStatus = state.devices[deviceId]?.status;
    const nextStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
    get().controlDevice(deviceId, { status: nextStatus });
  },

  setSetting: (key, value) => set(state => ({ settings: { ...state.settings, [key]: value } })),
  toggleRule: (id) => set(state => ({ rules: state.rules.map(r => r.id === id ? {...r, active: !r.active} : r) })),
  addRule: (newRule) => set(state => ({ rules: [...state.rules, { id: Date.now(), active: true, ...newRule } as Rule] })),
  selectSensor: (id) => set({ selectedSensorId: id }),
  clearSelection: () => set({ selectedSensorId: null }),
}));