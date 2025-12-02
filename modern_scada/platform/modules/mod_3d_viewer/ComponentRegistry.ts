import React from 'react';
import { HopperSystem } from '../../core/frontend/src/components/3d/HopperSystem';
import { WaterPipeSystem3D } from '../../core/frontend/src/components/3d/WaterPipeSystem3D';
import { SensorGrid } from '../../core/frontend/src/components/3d/SensorGrid';
import VerticalRack from '../../core/frontend/src/components/3d/VerticalRack';
import Fan3D from '../../core/frontend/src/components/3d/Fan3D';
import { Infrastructure } from '../../core/frontend/src/components/3d/Infrastructure';

// Define the Registry Type
type ComponentRegistryType = Record<string, React.ComponentType<any>>;

// Register Legacy Components
export const ComponentRegistry: ComponentRegistryType = {
    "HopperWidget": HopperSystem,
    "WaterPipeWidget": WaterPipeSystem3D,
    "SensorGridWidget": SensorGrid,
    "RackWidget": VerticalRack,
    "FanWidget": Fan3D,
    "InfrastructureWidget": Infrastructure,
    // Add wrappers if needed for specific props adaptation
};

export const getComponent = (type: string) => {
    return ComponentRegistry[type] || null;
};
