import React from 'react';
import { Box, Html } from '@react-three/drei';
import { useAppStore } from '../../stores/useAppStore';

interface SensorConfig {
    id: string;
    position: [number, number, number];
    type: string;
}

interface SensorGridProps {
    config: SensorConfig[];
}

export const SensorGrid: React.FC<SensorGridProps> = ({ config }) => {
    const { sensors } = useAppStore();

    return (
        <group>
            {config.map((sensor) => {
                // Find real-time data for this sensor if available
                // Note: The sensor ID in config (e.g., sensor_aisle1_front_top) might need mapping to the store's sensor data structure
                // For now, we'll just render the physical box

                return (
                    <group key={sensor.id} position={sensor.position}>
                        <Box args={[0.5, 0.5, 0.5]}>
                            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
                        </Box>
                        {/* Optional: Add hover tooltip or label */}
                    </group>
                );
            })}
        </group>
    );
};
