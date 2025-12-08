// @ts-ignore: 解決 Zustand v3 在 ESM 環境下的型別定義與執行時行為不一致的問題
import { create } from 'zustand';
import { StoreState, DeviceState, Rule } from '../types';
import { APP_CONFIG } from '../configs/constants';
import { api, mapApiDataToState } from '../services/api';
import { generateMockData, generateInitialDevices } from '../mocks';
import { DosingTank, RackNutrientTank, Recipe, MixerState, Chemical } from '../types/farming';
import { LayoutConfig, WAREHOUSE_LAYOUT } from '../configs/layoutConfig';
import { Language } from '../i18n/translations';

// Extend the base state
interface ExtendedStore extends StoreState {
  dosingTanks: DosingTank[];
  rackTanks: Record<string, RackNutrientTank>;
  recipes: Recipe[];
  chemicals: Chemical[]; // New Chemical Master List
  language: Language;
  userRole: string | null;
  userName: string | null;

  mixerData: MixerState;
  envControl: {
    status: 'IDLE' | 'RUNNING';
    timer: number;
    activeRuleId: number | null;
  };

  selectedDosingTankId: number | null;
  selectedRackTankId: string | null;
  isMixerSelected: boolean;
  setUserName: (name: string) => void;

  toggleMixerValve: () => void;
  toggleMixerPump: () => void;
  toggleRackTankValve: (rackId: string) => void;

  startMixingProcess: (recipeId: string) => Promise<void>;
  startTransferProcess: (targetRackId: string) => Promise<void>;

  // Rule Management
  reorderRules: (fromIndex: number, toIndex: number) => void;
  saveRules: () => Promise<void>;

  simulatePLCLogic: () => void;

  selectDosingTank: (id: number | null) => void;
  selectRackTank: (id: string | null) => void;
  selectMixer: (isSelected: boolean) => void;

  clearSelection: () => void;

  updateFromWebSocket: (data: any, layoutConfig: LayoutConfig) => void;
  initSystem: () => (() => void);

  controlDevice: (deviceId: string, command: Partial<DeviceState>) => Promise<void>;
  toggleDevice: (deviceId: string) => void;
  setSetting: (key: string, value: any) => void;
  toggleRule: (id: number) => void;
  addRule: (newRule: Partial<Rule>) => void;
  selectSensor: (id: string | null) => void;

  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  updateDosingTank: (id: number, data: Partial<DosingTank>) => void;
  setLanguage: (lang: Language) => void;
  setUserRole: (role: string) => void;

  // Chemical Actions
  addChemical: (chemical: Chemical) => void;
  updateChemical: (id: string, data: Partial<Chemical>) => void;
  deleteChemical: (id: string) => void;

  layoutConfig: LayoutConfig | null;
}

// 建立 Store (內部使用 any 規避檢查)
const store = create<ExtendedStore>((set: any, get: any) => {
  // Initial Rack Tanks Setup
  const initialRackTanks: Record<string, RackNutrientTank> = {};
  const racks = WAREHOUSE_LAYOUT.racks;
  racks.forEach((rack: any) => {
    initialRackTanks[rack.id] = {
      rackId: rack.id,
      position: [rack.position[0], 0, rack.position[2] + (rack.length / 2) + 12],
      level: 1,
      ph: 5.8,
      ec: 1.5,
      valveOpen: false,
      pumpActive: false,
      status: 'IDLE'
    };
  });

  // Initial Chemicals
  const initialChemicals: Chemical[] = [
    { id: 'chem_1', name: 'Nitrate Potassium', formula: 'KNO3', description: 'Provides Nitrogen and Potassium' },
    { id: 'chem_2', name: 'Nitrate Calcium', formula: 'Ca(NO3)2', description: 'Provides Nitrogen and Calcium' },
    { id: 'chem_3', name: 'Sulfate Magnesium', formula: 'MgSO4', description: 'Provides Magnesium and Sulfur' },
    { id: 'chem_4', name: 'Ammonium Phosphate', formula: 'NH4H2PO4', description: 'Provides Nitrogen and Phosphorus' },
    { id: 'chem_5', name: 'EDTA Iron', formula: 'Fe-EDTA', description: 'Iron Chelate' },
    { id: 'chem_6', name: 'Micro Elements', formula: 'Mix', description: 'Trace elements mix' },
  ];

  // Initial Dosing Tanks with Chemical Links
  const initialDosingTanks = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: `Tank ${i + 1}`,
    capacity: 1000,
    currentLevel: 85 - (i * 5),
    ph: 6.0,
    ec: 1.2,
    chemicalType: initialChemicals[i]?.name || 'Empty',
    chemicalId: initialChemicals[i]?.id
  }));

  // Initial Lettuce Recipe
  const lettuceRecipe: Recipe = {
    id: 'lettuce_recipe_1',
    name: 'Lettuce (Yamazaki)',
    targetWaterVolume: 1, // 1 Ton (1000L)
    ingredients: [
      { dosingTankId: 1, ratio: 3333.33, weight: 300 }, // KNO3 300g
      { dosingTankId: 2, ratio: 2127.66, weight: 470 }, // Ca(NO3)2 470g
      { dosingTankId: 3, ratio: 4000, weight: 250 }, // MgSO4 250g
      { dosingTankId: 4, ratio: 12500, weight: 80 }, // NH4H2PO4 80g
      { dosingTankId: 5, ratio: 50000, weight: 20 }, // Fe-EDTA 20g
    ],
    createdAt: new Date().toLocaleDateString()
  };

  return {
    connectionStatus: 'disconnected',
    lastUpdate: null,
    sensors: [],
    weatherStation: { temp: 0, hum: 0, uv: 0 },
    devices: {},
    rules: [
      { id: 1, name: 'High Temp Alert', condition: '[AND] Indoor Temp > 28°C', action: 'Fans ON', active: true },
      { id: 2, name: 'High Humidity Alert', condition: '[OR] Indoor Hum > 80%', action: 'Fans ON', active: true },
    ],
    settings: { autoMode: true, tempThreshold: 28, humThreshold: 80, schedules: [] },
    selectedSensorId: null,
    history: [],

    dosingTanks: initialDosingTanks,
    rackTanks: initialRackTanks,
    recipes: [lettuceRecipe],
    chemicals: initialChemicals,
    language: 'zh',
    userRole: (localStorage.getItem('role') || null) as string | null,
    userName: (localStorage.getItem('username') || null) as string | null,

    selectedDosingTankId: null,
    selectedRackTankId: null,
    isMixerSelected: false,

    layoutConfig: null,

    mixerData: {
      level: 8500,
      ph: 5.8,
      ec: 1.2,
      status: 'Ready',
      isMixing: false,
      valveOpen: false,
      pumpActive: false,
      currentRecipeId: undefined,
      progress: 0
    },

    envControl: {
      status: 'IDLE',
      timer: 0,
      activeRuleId: null
    },

    initSystem: () => {
      // Initial fetch
      const fetchInitialStatus = async () => {
        try {
          // 1. Fetch Layout Config
          const configRes = await fetch('/api/config/layout');
          const layoutConfig = await configRes.json();
          set({ layoutConfig });

          // 2. Fetch Status using layout config
          const result = await api.fetchStatus(layoutConfig);
          if (result.status === 'success' && result.data) {
            const now = new Date();
            set((state: ExtendedStore) => ({
              connectionStatus: 'connected',
              lastUpdate: now,
              sensors: result.data.sensors,
              devices: result.data.devices,
              weatherStation: result.data.weatherStation,
              history: [...state.history, result.data.history].slice(-20),
              ...(result.data.mixer && { mixerData: result.data.mixer }),
              ...(result.data.rackTanks && { rackTanks: result.data.rackTanks }),
            }));
          } else {
            set({ connectionStatus: 'error' });
          }
        } catch (e) {
          console.error("Failed to init system", e);
          set({ connectionStatus: 'error' });
        }
      };

      fetchInitialStatus();

      // Start simulation loop if using mock
      let intervalId: any = null;
      if (APP_CONFIG.USE_MOCK) {
        intervalId = setInterval(() => {
          get().simulatePLCLogic();

          // Update history periodically
          const state = get();
          const now = new Date();
          if (state.sensors.length > 0) {
            const avgTemp = state.sensors.reduce((acc: number, s: any) => acc + s.avgTemp, 0) / state.sensors.length;
            const avgHum = state.sensors.reduce((acc: number, s: any) => acc + s.avgHum, 0) / state.sensors.length;
            const avgCo2 = state.sensors.reduce((acc: number, s: any) => acc + s.avgCo2, 0) / state.sensors.length;

            const newEntry = {
              time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              temp: avgTemp, hum: avgHum, co2: avgCo2
            };
            set((s: ExtendedStore) => ({ history: [...s.history, newEntry].slice(-20) }));
          }
        }, 2000);
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    },

    updateFromWebSocket: (data: any, layoutConfig: LayoutConfig) => {
      const state = get();
      const mapped = mapApiDataToState(data, layoutConfig);
      set({
        connectionStatus: 'connected',
        lastUpdate: new Date(),
        sensors: mapped.sensors,
        devices: mapped.devices,
        weatherStation: mapped.weatherStation,
        history: [...state.history, mapped.history].slice(-20),
        ...(mapped.mixer && { mixerData: mapped.mixer }),
        ...(mapped.rackTanks && { rackTanks: mapped.rackTanks }),
      });
    },

    simulatePLCLogic: () => {
      set((state: any) => {
        const newState: any = {};

        // Environment Control Logic
        if (state.settings.autoMode) {
          if (state.envControl.status === 'RUNNING') {
            const newTimer = state.envControl.timer - 1;
            if (newTimer <= 0) {
              // Turn off fans
              const fanKeys = Object.keys(state.devices).filter(k => k.startsWith('fan'));
              fanKeys.forEach(k => {
                state.devices[k].status = 'OFF';
                state.devices[k].lastChanged = Date.now();
              });
              newState.envControl = { status: 'IDLE', timer: 0, activeRuleId: null };
              newState.devices = { ...state.devices };
            } else {
              newState.envControl = { ...state.envControl, timer: newTimer };
            }
          } else {
            // Check rules
            let currentTemp = 0;
            let currentHum = 0;
            if (state.sensors.length > 0) {
              currentTemp = state.sensors.reduce((acc: number, s: any) => acc + s.avgTemp, 0) / state.sensors.length;
              currentHum = state.sensors.reduce((acc: number, s: any) => acc + s.avgHum, 0) / state.sensors.length;
            }

            const isHighTemp = currentTemp > state.settings.tempThreshold;
            const isHighHum = currentHum > state.settings.humThreshold;

            if (isHighTemp || isHighHum) {
              const matchedRule = state.rules.find((rule: Rule) => {
                if (!rule.active) return false;
                if (isHighTemp && rule.condition.includes('Temp')) return true;
                if (isHighHum && rule.condition.includes('Hum')) return true;
                return false;
              });

              if (matchedRule) {
                if (matchedRule.action.includes('Fans ON')) {
                  const fanKeys = Object.keys(state.devices).filter(k => k.startsWith('fan'));
                  fanKeys.forEach(k => {
                    state.devices[k].status = 'ON';
                    state.devices[k].lastChanged = Date.now();
                  });
                }
                newState.envControl = {
                  status: 'RUNNING',
                  timer: 5,
                  activeRuleId: matchedRule.id
                };
                newState.devices = { ...state.devices };
              }
            }
          }
        } else {
          if (state.envControl.status !== 'IDLE') {
            newState.envControl = { status: 'IDLE', timer: 0, activeRuleId: null };
          }
        }

        // Mixer Logic
        const newMixerData = { ...state.mixerData };
        if (newMixerData.status === 'Mixing') {
          if ((newMixerData.progress || 0) < 100) {
            newMixerData.progress = (newMixerData.progress || 0) + 10;
            newMixerData.ec = +(newMixerData.ec + (Math.random() * 0.1 - 0.05)).toFixed(2);
          } else {
            newMixerData.status = 'Ready';
            newMixerData.isMixing = false;
            newMixerData.progress = 0;

            if (newMixerData.currentRecipeId) {
              const recipe = state.recipes.find((r: Recipe) => r.id === newMixerData.currentRecipeId);
              if (recipe) {
                const updatedTanks = state.dosingTanks.map((tank: DosingTank) => {
                  const ingredient = recipe.ingredients.find((i: any) => i.dosingTankId === tank.id);
                  if (ingredient) {
                    const deductLiters = ingredient.weight / 1000;
                    const deductPercent = (deductLiters / tank.capacity) * 100;
                    let newLevel = Math.max(0, tank.currentLevel - deductPercent);
                    if (newLevel < 20) {
                      console.warn(`⚠️ ALARM: Tank ${tank.id} (${tank.name}) level is low! (${newLevel.toFixed(1)}%)`);
                    }
                    return { ...tank, currentLevel: parseFloat(newLevel.toFixed(1)) };
                  }
                  return tank;
                });
                newState.dosingTanks = updatedTanks;
              }
            }
          }
          newState.mixerData = newMixerData;
        }

        // Rack Tank Logic
        const newRackTanks = { ...state.rackTanks };
        Object.keys(newRackTanks).forEach(key => {
          const tank = newRackTanks[key];
          if (tank.status === 'FILLING') {
            if (tank.level < 4) {
              tank.level = Math.min(4, tank.level + 0.05); // Smooth fill
            } else {
              tank.status = 'IDLE';
              tank.valveOpen = false;
            }
          } else {
            // Consume nutrient slowly
            if (Math.random() > 0.8 && tank.level > 0) {
              tank.level = Math.max(0, tank.level - 0.05); // Smooth drain
            }
          }
        });
        newState.rackTanks = newRackTanks;

        return newState;
      });
    },

    // Actions
    setUserName: (name: string) => set({ userName: name }),
    toggleMixerValve: () => set((state: ExtendedStore) => ({ mixerData: { ...state.mixerData, valveOpen: !state.mixerData.valveOpen } })),
    toggleMixerPump: () => set((state: ExtendedStore) => ({ mixerData: { ...state.mixerData, pumpActive: !state.mixerData.pumpActive } })),

    startMixingProcess: async (recipeId: string) => {
      set((state: ExtendedStore) => ({
        mixerData: { ...state.mixerData, status: 'Mixing', isMixing: true, progress: 0, currentRecipeId: recipeId }
      }));
    },

    startTransferProcess: async (targetRackId: string) => {
      set((state: ExtendedStore) => {
        const tank = state.rackTanks[targetRackId];
        if (!tank) return {};
        return {
          rackTanks: {
            ...state.rackTanks,
            [targetRackId]: { ...tank, status: 'FILLING', valveOpen: true }
          }
        };
      });
    },

    reorderRules: (fromIndex: number, toIndex: number) => {
      set((state: ExtendedStore) => {
        const newRules = [...state.rules];
        const [removed] = newRules.splice(fromIndex, 1);
        newRules.splice(toIndex, 0, removed);
        return { rules: newRules };
      });
    },

    saveRules: async () => {
      console.log('Rules saved to backend');
    },

    selectDosingTank: (id: number | null) => set({ selectedDosingTankId: id, selectedRackTankId: null, isMixerSelected: false, selectedSensorId: null }),
    selectRackTank: (id: string | null) => set({ selectedRackTankId: id, selectedDosingTankId: null, isMixerSelected: false, selectedSensorId: null }),
    selectMixer: (isSelected: boolean) => set({ isMixerSelected: isSelected, selectedDosingTankId: null, selectedRackTankId: null, selectedSensorId: null }),
    selectSensor: (id: string | null) => set({ selectedSensorId: id, selectedDosingTankId: null, selectedRackTankId: null, isMixerSelected: false }),

    clearSelection: () => set({ selectedDosingTankId: null, selectedRackTankId: null, isMixerSelected: false, selectedSensorId: null }),

    controlDevice: async (deviceId: string, command: Partial<DeviceState>) => {
      // Optimistic update
      set((state: ExtendedStore) => ({
        devices: {
          ...state.devices,
          [deviceId]: { ...state.devices[deviceId], ...command }
        }
      }));
      await api.controlDevice(deviceId, command);
    },

    toggleDevice: (deviceId: string) => {
      set((state: ExtendedStore) => {
        const device = state.devices[deviceId];
        const newStatus = device.status === 'ON' ? 'OFF' : 'ON';
        return {
          devices: {
            ...state.devices,
            [deviceId]: { ...device, status: newStatus, lastChanged: Date.now() }
          }
        };
      });
    },

    setSetting: (key: string, value: any) => set((state: ExtendedStore) => ({ settings: { ...state.settings, [key]: value } })),

    toggleRule: (id: number) => set((state: ExtendedStore) => ({
      rules: state.rules.map(r => r.id === id ? { ...r, active: !r.active } : r)
    })),

    addRule: (newRule: Partial<Rule>) => set((state: ExtendedStore) => ({
      rules: [...state.rules, { id: Date.now(), active: true, ...newRule } as Rule]
    })),

    addRecipe: (recipe: Recipe) => set((state: ExtendedStore) => ({ recipes: [...state.recipes, recipe] })),
    deleteRecipe: (id: string) => set((state: ExtendedStore) => ({ recipes: state.recipes.filter(r => r.id !== id) })),

    updateDosingTank: (id: number, data: Partial<DosingTank>) => set((state: ExtendedStore) => ({
      dosingTanks: state.dosingTanks.map(t => t.id === id ? { ...t, ...data } : t)
    })),

    setLanguage: (lang: Language) => set({ language: lang }),
    setUserRole: (role: string) => set({ userRole: role }),

    // Chemical Actions
    addChemical: (chemical: Chemical) => set((state: ExtendedStore) => ({ chemicals: [...state.chemicals, chemical] })),
    updateChemical: (id: string, data: Partial<Chemical>) => set((state: ExtendedStore) => ({
      chemicals: state.chemicals.map(c => c.id === id ? { ...c, ...data } : c)
    })),
    deleteChemical: (id: string) => set((state: ExtendedStore) => ({ chemicals: state.chemicals.filter(c => c.id !== id) })),
    toggleRackTankValve: (rackId: string) => set((state: ExtendedStore) => {
      const tank = state.rackTanks[rackId];
      if (!tank) return {};
      return {
        rackTanks: {
          ...state.rackTanks,
          [rackId]: { ...tank, valveOpen: !tank.valveOpen }
        }
      };
    }),
  };
});

export const useAppStore = store;