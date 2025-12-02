import React from 'react';
import { WidgetRegistry } from '../services/WidgetRegistry';

interface RendererProps {
    config: {
        id: string;
        name: string;
        typeId: string;
    };
}

export const EquipmentRenderer: React.FC<RendererProps> = ({ config }) => {
    const Component = WidgetRegistry.get(config.typeId);

    if (!Component) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded text-red-500">
                Unknown Type: {config.typeId}
            </div>
        );
    }

    return <Component deviceId={config.id} name={config.name} />;
};
