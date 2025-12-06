import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../stores/useAppStore';
import { SensorData } from '../../types/sensors';
import { ThreeEvent } from '@react-three/fiber';

const SensorGroup: React.FC<{ data: SensorData, id?: string, values?: any }> = ({ data: initialData, id }) => {
  // @ts-ignore
  const { selectedSensorId, selectSensor, sensors } = useAppStore();
  const [hovered, setHovered] = useState(false);

  // 從 Store 獲取即時數據
  const storeSensorData = sensors?.find((s: any) => s.id === id);
  const data = { ...initialData, ...storeSensorData };

  if (!data) return null;

  const isSelected = selectedSensorId === data.id;
  const isAlarm = data.status === 'warning';
  const isExpanded = hovered || isSelected;

  const handleMeshClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectSensor(isSelected ? null : data.id);
  };

  // 修正：事件傳遞邏輯
  const handleHtmlClick = (e: React.MouseEvent) => {
    // 這裡不需要 stopPropagation，因為我們已經在 mesh 層處理了點擊
    // 只需要處理 UI 內部的邏輯即可
    if (!isSelected) selectSensor(data.id);
    else selectSensor(null);
  };

  const fmt = (val: number | undefined) => typeof val === 'number' ? val.toFixed(1) : '-';

  return (
    <group position={data.position}>
      {/* 支架與感測器球體 (保持不變) */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 4]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      <mesh
        onClick={handleMeshClick}
        onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e: any) => { e.stopPropagation(); setHovered(false); }}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={isAlarm ? "#ef4444" : "#f97316"}
          emissive={isAlarm ? "#ef4444" : "#f97316"}
          emissiveIntensity={isAlarm ? 0.8 : 0.4}
        />
      </mesh>

      {/* [修正重點] 回歸 2D 模式，使用 CSS 絕對定位解決跳動與大小問題 */}
      <Html
        position={[0, 2.5, 0]}
        // 1. 移除 transform, sprite, distanceFactor (解決太小與抖動)
        // 2. 加入 occlude="raycast" 讓標籤在被物體遮擋時自動隱藏 (可選)
        // occlude="raycast" 
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          // 確保容器本身不佔空間，作為定位錨點
          width: 0,
          height: 0,
          overflow: 'visible'
        }}
        zIndexRange={[100, 0]}
      >
        {/* 使用 CSS transform 進行精確置中，這比 drei 的 center 屬性更穩定 */}
        <div
          className="absolute top-0 left-0 flex flex-col items-center justify-end -translate-x-1/2 -translate-y-1/2"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={handleHtmlClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* 詳細資訊卡片 (彈出層) */}
          <div
            className={`absolute bottom-full mb-2 transition-all duration-300 ease-out origin-bottom
              ${isExpanded ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-4 pointer-events-none'}`}
            style={{ width: '140px' }}
          >
            <div className="overflow-hidden shadow-2xl backdrop-blur-md border border-slate-500/50 rounded-xl bg-slate-900/95">
              <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-700 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-300 tracking-wider">SENSOR</span>
                <span className="text-[10px] font-mono text-blue-300">{data.id}</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Humidity</span>
                  <span className="font-mono font-bold text-blue-200">{fmt(data.avgHum)}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">CO2</span>
                  <span className="font-mono font-bold text-gray-200">{fmt(data.avgCo2)}</span>
                </div>
              </div>
            </div>
            {/* 小箭頭 */}
            <div className="w-2 h-2 bg-slate-500/50 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
          </div>

          {/* 常駐小標籤 (膠囊狀) */}
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 min-w-[80px] justify-between
            ${isAlarm ? 'bg-red-500/90 border-red-300 text-white animate-pulse' :
              isExpanded ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-500/30' :
                'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'}
          `}>
            <div className="flex flex-col leading-none">
              <span className="text-[8px] font-bold opacity-70 uppercase tracking-wider mb-0.5">Temp</span>
              <div className="flex items-baseline">
                <span className="text-sm font-mono font-bold">{fmt(data.avgTemp)}</span>
                <span className="text-[10px] ml-0.5">°C</span>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-white' : 'bg-green-400'} shadow-[0_0_5px_currentColor]`}></div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export default SensorGroup;