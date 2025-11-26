// src/mocks/sensors.ts
import { LayoutConfig } from '../configs/layoutConfig';
import { SensorData } from '../types';

export const generateMockData = (layout: LayoutConfig): SensorData[] => {
  return layout.sensorPoints.map(point => {
    const baseTemp = 24 + Math.random() * 2;
    const topTemp = +(baseTemp + 1.5).toFixed(1);
    const midTemp = +(baseTemp).toFixed(1);
    const botTemp = +(baseTemp - 1.0).toFixed(1);
    const baseHum = 60 + Math.random() * 10;
    const baseCo2 = 400 + Math.floor(Math.random() * 200);
    const avgTemp = +((topTemp + midTemp + botTemp) / 3).toFixed(1);
    const isWarning = topTemp > 28 || midTemp > 28 || botTemp > 28;

    return {
      id: point.id,
      position: point.position,
      avgTemp,
      avgHum: +baseHum.toFixed(0),
      avgCo2: baseCo2,
      status: isWarning ? 'warning' : 'normal',
      details: {
        top: { temp: topTemp, hum: +(baseHum - 5).toFixed(0), co2: baseCo2 - 50 },
        mid: { temp: midTemp, hum: +baseHum.toFixed(0), co2: baseCo2 },
        bot: { temp: botTemp, hum: +(baseHum + 5).toFixed(0), co2: baseCo2 + 50 },
      }
    };
  });
};
