// src/api.ts
import { APP_CONFIG } from '../configs/constants';
import { DeviceState } from '../types';
import { LayoutConfig } from '../configs/layoutConfig';
import { Recipe } from '../types/farming';
import { Rule } from '../types/rules';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) throw new Error('Network error');
  return response.json();
};

export const api = {
  async fetchStatus(layoutConfig: LayoutConfig) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/status`, {
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      return {
        status: 'success',
        data: mapApiDataToState(data, layoutConfig)
      };
    } catch (error) {
      console.error("API Error:", error);
      return { status: 'error' };
    }
  },

  // Helper to map API response (which is already structured by backend) to Frontend State
  // Wait, the backend /status endpoint returns structured data (sensors, devices, etc).
  // But the WebSocket sends raw tags?
  // Let's check polling.py again.
  // polling.py sends `processor.tag_values` which is a flat dict: {"sensor_1_top_temp": 25.0, ...}
  // So I need a mapper from Flat Tags -> Structured State.
  // The backend /status endpoint does this mapping in Python.
  // I should probably duplicate this mapping in Frontend or make the WS send structured data.
  // Making WS send structured data is cleaner but heavier on backend (re-calculating every 2s).
  // But wait, polling.py just dumps `tag_values`.
  // So Frontend MUST map flat tags to structured state.
  // Currently api.fetchStatus returns structured data because the backend /status does the mapping.
  // I will implement `mapTagsToState` in `api.ts` or a new utility.


  async controlDevice(deviceId: string, command: Partial<DeviceState>) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/control`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ deviceId, ...command })
      });
      await handleResponse(response);
      return { success: true };
    } catch (error) {
      console.error("Control Error:", error);
      return { success: false };
    }
  },

  async startMixing(recipe: Recipe) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/process/mix`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ recipeId: recipe.id, params: recipe.ingredients })
      });
      await handleResponse(response);
      return { success: true };
    } catch (error) {
      console.error("Mixing Start Error:", error);
      return { success: false };
    }
  },

  async startTransfer(targetRackId: string) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/process/transfer`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targetRackId })
      });
      await handleResponse(response);
      return { success: true };
    } catch (error) {
      console.error("Transfer Start Error:", error);
      return { success: false };
    }
  },

  async updateRules(rules: Rule[], settings: any) {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/rules/update`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rules, globals: settings })
      });
      await handleResponse(response);
      return { success: true };
    } catch (error) {
      console.error("Rules Update Error:", error);
      return { success: false };
    }
  }
};

export const mapApiDataToState = (data: any, layoutConfig: LayoutConfig) => {
  console.log("Using patched mapApiDataToState", layoutConfig);
  const now = new Date();
  const newEntry = {
    time: now.toLocaleTimeString(),
    temp: data.avgTemp, hum: data.avgHum, co2: data.avgCo2
  };

  // Helper to extract items from zones
  const extractFromZones = (key: string) => {
    const items: any[] = [];
    if (layoutConfig.zones) {
      Object.values(layoutConfig.zones).forEach((zone: any) => {
        if (zone[key]) items.push(...zone[key]);
      });
    }
    return items;
  };

  const allSensors = [...(layoutConfig.sensorPoints || []), ...extractFromZones('sensors')];
  const allRacks = [...(layoutConfig.racks || []), ...extractFromZones('racks')];

  const mergedSensors = data.sensors.map((apiSensor: any) => {
    const configSensor = allSensors.find((p: any) => p.id === apiSensor.id);
    return {
      ...apiSensor,
      position: configSensor ? configSensor.position : [0, 0, 0]
    };
  });

  return {
    sensors: mergedSensors,
    devices: data.devices,
    weatherStation: data.weather,
    history: newEntry,
    mixer: data.mixer,
    rackTanks: (() => {
      const mappedTanks: any = {};
      const backendKeys = Object.keys(data.rackTanks || {});

      // Use allRacks instead of layoutConfig.racks
      allRacks.forEach((rack: any, index: number) => {
        // Replicate position calculation from initSystem
        const position = [rack.position[0], 0, rack.position[2] + (rack.length / 2) + 12];

        // Map backend data by index (Best effort: R-1A -> RackA, etc.)
        const backendKey = backendKeys[index];
        const backendData = backendKey ? data.rackTanks[backendKey] : {};

        mappedTanks[rack.id] = {
          position: position,
          level: 1, // Default
          ph: 5.8,
          ec: 1.5,
          valveOpen: false,
          pumpActive: false,
          status: 'IDLE',
          ...backendData, // Override with backend data if available
          rackId: rack.id // Force ID to match layout
        };
      });
      return mappedTanks;
    })()
  };
};