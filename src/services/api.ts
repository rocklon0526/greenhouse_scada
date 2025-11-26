// src/api.ts
import { APP_CONFIG } from '../configs/constants';
import { DeviceState } from '../types';
import { LayoutConfig } from '../configs/layoutConfig';

export const api = {
  async fetchStatus(layoutConfig: LayoutConfig) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/status`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      const now = new Date();
      const newEntry = { 
         time: now.toLocaleTimeString(), 
         temp: data.avgTemp, hum: data.avgHum, co2: data.avgCo2 
      };
      const mergedSensors = data.sensors.map((apiSensor: any) => {
        const configSensor = layoutConfig.sensorPoints.find(p => p.id === apiSensor.id);
        return {
          ...apiSensor,
          position: configSensor ? configSensor.position : [0, 0, 0] 
        };
      });
      return {
        status: 'success',
        data: {
          sensors: mergedSensors,
          devices: data.devices,
          weatherStation: data.weather,
          history: newEntry
        }
      };
    } catch (error) {
      console.error("API Error:", error);
      return { status: 'error' };
    }
  },

  async controlDevice(deviceId: string, command: Partial<DeviceState>) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, ...command })
      });
      if (!response.ok) {
        throw new Error('Failed to control device');
      }
      return { success: true };
    } catch (error) {
      console.error("Control Error:", error);
      return { success: false };
    }
  }
};
