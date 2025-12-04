import React, { useState } from 'react';
import { useAppStore } from '@core/stores/useAppStore';
import { DeviceState } from '@core/types';
import Card from '@core/components/ui/Card';
import { Thermometer, Droplets, Activity, Power, CloudFog, Settings, LucideIcon, FileText } from 'lucide-react';
import { WAREHOUSE_LAYOUT, InfrastructureItem } from '@core/configs/layoutConfig';
import DeviceControlModal from '@core/components/devices/DeviceControlModal';
import { translations } from '@core/i18n/translations';

const SimpleLineChart = ({ data, dataKey, color, height = 100, loadingText }: { data: any[], dataKey: string, color: string, height?: number, loadingText: string }) => {
  if (!data || data.length < 2) return <div className="h-24 flex items-center justify-center text-slate-600 text-xs">{loadingText}</div>;
  const maxVal = Math.max(...data.map((d: any) => d[dataKey])) + 5;
  const minVal = Math.min(...data.map((d: any) => d[dataKey])) - 5;
  const points = data.map((d: any, i: number) => `${(i / (data.length - 1)) * 100},${100 - ((d[dataKey] - minVal) / (maxVal - minVal)) * 100}`).join(' ');
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points={`0,100 ${points} 100,100`} fill={color} fillOpacity="0.1" />
      </svg>
    </div>
  );
};

const KpiCard = ({ title, value, unit, icon: Icon, trend, color }: { title: string, value: string, unit: string, icon: LucideIcon, trend?: number, color: { text: string } }) => (
  <Card className="relative overflow-hidden">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg bg-slate-900/50 ${color.text}`}><Icon size={20} /></div>
      {trend && <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
    </div>
    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">{title}</div>
    <div className="text-2xl font-mono font-bold text-white mt-1">{value} <span className="text-sm text-slate-500">{unit}</span></div>
  </Card>
);

interface DeviceCardProps {
  label?: string;
  id: string;
  status: string;
  params: any;
  onClick: () => void;
  onConfig: () => void;
  color: string;
  statusText: string;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ label, id, status, params, onClick, onConfig, color, statusText }) => {
  const isActive = status === 'ON';
  return (
    <div className={`relative flex flex-col p-4 rounded-xl border transition-all duration-300 w-full group ${isActive ? `bg-slate-800 border-${color}-500 shadow-lg shadow-${color}-500/10` : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800'}`}>
      <div className="flex justify-between items-center mb-3"><span className="text-[10px] text-slate-500 font-mono">{id}</span><div className={`w-2 h-2 rounded-full ${isActive ? `bg-${color}-500 animate-pulse` : 'bg-slate-600'}`}></div></div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onClick} className={`p-3 rounded-full transition-colors duration-300 ${isActive ? `bg-${color}-500 text-white` : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}><Power size={20} /></button>
        <div>
          <div className={`text-sm font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-400'}`}>{label}</div>
          <div className={`text-[10px] ${isActive ? `text-${color}-400` : 'text-slate-600'}`}>{statusText}</div>
        </div>
      </div>
      {Object.keys(params).length > 0 && (
        <div className="border-t border-slate-700/50 pt-2 flex justify-between items-center">
          <span className="text-[10px] text-slate-500">{Object.entries(params).slice(0, 2).map(([k, v]) => `${k === 'speed' ? 'Spd' : k}: ${v}`).join(', ')}</span>
          <button onClick={(e) => { e.stopPropagation(); onConfig(); }} className="text-slate-600 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded"><Settings size={14} /></button>
        </div>
      )}
    </div>
  );
};

const DashboardPage = () => {
  const { history, devices, toggleDevice, controlDevice, language } = useAppStore();
  const t = translations[language as keyof typeof translations];
  const latest = history.length > 0 ? history[history.length - 1] : { temp: 0, hum: 0, co2: 400 };
  const [editingDevice, setEditingDevice] = useState<(InfrastructureItem & DeviceState) | null>(null);
  const { fans, waterWalls } = WAREHOUSE_LAYOUT.infrastructure;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-2 flex flex-col gap-6 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_type: 'daily_production', start_date: '2023-10-27', end_date: '2023-10-27' })
              });
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              } else {
                alert('Failed to generate report');
              }
            } catch (e) {
              console.error(e);
              alert('Error generating report');
            }
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
        >
          <FileText size={16} /> Download Report
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title={t.avgTemp} value={latest.temp.toFixed(1)} unit="°C" icon={Thermometer} trend={2.5} color={{ text: 'text-orange-400' }} />
        <KpiCard title={t.avgHum} value={latest.hum.toFixed(0)} unit="%" icon={Droplets} trend={-1.2} color={{ text: 'text-blue-400' }} />
        <KpiCard title={t.avgCo2} value={latest.co2.toFixed(0)} unit="ppm" icon={CloudFog} trend={5.8} color={{ text: 'text-gray-400' }} />
        <KpiCard title={t.activeDevices} value={Object.values(devices).filter(d => d.status === 'ON').length.toString()} unit={t.units} icon={Activity} color={{ text: 'text-green-400' }} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={t.tempTrend}><div className="h-40 flex items-end px-2 pb-2"><SimpleLineChart data={history} dataKey="temp" color="#fb923c" height={120} loadingText={t.collectingData} /></div></Card>
        <Card title={t.humTrend}><div className="h-40 flex items-end px-2 pb-2"><SimpleLineChart data={history} dataKey="hum" color="#60a5fa" height={120} loadingText={t.collectingData} /></div></Card>
        <Card title={t.co2Trend}><div className="h-40 flex items-end px-2 pb-2"><SimpleLineChart data={history} dataKey="co2" color="#9ca3af" height={120} loadingText={t.collectingData} /></div></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-2 flex justify-between">{t.waterWallSys}<span className="text-[10px] bg-slate-800 px-2 rounded text-slate-500">{waterWalls.length} {t.units}</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {waterWalls.map(device => (
              <DeviceCard
                key={device.id}
                id={device.id}
                label={device.label}
                status={devices[device.id]?.status || 'OFF'}
                params={devices[device.id]?.params || {}}
                onClick={() => toggleDevice(device.id)}
                onConfig={() => setEditingDevice({ ...device, ...devices[device.id] })}
                color="red"
                statusText={devices[device.id]?.status === 'ON' ? t.running : t.idle}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-2 flex justify-between">{t.exhaustFanSys}<span className="text-[10px] bg-slate-800 px-2 rounded text-slate-500">{fans.length} {t.units}</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fans.map(device => (
              <DeviceCard
                key={device.id}
                id={device.id}
                label={device.label}
                status={devices[device.id]?.status || 'OFF'}
                params={devices[device.id]?.params || {}}
                onClick={() => toggleDevice(device.id)}
                onConfig={() => setEditingDevice({ ...device, ...devices[device.id] })}
                color="blue"
                statusText={devices[device.id]?.status === 'ON' ? t.running : t.idle}
              />
            ))}
          </div>
        </div>
      </div>
      {editingDevice && <DeviceControlModal device={editingDevice} onClose={() => setEditingDevice(null)} onSave={controlDevice} />}
    </div>
  );
};

export default DashboardPage;