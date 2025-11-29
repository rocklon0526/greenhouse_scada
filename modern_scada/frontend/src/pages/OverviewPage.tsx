import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls, Grid, Environment, ContactShadows, Stars } from '@react-three/drei';
import { XCircle, CloudSun, Beaker, Droplets, Activity, Zap, ArrowRightCircle } from 'lucide-react';
import * as THREE from 'three';
import { WAREHOUSE_LAYOUT } from '../configs/layoutConfig';
import { useAppStore } from '../stores/useAppStore';
import VerticalRack from '../components/3d/VerticalRack';
import SensorGroup from '../components/3d/SensorGroup';
import { Infrastructure } from '../components/3d/Infrastructure';
import { DosingSystem3D } from '../components/3d/DosingSystem3D';
import RackNutrientTank3D from '../components/3d/RackNutrientTank3D';
import { translations } from '../i18n/translations';

// 共用卡片樣式元件
const DetailCard = ({ title, subTitle, onClose, children }: { title: string, subTitle?: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="absolute top-24 right-6 w-80 bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-5 shadow-2xl z-20 animate-in slide-in-from-right-10 fade-in duration-300">
    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
      <div>
        <h3 className="text-blue-400 font-bold text-lg">{title}</h3>
        {subTitle && <p className="text-slate-400 text-xs">{subTitle}</p>}
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><XCircle size={24} /></button>
    </div>
    {children}
  </div>
);

const SensorDetailPanel = () => {
  const { selectedSensorId, sensors, clearSelection, language } = useAppStore();
  const t = translations[language];
  const sensorGroup = sensors.find(s => s.id === selectedSensorId);
  if (!sensorGroup) return null;

  const levels = [t.top, t.mid, t.bot];
  const levelData = [sensorGroup.details.top, sensorGroup.details.mid, sensorGroup.details.bot];

  return (
    <DetailCard title={sensorGroup.id} subTitle={t.sensorAnalysis} onClose={clearSelection}>
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
    </DetailCard>
  );
};

const DosingTankPanel = () => {
  const { selectedDosingTankId, dosingTanks, clearSelection } = useAppStore();
  const tank = dosingTanks.find(t => t.id === selectedDosingTankId);
  if (!tank) return null;

  return (
    <DetailCard title={`Solution Tank ${tank.id}`} subTitle="Chemical Configuration" onClose={clearSelection}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
          <div className="p-2 bg-purple-500/20 rounded-full text-purple-400"><Beaker size={20} /></div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Chemical</div>
            <div className="text-lg font-bold text-white">{tank.chemicalType}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 uppercase mb-1">Capacity</div>
            <div className="text-xl font-mono font-bold text-white">{tank.capacity}<span className="text-xs ml-1 text-slate-500">kg</span></div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 uppercase mb-1">Current Level</div>
            <div className="text-xl font-mono font-bold text-blue-400">{tank.currentLevel}<span className="text-xs ml-1 text-slate-500">kg</span></div>
          </div>
        </div>
        <div className="text-xs text-slate-500 italic">
          Configured Name: <span className="text-slate-300 not-italic">{tank.name}</span>
        </div>
      </div>
    </DetailCard>
  );
};

const MixerPanel = () => {
  const { isMixerSelected, mixerData, clearSelection, toggleMixerValve, toggleMixerPump, language } = useAppStore();
  const t = translations[language];
  if (!isMixerSelected) return null;

  // 修改：最大容量設定為 20T (20000 公升)
  const MAX_CAPACITY = 20000;
  // 計算百分比，限制在 0-100 之間
  const fillPercentage = Math.min(100, Math.max(0, (mixerData.level / MAX_CAPACITY) * 100));

  return (
    <DetailCard title={t.mixerTitle} subTitle={t.mixerSubtitle} onClose={clearSelection}>
      <div className="space-y-4">
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase mb-1">System Status</div>
            <div className="text-lg font-bold text-green-400">{mixerData.status}</div>
          </div>
          <Activity size={24} className="text-slate-600" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Tank Level (Max 20T)</span>
            <span className="font-mono text-white">{mixerData.level} L</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            {/* 動態寬度 */}
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${fillPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={toggleMixerValve}
            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all active:scale-95
                ${mixerData.valveOpen ? 'bg-green-900/20 border-green-500 text-green-400 shadow-green-900/20 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
          >
            <div className={`p-2 rounded-full ${mixerData.valveOpen ? 'bg-green-500/20' : 'bg-slate-700'}`}>
              <Droplets size={20} />
            </div>
            <div className="text-xs font-bold uppercase">{t.mainValve}</div>
            <div className="text-[10px] opacity-70">{mixerData.valveOpen ? 'OPEN' : 'CLOSED'}</div>
          </button>

          <button
            onClick={toggleMixerPump}
            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all active:scale-95
                ${mixerData.pumpActive ? 'bg-blue-900/20 border-blue-500 text-blue-400 shadow-blue-900/20 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
          >
            <div className={`p-2 rounded-full ${mixerData.pumpActive ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
              <Zap size={20} />
            </div>
            <div className="text-xs font-bold uppercase">{t.feedPump}</div>
            <div className="text-[10px] opacity-70">{mixerData.pumpActive ? 'ON' : 'OFF'}</div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">PH</span>
            <span className="font-mono font-bold text-white">{mixerData.ph}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">EC</span>
            <span className="font-mono font-bold text-yellow-400">{mixerData.ec}</span>
          </div>
        </div>
      </div>
    </DetailCard>
  );
};

const RackTankPanel = () => {
  // @ts-ignore
  const { selectedRackTankId, rackTanks, clearSelection, startTransferProcess } = useAppStore();
  const tank = selectedRackTankId ? rackTanks[selectedRackTankId] : null;
  if (!tank) return null;

  return (
    <DetailCard title={`Rack ${tank.rackId}`} subTitle="Local Nutrient Supply" onClose={clearSelection}>
      <div className="space-y-4">
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${tank.valveOpen ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className={`p-2 rounded-full ${tank.valveOpen ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
            <Droplets size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Supply Status</div>
            <div className={`text-lg font-bold ${tank.valveOpen ? 'text-green-400' : 'text-slate-300'}`}>
              {tank.valveOpen ? 'FILLING' : 'IDLE'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 uppercase mb-1">PH Level</div>
            <div className="text-xl font-mono font-bold text-white">{tank.ph}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 uppercase mb-1">EC Level</div>
            <div className="text-xl font-mono font-bold text-yellow-400">{tank.ec}</div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-slate-400 uppercase">Tank Level</span>
            <span className="text-sm font-mono font-bold text-blue-300">Level {tank.level}</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden flex gap-0.5">
            {[1, 2, 3, 4].map(l => (
              <div key={l} className={`flex-1 h-full rounded-sm ${tank.level >= l ? 'bg-blue-500' : 'bg-slate-600/30'}`}></div>
            ))}
          </div>
        </div>

        {/* 測試按鈕：手動補水 (Scenario 2) */}
        <button
          onClick={() => startTransferProcess(tank.rackId)}
          disabled={tank.level > 1 || tank.status === 'FILLING'} // 只在低水位且閒置時可用
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
        >
          <ArrowRightCircle size={20} />
          {tank.status === 'FILLING' ? 'Refilling...' : 'Start Refill Task'}
        </button>
      </div>
    </DetailCard>
  );
};

const WeatherPanel = () => {
  const { weatherStation, language } = useAppStore();
  const t = translations[language];
  return (
    <div className="absolute top-24 left-6 w-56 bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 shadow-xl pointer-events-none z-10">
      <div className="flex items-center gap-2 mb-3 text-purple-400"><CloudSun size={20} /><span className="font-bold text-sm uppercase">{t.outdoorWeather}</span></div>
      <div className="grid grid-cols-2 gap-3">
        <div><div className="text-xs text-slate-400">Temp</div><div className="text-xl font-mono font-bold text-white">{weatherStation.temp}°</div></div>
        <div><div className="text-xs text-slate-400">Humidity</div><div className="text-xl font-mono font-bold text-blue-300">{weatherStation.hum}%</div></div>
        <div className="col-span-2 pt-2 border-t border-slate-700"><div className="flex justify-between text-xs"><span className="text-slate-400">{t.uvIndex}</span><span className="text-yellow-400 font-bold">{weatherStation.uv}</span></div></div>
      </div>
    </div>
  )
}

const OverviewPage = () => {
  // @ts-ignore
  const { initSystem, sensors, devices, toggleDevice, clearSelection, rackTanks } = useAppStore();
  useEffect(() => { const cleanup = initSystem(WAREHOUSE_LAYOUT); return cleanup; }, [initSystem]);

  return (
    <div className="w-full h-full relative bg-slate-950">
      <WeatherPanel />
      <SensorDetailPanel />
      <DosingTankPanel />
      <MixerPanel />
      <RackTankPanel />

      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }} onPointerMissed={(e) => e.type === 'click' && clearSelection()}>
        <OrthographicCamera makeDefault position={[60, 60, 90]} zoom={12} near={-200} far={1000} />
        <OrbitControls enableRotate={false} enableZoom={true} enablePan={true} minZoom={5} maxZoom={40} />
        <ambientLight intensity={0.8} color="#ffffff" />
        <directionalLight position={[30, 60, 30]} intensity={1.5} castShadow shadow-mapSize={[4096, 4096]} />
        <Stars radius={200} depth={50} count={2000} factor={4} saturation={0} fade />
        <Environment preset="city" />
        <group position={[0, -5, 0]}>
          <Grid position={[0, 0.01, 0]} args={[120, 120]} cellColor="#334155" sectionColor="#64748b" fadeDistance={150} infiniteGrid />
          <DosingSystem3D />
          {Object.values(rackTanks || {}).map((tank: any) => (
            <RackNutrientTank3D key={tank.rackId} data={tank} />
          ))}
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