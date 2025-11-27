import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { RackNutrientTank } from '../../types/farming';

const RackNutrientTank3D: React.FC<{ data: RackNutrientTank }> = ({ data }) => {
  const [hovered, setHovered] = useState(false);
  
  if (!data) return null; // 安全檢查

  const isEmpty = data.level === 0;
  
  return (
    <group 
      position={data.position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Tank Container */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.6, 1.5, 0.6]} />
        <meshStandardMaterial color="#64748b" opacity={0.6} transparent metalness={0.5} />
      </mesh>
      
      {/* 4-Stage Float Switch */}
      <group position={[0.35, 0.2, 0]}>
        {[1, 2, 3, 4].map(lvl => (
           <mesh key={lvl} position={[0, lvl * 0.3, 0]}>
               <sphereGeometry args={[0.06]} />
               <meshStandardMaterial 
                   color={data.level >= lvl ? "#3b82f6" : "#334155"} 
                   emissive={data.level >= lvl ? "#3b82f6" : "#000000"}
                   emissiveIntensity={data.level >= lvl ? 1 : 0}
               />
           </mesh>
        ))}
      </group>

      {/* Solenoid Valve */}
      {data.valveOpen && (
        <mesh position={[0, 1.8, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1} />
        </mesh>
      )}

      {/* Sensor Info Panel - 使用 scale-50 縮小 */}
      <Html position={[0, 2.5, 0]} center zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
         <div className={`origin-bottom transition-all duration-200 flex flex-col items-center gap-1
            ${hovered ? 'scale-75 opacity-100' : 'scale-50 opacity-90'}`}>
            
            {hovered && (
              <div className="px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-500 shadow-xl backdrop-blur-md mb-1 min-w-[80px]">
                <div className="flex justify-between gap-4 text-xs font-mono">
                  <span className="text-blue-300">pH: {data.ph}</span>
                  <span className="text-yellow-300">EC: {data.ec}</span>
                </div>
              </div>
            )}

            <div className={`px-2 py-1 rounded-full border shadow-md backdrop-blur-sm flex items-center gap-1
                ${isEmpty ? 'bg-red-900/80 border-red-500 animate-pulse' : 'bg-slate-800/80 border-slate-600'}`}>
                {data.valveOpen ? (
                   <span className="text-[10px] font-bold text-green-400 uppercase">FILLING</span>
                ) : isEmpty ? (
                   <span className="text-[10px] font-bold text-red-200 uppercase">EMPTY</span>
                ) : (
                   <div className="flex gap-1 items-center">
                     <div className={`w-2 h-2 rounded-full ${data.ph < 6 ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                     <span className="text-[10px] text-slate-300 font-mono">Tank</span>
                   </div>
                )}
            </div>
         </div>
      </Html>
    </group>
  );
};

export default RackNutrientTank3D;