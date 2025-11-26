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
}

const BASE_LAYOUT: LayoutConfig = {
  dimensions: { width: 60, depth: 60 },

  infrastructure: {
    waterWalls: [
      { id: 'ww-1', label: "Water Wall A", position: [-15, 5, -28], size: [20, 4, 1], color: "#ef4444", defaultParams: { level: 1 } },
      { id: 'ww-2', label: "Water Wall B", position: [15, 5, -28], size: [20, 4, 1], color: "#ef4444", defaultParams: { level: 1 } }
    ],
    fans: [
      { id: 'fan-1', label: "Fan #1", position: [-18, 5, 28], size: [4, 4, 1], color: "#3b82f6", defaultParams: { speed: 100 } },
      { id: 'fan-2', label: "Fan #2", position: [-6, 5, 28], size: [4, 4, 1], color: "#3b82f6", defaultParams: { speed: 100 } },
      { id: 'fan-3', label: "Fan #3", position: [6, 5, 28], size: [4, 4, 1], color: "#3b82f6", defaultParams: { speed: 100 } },
      { id: 'fan-4', label: "Fan #4", position: [18, 5, 28], size: [4, 4, 1], color: "#3b82f6", defaultParams: { speed: 100 } }
    ],
    acUnits: [
      { id: 'ac-1', label: "Main AC", position: [28, 2, 0], size: [4, 4, 50], color: "#eab308", defaultParams: { targetTemp: 26, mode: 'cool' } }
    ],
    weatherStation: { position: [-25, 0, 35], color: "#a855f7" }
  },
  sensorPoints: [],
  ducts: [],
  racks: []
};

const generateFullLayout = (base: LayoutConfig): LayoutConfig => {
  const layout = JSON.parse(JSON.stringify(base)) as LayoutConfig;
  
  const AISLES = 6;
  const SENSORS_PER_AISLE = 3;
  const SPACING_X = 8;
  const SPACING_Z = 15;

  for (let i = 0; i < AISLES; i++) {
    const x = (i - (AISLES - 1) / 2) * SPACING_X;
    layout.ducts.push({ position: [x, 8, 0], size: [0.5, 0.5, 50] });
    for (let j = 0; j < SENSORS_PER_AISLE; j++) {
      const z = (j - (SENSORS_PER_AISLE - 1) / 2) * SPACING_Z;
      layout.sensorPoints.push({ id: `Aisle-${i+1}-P-${j+1}`, position: [x, 4, z], aisle: i + 1 });
    }
  }
  for (let i = 0; i < AISLES + 1; i++) {
     const x = (i - AISLES / 2) * SPACING_X - (SPACING_X/2); 
     if(i > 0) layout.racks.push({ id: `R-${i}`, position: [x + 4, 0, 0], levels: 5, width: 2, length: 40, height: 6 });
  }
  
  return layout;
}

export const WAREHOUSE_LAYOUT: LayoutConfig = generateFullLayout(BASE_LAYOUT);