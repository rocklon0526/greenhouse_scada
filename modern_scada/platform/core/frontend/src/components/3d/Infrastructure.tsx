import React from 'react';
import { Box, Cylinder, Html } from '@react-three/drei';

interface InfrastructureConfig {
  waterWalls?: any[];
  fans?: any[];
  acUnits?: any[];
  weatherStation?: any;
}

interface InfrastructureProps {
  config: InfrastructureConfig;
  devices: any[];
  onToggle: (id: string) => void;
}

export const Infrastructure: React.FC<InfrastructureProps> = ({ config, devices, onToggle }) => {
  if (!config) return null;

  return (
    <group>
      {/* Water Walls */}
      {config.waterWalls?.map((ww: any) => (
        <group key={ww.id} position={ww.position}>
          <Box args={[2, 8, 15]}>
            <meshStandardMaterial color={ww.color} transparent opacity={0.6} />
          </Box>
          <Html position={[0, 5, 0]} center distanceFactor={15}>
            <div className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded border border-red-500/50 whitespace-nowrap">
              {ww.label}
            </div>
          </Html>
        </group>
      ))}

      {/* Fans */}
      {config.fans?.map((fan: any) => (
        <group key={fan.id} position={fan.position} rotation={fan.rotation ? [fan.rotation[0], fan.rotation[1], fan.rotation[2]] : [0, 0, 0]}>
          <Cylinder args={[2, 2, 1, 32]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color={fan.color} />
          </Cylinder>
          <Html position={[0, 3, 0]} center distanceFactor={15}>
            <div className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded border border-blue-500/50 whitespace-nowrap">
              {fan.label}
            </div>
          </Html>
        </group>
      ))}

      {/* Weather Station (Legacy support if needed) */}
      {config.weatherStation && (
        <group position={config.weatherStation.position}>
          <Box args={[1, 4, 1]}>
            <meshStandardMaterial color={config.weatherStation.color} />
          </Box>
        </group>
      )}
    </group>
  );
};