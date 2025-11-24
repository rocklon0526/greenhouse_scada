import React from 'react';
import { Text } from '@react-three/drei';

// 通用盒子組件
const Block = ({ position, size, color, label, opacity = 0.6 }) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
    {label && (
      <Text position={[0, size[1]/2 + 1, 0]} fontSize={1.5} color={color} anchorY="bottom">
        {label}
      </Text>
    )}
  </group>
);

// 氣象站 (紫色球體)
const WeatherStation3D = ({ position, color }) => (
  <group position={position}>
    <mesh position={[0, 3, 0]}>
      <dodecahedronGeometry args={[2, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
    </mesh>
    <mesh position={[0, 1.5, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 3]} />
      <meshStandardMaterial color="#64748b" />
    </mesh>
    <Text position={[0, 6, 0]} fontSize={1.2} color={color}>Weather Station</Text>
  </group>
);

export const Infrastructure = ({ config, activeDevices }) => {
  return (
    <group>
      {/* 紅色：水冷牆 */}
      <Block 
        position={config.waterWall.position} 
        size={config.waterWall.size} 
        color={config.waterWall.color} 
        label="Water Wall"
        opacity={activeDevices.waterWall ? 0.9 : 0.3}
      />

      {/* 藍色：負壓風扇 */}
      <Block 
        position={config.fans.position} 
        size={config.fans.size} 
        color={config.fans.color} 
        label="Exhaust Fans"
        opacity={activeDevices.fans ? 0.9 : 0.3}
      />

      {/* 黃色：冷氣主機 */}
      <Block 
        position={config.acUnit.position} 
        size={config.acUnit.size} 
        color={config.acUnit.color} 
        label="AC Unit"
        opacity={activeDevices.ac ? 0.9 : 0.3}
      />

      {/* 紫色：氣象站 */}
      <WeatherStation3D position={config.weatherStation.position} color={config.weatherStation.color} />
    </group>
  );
};

// 黃色風管系統
export const DuctSystem = ({ ducts }) => (
  <group>
    {ducts.map((duct, i) => (
      <mesh key={i} position={duct.position} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.3, 0.3, duct.size[2]]} />
        <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
      </mesh>
    ))}
  </group>
);