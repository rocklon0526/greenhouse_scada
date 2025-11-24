import React from 'react';
import { Text } from '@react-three/drei';
import Sensor3D from './Sensor3D.jsx'; // 引用剛剛拆出去的元件

const Rack3D = ({ position, rowId, sensors, maxLimit }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[10, 1, 1]} />
        <meshPhysicalMaterial color="#1e293b" transparent opacity={0.8} metalness={0.8} roughness={0.2} />
      </mesh>
      <Text position={[-5.5, 0.2, 0]} fontSize={0.4} color="#94a3b8" rotation={[-Math.PI/2, 0, Math.PI/2]}>
        ROW {rowId}
      </Text>
      {sensors.map((s, i) => (
        <Sensor3D key={s.id} val={s.temp} maxLimit={maxLimit} position={[-4 + i * 2, 1.2, 0]} />
      ))}
    </group>
  );
};

export default Rack3D;