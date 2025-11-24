import React, { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

const VerticalRack = ({ data }) => {
  const { position, levels, width, length, height } = data;
  const levelHeight = height / levels;

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#e2e8f0", metalness: 0.6, roughness: 0.2 
  }), []);

  return (
    <group position={position}>
      {/* 支柱 */}
      <Instances range={4} material={frameMaterial}>
        <boxGeometry args={[0.15, height, 0.15]} />
        <Instance position={[width/2, height/2, length/2]} />
        <Instance position={[-width/2, height/2, length/2]} />
        <Instance position={[width/2, height/2, -length/2]} />
        <Instance position={[-width/2, height/2, -length/2]} />
      </Instances>

      {/* 層板 (移除植物燈、簡化顯示) */}
      {Array.from({ length: levels }).map((_, i) => {
        const y = i * levelHeight + 1;
        return (
          <group key={i} position={[0, y, 0]}>
            {/* 橫樑 */}
            <mesh>
                <boxGeometry args={[width + 0.1, 0.1, length + 0.1]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* 植物 (純綠色塊) */}
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[width * 0.9, 0.2, length * 0.9]} />
              <meshStandardMaterial color="#15803d" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export default VerticalRack;