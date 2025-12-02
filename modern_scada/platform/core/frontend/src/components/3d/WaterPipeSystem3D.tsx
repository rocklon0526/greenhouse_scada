import React, { useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import * as THREE from 'three';

export const WaterPipeSystem3D = () => {
    // @ts-ignore
    const { rackTanks } = useAppStore();

    const pipeData = useMemo(() => {
        const tanks = Object.values(rackTanks || {}) as any[];
        if (tanks.length === 0) return null;

        // Calculate bounds
        const xPositions = tanks.map(t => t.position[0]);
        const minX = Math.min(...xPositions);
        const maxX = Math.max(...xPositions);

        // Assuming all tanks are at the same Z and Y relative to rack
        // Tank position from store is [x, 0, z]
        // Level gauge is at [0, 5, 0] relative to tank
        // So absolute level gauge position is [x, 5, z]
        const commonZ = tanks[0].position[2];
        const commonY = 0.5; // Lowered to align with Valve (Y=0.5)

        // Dosing System Position
        const dosingX = -40;
        const dosingZ = -22; // Extended to reach Mixer Tank (Center -25, Radius 3.5)
        const dosingYStart = 0.5;

        return {
            dosingStart: new THREE.Vector3(dosingX, dosingYStart, dosingZ),
            corner: new THREE.Vector3(dosingX, commonY, commonZ),
            end: new THREE.Vector3(maxX, commonY, commonZ),
            commonY, // Expose commonY
            tanks: tanks.map(t => ({
                id: t.rackId,
                position: new THREE.Vector3(t.position[0], commonY, commonZ),
                gaugeHeight: 5 // Target height for Level Gauge
            }))
        };
    }, [rackTanks]);

    if (!pipeData) return null;

    const { dosingStart, corner, end, tanks, commonY } = pipeData;
    const pipeColor = "#ef4444";
    const pipeRadius = 0.15;

    return (
        <group>
            {/* 1. Z-Axis Run (from Dosing Valve directly to Rack Z) */}
            <mesh
                position={[dosingStart.x, dosingStart.y, (dosingStart.z + corner.z) / 2]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <cylinderGeometry args={[pipeRadius, pipeRadius, Math.abs(corner.z - dosingStart.z), 16]} />
                <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.2} />
            </mesh>

            {/* Elbow at Corner (X=-40, Z=RackZ) */}
            <mesh position={[corner.x, corner.y, corner.z]}>
                <sphereGeometry args={[pipeRadius * 1.5, 16, 16]} />
                <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.2} />
            </mesh>

            {/* 2. X-Axis Run (Main Manifold along Racks) */}
            <mesh
                position={[(corner.x + end.x) / 2, corner.y, corner.z]}
                rotation={[0, 0, Math.PI / 2]}
            >
                <cylinderGeometry args={[pipeRadius, pipeRadius, Math.abs(end.x - corner.x), 16]} />
                <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.2} />
            </mesh>

            {/* 3. Risers at each Tank */}
            {tanks.map((tank) => (
                <group key={tank.id} position={[tank.position.x, tank.position.y, tank.position.z]}>
                    {/* T-Junction on Main Pipe */}
                    <mesh>
                        <sphereGeometry args={[pipeRadius * 1.2, 16, 16]} />
                        <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.2} />
                    </mesh>

                    {/* Vertical Riser to Level Gauge */}
                    <mesh position={[0, (tank.gaugeHeight - commonY) / 2, 0]}>
                        <cylinderGeometry args={[pipeRadius, pipeRadius, tank.gaugeHeight - commonY, 16]} />
                        <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.2} />
                    </mesh>

                    {/* Elbow/Connector at Top (Level Gauge Connection) */}
                    <mesh position={[0, tank.gaugeHeight - commonY, 0]}>
                        <sphereGeometry args={[pipeRadius * 1.2, 16, 16]} />
                        <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.2} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};
