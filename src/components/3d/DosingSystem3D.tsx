import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../stores/useAppStore';

// 小落料桶 (簡潔版)
const DosingTank = ({ data, position, color, labelOffset }: any) => {
  const [hovered, setHovered] = useState(false);
  const visualHeight = (data.currentLevel / 100) * 1.5;

  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.5, 0.5, 2, 32]} /><meshStandardMaterial color="#475569" transparent opacity={0.3} /></mesh>
      <mesh position={[0, visualHeight / 2, 0]}><cylinderGeometry args={[0.45, 0.45, visualHeight, 32]} /><meshStandardMaterial color={color} transparent opacity={0.8} /></mesh>
      
      {/* 標籤: 預設只顯示 %，Hover 顯示名稱 */}
      <Html position={[labelOffset[0] * 1.6, 2.5, labelOffset[1] * 1.6]} center style={{ pointerEvents: 'none' }}>
        <div 
          className={`transition-all duration-300 flex flex-col items-center
            ${hovered ? 'scale-110 z-50' : 'scale-100 z-0 opacity-80'}`}
          style={{ pointerEvents: 'auto' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {hovered && (
            <div className="mb-1 px-2 py-1 bg-slate-900/95 border border-slate-600 rounded text-[9px] text-slate-300 whitespace-nowrap shadow-xl">
              {data.name} ({data.chemicalType})
            </div>
          )}
          <div className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-600 shadow backdrop-blur-sm text-center min-w-[40px]">
             <div className="text-[8px] text-slate-400 font-bold mb-0.5">T{data.id}</div>
             <div className="text-xs font-mono font-bold text-white leading-none">{data.currentLevel}<span className="text-[8px]">%</span></div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export const DosingSystem3D = () => {
  // @ts-ignore
  const { dosingTanks } = useAppStore();
  const [mixHovered, setMixHovered] = useState(false); 
  
  // 調配區位置
  const baseX = -40; 
  const baseZ = -25;
  const radius = 3.5;

  // 用來連接後方主幹道的位置參數
  // 後方管線 Z 軸座標約為 22.5 (根據 RackNutrientTank 位置推算)
  const mainPipeZ = 22.5; 
  const mainPipeColor = "#ef4444";

  if (!dosingTanks) return null;

  const mixTankData = {
    level: 8500,
    ph: 5.8,
    ec: 1.2,
    status: 'Ready',
    isMixing: false
  };

  const isReady = mixTankData.status === 'Ready';
  const isExpanded = mixHovered;

  return (
    <group position={[baseX, 0, baseZ]}>
      {/* 1. 上層：環狀落料桶 */}
      <group position={[0, 5, 0]}>
        {dosingTanks.map((tank: any, i: number) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          return <DosingTank key={tank.id} data={tank} position={[x, 0, z]} labelOffset={[x, z]} color={['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'][i]} />;
        })}
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[radius, 0.1, 16, 64]} /><meshStandardMaterial color="#334155" /></mesh>
      </group>

      {/* 2. 中層：漏斗 */}
      <group position={[0, 2, 0]}>
        <mesh><cylinderGeometry args={[2.5, 0.4, 2.5, 32, 1, true]} /><meshStandardMaterial color="#94a3b8" side={2} opacity={0.6} transparent metalness={0.5} /></mesh>
      </group>

      {/* 3. 下層：調配桶 (Mixing Tank) */}
      <group position={[0, -2.5, 0]}>
        <mesh 
          onPointerOver={(e) => { e.stopPropagation(); setMixHovered(true); }} 
          onPointerOut={(e) => { e.stopPropagation(); setMixHovered(false); }}
        >
          <cylinderGeometry args={[3.5, 3.5, 4, 32]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.2} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[3.3, 3.3, 2.5, 32]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.7} emissive="#0284c7" emissiveIntensity={0.3} />
        </mesh>

        {/* --- 新增：調配桶出口與總管線連線 --- */}
        
        {/* 出口管 (從桶底出來，往後方延伸) */}
        {/* 計算 Z 軸長度: 目標 Z (28.5) - 目前 Z (baseZ = -25) = 距離約 53.5 */}
        <group position={[0, -1.5, (mainPipeZ - baseZ) / 2]}> 
           <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.3, mainPipeZ - baseZ, 16]} />
              <meshStandardMaterial color={mainPipeColor} metalness={0.5} roughness={0.2} />
           </mesh>
        </group>

        {/* 總電磁閥 (Main Valve) - 放置在靠近桶子的出口處 */}
        <group position={[0, -1.5, 4]} rotation={[0, 0, Math.PI/2]}>
           <mesh>
             <boxGeometry args={[0.8, 1.2, 0.8]} />
             <meshStandardMaterial color="#1e293b" />
           </mesh>
           <mesh position={[0, 0.8, 0]}>
             <cylinderGeometry args={[0.3, 0.3, 0.6]} />
             <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
           </mesh>
           {/* Valve Label */}
           <Html position={[0, 1.5, 0]} center transform sprite>
              <div className="text-[8px] bg-black/80 text-orange-400 px-1 rounded border border-orange-500/50">MAIN V.</div>
           </Html>
        </group>

        {/* --- 互動式 UI 卡片 --- */}
        <Html position={[-4, -6, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
           <div 
              className={`flex flex-col items-center gap-1 transition-all duration-300 ease-out origin-bottom
                ${isExpanded ? 'z-50 scale-100' : 'z-0 scale-90'}`}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onMouseEnter={() => setMixHovered(true)}
              onMouseLeave={() => setMixHovered(false)}
           >
              <div className={`overflow-hidden transition-all duration-300 ease-out shadow-2xl backdrop-blur-md border border-blue-500/50 rounded-xl bg-slate-900/95
                  ${isExpanded ? 'max-h-48 opacity-100 mb-2 translate-y-0' : 'max-h-0 opacity-0 translate-y-4'}`}
                style={{ width: '160px' }}
              >
                 <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-100 tracking-wider">MIXER</span>
                    <span className="text-[9px] font-mono text-slate-300">{mixTankData.status}</span>
                 </div>
                 <div className="p-3 space-y-2">
                    <div>
                       <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Level</span><span className="text-white font-mono">8500 L</span></div>
                       <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[65%]"></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                       <div className="flex justify-between border-b border-slate-700/50 pb-1"><span className="text-slate-400">PH</span><span className="font-mono text-green-400 font-bold">{mixTankData.ph}</span></div>
                       <div className="flex justify-between border-b border-slate-700/50 pb-1"><span className="text-slate-400">EC</span><span className="font-mono text-yellow-400 font-bold">{mixTankData.ec}</span></div>
                    </div>
                 </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all duration-300
                 ${isExpanded ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-500/30' : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                 <div className="flex flex-col leading-none">
                    <span className="text-[8px] font-bold opacity-70 uppercase tracking-wider mb-0.5">Tank</span>
                    <span className="text-sm font-mono font-bold">Main</span>
                 </div>
                 <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-400' : 'bg-yellow-400'} shadow-[0_0_5px_currentColor]`}></div>
              </div>
           </div>
        </Html>
      </group>
    </group>
  );
};