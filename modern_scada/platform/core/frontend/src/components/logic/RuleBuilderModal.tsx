import React, { useState } from 'react';
import { X, Plus, Trash2, Save, ArrowRight, Settings } from 'lucide-react';
import { Rule } from '../../types/rules';
import { useAppStore } from '../../stores/useAppStore';
import { translations } from '../../i18n/translations';
import AdvancedSettings from './AdvancedSettings';

const DEVICES = [{ value: 'fans', label: 'Exhaust Fans' }, { value: 'waterWall', label: 'Water Wall' }];

interface Props {
  onClose: () => void;
  onSave: (rule: Partial<Rule>) => void;
}

const RuleBuilderModal: React.FC<Props> = ({ onClose, onSave }) => {
  const { language, sensors } = useAppStore();
  const t = translations[language as keyof typeof translations];

  const PARAMETERS = [
    { value: 'indoor_temp', label: `${t.indoorTemp} (°C)` }, { value: 'outdoor_temp', label: `${t.outdoorTemp} (°C)` },
    { value: 'indoor_hum', label: `${t.indoorHum} (%)` },
  ];

  const [ruleName, setRuleName] = useState('');
  const [logicMode, setLogicMode] = useState<'AND' | 'OR'>('AND');
  // 增加 compareTo 欄位初始值
  const [conditions, setConditions] = useState([{ param: 'indoor_temp', operator: '>', value: '28', compareTo: 'value', offset: '0' }]);
  const [actions, setActions] = useState([{ device: 'fans', state: 'ON' }]);

  // Advanced Settings State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    stop_condition: { type: 'standard', value: 2.0 },
    constraints: { min_run_time: 3 },
    cycle: { enabled: false, run_duration: 3, pause_duration: 5 }
  });

  const addCondition = () => setConditions([...conditions, { param: 'indoor_temp', operator: '>', value: '0', compareTo: 'value', offset: '0' }]);
  const removeCondition = (idx: number) => setConditions(conditions.filter((_, i) => i !== idx));

  const updateCondition = (idx: number, field: string, val: string) => {
    const newConds: any = [...conditions];
    newConds[idx][field] = val;
    // 當切換比較模式時，重置 value 以避免類型不符
    if (field === 'compareTo') {
      newConds[idx].value = val === 'value' ? '0' : PARAMETERS[0].value;
    }
    setConditions(newConds);
  };

  const handleSave = () => {
    if (!ruleName) return alert('Please enter a rule name');
    const joinStr = logicMode === 'AND' ? ' AND ' : ' OR ';
    const conditionStr = conditions.map(c => {
      // 根據 compareTo 決定顯示數值還是參數標籤
      let target = '';
      if (c.compareTo === 'value') {
        target = c.value;
      } else {
        // Ref mode
        const sensorName = sensors.find((s: any) => s.id === c.value)?.name || PARAMETERS.find(p => p.value === c.value)?.label || c.value;
        const offsetStr = c.offset && c.offset !== '0' ? ` + ${c.offset}` : '';
        target = `${sensorName}${offsetStr}`;
      }

      const paramLabel = PARAMETERS.find(p => p.value === c.param)?.label;
      return `${paramLabel} ${c.operator} ${target}`;
    }).join(joinStr);

    const actionStr = actions.map(a => `${DEVICES.find(d => d.value === a.device)?.label} ${a.state}`).join(', ');

    onSave({
      name: ruleName,
      condition: `[${logicMode}] ` + conditionStr,
      action: actionStr,
      rawConditions: conditions,
      rawActions: actions,
      logicMode,
      // Save advanced settings
      ...advancedSettings
    });
    onClose();
  };

  const OPERATORS = [{ value: '>', label: '>' }, { value: '<', label: '<' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }, { value: '==', label: '=' }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{t.createRuleTitle}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-8">
          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">{t.ruleName}</label><input type="text" value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder={t.ruleNamePlaceholder} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white" /></div>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-slate-500 uppercase">{t.ifConditions}</label>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button onClick={() => setLogicMode('AND')} className={`px-3 py-1 rounded text-xs font-bold ${logicMode === 'AND' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>AND</button>
                <button onClick={() => setLogicMode('OR')} className={`px-3 py-1 rounded text-xs font-bold ${logicMode === 'OR' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>OR</button>
              </div>
            </div>
            <div className="space-y-2">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                  <span className="text-xs font-mono font-bold text-blue-400 w-8 text-center shrink-0">{idx === 0 ? 'IF' : logicMode}</span>

                  {/* 參數選擇 */}
                  <select value={cond.param} onChange={(e) => updateCondition(idx, 'param', e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white flex-1 min-w-[140px]">{PARAMETERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>

                  {/* 運算子 */}
                  <select value={cond.operator} onChange={(e) => updateCondition(idx, 'operator', e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-orange-400 w-16 text-center">{OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select>

                  {/* 切換比較模式：數值 (123) vs 參考 (Ref) */}
                  <div className="flex bg-slate-900 rounded p-0.5 border border-slate-600 shrink-0">
                    <button
                      onClick={() => updateCondition(idx, 'compareTo', 'value')}
                      className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${cond.compareTo === 'value' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      123
                    </button>
                    <button
                      onClick={() => updateCondition(idx, 'compareTo', 'ref')}
                      className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${cond.compareTo === 'ref' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Ref
                    </button>
                  </div>

                  {/* 根據模式顯示 輸入框 或 下拉選單 */}
                  {cond.compareTo === 'value' ? (
                    <input type="number" value={cond.value} onChange={(e) => updateCondition(idx, 'value', e.target.value)} className="w-20 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white" />
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <select value={cond.value} onChange={(e) => updateCondition(idx, 'value', e.target.value)} className="flex-1 min-w-[120px] bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white">
                        {sensors.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
                        {/* Fallback if no sensors */}
                        {sensors.length === 0 && PARAMETERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <span className="text-slate-400 text-xs font-bold">+</span>
                      <input
                        type="number"
                        placeholder="Offset"
                        value={cond.offset || 0}
                        onChange={(e) => updateCondition(idx, 'offset', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-2 text-sm text-white"
                      />
                    </div>
                  )}

                  <button onClick={() => removeCondition(idx)} disabled={conditions.length === 1} className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            <button onClick={addCondition} className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-bold px-2 mt-2"><Plus size={14} /> {t.addCondition}</button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end"><label className="text-xs font-bold text-slate-500 uppercase">{t.thenActions}</label></div>
            <div className="space-y-2">
              {actions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                  <span className="text-xs font-mono font-bold text-green-400 w-8 text-center shrink-0">{idx === 0 ? 'DO' : '&'}</span>
                  <select value={action.device} onChange={(e) => { const n = [...actions]; n[idx].device = e.target.value; setActions(n); }} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white flex-1">{DEVICES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
                  <ArrowRight size={16} className="text-slate-500" />
                  <select value={action.state} onChange={(e) => { const n = [...actions]; n[idx].state = e.target.value; setActions(n); }} className={`bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm font-bold w-32 ${action.state === 'ON' ? 'text-green-400' : 'text-red-400'}`}><option value="ON">{t.turnOn}</option><option value="OFF">{t.turnOff}</option></select>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors text-sm font-bold"
            >
              <Settings size={16} className={showAdvanced ? "text-blue-500" : ""} />
              {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
            </button>

            {showAdvanced && (
              <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <AdvancedSettings settings={advancedSettings} onChange={setAdvancedSettings} />
              </div>
            )}
          </div>

        </div>
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-lg text-slate-400 hover:text-white font-bold">{t.cancel}</button>
          <button onClick={handleSave} className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2"><Save size={18} />{t.saveRule}</button>
        </div>
      </div>
    </div>
  );
};
export default RuleBuilderModal;