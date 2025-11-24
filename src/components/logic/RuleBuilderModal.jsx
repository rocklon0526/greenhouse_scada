import React, { useState } from 'react';
import { X, Plus, Trash2, Save, ArrowRight, GitMerge } from 'lucide-react'; // 新增 GitMerge icon

// [修改] 參數選項：加入 CO2
const PARAMETERS = [
  { value: 'indoor_temp', label: 'Indoor Temp (°C)' },
  { value: 'outdoor_temp', label: 'Outdoor Temp (°C)' },
  { value: 'indoor_hum', label: 'Indoor Humidity (%)' },
  { value: 'outdoor_hum', label: 'Outdoor Humidity (%)' },
  { value: 'indoor_co2', label: 'Indoor CO2 (ppm)' }, // 新增
  { value: 'weather_temp', label: 'Weather Station Temp' },
  { value: 'weather_hum', label: 'Weather Station Hum' },
];

const OPERATORS = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '==', label: '=' },
];

// [修改] 設備選項：移除 ac 和 growLights
const DEVICES = [
  { value: 'fans', label: 'Exhaust Fans' },
  { value: 'waterWall', label: 'Water Wall' },
];

const RuleBuilderModal = ({ onClose, onSave }) => {
  const [ruleName, setRuleName] = useState('');
  
  // [新增] 邏輯運算子模式：AND (所有條件成立) / OR (任一條件成立)
  const [logicMode, setLogicMode] = useState('AND');

  const [conditions, setConditions] = useState([
    { param: 'indoor_temp', operator: '>', value: '28', compareTo: 'value' }
  ]);

  const [actions, setActions] = useState([
    { device: 'fans', state: 'ON' }
  ]);

  const addCondition = () => {
    setConditions([...conditions, { param: 'indoor_temp', operator: '>', value: '0', compareTo: 'value' }]);
  };

  const removeCondition = (idx) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx, field, val) => {
    const newConds = [...conditions];
    newConds[idx][field] = val;
    setConditions(newConds);
  };

  const handleSave = () => {
    if (!ruleName) return alert('Please enter a rule name');
    
    // 根據 logicMode 決定連接詞
    const joinStr = logicMode === 'AND' ? ' AND ' : ' OR ';

    const conditionStr = conditions.map(c => {
      const target = c.compareTo === 'value' ? c.value : PARAMETERS.find(p=>p.value === c.value)?.label;
      const paramLabel = PARAMETERS.find(p=>p.value === c.param)?.label;
      return `${paramLabel} ${c.operator} ${target}`;
    }).join(joinStr);

    const actionStr = actions.map(a => {
      const deviceLabel = DEVICES.find(d=>d.value === a.device)?.label;
      return `${deviceLabel} ${a.state}`;
    }).join(', ');

    onSave({
      name: ruleName,
      condition: `[${logicMode}] ` + conditionStr, // 在顯示字串中標記邏輯模式
      action: actionStr,
      rawConditions: conditions,
      rawActions: actions,
      logicMode: logicMode // 儲存邏輯模式
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Create New Logic Rule</h2>
            <p className="text-slate-400 text-sm">Define automation logic for the greenhouse environment.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          
          {/* 1. Rule Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rule Name</label>
            <input 
              type="text" 
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g., High CO2 Ventilation" 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* 2. Conditions (IF) */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">IF (Conditions)</label>
              
              {/* [新增] 邏輯切換按鈕 */}
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setLogicMode('AND')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${logicMode === 'AND' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  AND (All)
                </button>
                <button 
                  onClick={() => setLogicMode('OR')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${logicMode === 'OR' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  OR (Any)
                </button>
              </div>
            </div>
            
            <div className="space-y-2 relative">
              {/* 視覺連接線 */}
              {conditions.length > 1 && (
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-700 -z-10"></div>
              )}

              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap md:flex-nowrap bg-slate-800/50 p-2 rounded-lg border border-slate-700 z-10">
                  {/* IF / Logic Label */}
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold text-xs 
                    ${idx === 0 ? 'bg-blue-900/50 text-blue-400' : (logicMode === 'AND' ? 'bg-slate-700 text-slate-300' : 'bg-orange-900/50 text-orange-400')}
                  `}>
                    {idx === 0 ? 'IF' : logicMode}
                  </div>

                  {/* Parameter A */}
                  <select 
                    value={cond.param} 
                    onChange={(e) => updateCondition(idx, 'param', e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
                  >
                    {PARAMETERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>

                  {/* Operator */}
                  <select 
                    value={cond.operator}
                    onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-orange-400 font-bold focus:outline-none focus:border-blue-500 w-20"
                  >
                    {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>

                  {/* Value or Parameter B */}
                  <div className="flex-1 flex gap-2">
                    {cond.compareTo === 'value' ? (
                      <input 
                        type="number" 
                        value={cond.value}
                        onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <select 
                        value={cond.value}
                        onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        {PARAMETERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    )}
                  </div>

                  <button 
                    onClick={() => updateCondition(idx, 'compareTo', cond.compareTo === 'value' ? 'param' : 'value')}
                    className="text-[10px] px-2 py-1 bg-slate-700 rounded text-slate-300 hover:bg-slate-600"
                    title="Toggle value type"
                  >
                    {cond.compareTo === 'value' ? '123' : 'Ref'}
                  </button>

                  <button 
                    onClick={() => removeCondition(idx)}
                    disabled={conditions.length === 1}
                    className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addCondition}
              className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-bold px-2 mt-2"
            >
              <Plus size={14} /> ADD CONDITION
            </button>
          </div>

          {/* 3. Actions (THEN) */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">THEN (Actions)</label>
            </div>
            
            <div className="space-y-2">
              {actions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                  <span className="text-xs font-mono font-bold text-green-400 w-8 text-center shrink-0">
                    {idx === 0 ? 'DO' : '&'}
                  </span>
                  
                  <select 
                    value={action.device}
                    onChange={(e) => {
                       const newActions = [...actions];
                       newActions[idx].device = e.target.value;
                       setActions(newActions);
                    }}
                    className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
                  >
                    {DEVICES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>

                  <div className="text-slate-500"><ArrowRight size={16}/></div>

                  <select 
                    value={action.state}
                    onChange={(e) => {
                       const newActions = [...actions];
                       newActions[idx].state = e.target.value;
                       setActions(newActions);
                    }}
                    className={`bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm font-bold focus:outline-none w-32 ${action.state === 'ON' ? 'text-green-400' : 'text-red-400'}`}
                  >
                    <option value="ON">TURN ON</option>
                    <option value="OFF">TURN OFF</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-lg text-slate-400 hover:text-white font-bold transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Save size={18} />
            Save Rule
          </button>
        </div>

      </div>
    </div>
  );
};

export default RuleBuilderModal;