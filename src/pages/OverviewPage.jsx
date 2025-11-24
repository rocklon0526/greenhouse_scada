import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrthographicCamera, OrbitControls, Grid, 
  Environment, ContactShadows, Text
} from '@react-three/drei';
import { Wind, Droplets, Thermometer, Activity } from 'lucide-react';
import * as THREE from 'three';
import Card from '../components/Card';

// ============================================================================
// 3D 物件與場景定義
// ============================================================================

// 1. 3D 感測器點 (會發光的立方體)
const Sensor3D = ({ position, val, maxLimit, id }) => {
  const isAlarm = val > maxLimit;
  const color = isAlarm ? "#ef4444" : "#22c55e"; // 紅/綠

  return (
    <group position={position}>
      {/* 發光本體 */}
      <mesh>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} // 自發光
          emissiveIntensity={isAlarm ? 2 : 0.5} // 警報時更亮
          toneMapped={false}
        />
      </mesh>
      {/* 上方數值標籤 */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        billboard // 永遠面向攝影機
      >
        {val.toFixed(1)}°
      </Text>
    </group>
  );
};

// 2. 3D 種植架 (代表一排)
const Rack3D = ({ position, rowId, sensors, maxLimit }) => {
  return (
    <group position={position}>
      {/* 架子結構 (半透明長方體) */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[10, 2, 1]} />
        <meshPhysicalMaterial 
          color="#1e293b" 
          transparent 
          opacity={0.8} 
          metalness={0.8} 
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>
      {/* 架子編號 */}
      <Text position={[-5.5, 0.2, 0]} fontSize={0.5} color="#94a3b8" rotation={[-Math.PI/2, 0, Math.PI/2]}>
        ROW {rowId}
      </Text>
      {/* 放置在架子上的感測器 */}
      {sensors.map((s, i) => (
        <Sensor3D 
          key={s.id} 
          id={s.id}
          val={s.temp}
          maxLimit={maxLimit}
          // 在架子上平均分佈
          position={[-4 + i * 2, 2.2, 0]} 
        />
      ))}
    </group>
  );
};

// 3. 3D 風扇 (會旋轉)
const Fan3D = ({ position, isRunning }) => {
  const bladeRef = useRef();
  // 動畫迴圈：如果運轉中，就旋轉葉片
  useFrame((state, delta) => {
    if (isRunning && bladeRef.current) {
      bladeRef.current.rotation.z += delta * 5; // 調整轉速
    }
  });

  return (
    <group position={position}>
      {/* 風扇外框 */}
      <mesh rotation={[0, Math.PI/2, 0]}>
        <cylinderGeometry args={[1, 1, 0.5, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* 風扇葉片 (用一個簡單的十字代替) */}
      <group ref={bladeRef} rotation={[0, Math.PI/2, 0]}>
        <mesh>
          <boxGeometry args={[0.2, 1.8, 0.1]} />
          <meshStandardMaterial color={isRunning ? "#3b82f6" : "#64748b"} emissive={isRunning ? "#3b82f6" : "black"} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <boxGeometry args={[0.2, 1.8, 0.1]} />
          <meshStandardMaterial color={isRunning ? "#3b82f6" : "#64748b"} emissive={isRunning ? "#3b82f6" : "black"} />
        </mesh>
      </group>
    </group>
  );
};

// ============================================================================
// 主頁面組件 (3D Overview)
// ============================================================================
const OverviewPage = ({ sys }) => {
  const { data } = sys;
  const rows = 8;

  // 將感測器數據按「排 (Row)」分組
  const sensorsByRow = Array.from({ length: rows }, (_, i) => 
    data.sensors.filter(s => s.row === i + 1)
  );

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* KPI 頂部欄 (維持 2D UI 浮動於上方) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 z-10">
        <Card className="flex-row items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs">Avg Temp</div>
            <div className="text-2xl font-bold text-white">26.4°C</div>
          </div>
          <Thermometer className="text-orange-500" />
        </Card>
        <Card className="flex-row items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs">Avg Humidity</div>
            <div className="text-2xl font-bold text-white">65%</div>
          </div>
          <Droplets className="text-blue-500" />
        </Card>
        <Card className={`flex-row items-center justify-between transition-colors ${data.devices.fans ? 'bg-green-900/20 border-green-500/50' : ''}`}>
          <div>
            <div className="text-slate-400 text-xs">Exhaust Fans</div>
            <div className={`text-lg font-bold ${data.devices.fans ? 'text-green-400' : 'text-slate-500'}`}>
              {data.devices.fans ? 'RUNNING' : 'STOPPED'}
            </div>
          </div>
          <Wind className={data.devices.fans ? 'text-green-400 animate-spin' : 'text-slate-600'} />
        </Card>
        <Card className={`flex-row items-center justify-between transition-colors ${data.devices.waterWall ? 'bg-blue-900/20 border-blue-500/50' : ''}`}>
          <div>
            <div className="text-slate-400 text-xs">Water Wall</div>
            <div className={`text-lg font-bold ${data.devices.waterWall ? 'text-blue-400' : 'text-slate-500'}`}>
              {data.devices.waterWall ? 'ACTIVE' : 'OFF'}
            </div>
          </div>
          <Activity className={data.devices.waterWall ? 'text-blue-400' : 'text-slate-600'} />
        </Card>
      </div>

      {/* 3D 場景容器 */}
      <Card title="3D Digital Twin View" className="flex-1 relative overflow-hidden p-0 bg-slate-950 border-none">
        
        {/* R3F Canvas: 3D 世界的入口 */}
        <Canvas shadows className="w-full h-full" gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping }}>
          {/* 1. 攝影機與控制 */}
          <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={25} />
          <OrbitControls 
            enableRotate={true} enableZoom={true} enablePan={true}
            minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.2}
          />

          {/* 2. 燈光與環境 */}
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 20, 10]} intensity={2} castShadow color="#ffffff" />
          <pointLight position={[-10, 5, -10]} intensity={2} color="#3b82f6" distance={30} />
          <Environment preset="city" />

          {/* 3. 場景物件 */}
          <group position={[-5, -2, -5]}>
            
            {/* 地板網格 */}
            <Grid 
              position={[0, 0.01, 0]} args={[40, 40]} 
              cellColor="#334155" sectionColor="#475569" 
              fadeDistance={30} infiniteGrid
            />
            
            {/* 水冷牆 */}
            <mesh position={[0, 2, -8]}>
              <boxGeometry args={[20, 4, 0.5]} />
              <meshStandardMaterial 
                color={data.devices.waterWall ? "#3b82f6" : "#1e293b"}
                emissive={data.devices.waterWall ? "#3b82f6" : "#000000"}
                emissiveIntensity={data.devices.waterWall ? 1 : 0}
                metalness={0.8} roughness={0.2}
              />
              <Text position={[0, 2.5, 0]} fontSize={0.8} color="#3b82f6" anchorY="bottom">
                WATER WALL
              </Text>
            </mesh>

            {/* 種植架與感測器 */}
            {sensorsByRow.map((rowSensors, i) => (
              <Rack3D 
                key={i} 
                rowId={i + 1}
                sensors={rowSensors}
                maxLimit={data.settings.tempThreshold}
                position={[0, 0, i * 2.5]} 
              />
            ))}

            {/* 負壓風扇牆 */}
            <group position={[0, 2, 18]}>
              <Text position={[0, 1.5, 0]} fontSize={0.8} color="#64748b" anchorY="bottom" rotation={[0, Math.PI, 0]}>
                EXHAUST FANS
              </Text>
              {[-4, -2, 0, 2, 4].map((x, i) => (
                <Fan3D key={i} position={[x * 1.5, 0, 0]} isRunning={data.devices.fans} />
              ))}
            </group>

            {/* 模擬養液桶預留位置 (示意) */}
            <group position={[12, 0, 0]}>
              <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 3, 32]} />
                <meshPhysicalMaterial color="#cbd5e1" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
              </mesh>
              <Text position={[0, 3.5, 0]} fontSize={0.5} color="#94a3b8" billboard>Nutrient Tank (Future)</Text>
            </group>

          </group>

        </Canvas>
      </Card>
    </div>
  );
};

export default OverviewPage;