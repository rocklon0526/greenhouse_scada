import React from 'react';
import { Box, Html } from '@react-three/drei';

interface BoxShapeProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    args?: [number, number, number]; // width, height, depth
    color?: string;
    label?: string;
    opacity?: number;
    transparent?: boolean;
    [key: string]: any;
}

export const BoxShape: React.FC<BoxShapeProps> = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    args = [1, 1, 1],
    color = '#cbd5e1',
    label,
    opacity = 1,
    transparent = false,
    ...props
}) => {
    return (
        <group position={position} rotation={rotation ? [rotation[0], rotation[1], rotation[2]] : [0, 0, 0]}>
            <Box args={args}>
                <meshStandardMaterial
                    color={color}
                    transparent={transparent || opacity < 1}
                    opacity={opacity}
                    metalness={0.5}
                    roughness={0.5}
                />
            </Box>
            {/* {label && (
                <Html position={[0, args[1] / 2 + 0.5, 0]} center distanceFactor={15}>
                    <div className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded border border-slate-500/50 whitespace-nowrap pointer-events-none select-none">
                        {label}
                    </div>
                </Html>
            )} */}
        </group>
    );
};

export default BoxShape;
