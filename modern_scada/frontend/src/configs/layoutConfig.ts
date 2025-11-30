import { DosingTank } from '../types/farming';

export interface InfrastructureItem {
  id: string;
  label?: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  defaultParams?: Record<string, any>;
}

export interface SensorPoint {
  id: string;
  position: [number, number, number];
  aisle: number;
}

export interface RackData {
  id: string;
  position: [number, number, number];
  levels: number;
  width: number;
  length: number;
  height: number;
}

export interface LayoutConfig {
  dimensions: { width: number; depth: number };
  infrastructure: {
    waterWalls: InfrastructureItem[];
    fans: InfrastructureItem[];
    acUnits: InfrastructureItem[];
    weatherStation: { position: [number, number, number]; color: string };
  };
  sensorPoints: SensorPoint[];
  ducts: Array<{ position: [number, number, number]; size: [number, number, number] }>;
  racks: RackData[];
  dosingSystem?: {
    position: [number, number, number];
    tankConfigs: { id: number; color: string }[];
  };
}

const BASE_LAYOUT: LayoutConfig = {
  dimensions: { width: 60, depth: 60 },

  infrastructure: {
    waterWalls: [
      { id: 'ww-2', label: "Water Wall A", position: [22, 5, -28], size: [20, 4, 1], color: "#ef4444", defaultParams: { level: 1 } }
    ],
    // 風扇現在改為動態生成，這裡的設定會被覆蓋，保留空陣列或預設值皆可
    fans: [],
    acUnits: [
      { id: 'ac-1', label: "Main AC", position: [35, 2, 0], size: [4, 4, 50], color: "#eab308", defaultParams: { targetTemp: 26, mode: 'cool' } }
    ],
    weatherStation: { position: [-25, 0, 35], color: "#a855f7" }
  },
  sensorPoints: [],
  ducts: [],
  racks: []
};

const generateFullLayout = (base: LayoutConfig): LayoutConfig => {
  const layout = JSON.parse(JSON.stringify(base)) as LayoutConfig;

  // --- 參數設定 ---
  const NUM_AISLES = 2;       // 總共 2 條走道
  const AISLE_SPACING = 10;   // 走道中心點的間距 (您的設定)
  const RACK_OFFSET = 3.8;    // 層架距離走道中心的偏移量
  const SENSORS_PER_AISLE = 3;

  // [計算偏移量] 
  // 目標座標: Fan1 X=25, Fan2 X=15
  // 公式: ((1)/2 - 0) * 10 + SHIFT = 5 + SHIFT = 25  => SHIFT = 20
  const GROUP_SHIFT_X = 20;

  // [關鍵步驟] 清空並重新生成風扇，確保每個走道對應一個風扇
  layout.infrastructure.fans = [];

  for (let i = 0; i < NUM_AISLES; i++) {
    // 計算每條走道的 X 軸中心點 (從右向左生成: 25 -> 15)
    const aisleX = ((NUM_AISLES - 1) / 2 - i) * AISLE_SPACING + GROUP_SHIFT_X;

    // 1. 動態生成對應走道的風扇 (Fan)
    layout.infrastructure.fans.push({
      id: `fan-${i + 1}`,
      label: `Fan #${i + 1}`,
      position: [aisleX, 5, 28], // X=aisleX, Z=28 (後牆)
      size: [4, 4, 1],
      color: "#3b82f6",
      defaultParams: { speed: 100 }
    });

    // 2. 建立中間走道的設施 (Ducts, Sensors)
    layout.ducts.push({ position: [aisleX, 8, 0], size: [0.4, 0.4, 0] });

    for (let j = 0; j < SENSORS_PER_AISLE; j++) {
      const z = (j - (SENSORS_PER_AISLE - 1) / 2) * 19;
      // Calculate sequential ID to match backend (sensor_1 to sensor_6)
      const sensorId = `sensor_${i * SENSORS_PER_AISLE + j + 1}`;
      layout.sensorPoints.push({
        id: sensorId,
        position: [aisleX, 4, z],
        aisle: i + 1
      });
    }

    // 3. 建立走道兩側的層架 (Rack-Aisle-Rack)
    // 右側層架 (A側)
    layout.racks.push({
      id: `R-${i + 1}A`,
      position: [aisleX + RACK_OFFSET, 0, 0],
      levels: 5,
      width: 2,
      length: 40,
      height: 6
    });

    // 左側層架 (B側)
    layout.racks.push({
      id: `R-${i + 1}B`,
      position: [aisleX - RACK_OFFSET, 0, 0],
      levels: 5,
      width: 2,
      length: 40,
      height: 6
    });
  }

  // 調配區位置
  layout.dosingSystem = {
    position: [-35, 0, -20],
    tankConfigs: [
      { id: 1, color: '#a855f7' }, { id: 2, color: '#ec4899' },
      { id: 3, color: '#3b82f6' }, { id: 4, color: '#10b981' },
      { id: 5, color: '#f59e0b' }, { id: 6, color: '#6366f1' }
    ]
  };

  return layout;
}

export const WAREHOUSE_LAYOUT: LayoutConfig = generateFullLayout(BASE_LAYOUT);