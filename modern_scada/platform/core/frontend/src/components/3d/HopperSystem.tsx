import React from 'react';
import { Cone, Html } from '@react-three/drei';

interface HopperConfig {
    id: string;
    position: [number, number, number];
    type: string;
    color: string;
    label: string;
    tag: string;
}

interface HopperSystemProps {
    config: HopperConfig[];
}

export const HopperSystem: React.FC<HopperSystemProps> = ({ config }) => {
    return (
        <group>
            {config.map((hopper) => (
                <group key={hopper.id} position={hopper.position}>
                    {/* Hopper Body (Inverted Cone) */}
                    <Cone args={[2, 4, 32]} rotation={[Math.PI, 0, 0]} position={[0, 2, 0]}>
                        <meshStandardMaterial color={hopper.color} />
                    </Cone>

                    {/* Label */}
                    <Html position={[0, 5, 0]} center distanceFactor={15}>
                        <div className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded border border-slate-600 whitespace-nowrap">
                            {hopper.label}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
};
