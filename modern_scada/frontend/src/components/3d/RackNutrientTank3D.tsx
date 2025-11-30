import React from 'react';
import { Html } from '@react-three/drei';
import { RackNutrientTank } from '../../types/farming';
import { Droplets, Power } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const RackNutrientTank3D: React.FC<{ data: RackNutrientTank }> = ({ data }) => {
  // @ts-ignore
  const { selectRackTank, selectedRackTankId, toggleRackTankValve } = useAppStore();

  if (!data) return null;

  const isEmpty = data.level === 0;
  const isSelected = selectedRackTankId === data.rackId;
  const fillPercentage = Math.max(15, (data.level / 4) * 100);

  // 統一的點擊處理函數 (選取物件)
  const handleClick = (e: any) => {
    e.stopPropagation();
    selectRackTank(data.rackId);
  };

  // 水閥開關點擊處理
  const handleValveClick = (e: any) => {
    e.stopPropagation(); // 阻止冒泡，避免同時觸發選取
    toggleRackTankValve(data.rackId);
  };

  return (
    <group
      position={data.position}
      onClick={handleClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >

      {/* 4. 分支電磁閥 (物理模型) */}
      <group position={[0, 2.5, 0.2]}>
        <mesh><boxGeometry args={[0.4, 0.5, 0.4]} /><meshStandardMaterial color="#1e293b" /></mesh>
        <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.4]} />
          <meshStandardMaterial
            color={data.valveOpen ? "#22c55e" : "#94a3b8"}
            emissive={data.valveOpen ? "#22c55e" : "#000000"}
            emissiveIntensity={data.valveOpen ? 0.8 : 0}
          />
        </mesh>
      </group>

      {/* 5. 液位計 + 水閥狀態 UI */}
      {/* pointerEvents: 'none' 設在 wrapper，內部元素設為 'auto' 以啟用點擊 */}
      <Html position={[0, 5, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
        <div
          className={`relative flex flex-col items-center gap-1 transition-transform duration-200 cursor-pointer
                ${isSelected ? 'scale-110' : 'scale-100 opacity-90 hover:scale-105'}`}
          style={{ pointerEvents: 'auto' }} // 讓 HTML 介面也可以被點擊
          onClick={handleClick}
        >

          {/* 水閥狀態開關 (Valve Indicator) - 可點擊 */}
          <div
            onClick={handleValveClick}
            className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95
                ${data.valveOpen ? 'bg-green-500 text-white border-green-300 animate-pulse ring-2 ring-green-500/30' : 'bg-slate-800 text-slate-500 border-slate-600 hover:bg-slate-700 hover:text-slate-300'}`}
            title="Toggle Valve"
          >
            {data.valveOpen ? <Droplets size={16} fill="currentColor" /> : <Power size={16} />}
          </div>

          {/* 垂直液位條 */}
          <div className={`w-6 h-24 bg-slate-950/80 rounded-full border-2 p-[3px] shadow-xl backdrop-blur-sm flex flex-col justify-end overflow-hidden transition-colors
                ${isSelected ? 'border-blue-400 ring-4 ring-blue-400/20' : 'border-slate-600/80 hover:border-slate-400'}`}>

            {/* 刻度線 */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between py-3 px-1.5 opacity-30 pointer-events-none">
              <div className="w-full h-0.5 bg-white"></div>
              <div className="w-full h-0.5 bg-white"></div>
              <div className="w-full h-0.5 bg-white"></div>
            </div>

            <div
              className={`w-full rounded-full transition-all duration-700 ease-in-out relative
                        ${isEmpty ? 'bg-red-500/80' : data.valveOpen ? 'bg-green-500/80' : 'bg-blue-500/90'}
                    `}
              style={{ height: `${fillPercentage}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/50 shadow-[0_0_6px_white]"></div>
            </div>
          </div>

          {/* 底部液位標籤 */}
          <div className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold shadow-md whitespace-nowrap
                ${isSelected ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900/90 text-slate-300 border-slate-700'}`}>
            L{data.level}
          </div>
        </div>
      </Html>
    </group>
  );
};

export default RackNutrientTank3D;