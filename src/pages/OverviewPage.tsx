import React, { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls, Grid, Environment, ContactShadows, Stars } from '@react-three/drei';
import { XCircle, CloudSun, Thermometer, Droplets } from 'lucide-react'; 
import * as THREE from 'three';
import { WAREHOUSE_LAYOUT } from '../configs/layoutConfig';
import { useAppStore } from '../stores/useAppStore';
import VerticalRack from '../components/3d/VerticalRack';
import SensorGroup from '../components/3d/SensorGroup';
import { Infrastructure } from '../components/3d/Infrastructure';

const SensorDetailPanel = () => {
  const { selectedSensorId, sensors, clearSelection } = useAppStore();
  const sensorGroup = sensors.find(s => s.id === selectedSensorId);
  if (!sensorGroup) return null;

  const levels = ['Top', 'Mid', 'Bot'];
  const levelData = [sensorGroup.details.top, sensorGroup.details.mid, sensorGroup.details.bot];

  return (
    <div className="absolute top-24 right-6 w-80 bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-5 shadow-2xl z-20 animate-in slide-in-from-right-10 fade-in duration-300">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
        <div><h3 className="text-orange-400 font-bold text-lg">{sensorGroup.id}</h3><p className="text-slate-400 text-xs">Vertical Profile Analysis</p></div>
        <button onClick={clearSelection} className="text-slate-400 hover:text-white transition-colors"><XCircle size={24} /></button>
      </div>
      <div className="space-y-3">
        {levels.map((label, idx) => (
          <div key={label} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-center justify-between gap-3">
            <div className="flex flex-col justify-center w-8 border-r border-slate-600 mr-1"><span className="text-xs font-bold text-slate-500 uppercase">{label}</span></div>
            <div className="flex-1"><div className="text-[9px] text-slate-400 uppercase">Temp</div><div className={`font-mono font-bold text-sm ${levelData[idx].temp > 28 ? 'text-red-400' : 'text-white'}`}>{levelData[idx].temp}°</div></div>
            <div className="flex-1"><div className="text-[9px] text-slate-400 uppercase">Hum</div><div className="font-mono font-bold text-sm text-blue-300">{levelData[idx].hum}%</div></div>
            <div className="flex-1"><div className="text-[9px] text-slate-400 uppercase">CO2</div><div className="font-mono font-bold text-sm text-gray-300">{levelData[idx].co2}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeatherPanel = () => {
    const { weatherStation } = useAppStore();
    return (
        <div className="absolute top-24 left-6 w-56 bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 shadow-xl pointer-events-none z-10">
            <div className="flex items-center gap-2 mb-3 text-purple-400"><CloudSun size={20} /><span className="font-bold text-sm uppercase">Outdoor Weather</span></div>
            <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs text-slate-400">Temp</div><div className="text-xl font-mono font-bold text-white">{weatherStation.temp}°</div></div>
                <div><div className="text-xs text-slate-400">Humidity</div><div className="text-xl font-mono font-bold text-blue-300">{weatherStation.hum}%</div></div>
                <div className="col-span-2 pt-2 border-t border-slate-700"><div className="flex justify-between text-xs"><span className="text-slate-400">UV Index</span><span className="text-yellow-400 font-bold">{weatherStation.uv}</span></div></div>
            </div>
        </div>
    )
}

const OverviewPage = () => {
  const { initSystem, sensors, devices, toggleDevice, clearSelection } = useAppStore();
  useEffect(() => { const cleanup = initSystem(WAREHOUSE_LAYOUT); return cleanup; }, [initSystem]);

  return (
    <div className="w-full h-full relative bg-slate-950">
      <WeatherPanel />
      <SensorDetailPanel />
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }} onPointerMissed={(e) => e.type === 'click' && clearSelection()}>
        <OrthographicCamera makeDefault position={[60, 60, 60]} zoom={12} near={-200} far={1000} />
        <OrbitControls enableRotate={false} enableZoom={true} enablePan={true} minZoom={5} maxZoom={40} />
        <ambientLight intensity={0.8} color="#ffffff" />
        <directionalLight position={[30, 60, 30]} intensity={1.5} castShadow shadow-mapSize={[4096, 4096]} />
        <Stars radius={200} depth={50} count={2000} factor={4} saturation={0} fade />
        <Environment preset="city" />
        <group position={[0, -5, 0]}>
          <Grid position={[0, 0.01, 0]} args={[120, 120]} cellColor="#334155" sectionColor="#64748b" fadeDistance={150} infiniteGrid />
          {WAREHOUSE_LAYOUT.racks.map((rack) => <VerticalRack key={rack.id} data={rack} />)}
          {sensors.map((group) => <SensorGroup key={group.id} data={group} />)}
          <Infrastructure config={WAREHOUSE_LAYOUT.infrastructure} devices={devices} onToggle={toggleDevice} />
          <ContactShadows resolution={1024} scale={150} blur={2} opacity={0.25} far={5} color="#000000" />
        </group>
      </Canvas>
    </div>
  );
};

export default OverviewPage;