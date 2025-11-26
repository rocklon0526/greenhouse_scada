// src/types/sensors.ts
export interface SensorData {
  id: string;
  position: [number, number, number];
  avgTemp: number;
  avgHum: number;
  avgCo2: number;
  status: 'normal' | 'warning';
  details: {
    top: { temp: number; hum: number; co2: number };
    mid: { temp: number; hum: number; co2: number };
    bot: { temp: number; hum: number; co2: number };
  };
}
