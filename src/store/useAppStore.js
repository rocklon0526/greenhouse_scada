import create from 'zustand';
import { APP_CONFIG } from '../config/constants';

const generateMockData = (layout) => {
  return layout.sensorPoints.map(point => {
    const baseTemp = 24 + Math.random() * 2;
    const topTemp = +(baseTemp + 1.5).toFixed(1);
    const midTemp = +(baseTemp).toFixed(1);
    const botTemp = +(baseTemp - 1.0).toFixed(1);

    const baseHum = 60 + Math.random() * 10;
    
    // [新增] CO2 模擬數據 (PPM) - 底部通常濃度較高
    const baseCo2 = 400 + Math.floor(Math.random() * 200);
    
    const avgTemp = +((topTemp + midTemp + botTemp) / 3).toFixed(1);
    
    const isWarning = topTemp > 28 || midTemp > 28 || botTemp > 28;

    return {
      id: point.id,
      position: point.position,
      avgTemp,
      avgHum: baseHum.toFixed(0),
      avgCo2: baseCo2, // 新增平均 CO2
      status: isWarning ? 'warning' : 'normal',
      details: {
        // [新增] 各層加入 co2
        top: { temp: topTemp, hum: (baseHum - 5).toFixed(0), co2: baseCo2 - 50 },
        mid: { temp: midTemp, hum: baseHum.toFixed(0), co2: baseCo2 },
        bot: { temp: botTemp, hum: (baseHum + 5).toFixed(0), co2: baseCo2 + 50 },
      }
    };
  });
};

export const useAppStore = create((set, get) => ({
  connectionStatus: 'disconnected',
  lastUpdate: null,
  
  sensors: [],
  weatherStation: { temp: 32, hum: 80, uv: 5 },
  
  // [修改] 移除 growLights, ac (因為是預留/不需控制，狀態留著給 UI 顯示'停止'即可，或是直接移除控制項)
  devices: { fans: false, waterWall: false }, 
  
  rules: [
    { id: 1, name: 'High Temp Alert', condition: 'Avg Temp > 28°C', action: 'Fans ON', active: true },
  ],
  
  settings: { autoMode: true, tempThreshold: 28 },
  selectedSensorId: null,
  history: [], 

  initSystem: (layoutConfig) => {
    const updateLogic = () => {
      const state = get();
      if (APP_CONFIG.USE_MOCK) {
        const newSensors = generateMockData(layoutConfig);
        const now = new Date();
        
        const avgTemp = newSensors.length > 0 ? (newSensors.reduce((acc, s) => acc + s.avgTemp, 0) / newSensors.length) : 0;
        const avgHum = newSensors.length > 0 ? (newSensors.reduce((acc, s) => acc + parseInt(s.avgHum), 0) / newSensors.length) : 0;
        // [新增] 歷史紀錄加入 CO2
        const avgCo2 = newSensors.length > 0 ? (newSensors.reduce((acc, s) => acc + s.avgCo2, 0) / newSensors.length) : 400;

        const newEntry = { 
          time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          temp: avgTemp,
          hum: avgHum,
          co2: avgCo2 
        };
        const newHistory = [...state.history, newEntry].slice(-20);

        set({ 
          connectionStatus: 'connected',
          lastUpdate: now,
          sensors: newSensors,
          history: newHistory, 
          weatherStation: { 
            temp: +(30 + Math.random()).toFixed(1), 
            hum: +(75 + Math.random() * 5).toFixed(0),
            uv: +(5 + Math.random()).toFixed(1)
          }
        });
      }
    };
    updateLogic();
    const interval = setInterval(updateLogic, APP_CONFIG.POLLING_INTERVAL || 2000);
    return () => clearInterval(interval);
  },

  toggleDevice: (device) => set(state => ({ devices: { ...state.devices, [device]: !state.devices[device] } })),
  setSetting: (key, value) => set(state => ({ settings: { ...state.settings, [key]: value } })),
  toggleRule: (id) => set(state => ({ rules: state.rules.map(r => r.id === id ? {...r, active: !r.active} : r) })),
  addRule: (newRule) => set(state => ({ rules: [...state.rules, { id: Date.now(), active: true, ...newRule }] })),
  selectSensor: (id) => set({ selectedSensorId: id }),
  clearSelection: () => set({ selectedSensorId: null }),
}));