import { useState, useEffect } from 'react';
import { CONFIG } from '../config';
import { APP_CONFIG } from '../config/constants';

// 負責處理所有與 Ignition 的通訊、數據模擬、狀態管理
export const useIgnitionSystem = () => {
  const [status, setStatus] = useState('disconnected'); // connected, disconnected, error
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // 核心數據模型
  const [data, setData] = useState({
    sensors: [], // 感測器陣列
    devices: {   // 設備狀態
      waterWall: false,
      fans: false,
      ac: false
    },
    settings: {  // 系統設定
      autoMode: true,
      tempThreshold: 30
    },
    rules: [     // 邏輯規則 (預設)
      { id: 1, name: '高溫散熱', condition: 'Temp > 30', action: 'Fans ON', active: true },
      { id: 2, name: '緊急降溫', condition: 'Temp > 35', action: 'WaterWall ON', active: false }
    ]
  });

  // 數據輪詢 (Polling)
  useEffect(() => {
    const fetchData = async () => {
      if (CONFIG.USE_MOCK) {
        // --- MOCK DATA GENERATOR ---
        const mockSensors = Array.from({ length: 40 }, (_, i) => ({
          id: `S-${i+1}`,
          row: Math.floor(i / 5) + 1,
          col: (i % 5) + 1,
          temp: +(24 + Math.random() * 8).toFixed(1),
          hum: +(60 + Math.random() * 10).toFixed(0),
          co2: 400 + Math.floor(Math.random() * 100)
        }));

        setData(prev => ({
          ...prev,
          sensors: mockSensors,
          // 簡單的模擬邏輯：如果自動模式開啟且有高溫，風扇自動轉
          devices: {
            ...prev.devices,
            fans: prev.settings.autoMode && mockSensors.some(s => s.temp > prev.settings.tempThreshold),
            waterWall: prev.settings.autoMode && mockSensors.some(s => s.temp > prev.settings.tempThreshold + 5),
          }
        }));
        setStatus('connected');
        setLastUpdate(new Date());
      } else {
        // --- REAL API CALL ---
        try {
          const res = await fetch(CONFIG.API_URL);
          if (!res.ok) throw new Error('API Error');
          const jsonData = await res.json();
          setData(jsonData);
          setStatus('connected');
          setLastUpdate(new Date());
        } catch (err) {
          setStatus('error');
          console.error("Connection failed:", err);
        }
      }
    };

    const interval = setInterval(fetchData, CONFIG.POLLING_RATE);
    fetchData();
    return () => clearInterval(interval);
  }, []);

  // 控制指令發送
  const sendCommand = async (device, state) => {
    console.log(`[Command] Device: ${device}, State: ${state}`);
    // 在這裡實作 POST 到 Ignition 的邏輯
    if(CONFIG.USE_MOCK) {
       setData(prev => ({...prev, devices: {...prev.devices, [device]: state}}));
    }
  };

  return { status, data, lastUpdate, sendCommand, setData };
};