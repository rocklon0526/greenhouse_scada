import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../stores/useAppStore';
import { SensorData } from '../../types/sensors';
import { ThreeEvent } from '@react-three/fiber';

const SensorGroup: React.FC<{ data: SensorData }> = ({ data }) => {
  const { selectedSensorId, selectSensor } = useAppStore();
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedSensorId === data.id;
  const isAlarm = data.status === 'warning';
  const baseColor = "#f97316"; 
  const alarmColor = "#ef4444";

  // 處理 3D Mesh 的點擊
  const handleMeshClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); // 阻止 3D 事件冒泡，這很重要，防止觸發父層或 onPointerMissed
    selectSensor(isSelected ? null : data.id);
  };

  // 處理 HTML 標籤的點擊
  const handleHtmlClick = (e: React.MouseEvent) => {
    // 這是關鍵：阻止 DOM 事件冒泡到 Canvas 的父容器
    // 如果不加這個，點擊 HTML 元素可能會被視為點擊了 Canvas 背景
    e.stopPropagation(); 
    e.nativeEvent.stopImmediatePropagation(); 
    selectSensor(isSelected ? null : data.id);
  };

  return (
    <group position={data.position}>
      {/* 支架 */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 4]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>
      
      {/* 感測器球體 */}
      <mesh 
        onClick={handleMeshClick} 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }} 
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial 
          color={isAlarm ? alarmColor : baseColor} 
          emissive={isAlarm ? alarmColor : baseColor} 
          emissiveIntensity={isAlarm ? 0.8 : 0.4} 
        />
      </mesh>

      {/* 資訊標籤 - 注意這裡的 div 不需要 onClick，因為它內部的 div 已經處理了 */}
      <Html position={[0.8, 0, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <div 
          className={`transition-all duration-200 ease-out select-none ${(hovered || isSelected) ? 'scale-110 z-50' : 'scale-100 z-0'}`}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          // 將事件綁定在這裡
          onClick={handleHtmlClick}
          onMouseEnter={() => setHovered(true)} 
          onMouseLeave={() => setHovered(false)}
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