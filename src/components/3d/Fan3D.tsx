import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface Fan3DProps {
  position: [number, number, number];
  isRunning: boolean;
}

const Fan3D: React.FC<Fan3DProps> = ({ position, isRunning }) => {
  const bladeRef = useRef<Group>(null);
  useFrame((state, delta) => {
    if (isRunning && bladeRef.current) bladeRef.current.rotation.z += delta * 5;
  });

  return (
    <group position={position}>
      <mesh rotation={[0, Math.PI/2, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <group ref={bladeRef} position={[0, 0, 0.15]}>
        <mesh><boxGeometry args={[0.15, 1.4, 0.05]} /><meshStandardMaterial color={isRunning ? "#3b82f6" : "#64748b"} /></mesh>
        <mesh rotation={[0, 0, Math.PI/2]}><boxGeometry args={[0.15, 1.4, 0.05]} /><meshStandardMaterial color={isRunning ? "#3b82f6" : "#64748b"} /></mesh>
      </group>
    </group>
  );
};

export default Fan3D;