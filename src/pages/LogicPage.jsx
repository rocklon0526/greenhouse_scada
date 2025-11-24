import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/ui/Card';
import RuleBuilderModal from '../components/logic/RuleBuilderModal'; // 引入新組件
import { Plus } from 'lucide-react';

const LogicPage = () => {
  const { settings, rules, setSetting, toggleRule, addRule } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="h-full flex flex-col gap-4 relative">
      
      {/* Global Settings (保持不變) */}
      <Card title="Global Settings" className="shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700">
            <span className="text-sm text-slate-400">System Mode:</span>
            <button 
              onClick={() => setSetting('autoMode', !settings.autoMode)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${settings.autoMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              {settings.autoMode ? 'AUTO' : 'MANUAL'}
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700 flex-1">
            <span className="text-sm text-slate-400">Safety Threshold:</span>
            <input 
              type="range" min="20" max="40" step="0.5" 
              value={settings.tempThreshold} 
              onChange={(e) => setSetting('tempThreshold', parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="font-mono font-bold text-blue-400">{settings.tempThreshold}°C</span>
          </div>
        </div>
      </Card>

      {/* Automation Rules */}
      <Card title="Automation Rules" className="flex-1 overflow-auto pb-20"> {/* pb-20 預留空間給按鈕 */}
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 sticky top-0 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Rule Name</th>
              <th className="px-4 py-3">Conditions</th>
              <th className="px-4 py-3">Actions</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, idx) => (
              <tr key={rule.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors group">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{idx + 1}</td>
                <td className="px-4 py-3 font-bold text-slate-200">{rule.name}</td>
                {/* 允許條件換行顯示，比較清楚 */}
                <td className="px-4 py-3">
                  <div className="text-orange-400 font-mono text-xs bg-orange-400/10 px-2 py-1 rounded inline-block border border-orange-400/20">
                    {rule.condition}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-green-400 font-mono text-xs bg-green-400/10 px-2 py-1 rounded inline-block border border-green-400/20">
                    {rule.action}
                  </div>
                </td>
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
        
        {/* 新增按鈕改為開啟 Modal */}
        <div className="mt-4 text-center">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm border border-dashed border-slate-600 rounded-xl px-4 py-4 w-full hover:bg-slate-800/50 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-slate-700 group-hover:bg-blue-500 flex items-center justify-center text-white transition-colors">
                <Plus size={14} />
              </div>
              <span>Add New Logic Rule</span>
            </button>
        </div>
      </Card>

      {/* Render Modal */}
      {isModalOpen && (
        <RuleBuilderModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={addRule} 
        />
      )}
    </div>
  );
};

export default LogicPage;