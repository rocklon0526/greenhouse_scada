import React, { useEffect, useMemo } from 'react';
import { usePermission } from '@core/hooks/usePermission';
import { XCircle, CloudSun, Beaker, Droplets, Activity, Zap, ArrowRightCircle, Loader2, Database } from 'lucide-react';
import { useAppStore } from '@core/stores/useAppStore';

import { Generic3DViewer } from '@modules/mod_3d_viewer/Generic3DViewer';
import { translations } from '@core/i18n/translations';

// --- 子元件 ---

const DetailCard = ({ title, subTitle, onClose, children }: { title: string, subTitle?: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="absolute top-32 right-6 w-72 bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-2xl z-20 animate-in slide-in-from-right-10 fade-in duration-300">
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
  const { selectedSensorId, sensors, clearSelection, language } = useAppStore() as any;
  const t = translations[language as keyof typeof translations] || translations.en;
  const sensorGroup = sensors.find((s: any) => s.id === selectedSensorId);
  if (!sensorGroup) return null;

  const levels = [t.top, t.mid, t.bot];
  const levelData = [sensorGroup.details.top, sensorGroup.details.mid, sensorGroup.details.bot];
  const fmt = (val: number | undefined) => typeof val === 'number' ? val.toFixed(2) : val;

  return (
    <DetailCard title={sensorGroup.id} subTitle={t.sensorAnalysis} onClose={clearSelection}>
      <div className="space-y-3">
        {levels.map((label: string, idx: number) => (
          <div key={label} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-center justify-between gap-3">
            <div className="flex flex-col justify-center w-8 border-r border-slate-600 mr-1"><span className="text-xs font-bold text-slate-500 uppercase">{label}</span></div>
            <div className="flex-1"><div className="text-[9px] text-slate-400 uppercase">Temp</div><div className={`font-mono font-bold text-sm ${levelData[idx].temp > 28 ? 'text-red-400' : 'text-white'}`}>{fmt(levelData[idx].temp)}°</div></div>
            <div className="flex-1"><div className="text-[9px] text-slate-400 uppercase">Hum</div><div className="font-mono font-bold text-sm text-blue-300">{fmt(levelData[idx].hum)}%</div></div>
            <div className="flex-1"><div className="text-[9px] text-slate-400 uppercase">CO2</div><div className="font-mono font-bold text-sm text-gray-300">{fmt(levelData[idx].co2)}</div></div>
          </div>
        ))}
      </div>
    </DetailCard>
  );
};

const DosingTankPanel = () => {
  const { selectedDosingTankId, dosingTanks, clearSelection } = useAppStore() as any;
  const tank = dosingTanks.find((t: any) => t.id === selectedDosingTankId);
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
  const { isMixerSelected, mixerData, clearSelection, toggleMixerValve, toggleMixerPump, language } = useAppStore() as any;
  const t = translations[language as keyof typeof translations] || translations.en;
  const canControl = usePermission('START_MACHINE');

  if (!isMixerSelected) return null;

  const MAX_CAPACITY = 20000;
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
            <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${fillPercentage}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={canControl ? toggleMixerValve : undefined}
            disabled={!canControl}
            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all active:scale-95 ${mixerData.valveOpen ? 'bg-green-900/20 border-green-500 text-green-400 shadow-green-900/20 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'} ${!canControl ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`p-2 rounded-full ${mixerData.valveOpen ? 'bg-green-500/20' : 'bg-slate-700'}`}><Droplets size={20} /></div>
            <div className="text-xs font-bold uppercase">{t.mainValve}</div>
            <div className="text-[10px] opacity-70">{mixerData.valveOpen ? 'OPEN' : 'CLOSED'}</div>
          </button>

          <button
            onClick={canControl ? toggleMixerPump : undefined}
            disabled={!canControl}
            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all active:scale-95 ${mixerData.pumpActive ? 'bg-blue-900/20 border-blue-500 text-blue-400 shadow-blue-900/20 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'} ${!canControl ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`p-2 rounded-full ${mixerData.pumpActive ? 'bg-blue-500/20' : 'bg-slate-700'}`}><Zap size={20} /></div>
            <div className="text-xs font-bold uppercase">{t.feedPump}</div>
            <div className="text-[10px] opacity-70">{mixerData.pumpActive ? 'ON' : 'OFF'}</div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center"><span className="text-sm text-slate-400">PH</span><span className="font-mono font-bold text-white">{mixerData.ph}</span></div>
          <div className="flex justify-between items-center"><span className="text-sm text-slate-400">EC</span><span className="font-mono font-bold text-yellow-400">{mixerData.ec}</span></div>
        </div>
      </div>
    </DetailCard>
  );
};

const RackTankPanel = () => {
  const { selectedRackId, clearSelection } = useAppStore() as any;
  if (!selectedRackId) return null;

  return (
    <DetailCard title={`Rack ${selectedRackId}`} subTitle="Growth Unit Details" onClose={clearSelection}>
      <div className="flex flex-col items-center justify-center py-8 text-slate-500 space-y-2">
        <Database size={32} />
        <span className="text-sm">Rack data visualization</span>
      </div>
    </DetailCard>
  );
}

const WeatherPanel = () => {
  const { weatherStation, language } = useAppStore() as any;
  const t = translations[language as keyof typeof translations] || translations.en;
  return (
    <div className="absolute top-32 left-6 w-48 bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-xl p-3 shadow-xl z-50">
      <div className="flex items-center gap-2 mb-3 text-purple-400"><CloudSun size={20} /><span className="font-bold text-sm uppercase">{t.outdoorWeather}</span></div>
      <div className="grid grid-cols-2 gap-3">
        <div><div className="text-xs text-slate-400">Temp</div><div className="text-xl font-mono font-bold text-white">{typeof weatherStation.temp === 'number' ? weatherStation.temp.toFixed(2) : weatherStation.temp}°</div></div>
        <div><div className="text-xs text-slate-400">Humidity</div><div className="text-xl font-mono font-bold text-blue-300">{typeof weatherStation.hum === 'number' ? weatherStation.hum.toFixed(2) : weatherStation.hum}%</div></div>
        <div className="col-span-2 pt-2 border-t border-slate-700"><div className="flex justify-between text-xs"><span className="text-slate-400">{t.uvIndex}</span><span className="text-yellow-400 font-bold">{weatherStation.uv}</span></div></div>
      </div>
    </div>
  )
};

// --- 主要元件 OverviewPage ---

const OverviewPage = () => {
  const { initSystem, devices, layoutConfig } = useAppStore() as any;

  // 1. useEffect (Hook) - 必须放在最上面
  useEffect(() => {
    const cleanup = initSystem();
    return cleanup;
  }, [initSystem]);

  // 2. useMemo (Mapping) - 必须在 return 之前执行
  const visualizationMapping = useMemo(() => {
    if (!layoutConfig || !layoutConfig.zones) return {};
    const mapping: Record<string, string> = {};

    const addItems = (items: any[] | undefined) => {
      if (!items) return;
      items.forEach(item => { if (item.id) mapping[item.id] = item.id; });
    };

    if (layoutConfig.zones.nutrient) {
      addItems(layoutConfig.zones.nutrient.hoppers);
      if (layoutConfig.zones.nutrient.mixing_tank) mapping[layoutConfig.zones.nutrient.mixing_tank.id] = layoutConfig.zones.nutrient.mixing_tank.id;
    }
    if (layoutConfig.zones.growing) {
      addItems(layoutConfig.zones.growing.racks);
      addItems(layoutConfig.zones.growing.fans);
      addItems(layoutConfig.zones.growing.water_walls);
      addItems(layoutConfig.zones.growing.sensors);
    }
    return mapping;
  }, [layoutConfig]);

  // 3. useMemo (Objects) - 必须在 return 之前执行
  const proceduralObjects = useMemo(() => {
    if (!layoutConfig?.zones) return [];

    const objects: any[] = [];
    const { nutrient, growing } = layoutConfig.zones;

    // ==========================================
    // 1. 左側配液區 (Nutrient Zone)
    // ==========================================

    // 使用 DosingSystem 整合元件 (包含 Mixer, Hoppers, Valves)
    objects.push({
      id: 'sys_dosing',
      type: 'DosingSystemWidget',
      position: [0, 0, 0], // 內部有絕對座標邏輯 (-40, 0, -25)
      props: {}
    });

    // ==========================================
    // 2. 右側種植區 (Growing Zone)
    // ==========================================

    // 收集所有 RackNutrientTank 的位置資訊，傳給 WaterPipeSystem
    const tankPositions = growing?.racks?.map((rack: any, index: number) => {
      const xPos = 10 + (index * 12);
      return {
        id: rack.id,
        position: [xPos - 3, 0, 12] // 必須與 RackNutrientTankWidget 的位置一致
      };
    }) || [];

    if (growing?.racks) {
      growing.racks.forEach((rack: any, index: number) => {
        const xPos = 10 + (index * 12);

        // A. 機架 (Racks)
        objects.push({
          id: rack.id,
          type: 'RackWidget',
          position: [xPos, 0, 0],
          props: {
            data: {
              ...rack,
              position: [xPos, 0, 0] // Override position to avoid double offset
            }
          }
        });

        // B. 機架前的藍色配液桶 (RackNutrientTank)
        objects.push({
          id: `${rack.id}_tank`,
          type: 'RackNutrientTankWidget',
          position: [xPos - 3, 0, 12], // 放在機架前方 (Z=12)
          props: {
            data: {
              rackId: rack.id,
              position: [0, 0, 0], // Relative to the wrapper group
              level: 4, // Default level (Full)
              ph: 6.5,
              ec: 2.0,
              valveOpen: false,
              pumpActive: false
            }
          }
        });
      });
    }

    // ==========================================
    // 3. 基礎設施 (Infrastructure) - 水牆與風扇
    // ==========================================
    // 這裡我們將原本分散的 WaterWall 整合進 Infrastructure

    if (growing?.fans) {
      growing.fans.forEach((fan: any, index: number) => {
        const xPos = 10 + (index * 12);

        // 負壓風扇
        objects.push({
          id: fan.id,
          type: 'FanWidget',
          position: [xPos - 3, 0, 12],
          props: {
            config: layoutConfig.infrastructure
          }
        });
      });
    }
    // ==========================================
    // 4. 連接管線 (Pipes) - 自動計算路徑
    // ==========================================
    objects.push({
      id: 'sys_pipes',
      type: 'WaterPipeWidget',
      position: [0, 0, 0],
      props: {
        config: {
          tanks: tankPositions
        }
      }
    });

    return objects;
  }, [layoutConfig]);

  // 4. Conditional Rendering (Early Return) - 必须在所有 Hooks 之后
  if (!layoutConfig) {
    return (
      <div className="w-full h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Loading System Configuration...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          {/* <WeatherPanel /> */}
          <SensorDetailPanel />
          <DosingTankPanel />
          <MixerPanel />
          <RackTankPanel />
        </div>
      </div>

      {/* 3D Viewer Layer (z-0) */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Generic3DViewer
          mapping={visualizationMapping}
          values={devices}
          visualizationConfig={layoutConfig.visualization || {
            strategy: 'procedural',
            objects: proceduralObjects
          }}
        />
      </div>
    </div>
  );
};

export default OverviewPage;