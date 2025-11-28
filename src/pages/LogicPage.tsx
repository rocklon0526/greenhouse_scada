import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import Card from '../components/ui/Card';
import RuleBuilderModal from '../components/logic/RuleBuilderModal';
import { Plus, Droplets, Thermometer } from 'lucide-react';
import { translations } from '../i18n/translations';

const LogicPage = () => {
  const { settings, rules, setSetting, toggleRule, addRule, language } = useAppStore();
  const t = translations[language];
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="h-full flex flex-col gap-4 relative">
      <Card title={t.globalSettings} className="shrink-0">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* 模式切換 */}
          <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700 w-full md:w-auto">
            <span className="text-sm text-slate-400 whitespace-nowrap">{t.systemMode}:</span>
            <button onClick={() => setSetting('autoMode', !settings.autoMode)} className={`flex-1 md:flex-none px-3 py-1 rounded text-xs font-bold transition-colors ${settings.autoMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{settings.autoMode ? t.auto : t.manual}</button>
          </div>
          
          {/* 溫度閥值設定 */}
          <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700 flex-1 w-full">
            <Thermometer size={16} className="text-orange-400" />
            <span className="text-sm text-slate-400 whitespace-nowrap">{t.safetyThreshold} (Temp):</span>
            <input type="range" min="20" max="40" step="0.5" value={settings.tempThreshold} onChange={(e) => setSetting('tempThreshold', parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <span className="font-mono font-bold text-blue-400 w-12 text-right">{settings.tempThreshold}°C</span>
          </div>

          {/* 濕度閥值設定 (新增) */}
          <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700 flex-1 w-full">
            <Droplets size={16} className="text-blue-400" />
            <span className="text-sm text-slate-400 whitespace-nowrap">{t.safetyThreshold} (Hum):</span>
            <input type="range" min="40" max="100" step="5" value={settings.humThreshold || 80} onChange={(e) => setSetting('humThreshold', parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            <span className="font-mono font-bold text-cyan-400 w-12 text-right">{settings.humThreshold || 80}%</span>
          </div>
        </div>
      </Card>

      <Card title={t.automationRules} className="flex-1 overflow-auto pb-20">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 sticky top-0 backdrop-blur-sm">
            <tr><th className="px-4 py-3">{t.priority}</th><th className="px-4 py-3">{t.ruleName}</th><th className="px-4 py-3">{t.condition}</th><th className="px-4 py-3">{t.action}</th><th className="px-4 py-3 text-right">{t.status}</th></tr>
          </thead>
          <tbody>
            {rules.map((rule, idx) => (
              <tr key={rule.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{idx + 1}</td>
                <td className="px-4 py-3 font-bold text-slate-200">{rule.name}</td>
                <td className="px-4 py-3"><span className="text-orange-400 font-mono text-xs bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20">{rule.condition}</span></td>
                <td className="px-4 py-3"><span className="text-green-400 font-mono text-xs bg-green-400/10 px-2 py-1 rounded border border-green-400/20">{rule.action}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleRule(rule.id)} className={`w-10 h-5 rounded-full relative transition-colors ${rule.active ? 'bg-blue-600' : 'bg-slate-600'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${rule.active ? 'left-6' : 'left-1'}`}></div></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-center">
            <button onClick={() => setIsModalOpen(true)} className="group flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm border border-dashed border-slate-600 rounded-xl px-4 py-4 w-full hover:bg-slate-800/50 transition-all">
              <div className="w-6 h-6 rounded-full bg-slate-700 group-hover:bg-blue-500 flex items-center justify-center text-white transition-colors"><Plus size={14} /></div><span>{t.addNewRule}</span>
            </button>
        </div>
      </Card>
      {isModalOpen && <RuleBuilderModal onClose={() => setIsModalOpen(false)} onSave={addRule} />}
    </div>
  );
};
export default LogicPage;