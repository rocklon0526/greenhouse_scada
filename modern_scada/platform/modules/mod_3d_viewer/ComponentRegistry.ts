// ComponentRegistry.ts
import React from 'react';

// === 1. Existing Components ===
// Default Exports
import { VerticalRack } from '../../core/frontend/src/components/3d/VerticalRack';
import Fan3D from '../../core/frontend/src/components/3d/Fan3D';
import SensorGroup from '../../core/frontend/src/components/3d/SensorGroup';

// Named Exports
import { HopperSystem } from '../../core/frontend/src/components/3d/HopperSystem';
import { Infrastructure } from '../../core/frontend/src/components/3d/Infrastructure';
import { SensorGrid } from '../../core/frontend/src/components/3d/SensorGrid';
import { WaterPipeSystem3D } from '../../core/frontend/src/components/3d/WaterPipeSystem3D';
import { DosingSystem3D } from '../../core/frontend/src/components/3d/DosingSystem3D';
import { RackNutrientTank3D } from '../../core/frontend/src/components/3d/RackNutrientTank3D';
import { BoxShape } from '../../core/frontend/src/components/3d/BoxShape';
import { WaterWall3D } from '../../core/frontend/src/components/3d/WaterWall3D';

type ComponentRegistryType = Record<string, React.ComponentType<any>>;

export const ComponentRegistry: ComponentRegistryType = {
    "HopperWidget": HopperSystem,
    "RackWidget": VerticalRack,
    "InfrastructureWidget": Infrastructure,
    "SensorGridWidget": SensorGrid,
    "WaterPipeWidget": WaterPipeSystem3D,
    "DosingSystemWidget": DosingSystem3D,
    "RackNutrientTankWidget": RackNutrientTank3D,
    "FanWidget": Fan3D,
    "SensorWidget": SensorGroup,
    "box": BoxShape,
    "BoxWidget": BoxShape,
    "WaterWallWidget": WaterWall3D
};

export const getComponent = (type: string) => {
    const component = ComponentRegistry[type];

    // CRITICAL: Debugging Log
    // if (component) {
    //     console.log(`[3D Registry] Successfully found component for type: '${type}'`);
    // } else {
    //     console.error(`[3D Registry] FAILED to find component for type: '${type}'. Available keys:`, Object.keys(ComponentRegistry));
    // }

    return component || null;
};