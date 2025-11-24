import React from 'react';
import { Text, Billboard } from '@react-three/drei';

const Sensor3D = ({ position, val, maxLimit }) => {
  const isAlarm = val > maxLimit;
  const color = isAlarm ? "#ef4444" : "#22c55e"; 

  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isAlarm ? 2 : 0.5} toneMapped={false} />
      </mesh>
      <Billboard position={[0, 0.8, 0]}>
        <Text fontSize={0.3} color="white" anchorX="center" anchorY="middle">
          {val.toFixed(1)}°
        </Text>
      </Billboard>
    </group>
  );
};

export default Sensor3D;