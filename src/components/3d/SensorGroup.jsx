import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';

const SensorGroup = ({ data }) => {
  const { selectedSensorId, selectSensor } = useAppStore();
  const [hovered, setHovered] = useState(false);
  
  const isSelected = selectedSensorId === data.id;
  const isAlarm = data.status === 'warning';
  
  // 橘色 (Orange-500)
  const baseColor = "#f97316"; 
  const alarmColor = "#ef4444";

  return (
    <group position={data.position}>
      {/* 懸吊線 */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 4]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>

      {/* 感測器本體球 */}
      <mesh 
        onClick={(e) => { e.stopPropagation(); selectSensor(isSelected ? null : data.id); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial 
          color={isAlarm ? alarmColor : baseColor}
          emissive={isAlarm ? alarmColor : baseColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 標籤：永遠顯示平均值 */}
      <Html position={[0.8, 0, 0]} center zIndexRange={[100, 0]}>
        <div 
          className={`
            transition-all duration-200 ease-out cursor-pointer select-none
            ${(hovered || isSelected) ? 'scale-110 z-50' : 'scale-100 z-0'}
          `}
          onClick={(e) => { e.stopPropagation(); selectSensor(isSelected ? null : data.id); }}
        >
          <div className={`
            flex flex-col items-center px-2 py-1 rounded-lg border shadow-lg backdrop-blur-md
            ${isAlarm 
              ? 'bg-red-900/80 border-red-500 text-white' 
              : 'bg-orange-900/80 border-orange-500 text-orange-100'}
          `}>
            <span className="text-[10px] font-bold opacity-70">AVG</span>
            <span className="text-sm font-mono font-bold">{data.avgTemp}°</span>
          </div>
        </div>
      </Html>
    </group>
  );
};

export default SensorGroup;