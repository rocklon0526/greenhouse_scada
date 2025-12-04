import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

interface GenericShapeProps {
    type: 'Cylinder' | 'PipeSegment' | 'WaterWall' | string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    args?: any[]; // For geometry args
    color?: string;
    [key: string]: any;
}

export const GenericShape: React.FC<GenericShapeProps> = ({
    type,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    args,
    color = '#cbd5e1',
    ...props
}) => {
    // Default material props for industrial look
    const materialProps = {
        color: color,
        metalness: 0.5,
        roughness: 0.4,
    };

    switch (type) {
        case 'Cylinder':
            // Default cylinder: radiusTop, radiusBottom, height, radialSegments
            const cylinderArgs = args || [1, 1, 2, 32];
            return (
                <group position={position} rotation={rotation}>
                    <Cylinder args={cylinderArgs as any}>
                        <meshStandardMaterial {...materialProps} />
                    </Cylinder>
                </group>
            );

        case 'PipeSegment':
            // Pipe usually needs to be rotated to align with axes, but we'll respect passed rotation
            // Default pipe: radiusTop, radiusBottom, height
            const pipeArgs = args || [0.2, 0.2, 5, 16];
            return (
                <group position={position} rotation={rotation}>
                    <Cylinder args={pipeArgs as any}>
                        <meshStandardMaterial {...materialProps} color={color || '#ef4444'} />
                    </Cylinder>
                </group>
            );

        case 'WaterWall':
            // Wall: width, height, depth
            const wallArgs = args || [5, 3, 0.2];
            return (
                <group position={position} rotation={rotation}>
                    <Box args={wallArgs as any}>
                        <meshStandardMaterial
                            {...materialProps}
                            color={color || '#3b82f6'}
                            transparent
                            opacity={0.4}
                        />
                    </Box>
                </group>
            );

        default:
            console.warn(`[GenericShape] Unknown type: ${type}`);
            return null;
    }
};