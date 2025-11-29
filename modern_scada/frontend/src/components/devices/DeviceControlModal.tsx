import React, { useState } from 'react';
import { X, Save, Sliders, Thermometer } from 'lucide-react';
import { DeviceState } from '../../types/devices';
import { InfrastructureItem } from '../../configs/layoutConfig';
import { useAppStore } from '../../stores/useAppStore';
import { translations } from '../../i18n/translations';

interface ExtendedDevice extends InfrastructureItem, DeviceState {}

interface Props {
  device: ExtendedDevice;
  onClose: () => void;
  onSave: (id: string, command: Partial<DeviceState>) => void;
}

const DeviceControlModal: React.FC<Props> = ({ device, onClose, onSave }) => {
  const { language } = useAppStore();
  const t = translations[language];
  const [localParams, setLocalParams] = useState({ ...device.params });
  
  const handleChange = (key: string, value: any) => setLocalParams(prev => ({ ...prev, [key]: typeof prev[key] === 'number' ? parseFloat(value) : value }));
  const handleSave = () => { onSave(device.id, { params: localParams }); onClose(); };

  const renderInput = (key: string, value: any) => {
    const labelClass = "text-xs font-bold text-slate-500 uppercase mb-2 block";
    if (key === 'speed') {
      return (
        <div key={key} className="mb-6">
          <label className={labelClass}>{t.fanSpeed}</label>
          <div className="flex items-center gap-4">
            <input type="range" min="0" max="100" step="10" value={value} onChange={(e) => handleChange(key, e.target.value)} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <span className="font-mono font-bold text-blue-400 w-12 text-right">{value}%</span>
          </div>
        </div>
      );
    }
    if (key === 'level') {
      return (
        <div key={key} className="mb-6">
          <label className={labelClass}>{t.waterLevel}</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(lvl => (
              <button key={lvl} onClick={() => handleChange(key, lvl)} className={`flex-1 py-2 rounded-lg border font-bold transition-all ${value === lvl ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>Lv.{lvl}</button>
            ))}
          </div>
        </div>
      );
    }
    if (key === 'targetTemp') {
      return (
        <div key={key} className="mb-6">
          <label className={labelClass}>{t.targetTemp}</label>
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
            <Thermometer size={18} className="text-orange-400" />
            <input type="number" value={value} onChange={(e) => handleChange(key, e.target.value)} className="bg-transparent text-white font-mono font-bold w-full focus:outline-none" />
            <span className="text-slate-500 text-xs">°C</span>
          </div>
        </div>
      );
    }
    return (
      <div key={key} className="mb-6">
        <label className={labelClass}>{key}</label>
        <input type="text" value={value} onChange={(e) => handleChange(key, e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${device.status === 'ON' ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}><Sliders size={20} /></div>
            <div><h3 className="font-bold text-white text-lg">{device.label}</h3><p className="text-xs text-slate-500 font-mono uppercase">{device.id}</p></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 p-3 bg-slate-950/50 rounded-xl border border-slate-800"><span className="text-sm text-slate-400">{t.currentStatus}</span><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${device.status === 'ON' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div><span className={`font-bold ${device.status === 'ON' ? 'text-green-400' : 'text-slate-500'}`}>{device.status}</span></div></div>
          {Object.keys(localParams).length > 0 ? Object.entries(localParams).map(([k, v]) => renderInput(k, v)) : <div className="text-center text-slate-500 py-4 text-sm">{t.noParams}</div>}
        </div>
        <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm font-bold transition-colors">{t.cancel}</button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95"><Save size={16} />{t.applyChanges}</button>
        </div>
      </div>
    </div>
  );
};
export default DeviceControlModal;