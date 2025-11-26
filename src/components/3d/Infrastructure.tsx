import React from 'react';
import { Text } from '@react-three/drei';
import { DeviceState } from '../../types';
import { InfrastructureItem } from '../../configs/layoutConfig';

interface BlockProps {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  label?: string;
  opacity?: number;
  isActive?: boolean;
  onClick?: () => void;
}

const Block: React.FC<BlockProps> = ({ position, size, color, label, opacity = 0.6, isActive, onClick }) => (
  <group position={position} onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
    <mesh>
      <boxGeometry args={[size[0], size[1], size[2]]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 0.8 : 0} metalness={0.3} roughness={0.4} transparent opacity={isActive ? 0.9 : 0.4} />
    </mesh>
    {label && (
      <Text position={[0, size[1]/2 + 1, 0]} fontSize={1.5} color={isActive ? color : '#94a3b8'} anchorY="bottom">{label}</Text>
    )}
  </group>
);

const WeatherStation3D = ({ position, color }: { position: [number, number, number], color: string }) => (
  <group position={position}>
    <mesh position={[0, 3, 0]}><dodecahedronGeometry args={[2, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe /></mesh>
    <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.2, 0.2, 3]} /><meshStandardMaterial color="#64748b" /></mesh>
    <Text position={[0, 6, 0]} fontSize={1.2} color={color}>Weather Station</Text>
  </group>
);

interface InfrastructureProps {
  config: {
    waterWalls: InfrastructureItem[];
    fans: InfrastructureItem[];
    acUnits: InfrastructureItem[];
    weatherStation: { position: [number, number, number]; color: string };
  };
  devices: Record<string, DeviceState>;
  onToggle?: (id: string) => void;
}

export const Infrastructure: React.FC<InfrastructureProps> = ({ config, devices, onToggle }) => {
  const getStatus = (id: string) => devices && devices[id]?.status === 'ON';
  return (
    <group>
      {config.waterWalls.map(ww => <Block key={ww.id} position={ww.position} size={ww.size} color={ww.color} label={ww.label} isActive={getStatus(ww.id)} onClick={() => onToggle && onToggle(ww.id)} />)}
      {config.fans.map(fan => <Block key={fan.id} position={fan.position} size={fan.size} color={fan.color} label={fan.label} isActive={getStatus(fan.id)} onClick={() => onToggle && onToggle(fan.id)} />)}
      {config.acUnits.map(ac => <Block key={ac.id} position={ac.position} size={ac.size} color={ac.color} label={ac.label} isActive={getStatus(ac.id)} opacity={0.3} />)}
      <WeatherStation3D position={config.weatherStation.position} color={config.weatherStation.color} />
    </group>
  );
};