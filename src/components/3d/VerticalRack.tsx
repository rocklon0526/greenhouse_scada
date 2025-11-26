import React, { useMemo } from 'react';
import { Instance, Instances, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RackData } from '../../configs/layoutConfig';

interface PlantTrayProps {
  position: [number, number, number];
  width: number;
  length: number;
}

const PlantTray: React.FC<PlantTrayProps> = ({ position, width, length }) => (
  <group position={position}>
    {/* 托盤底座 */}
    <mesh position={[0, 0.05, 0]}>
      <boxGeometry args={[width * 0.95, 0.1, length * 0.95]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
    </mesh>
    {/* 植物層 */}
    <mesh position={[0, 0.25, 0]}>
      <boxGeometry args={[width * 0.85, 0.3, length * 0.85]} />
      <meshStandardMaterial color="#4ade80" roughness={1} emissive="#166534" emissiveIntensity={0.2} />
    </mesh>
  </group>
);

interface VerticalRackProps {
  data: RackData;
}

const VerticalRack: React.FC<VerticalRackProps> = ({ data }) => {
  const { position, levels, width, length, height, id } = data;
  const levelHeight = height / levels;
  
  // 使用 useMemo 優化材質，避免重複創建
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#e2e8f0", 
    metalness: 0.6, 
    roughness: 0.2 
  }), []);

  return (
    <group position={position}>
      {/* 1. 四根主支柱 (使用 Instances 優化效能) */}
      <Instances range={4} material={frameMaterial}>
        <boxGeometry args={[0.15, height, 0.15]} />
        <Instance position={[width/2, height/2, length/2]} />
        <Instance position={[-width/2, height/2, length/2]} />
        <Instance position={[width/2, height/2, -length/2]} />
        <Instance position={[-width/2, height/2, -length/2]} />
      </Instances>

      {/* 2. 每一層的橫樑與植物 */}
      {Array.from({ length: levels }).map((_, i) => {
        const y = i * levelHeight + 1;
        return (
          <group key={i} position={[0, y, 0]}>
            {/* 橫樑支架 */}
            <mesh>
                <boxGeometry args={[width + 0.1, 0.1, length + 0.1]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* 植物盤 */}
            <PlantTray position={[0, 0, 0]} width={width} length={length} />
          </group>
        );
      })}
      
      {/* 3. 架頂編號牌 */}
      <Html position={[0, height + 0.5, 0]} center transform sprite>
        <div className="flex flex-col items-center">
          <div className="text-xs font-black text-slate-300 tracking-widest bg-slate-900/80 px-3 py-1 rounded-full border border-slate-600 shadow-xl">
            {id}
          </div>
          <div className="w-px h-4 bg-slate-600"></div>
        </div>
      </Html>
    </group>
  );
};

export default VerticalRack;