// src/mocks/devices.ts
import { LayoutConfig, InfrastructureItem } from '../configs/layoutConfig';
import { DeviceState } from '../types';

export const generateInitialDevices = (layout: LayoutConfig): Record<string, DeviceState> => {
  const state: Record<string, DeviceState> = {};
  const initGroup = (group: InfrastructureItem[]) => {
    group.forEach(d => {
      state[d.id] = {
        status: 'OFF',
        params: { ...d.defaultParams },
        lastChanged: null
      };
    });
  };
  initGroup(layout.infrastructure.fans);
  initGroup(layout.infrastructure.waterWalls);
  initGroup(layout.infrastructure.acUnits);
  return state;
};
