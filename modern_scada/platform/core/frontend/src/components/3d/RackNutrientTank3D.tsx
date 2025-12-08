import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { RackNutrientTank } from '../../types/farming';
import { Droplets, Power } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useShallow } from 'zustand/react/shallow';

export const RackNutrientTank3D: React.FC<{ data: RackNutrientTank }> = ({ data: initialData }) => {
  const selectRackTank = useAppStore((state) => state.selectRackTank);
  const selectedRackTankId = useAppStore((state) => state.selectedRackTankId);
  const toggleRackTankValve = useAppStore((state) => state.toggleRackTankValve);

  // [修正 1] 鎖定 Tank 位置的參照
  // 除非 initialData.position 的「數值」真的變了，否則不要產生新的陣列
  // 這能避免 React 因為 props 改變而導致 group 微妙的重新計算
  const position = useMemo(() => initialData.position, [
    initialData.position[0],
    initialData.position[1],
    initialData.position[2]
  ]);

  const liveData = useAppStore(
    useShallow((state) => state.rackTanks[initialData.rackId])
  );

  const data = useMemo(() => ({
    ...initialData,
    ...(liveData || {})
  }), [initialData, liveData]);

  if (!data) return null;

  const level = typeof data.level === 'number' ? data.level : 0;
  const isEmpty = level === 0;
  const isSelected = selectedRackTankId === data.rackId;
  const fillPercentage = Math.max(15, (level / 4) * 100);

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectRackTank(data.rackId);
  };

  const handleValveClick = (e: any) => {
    e.stopPropagation();
    toggleRackTankValve(data.rackId);
  };

  return (
    <group
      position={position} // 使用鎖定的 position
      onClick={handleClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      {/* 3D 模型部分 */}
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

      {/* UI 部分 */}
      <Html
        position={[0, 5, 0]}
        center={false} // 保持關閉
        // [修正 2] 關閉 occlusion (遮擋運算)，避免 UI 因為深度計算誤差而閃爍消失
        occlude={false}
        // [修正 3] 將 epsilon 設為 0，強制每一幀都進行平滑更新，消除微小抖動
        eps={0}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        {/* 錨點層：CSS 定位 */}
        <div
          className="absolute top-0 left-0"
          style={{ transform: 'translate3d(-50%, -50%, 0)' }}
        >
          {/* 動畫層 */}
          <div
            className="relative flex flex-col items-center gap-1 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
            onClick={handleClick}
          >
            {/* 內容層 */}
            <div className={`flex flex-col items-center gap-1 transition-transform duration-200 ease-out origin-bottom
                ${isSelected ? 'scale-110' : 'scale-100 opacity-90 hover:scale-105'}`}
            >
              {/* [修正 4] 移除所有 backdrop-blur (毛玻璃)，這是造成移動中 UI 撕裂/跳動的主因 */}

              {/* 按鈕 */}
              <div
                onClick={handleValveClick}
                className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-lg transition-all active:scale-95 bg-slate-800 
                  ${data.valveOpen ? 'bg-green-500 text-white border-green-300 ring-2 ring-green-500/30' : 'bg-slate-800 text-slate-500 border-slate-600 hover:bg-slate-700'}`}
              >
                {data.valveOpen ? <Droplets size={16} fill="currentColor" /> : <Power size={16} />}
              </div>

              {/* 液位計本體 */}
              {/* 注意：這裡移除了 backdrop-blur-sm，改用較深的背景色來維持對比 */}
              <div className={`w-6 h-24 bg-slate-950 rounded-full border-2 p-[3px] shadow-xl flex flex-col justify-end overflow-hidden
                    ${isSelected ? 'border-blue-400 ring-4 ring-blue-400/20' : 'border-slate-600 hover:border-slate-400'} relative`}>
                {/* 刻度線 */}
                <div className="absolute inset-0 z-10 flex flex-col justify-between py-3 px-1.5 opacity-30 pointer-events-none">
                  <div className="w-full h-0.5 bg-white"></div>
                  <div className="w-full h-0.5 bg-white"></div>
                  <div className="w-full h-0.5 bg-white"></div>
                </div>

                {/* 水位條 */}
                <div
                  className={`w-full rounded-full transition-all duration-700 ease-in-out relative
                            ${isEmpty ? 'bg-red-500' : data.valveOpen ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ height: `${fillPercentage}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/50 shadow-[0_0_6px_white]"></div>
                </div>
              </div>

              {/* 標籤 */}
              <div className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold shadow-md whitespace-nowrap flex justify-center
                    ${isSelected ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>
                <span>L</span><span className="w-2 text-center">{level.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};