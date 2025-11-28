// src/api.ts
import { APP_CONFIG } from '../configs/constants';
import { DeviceState } from '../types';
import { LayoutConfig } from '../configs/layoutConfig';
import { Recipe } from '../types/farming';

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
          history: newEntry,
          // 假設 API 也回傳混合與桶槽狀態，若無則由前端 Store 處理
          mixer: data.mixer, 
          rackTanks: data.rackTanks
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
      if (!response.ok) throw new Error('Failed to control device');
      return { success: true };
    } catch (error) {
      console.error("Control Error:", error);
      return { success: false };
    }
  },

  // 1. 調配桶混合 API
  async startMixing(recipe: Recipe) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/process/mix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id, params: recipe.ingredients })
      });
      if (!response.ok) throw new Error('Failed to start mixing');
      return { success: true };
    } catch (error) {
      console.error("Mixing Start Error:", error);
      return { success: false };
    }
  },

  // 2. 傳送養液 API
  async startTransfer(targetRackId: string) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/process/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRackId })
      });
      if (!response.ok) throw new Error('Failed to start transfer');
      return { success: true };
    } catch (error) {
      console.error("Transfer Start Error:", error);
      return { success: false };
    }
  }
};