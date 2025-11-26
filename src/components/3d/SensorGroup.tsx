import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useAppStore, SensorData } from '../../stores/useAppStore';

const SensorGroup: React.FC<{ data: SensorData }> = ({ data }) => {
  const { selectedSensorId, selectSensor } = useAppStore();
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedSensorId === data.id;
  const isAlarm = data.status === 'warning';
  const baseColor = "#f97316"; 
  const alarmColor = "#ef4444";

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectSensor(isSelected ? null : data.id);
  };

  return (
    <group position={data.position}>
      <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.02, 0.02, 4]} /><meshBasicMaterial color="#64748b" /></mesh>
      <mesh onClick={handleClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color={isAlarm ? alarmColor : baseColor} emissive={isAlarm ? alarmColor : baseColor} emissiveIntensity={isAlarm ? 0.8 : 0.4} />
      </mesh>
      <Html position={[0.8, 0, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <div 
          className={`transition-all duration-200 ease-out select-none ${(hovered || isSelected) ? 'scale-110 z-50' : 'scale-100 z-0'}`}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={handleClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        >
          <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border shadow-lg backdrop-blur-md min-w-[60px]
            ${isAlarm ? 'bg-red-900/90 border-red-500 text-white animate-pulse' : isSelected ? 'bg-blue-600/90 border-blue-400 text-white' : 'bg-orange-900/80 border-orange-500 text-orange-100 hover:bg-orange-800/90'}`}>
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">AVG</span>
            <div className="flex items-baseline gap-0.5"><span className="text-lg font-mono font-bold">{data.avgTemp}</span><span className="text-xs">°C</span></div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export default SensorGroup;