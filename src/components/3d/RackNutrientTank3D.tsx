import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { RackNutrientTank } from '../../types/farming';

const RackNutrientTank3D: React.FC<{ data: RackNutrientTank }> = ({ data }) => {
  const [hovered, setHovered] = useState(false);
  
  if (!data) return null;

  const isEmpty = data.level === 0;
  
  // 視覺參數
  const tankSize = 1.4; // 方形桶身大小
  const mainColor = "#0ea5e9"; // 科技藍 (高亮)
  const pipeColor = "#ef4444"; // 紅色管線
  
  // 主管線高度設定 (位於桶子上方)
  const pipeHeight = 2.5; 

  return (
    <group 
      position={data.position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* 1. 紅色主供水管 (Main Pipe Segment) */}
      {/* 這裡繪製一節長度為 8 的橫向管線 (對應層架間距)，當多個桶子排列時，視覺上會連成一條長管 */}
      <mesh position={[-20, pipeHeight, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 50, 16]} /> 
        <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* 2. 分支管線 (Branch Pipe) */}
      {/* 從主管線向下連接到桶子頂部 */}
      <mesh position={[0, (pipeHeight + tankSize) / 2, 0]}>
         <cylinderGeometry args={[0.08, 0.08, pipeHeight - tankSize, 12]} />
         <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* 3. 分支電磁閥 (Branch Valve) */}
      {/* 放置在主管線與分支管線的交接處 (T型接頭處) */}
      <group position={[0, pipeHeight, 0.2]}> {/* 稍微往 Z 軸突出，讓視覺更明顯 */}
         {/* 閥體盒子 */}
         <mesh>
            <boxGeometry args={[0.4, 0.5, 0.4]} />
            <meshStandardMaterial color="#1e293b" />
         </mesh>
         {/* 電磁線圈 (上方圓柱) */}
         <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.4]} />
            <meshStandardMaterial 
                color={data.valveOpen ? "#22c55e" : "#94a3b8"} // 開啟時變綠，關閉時灰色
                emissive={data.valveOpen ? "#22c55e" : "#000000"}
                emissiveIntensity={data.valveOpen ? 0.8 : 0}
            />
         </mesh>
         {/* 手動旋鈕 (紅色小配件) */}
         <mesh position={[0, 0, 0.25]} rotation={[Math.PI/2, 0, 0]}>
             <torusGeometry args={[0.1, 0.04, 8, 16]} />
             <meshStandardMaterial color="red" />
         </mesh>
      </group>

      {/* 4. 桶身 (方形工業桶) */}
      <group position={[0, tankSize / 2, 0]}>
         {/* 外殼 */}
         <mesh>
            <boxGeometry args={[tankSize, tankSize, tankSize]} />
            <meshStandardMaterial 
              color={mainColor} 
              transparent 
              opacity={0.7} 
              metalness={0.4} 
              roughness={0.1}
              emissive={mainColor}
              emissiveIntensity={0.2}
            />
         </mesh>
         
         {/* 邊框 Wireframe */}
         <mesh>
            <boxGeometry args={[tankSize + 0.02, tankSize + 0.02, tankSize + 0.02]} />
            <meshBasicMaterial color="#bae6fd" wireframe />
         </mesh>

         {/* 內部液體 */}
         {data.level > 0 && (
           <mesh position={[0, -tankSize/2 + (data.level * 0.25 * tankSize)/2, 0]}>
              <boxGeometry args={[tankSize - 0.1, data.level * 0.25 * tankSize, tankSize - 0.1]} />
              <meshStandardMaterial color="#3b82f6" transparent opacity={0.9} />
           </mesh>
         )}
      </group>

      {/* 5. PH/EC 感測器控制盒 */}
      <group position={[0.5, tankSize + 0.2, 0.5]}>
        <mesh>
          <boxGeometry args={[0.4, 0.3, 0.3]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <Html position={[0, 0.4, 0]} center transform sprite>
           <div className="bg-slate-900 text-[8px] text-white px-1 border border-slate-600 rounded opacity-80">PH/EC</div>
        </Html>
      </group>

      {/* 6. 多浮球開關 */}
      <group position={[-0.5, tankSize / 2, -0.5]}>
         <mesh>
            <cylinderGeometry args={[0.02, 0.02, tankSize]} />
            <meshStandardMaterial color="#64748b" />
         </mesh>
         {[1, 2, 3, 4].map(lvl => (
            <mesh key={lvl} position={[0, (lvl * 0.25 * tankSize) - (tankSize/2), 0]}>
                <sphereGeometry args={[0.08]} />
                <meshStandardMaterial 
                    color={data.level >= lvl ? "#22c55e" : "#475569"} 
                    emissive={data.level >= lvl ? "#22c55e" : "#000000"}
                    emissiveIntensity={data.level >= lvl ? 0.8 : 0}
                />
            </mesh>
         ))}
      </group>

      {/* 7. 互動式 UI 卡片 */}
      <Html position={[0, tankSize + 2, 0]} center zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
         <div className={`origin-bottom transition-all duration-300 flex flex-col items-center gap-1
            ${hovered ? 'scale-110 opacity-100 z-50' : 'scale-75 opacity-80 z-0'}`}>
            
            {hovered && (
              <div className="px-3 py-2 rounded-lg bg-slate-900/95 border border-blue-500/50 shadow-2xl backdrop-blur-md mb-2 min-w-[100px] animate-in slide-in-from-bottom-2 fade-in">
                <div className="text-[10px] text-slate-400 font-bold mb-1 border-b border-slate-700 pb-1">Rack {data.rackId}</div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center gap-3">
                     <span className="text-slate-400 text-xs">PH</span>
                     <span className={`font-mono font-bold text-sm ${data.ph < 5.5 || data.ph > 6.5 ? 'text-red-400' : 'text-green-400'}`}>{data.ph}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                     <span className="text-slate-400 text-xs">EC</span>
                     <span className="font-mono font-bold text-sm text-yellow-400">{data.ec}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={`px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md flex items-center gap-2 cursor-pointer
                ${isEmpty ? 'bg-red-900/90 border-red-500 animate-pulse' : 'bg-slate-800/90 border-slate-600 hover:bg-blue-900/80 hover:border-blue-500'}`}>
                
                {data.valveOpen ? (
                   <>
                     <div className="w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
                     <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">FILLING</span>
                   </>
                ) : isEmpty ? (
                   <>
                     <div className="w-2 h-2 rounded-full bg-red-500"></div>
                     <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider">EMPTY</span>
                   </>
                ) : (
                   <>
                     <div className="flex flex-col items-center">
                        <span className="text-[8px] text-slate-400 uppercase leading-none">Lvl</span>
                        <span className="text-xs font-bold text-white leading-none">{data.level}</span>
                     </div>
                     <div className="h-4 w-px bg-slate-600 mx-1"></div>
                     <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_currentColor]"></div>
                   </>
                )}
            </div>
         </div>
      </Html>
    </group>
  );
};

export default RackNutrientTank3D;