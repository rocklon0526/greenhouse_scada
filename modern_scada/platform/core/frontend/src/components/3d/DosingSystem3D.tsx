import React from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../stores/useAppStore';
import { Droplets, Zap, Power } from 'lucide-react'; // 引入 Zap 圖示代表幫浦

const DosingTank = ({ data, position, color, labelOffset }: any) => {
  // @ts-ignore
  const { selectDosingTank, selectedDosingTankId } = useAppStore();
  const visualHeight = (data.currentLevel / 100) * 1.5;
  const isSelected = selectedDosingTankId === data.id;

  return (
    <group
      position={position}
      onClick={(e: any) => { e.stopPropagation(); selectDosingTank(data.id); }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.5, 0.5, 2, 32]} /><meshStandardMaterial color="#475569" transparent opacity={0.3} /></mesh>
      <mesh position={[0, visualHeight / 2, 0]}><cylinderGeometry args={[0.45, 0.45, visualHeight, 32]} /><meshStandardMaterial color={color} transparent opacity={0.8} /></mesh>

      {/* 靜態標籤 */}
      <Html position={[labelOffset[0] * 1.6, 2.5, labelOffset[1] * 1.6]} center style={{ pointerEvents: 'none' }}>
        <div className={`px-2 py-1 rounded-md border shadow backdrop-blur-sm text-center min-w-[40px] transition-all
            ${isSelected ? 'bg-blue-600/80 border-blue-400 scale-110' : 'bg-slate-800/60 border-slate-600/50 scale-100 opacity-80'}`}>
          <div className="text-[8px] font-bold mb-0.5 text-slate-300">T{data.id}</div>
        </div>
      </Html>
    </group>
  );
};

export const DosingSystem3D = () => {
  // @ts-ignore
  const { dosingTanks, selectMixer, isMixerSelected, mixerData } = useAppStore();

  const baseX = -40;
  const baseZ = -25;
  const radius = 3.5;

  if (!dosingTanks) return null;

  return (
    <group position={[baseX, 4.5, baseZ]}>
      {/* 1. 上層：環狀落料桶 */}
      <group position={[0, 5, 0]}>
        {dosingTanks.map((tank: any, i: number) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          return <DosingTank key={tank.id} data={tank} position={[x, 0, z]} labelOffset={[x, z]} color={['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'][i]} />;
        })}
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, 0.1, 16, 64]} /><meshStandardMaterial color="#334155" /></mesh>
      </group>

      {/* 2. 中層：漏斗 */}
      <group position={[0, 2, 0]}>
        <mesh><cylinderGeometry args={[2.5, 0.4, 2.5, 32, 1, true]} /><meshStandardMaterial color="#94a3b8" side={2} opacity={0.6} transparent metalness={0.5} /></mesh>
      </group>

      {/* 3. 下層：調配桶 (Mixing Tank) */}
      <group position={[0, -2.5, 0]}>
        <mesh
          onClick={(e: any) => { e.stopPropagation(); selectMixer(true); }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <cylinderGeometry args={[3.5, 3.5, 4, 32]} />
          <meshStandardMaterial color={isMixerSelected ? "#3b82f6" : "#0f172a"} metalness={0.6} roughness={0.2} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[3.3, 3.3, 2.5, 32]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.7} emissive="#0284c7" emissiveIntensity={0.3} />
        </mesh>

        {/* 總電磁閥 & 幫浦模組 */}
        <group position={[0, -1.5, 10]} rotation={[0, 0, Math.PI / 2]}>
          {/* 水閥 (Valve) */}
          <mesh><boxGeometry args={[0.8, 1.2, 0.8]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.6]} />
            <meshStandardMaterial color={mixerData.valveOpen ? "#22c55e" : "#f59e0b"} emissive={mixerData.valveOpen ? "#22c55e" : "#000000"} emissiveIntensity={0.5} />
          </mesh>

          {/* 幫浦 (Pump) - 位於水閥旁邊 */}
          <group position={[0, -1.5, 0]}> {/* 往管線延伸方向移動 */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.6, 0.6, 1.2, 16]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.8, 1.0, 1.0]} />
              <meshStandardMaterial color={mixerData.pumpActive ? "#3b82f6" : "#334155"} emissive={mixerData.pumpActive ? "#3b82f6" : "#000000"} emissiveIntensity={0.5} />
            </mesh>
          </group>

          {/* 3D 狀態標籤 - 顯示 Valve 與 Pump 狀態 */}
          <Html position={[0, 2.5, 0]} center transform sprite style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col gap-1 items-center">
              {/* Valve Indicator */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-sm
                    ${mixerData.valveOpen ? 'bg-green-500 text-white border-green-300 animate-pulse' : 'bg-slate-900/80 text-slate-500 border-slate-600'}`}>
                {mixerData.valveOpen ? <Droplets size={14} fill="currentColor" /> : <Power size={14} />}
              </div>
              {/* Pump Indicator */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-sm
                    ${mixerData.pumpActive ? 'bg-blue-500 text-white border-blue-300 animate-pulse' : 'bg-slate-900/80 text-slate-500 border-slate-600'}`}>
                <Zap size={14} fill="currentColor" />
              </div>
            </div>
          </Html>
        </group>

        {/* 靜態標籤 Mixer */}
        <Html position={[-4, -3, 0]} center style={{ pointerEvents: 'none' }}>
          <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md transition-all
              ${isMixerSelected ? 'bg-blue-600/90 border-blue-400 text-white' : 'bg-slate-800/60 border-slate-600/50 text-slate-400'}`}>
            <span className="text-xs font-mono font-bold">Mixer</span>
          </div>
        </Html>
      </group>
    </group>
  );
};