import React, { useState } from 'react';
import { X, Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import { Rule } from '../../store/useAppStore';

const PARAMETERS = [
  { value: 'indoor_temp', label: 'Indoor Temp (°C)' }, { value: 'outdoor_temp', label: 'Outdoor Temp (°C)' },
  { value: 'indoor_hum', label: 'Indoor Humidity (%)' }, { value: 'outdoor_hum', label: 'Outdoor Humidity (%)' },
  { value: 'indoor_co2', label: 'Indoor CO2 (ppm)' },
  { value: 'weather_temp', label: 'Weather Station Temp' }, { value: 'weather_hum', label: 'Weather Station Hum' },
];
const OPERATORS = [{ value: '>', label: '>' }, { value: '<', label: '<' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }, { value: '==', label: '=' }];
const DEVICES = [{ value: 'fans', label: 'Exhaust Fans' }, { value: 'waterWall', label: 'Water Wall' }];

interface Props {
  onClose: () => void;
  onSave: (rule: Partial<Rule>) => void;
}

const RuleBuilderModal: React.FC<Props> = ({ onClose, onSave }) => {
  const [ruleName, setRuleName] = useState('');
  const [logicMode, setLogicMode] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState([{ param: 'indoor_temp', operator: '>', value: '28', compareTo: 'value' }]);
  const [actions, setActions] = useState([{ device: 'fans', state: 'ON' }]);

  const addCondition = () => setConditions([...conditions, { param: 'indoor_temp', operator: '>', value: '0', compareTo: 'value' }]);
  const removeCondition = (idx: number) => setConditions(conditions.filter((_, i) => i !== idx));
  const updateCondition = (idx: number, field: string, val: string) => {
    const newConds: any = [...conditions];
    newConds[idx][field] = val;
    setConditions(newConds);
  };

  const handleSave = () => {
    if (!ruleName) return alert('Please enter a rule name');
    const joinStr = logicMode === 'AND' ? ' AND ' : ' OR ';
    const conditionStr = conditions.map(c => {
      const target = c.compareTo === 'value' ? c.value : PARAMETERS.find(p=>p.value === c.value)?.label;
      const paramLabel = PARAMETERS.find(p=>p.value === c.param)?.label;
      return `${paramLabel} ${c.operator} ${target}`;
    }).join(joinStr);
    const actionStr = actions.map(a => `${DEVICES.find(d=>d.value === a.device)?.label} ${a.state}`).join(', ');
    onSave({ name: ruleName, condition: `[${logicMode}] ` + conditionStr, action: actionStr, rawConditions: conditions, rawActions: actions, logicMode });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Create New Logic Rule</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-8">
          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Rule Name</label><input type="text" value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="Rule Name" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white" /></div>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-slate-500 uppercase">IF (Conditions)</label>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button onClick={() => setLogicMode('AND')} className={`px-3 py-1 rounded text-xs font-bold ${logicMode === 'AND' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>AND</button>
                <button onClick={() => setLogicMode('OR')} className={`px-3 py-1 rounded text-xs font-bold ${logicMode === 'OR' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>OR</button>
              </div>
            </div>
            <div className="space-y-2">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap md:flex-nowrap bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                   <span className="text-xs font-mono font-bold text-blue-400 w-8 text-center shrink-0">{idx === 0 ? 'IF' : logicMode}</span>
                   <select value={cond.param} onChange={(e) => updateCondition(idx, 'param', e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white flex-1">{PARAMETERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
                   <select value={cond.operator} onChange={(e) => updateCondition(idx, 'operator', e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-orange-400 w-20">{OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select>
                   <input type="number" value={cond.value} onChange={(e) => updateCondition(idx, 'value', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white" />
                   <button onClick={() => removeCondition(idx)} disabled={conditions.length === 1} className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            <button onClick={addCondition} className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-bold px-2 mt-2"><Plus size={14} /> ADD CONDITION</button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end"><label className="text-xs font-bold text-slate-500 uppercase">THEN (Actions)</label></div>
            <div className="space-y-2">
              {actions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                   <span className="text-xs font-mono font-bold text-green-400 w-8 text-center shrink-0">{idx === 0 ? 'DO' : '&'}</span>
                   <select value={action.device} onChange={(e) => { const n = [...actions]; n[idx].device = e.target.value; setActions(n); }} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white flex-1">{DEVICES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
                   <ArrowRight size={16} className="text-slate-500" />
                   <select value={action.state} onChange={(e) => { const n = [...actions]; n[idx].state = e.target.value; setActions(n); }} className={`bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm font-bold w-32 ${action.state === 'ON' ? 'text-green-400' : 'text-red-400'}`}><option value="ON">TURN ON</option><option value="OFF">TURN OFF</option></select>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-lg text-slate-400 hover:text-white font-bold">Cancel</button>
          <button onClick={handleSave} className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2"><Save size={18} />Save Rule</button>
        </div>
      </div>
    </div>
  );
};
export default RuleBuilderModal;