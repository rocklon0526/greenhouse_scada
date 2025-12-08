import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group } from 'three';
import { useAppStore } from '../../stores/useAppStore';
import { Power, Wind } from 'lucide-react';

interface Fan3DProps {
  id?: string;
  values?: any;
}

const Fan3D: React.FC<Fan3DProps> = ({ id, values }) => {
  const bladeRef = useRef<Group>(null);
  // @ts-ignore
  const { controlDevice } = useAppStore();
  const [hovered, setHovered] = useState(false);

  const deviceData = values && id ? values[id] : null;
  const isRunning = deviceData?.status === 'ON';

  // 點擊切換狀態
  const toggleStatus = (e: any) => {
    e.stopPropagation();
    if (!id) return;
    const newStatus = isRunning ? 'OFF' : 'ON';
    controlDevice(id, { status: newStatus });
  };

  // 轉動動畫
  useFrame((state, delta) => {
    if (isRunning && bladeRef.current) {
      bladeRef.current.rotation.y += delta * 15;
    }
  });

  return (
    <group
      onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: any) => { e.stopPropagation(); setHovered(false); }}
    >

      {/* 風扇主體 (Y軸向上) */}
      <mesh>
        <cylinderGeometry args={[2, 2, 1, 32, 1, true]} />
        <meshStandardMaterial color="#475569" side={2} metalness={0.5} roughness={0.5} />
      </mesh>

      {/* 扇葉群組 */}
      <group ref={bladeRef}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.2, 0.1, 3.6]} />
          <meshStandardMaterial color={isRunning ? "#3b82f6" : "#94a3b8"} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.2, 0.1, 3.6]} />
          <meshStandardMaterial color={isRunning ? "#3b82f6" : "#94a3b8"} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* 互動 UI */}
      <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
        <div
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${hovered ? 'scale-110 opacity-100' : 'scale-100 opacity-90'}`}
          style={{ pointerEvents: 'auto' }}
        >
          <button
            onClick={toggleStatus}
            className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-sm transition-all active:scale-95
              ${isRunning
                ? 'bg-blue-500 text-white border-blue-300 ring-2 ring-blue-500/30 animate-pulse'
                : 'bg-slate-900 text-slate-500 border-slate-600 hover:bg-slate-800 hover:text-slate-300'}`}
          >
            {isRunning ? <Wind size={16} className="animate-spin" /> : <Power size={16} />}
          </button>

          {/* {hovered && (
            <div className="px-2 py-0.5 bg-slate-900/90 text-white text-[10px] rounded border border-slate-700 whitespace-nowrap">
              {id}
            </div>
          )} */}
        </div>
      </Html>
    </group>
  );
};

export default Fan3D;