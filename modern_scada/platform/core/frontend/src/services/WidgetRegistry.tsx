import React from 'react';
import { Activity } from 'lucide-react';

export interface WidgetProps {
    deviceId: string;
    name: string;
}

const SensorCard: React.FC<WidgetProps> = ({ deviceId, name }) => (
    <div>{ name }({ deviceId }) </div>
);

const registry: Record<string, React.FC<WidgetProps>> = {
    'sensor_box': SensorCard,
};

export const WidgetRegistry = {
    get: (typeId: string): React.FC<WidgetProps> | null => {
        return registry[typeId] || null;
    },

    register: (typeId: string, component: React.FC<WidgetProps>) => {
        registry[typeId] = component;
    }
};
