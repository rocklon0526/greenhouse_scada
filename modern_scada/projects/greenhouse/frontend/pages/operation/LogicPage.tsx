import React, { useState } from 'react';
import { useAppStore } from '@core/stores/useAppStore';
import Card from '@core/components/ui/Card';
import RuleBuilderModal from '@core/components/logic/RuleBuilderModal';
import { Plus, Droplets, Thermometer, ArrowUp, ArrowDown, Save, Clock, Trash2 } from 'lucide-react';
import { translations } from '@core/i18n/translations';

const LogicPage = () => {
  const { settings, rules, setSetting, toggleRule, addRule, reorderRules, saveRules, language } = useAppStore();

  // 修正 TS7053: 強制轉型以符合物件鍵值
  const t = translations[language as keyof typeof translations];

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 處理上移
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderRules(index, index - 1);
    }
  };

  // 處理下移
  const handleMoveDown = (index: number) => {
    if (index < rules.length - 1) {
      reorderRules(index, index + 1);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 relative">
      <Card title={t.globalSettings} className="shrink-0">
        <div className="flex flex-col gap-4">
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

          {/* Global Time Schedules */}
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
              <Clock size={14} /> Global Time Schedules (Override Thresholds)
            </h4>
            <div className="space-y-2">
              {(settings.schedules || []).map((schedule: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700 flex-wrap">
                  <input
                    type="time"
                    value={schedule.start}
                    onChange={(e) => {
                      const newSchedules = [...(settings.schedules || [])];
                      newSchedules[idx].start = e.target.value;
                      setSetting('schedules', newSchedules);
                    }}
                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="time"
                    value={schedule.end}
                    onChange={(e) => {
                      const newSchedules = [...(settings.schedules || [])];
                      newSchedules[idx].end = e.target.value;
                      setSetting('schedules', newSchedules);
                    }}
                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                  />

                  <div className="flex items-center gap-1 bg-slate-900 rounded px-2 py-1 border border-slate-600">
                    <Thermometer size={12} className="text-orange-400" />
                    <input
                      type="number"
                      placeholder="Temp"
                      value={schedule.tempThreshold}
                      onChange={(e) => {
                        const newSchedules = [...(settings.schedules || [])];
                        newSchedules[idx].tempThreshold = parseFloat(e.target.value);
                        setSetting('schedules', newSchedules);
                      }}
                      className="bg-transparent text-white text-xs w-12 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 rounded px-2 py-1 border border-slate-600">
                    <Droplets size={12} className="text-blue-400" />
                    <input
                      type="number"
                      placeholder="Hum"
                      value={schedule.humThreshold}
                      onChange={(e) => {
                        const newSchedules = [...(settings.schedules || [])];
                        newSchedules[idx].humThreshold = parseFloat(e.target.value);
                        setSetting('schedules', newSchedules);
                      }}
                      className="bg-transparent text-white text-xs w-12 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const newSchedules = (settings.schedules || []).filter((_: any, i: number) => i !== idx);
                      setSetting('schedules', newSchedules);
                    }}
                    className="ml-auto text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newSchedules = [...(settings.schedules || []), { start: '08:00', end: '18:00', tempThreshold: 28, humThreshold: 80 }];
                  setSetting('schedules', newSchedules);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 mt-1"
              >
                <Plus size={12} /> Add Schedule
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card title={t.automationRules} className="flex-1 overflow-auto pb-20 relative">
        {/* 儲存按鈕 */}
        <div className="absolute top-3 right-4 z-10">
          <button
            onClick={saveRules}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-green-900/20 transition-all active:scale-95"
          >
            <Save size={14} />
            <span>{t.saveRule || 'Save'}</span>
          </button>
        </div>

        <div className="mt-8"> {/* 增加上邊距，避免表格標頭與儲存按鈕重疊 */}
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 sticky top-0 backdrop-blur-sm z-0">
              <tr>
                <th className="px-4 py-3">{t.priority}</th>
                <th className="px-4 py-3">{t.ruleName}</th>
                <th className="px-4 py-3">{t.condition}</th>
                <th className="px-4 py-3">{t.action}</th>
                <th className="px-4 py-3 text-center">{t.status}</th>
                <th className="px-4 py-3 text-right">Order</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule: any, idx: number) => (
                <tr key={rule.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{rule.name}</td>
                  <td className="px-4 py-3"><span className="text-orange-400 font-mono text-xs bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20">{rule.condition}</span></td>
                  <td className="px-4 py-3"><span className="text-green-400 font-mono text-xs bg-green-400/10 px-2 py-1 rounded border border-green-400/20">{rule.action}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleRule(rule.id)} className={`w-10 h-5 rounded-full relative transition-colors ${rule.active ? 'bg-blue-600' : 'bg-slate-600'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${rule.active ? 'left-6' : 'left-1'}`}></div></button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === rules.length - 1}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 新增按鈕區塊 */}
        <div className="mt-6 px-4 text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center justify-center gap-2 text-slate-300 hover:text-white text-sm border border-dashed border-slate-600 hover:border-blue-500 rounded-xl px-4 py-4 w-full hover:bg-slate-800/50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center text-white transition-colors shadow-lg">
              <Plus size={18} />
            </div>
            <span className="font-bold">{t.addNewRule}</span>
          </button>
        </div>
      </Card>
      {isModalOpen && <RuleBuilderModal onClose={() => setIsModalOpen(false)} onSave={addRule} />}
    </div>
  );
};
export default LogicPage;