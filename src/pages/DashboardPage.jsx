import React from 'react';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/ui/Card';
import { Thermometer, Droplets, Wind, Zap, Activity, Power, CloudFog } from 'lucide-react'; // 新增 CloudFog for CO2

// SimpleLineChart 保持不變 ...
const SimpleLineChart = ({ data, dataKey, color, height = 100 }) => {
  if (!data || data.length < 2) return <div className="h-24 flex items-center justify-center text-slate-600 text-xs">Collecting Data...</div>;
  const maxVal = Math.max(...data.map(d => d[dataKey])) + 5;
  const minVal = Math.min(...data.map(d => d[dataKey])) - 5;
  const width = 100; 
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d[dataKey] - minVal) / (maxVal - minVal)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points={`0,100 ${points} 100,100`} fill={color} fillOpacity="0.1" />
      </svg>
    </div>
  );
};

const KpiCard = ({ title, value, unit, icon: Icon, trend, color }) => (
  <Card className="relative overflow-hidden">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg bg-slate-900/50 ${color.text}`}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">{title}</div>
    <div className="text-2xl font-mono font-bold text-white mt-1">
      {value} <span className="text-sm text-slate-500">{unit}</span>
    </div>
  </Card>
);

const DeviceCard = ({ label, active, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`
      relative flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-300 w-full
      ${active 
        ? `bg-slate-800 border-${color}-500 shadow-lg shadow-${color}-500/20` 
        : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800'}
    `}
  >
    <div className={`mb-3 p-3 rounded-full transition-colors duration-300 ${active ? `bg-${color}-500 text-white` : 'bg-slate-800 text-slate-500'}`}>
      <Power size={24} />
    </div>
    <span className={`text-sm font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
    <span className={`text-xs mt-1 ${active ? `text-${color}-400` : 'text-slate-600'}`}>
      {active ? 'RUNNING' : 'STOPPED'}
    </span>
  </button>
);

const DashboardPage = () => {
  const { history, devices, toggleDevice } = useAppStore();
  const latest = history.length > 0 ? history[history.length - 1] : { temp: 0, hum: 0, co2: 400 };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-2 flex flex-col gap-6 pb-24">
      
      {/* 1. KPI Section (加入 CO2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Avg Temp" value={latest.temp.toFixed(1)} unit="°C" icon={Thermometer} trend={2.5} color={{ text: 'text-orange-400' }} />
        <KpiCard title="Avg Humidity" value={latest.hum.toFixed(0)} unit="%" icon={Droplets} trend={-1.2} color={{ text: 'text-blue-400' }} />
        <KpiCard title="Avg CO2" value={latest.co2.toFixed(0)} unit="ppm" icon={CloudFog} trend={5.8} color={{ text: 'text-gray-400' }} />
        <KpiCard title="System Health" value="98" unit="%" icon={Activity} color={{ text: 'text-green-400' }} />
      </div>

      {/* 2. Charts Section (加入 CO2 趨勢圖) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Temp Trend">
          <div className="h-40 flex items-end px-2 pb-2">
             <SimpleLineChart data={history} dataKey="temp" color="#fb923c" height={120} />
          </div>
        </Card>
        <Card title="Humidity Trend">
          <div className="h-40 flex items-end px-2 pb-2">
             <SimpleLineChart data={history} dataKey="hum" color="#60a5fa" height={120} />
          </div>
        </Card>
        <Card title="CO2 Trend">
          <div className="h-40 flex items-end px-2 pb-2">
             <SimpleLineChart data={history} dataKey="co2" color="#9ca3af" height={120} />
          </div>
        </Card>
      </div>

      {/* 3. Manual Control Section (移除 AC 和 生長燈) */}
      <div>
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Manual Device Control</h3>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <DeviceCard 
            label="Water Wall" 
            active={devices.waterWall} 
            onClick={() => toggleDevice('waterWall')} 
            color="red"
          />
          <DeviceCard 
            label="Exhaust Fans" 
            active={devices.fans} 
            onClick={() => toggleDevice('fans')} 
            color="blue"
          />
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;