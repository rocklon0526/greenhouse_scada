import create from 'zustand';
import { StoreState, DeviceState, Rule } from '../types';
import { APP_CONFIG } from '../configs/constants';
import { api } from '../services/api';
import { generateMockData, generateInitialDevices } from '../mocks';
import { DosingTank, RackNutrientTank, Recipe } from '../types/farming';
import { LayoutConfig } from '../configs/layoutConfig';

// Extend the base state to include Farming/Dosing features
interface ExtendedStore extends StoreState {
  dosingTanks: DosingTank[];
  rackTanks: Record<string, RackNutrientTank>;
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  simulateFillingLogic: () => void;
}

export const useAppStore = create<ExtendedStore>((set, get) => ({
  // --- Existing State ---
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

  // --- New Dosing System State ---
  dosingTanks: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: `Sol. Tank ${i + 1}`,
    capacity: 1000,
    currentLevel: 85 - (i * 5), // Mock initial levels
    ph: 6.0,
    ec: 1.2,
    chemicalType: 'Base'
  })),
  rackTanks: {},
  recipes: [],

  // --- Actions ---
  
  // Merged initSystem: Initializes Devices, Rack Tanks, and starts the Loop
  initSystem: (layoutConfig: LayoutConfig) => {
    // 1. Initialize Standard Devices (Fans, etc.)
    set({ devices: generateInitialDevices(layoutConfig) });

    // 2. Initialize Rack Nutrient Tanks (One per rack)
    const initialRackTanks: Record<string, RackNutrientTank> = {};
    layoutConfig.racks.forEach((rack: any) => {
      // 根據您的需求修改位置：rack.position[2] + (rack.length / 2) + 8.5
      // 這樣會讓養液桶位於層架後方靠近風扇的位置
      initialRackTanks[rack.id] = {
        rackId: rack.id,
        position: [rack.position[0], 0, rack.position[2] + (rack.length / 2) + 8.5], 
        level: 2, // Start at Medium level
        ph: 5.8,
        ec: 1.5,
        valveOpen: false,
        pumpActive: false
      };
    });
    set({ rackTanks: initialRackTanks });

    // 3. Define the Data Fetching & Simulation Function
    const fetchData = async () => {
      // A. Run Simulation Logic (Tank Filling)
      get().simulateFillingLogic();

      // B. Fetch Sensor/Device Data
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

    // 4. Start Interval
    fetchData(); // Run once immediately
    const interval = setInterval(fetchData, APP_CONFIG.POLLING_INTERVAL || 2000);
    return () => clearInterval(interval);
  },

  simulateFillingLogic: () => {
    set((state: ExtendedStore) => {
      const newRackTanks = { ...state.rackTanks };
      Object.keys(newRackTanks).forEach(key => {
        const tank = newRackTanks[key];

        // Simulate consumption (Level drops randomly if valve closed)
        if (!tank.valveOpen && tank.level > 0 && Math.random() > 0.95) {
          tank.level = (tank.level - 1) as any;
        }

        // LOGIC: If Empty (0), Open Valve & Start Pump
        if (tank.level === 0 && !tank.valveOpen) {
          tank.valveOpen = true;
          tank.pumpActive = true;
        }

        // Simulate Filling
        if (tank.valveOpen) {
          // 30% chance to increase level per tick
          if (Math.random() > 0.7) tank.level = (tank.level + 1) as any;
          
          // Stop when Full (4)
          if (tank.level === 4) {
            tank.valveOpen = false;
            tank.pumpActive = false;
          }
        }
      });
      return { rackTanks: newRackTanks };
    });
  },

  controlDevice: async (deviceId: string, command: Partial<DeviceState>) => {
    const state = get();
    const originalDevice = state.devices[deviceId];
    if (!originalDevice) return;

    const nextDeviceState: DeviceState = {
      ...originalDevice,
      ...command,
      params: { ...originalDevice.params, ...(command.params || {}) }
    };

    set((state: ExtendedStore) => ({ devices: { ...state.devices, [deviceId]: nextDeviceState } }));

    if (!APP_CONFIG.USE_MOCK) {
      const result = await api.controlDevice(deviceId, command);
      if (!result.success) {
        set((state: ExtendedStore) => ({ devices: { ...state.devices, [deviceId]: originalDevice } }));
        alert(`Control failed for ${deviceId}`);
      }
    }
  },

  toggleDevice: (deviceId: string) => {
    const state = get();
    const currentStatus = state.devices[deviceId]?.status;
    const nextStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
    get().controlDevice(deviceId, { status: nextStatus });
  },

  setSetting: (key: string, value: any) => set((state: ExtendedStore) => ({ settings: { ...state.settings, [key]: value } })),
  
  toggleRule: (id: number) => set((state: ExtendedStore) => ({ rules: state.rules.map((r: Rule) => r.id === id ? {...r, active: !r.active} : r) })),
  
  addRule: (newRule: Partial<Rule>) => set((state: ExtendedStore) => ({ rules: [...state.rules, { id: Date.now(), active: true, ...newRule } as Rule] })),
  
  selectSensor: (id: string | null) => set({ selectedSensorId: id }),
  
  clearSelection: () => set({ selectedSensorId: null }),

  addRecipe: (recipe: Recipe) => set((s: ExtendedStore) => ({ recipes: [...s.recipes, recipe] })),
  
  deleteRecipe: (id: string) => set((s: ExtendedStore) => ({ recipes: s.recipes.filter((r: Recipe) => r.id !== id) })),
}));