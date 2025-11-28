// @ts-ignore: 解決 Zustand v3 在 ESM 環境下的型別定義與執行時行為不一致的問題
import { create } from 'zustand';
import { StoreState, DeviceState, Rule } from '../types';
import { APP_CONFIG } from '../configs/constants';
import { api } from '../services/api';
import { generateMockData, generateInitialDevices } from '../mocks';
import { DosingTank, RackNutrientTank, Recipe, MixerState } from '../types/farming';
import { LayoutConfig } from '../configs/layoutConfig';
import { Language } from '../i18n/translations';

// Extend the base state
interface ExtendedStore extends StoreState {
  dosingTanks: DosingTank[];
  rackTanks: Record<string, RackNutrientTank>;
  recipes: Recipe[];
  language: Language;
  
  selectedDosingTankId: number | null;
  selectedRackTankId: string | null;
  isMixerSelected: boolean;
  
  mixerData: MixerState;

  envControl: {
    status: 'IDLE' | 'RUNNING';
    timer: number;
    activeRuleId: number | null;
  };

  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  updateDosingTank: (id: number, data: Partial<DosingTank>) => void;
  setLanguage: (lang: Language) => void;
  
  toggleMixerValve: () => void;
  toggleMixerPump: () => void;

  startMixingProcess: (recipeId: string) => Promise<void>;
  startTransferProcess: (targetRackId: string) => Promise<void>;
  
  simulatePLCLogic: () => void;

  selectDosingTank: (id: number | null) => void;
  selectRackTank: (id: string | null) => void;
  selectMixer: (isSelected: boolean) => void;
  
  clearSelection: () => void;
}

// 建立 Store (內部使用 any 規避檢查)
const store = create<ExtendedStore>((set: any, get: any) => ({
  connectionStatus: 'disconnected',
  lastUpdate: null,
  sensors: [],
  weatherStation: { temp: 0, hum: 0, uv: 0 },
  devices: {},
  rules: [
    { id: 1, name: 'High Temp Alert', condition: '[AND] Indoor Temp > 28°C', action: 'Fans ON', active: true },
    { id: 2, name: 'High Humidity Alert', condition: '[OR] Indoor Hum > 80%', action: 'Fans ON', active: true },
  ],
  settings: { autoMode: true, tempThreshold: 28, humThreshold: 80 },
  selectedSensorId: null,
  history: [],

  dosingTanks: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: `Sol. Tank ${i + 1}`,
    capacity: 1000,
    currentLevel: 85 - (i * 5),
    ph: 6.0,
    ec: 1.2,
    chemicalType: 'Base'
  })),
  rackTanks: {},
  recipes: [],
  language: 'zh',

  selectedDosingTankId: null,
  selectedRackTankId: null,
  isMixerSelected: false,
  
  mixerData: {
    level: 8500,
    ph: 5.8,
    ec: 1.2,
    status: 'Ready',
    isMixing: false,
    valveOpen: false,
    pumpActive: false,
    progress: 0
  },

  envControl: {
    status: 'IDLE',
    timer: 0,
    activeRuleId: null
  },
  
  initSystem: (layoutConfig: LayoutConfig) => {
    set({ devices: generateInitialDevices(layoutConfig) });

    const initialRackTanks: Record<string, RackNutrientTank> = {};
    layoutConfig.racks.forEach((rack: any) => {
      initialRackTanks[rack.id] = {
        rackId: rack.id,
        position: [rack.position[0], 0, rack.position[2] + (rack.length / 2) + 8.5], 
        level: 1,
        ph: 5.8,
        ec: 1.5,
        valveOpen: false,
        pumpActive: false,
        status: 'IDLE'
      };
    });
    set({ rackTanks: initialRackTanks });

    const fetchData = async () => {
      get().simulatePLCLogic();

      const state = get();
      if (APP_CONFIG.USE_MOCK) {
        const newSensors = generateMockData(layoutConfig);
        const now = new Date();
        const avgTemp = newSensors.length > 0 ? (newSensors.reduce((acc, s: any) => acc + s.avgTemp, 0) / newSensors.length) : 0;
        const avgHum = newSensors.length > 0 ? (newSensors.reduce((acc, s: any) => acc + s.avgHum, 0) / newSensors.length) : 0;
        const avgCo2 = newSensors.length > 0 ? (newSensors.reduce((acc, s: any) => acc + s.avgCo2, 0) / newSensors.length) : 400;

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
            history: [...state.history, result.data.history].slice(-20),
            ...(result.data.mixer && { mixerData: result.data.mixer }),
            ...(result.data.rackTanks && { rackTanks: result.data.rackTanks }),
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

  simulatePLCLogic: () => {
    set((state: any) => {
      const newState: any = {};
      
      if (state.settings.autoMode) {
        if (state.envControl.status === 'RUNNING') {
            const newTimer = state.envControl.timer - 1;
            if (newTimer <= 0) {
                const fanKeys = Object.keys(state.devices).filter(k => k.startsWith('fan'));
                fanKeys.forEach(k => {
                    if (state.devices[k].status === 'ON') {
                        state.devices[k].status = 'OFF';
                        state.devices[k].lastChanged = Date.now();
                    }
                });
                newState.envControl = { status: 'IDLE', timer: 0, activeRuleId: null };
                newState.devices = { ...state.devices }; 
            } else {
                newState.envControl = { ...state.envControl, timer: newTimer };
            }
        } 
        else {
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

      // === 修正部分：傳送與補水邏輯 ===
      const newRackTanks = { ...state.rackTanks };
      let tanksChanged = false;
      let anyTankStillFilling = false; // 用來追蹤是否還有任何一個桶子正在補水

      Object.keys(newRackTanks).forEach(key => {
        const tank = newRackTanks[key];
        
        if (tank.status === 'FILLING') {
           tanksChanged = true;
           // 模擬水位上升
           if (tank.level < 4) {
              if (Math.random() > 0.5) {
                 tank.level = Math.min(4, tank.level + 1) as any;
              }
           } 
           
           // 檢查是否達到滿水位 L4
           if (tank.level === 4) {
              tank.status = 'IDLE';
              tank.valveOpen = false;
              tank.pumpActive = false;
              // 此桶已完成，不計入 anyTankStillFilling
           } else {
              // 此桶尚未完成
              anyTankStillFilling = true;
           }
        }
      });

      // 如果有任何桶子狀態改變，更新 rackTanks
      if (tanksChanged) {
          newState.rackTanks = newRackTanks;
          
          // 如果所有桶子都補滿了 (沒有任何一個還在 FILLING)，則重置 Mixer 狀態
          if (!anyTankStillFilling && state.mixerData.status === 'Transferring') {
              console.log("[PLC] All transfers completed. Resetting Mixer status.");
              newState.mixerData = {
                  ...state.mixerData,
                  status: 'Ready',
                  valveOpen: false,
                  pumpActive: false
              };
          }
      }

      return newState;
    });
  },

  startMixingProcess: async (recipeId: string) => {
    const state = get();
    const recipe = state.recipes.find((r: Recipe) => r.id === recipeId);
    if (!recipe) { alert("Recipe not found!"); return; }
    if (state.mixerData.status === 'Mixing') { alert("System is already mixing!"); return; }

    const insufficientIngredients: string[] = [];
    recipe.ingredients.forEach((ing: any) => {
        const tank = state.dosingTanks.find((t: any) => t.id === ing.dosingTankId);
        if (tank) {
            const requiredLiters = ing.weight / 1000;
            const requiredPercent = (requiredLiters / tank.capacity) * 100;
            if (tank.currentLevel < requiredPercent) {
                insufficientIngredients.push(`${tank.name} (需要: ${requiredPercent.toFixed(1)}%, 現有: ${tank.currentLevel}%)`);
            }
        }
    });

    if (insufficientIngredients.length > 0) {
        alert(`⚠️ 無法開始製程！以下原料不足：\n${insufficientIngredients.join('\n')}`);
        return;
    }

    if (!APP_CONFIG.USE_MOCK) {
       const res = await api.startMixing(recipe);
       if (!res.success) return;
    }

    set((s: any) => ({
      mixerData: { ...s.mixerData, status: 'Mixing', isMixing: true, currentRecipeId: recipeId, progress: 0 }
    }));
    console.log(`[PLC] Recipe ${recipe.name} loaded. Process Started.`);
  },

  startTransferProcess: async (targetRackId: string) => {
    const state = get();
    const targetTank = state.rackTanks[targetRackId];
    if (!targetTank) return;
    if (targetTank.level > 1) {
      alert(`⚠️ 警示: Rack ${targetRackId} 水位過高 (L${targetTank.level})。請先手動排水至 L1 以下才能進行自動補水。`);
      return;
    }
    if (!APP_CONFIG.USE_MOCK) {
       const res = await api.startTransfer(targetRackId);
       if (!res.success) return;
    }
    set((s: any) => ({
      mixerData: { ...s.mixerData, status: 'Transferring', pumpActive: true, valveOpen: true },
      rackTanks: { ...s.rackTanks, [targetRackId]: { ...s.rackTanks[targetRackId], status: 'FILLING', valveOpen: true, pumpActive: true } }
    }));
    console.log(`[PLC] Transfer to Rack ${targetRackId} started.`);
  },

  controlDevice: async (deviceId: string, command: Partial<DeviceState>) => {
    const state = get();
    const originalDevice = state.devices[deviceId];
    if (!originalDevice) return;
    const nextDeviceState = { ...originalDevice, ...command, params: { ...originalDevice.params, ...(command.params || {}) } };
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
  
  selectSensor: (id: string | null) => set({ selectedSensorId: id, selectedDosingTankId: null, selectedRackTankId: null, isMixerSelected: false }),
  selectDosingTank: (id: number | null) => set({ selectedDosingTankId: id, selectedSensorId: null, selectedRackTankId: null, isMixerSelected: false }),
  selectRackTank: (id: string | null) => set({ selectedRackTankId: id, selectedSensorId: null, selectedDosingTankId: null, isMixerSelected: false }),
  selectMixer: (isSelected: boolean) => set({ isMixerSelected: isSelected, selectedSensorId: null, selectedDosingTankId: null, selectedRackTankId: null }),
  
  clearSelection: () => set({ selectedSensorId: null, selectedDosingTankId: null, selectedRackTankId: null, isMixerSelected: false }),

  toggleMixerValve: () => set((state: any) => ({ mixerData: { ...state.mixerData, valveOpen: !state.mixerData.valveOpen } })),
  toggleMixerPump: () => set((state: any) => ({ mixerData: { ...state.mixerData, pumpActive: !state.mixerData.pumpActive } })),

  addRecipe: (recipe: Recipe) => set((s: ExtendedStore) => ({ recipes: [...s.recipes, recipe] })),
  deleteRecipe: (id: string) => set((s: ExtendedStore) => ({ recipes: s.recipes.filter((r: Recipe) => r.id !== id) })),
  updateDosingTank: (id: number, data: Partial<DosingTank>) => set((state: any) => ({ dosingTanks: state.dosingTanks.map((tank: any) => tank.id === id ? { ...tank, ...data } : tank)})),
  setLanguage: (lang: Language) => set({ language: lang }),
}));

// 手動定義 Store Hook 的型別，讓 TypeScript 能夠正確推斷
// 這樣做可以繞過 zustand v3 在 ESM 下的 UseStore 導出問題
type StoreHook = {
  (): ExtendedStore;
  <U>(selector: (state: ExtendedStore) => U): U;
  setState: (state: Partial<ExtendedStore> | ((state: ExtendedStore) => Partial<ExtendedStore>), replace?: boolean) => void;
  getState: () => ExtendedStore;
  subscribe: (listener: (state: ExtendedStore, prevState: ExtendedStore) => void) => () => void;
  destroy: () => void;
};

export const useAppStore = store as unknown as StoreHook;