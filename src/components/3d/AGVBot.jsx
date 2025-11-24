import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const AGVBot = ({ position }) => {
  return (
    <group position={position}>
      {/* 車體 */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.2, 0.5, 1.5]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 狀態燈 */}
      <mesh position={[0, 0.5, 0.7]}>
        <boxGeometry args={[0.8, 0.1, 0.1]} />
        <meshBasicMaterial color="#22c55e" toneMapped={false} />
      </mesh>
      <Text position={[0, 0.8, 0]} fontSize={0.3} color="white" billboard>
        AGV-01
      </Text>
    </group>
  );
};

export default AGVBot;