import React from 'react';
import Card from '../components/Card';

const LogicPage = ({ sys }) => {
  const { data, setData } = sys;

  const toggleRule = (id) => {
    const newRules = data.rules.map(r => r.id === id ? {...r, active: !r.active} : r);
    setData(prev => ({ ...prev, rules: newRules }));
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <Card title="Global Settings" className="shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
            <span className="text-sm text-slate-400">System Mode:</span>
            <button 
              onClick={() => setData(prev => ({...prev, settings: {...prev.settings, autoMode: !prev.settings.autoMode}}))}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${data.settings.autoMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              {data.settings.autoMode ? 'AUTO' : 'MANUAL'}
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700 flex-1">
            <span className="text-sm text-slate-400">Safety Threshold:</span>
            <input 
              type="range" min="20" max="40" step="0.5" 
              value={data.settings.tempThreshold} 
              onChange={(e) => setData(prev => ({...prev, settings: {...prev.settings, tempThreshold: parseFloat(e.target.value)}}))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="font-mono font-bold text-blue-400">{data.settings.tempThreshold}°C</span>
          </div>
        </div>
      </Card>

      <Card title="Automation Rules" className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
            <tr>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Rule Name</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.rules.map((rule, idx) => (
              <tr key={rule.id} className="border-b border-slate-700 hover:bg-slate-700/20">
                <td className="px-4 py-3 font-mono text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-bold text-white">{rule.name}</td>
                <td className="px-4 py-3 text-orange-400 font-mono">{rule.condition}</td>
                <td className="px-4 py-3 text-green-400 font-mono">{rule.action}</td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => toggleRule(rule.id)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${rule.active ? 'bg-blue-600' : 'bg-slate-600'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${rule.active ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-center">
            <button className="text-slate-500 hover:text-white text-xs border border-dashed border-slate-600 rounded px-4 py-2 w-full">
              + Add New Logic Rule (Coming Soon)
            </button>
        </div>
      </Card>
    </div>
  );
};

export default LogicPage;