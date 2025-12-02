import React from 'react';
import { Clock, AlertTriangle, RefreshCw, PauseCircle } from 'lucide-react';
import { translations } from '../../i18n/translations';
import { useAppStore } from '../../stores/useAppStore';

interface AdvancedSettingsProps {
    settings: any;
    onChange: (newSettings: any) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onChange }) => {
    const { language } = useAppStore();
    const t = translations[language as keyof typeof translations];

    const updateSetting = (key: string, value: any) => {
        onChange({ ...settings, [key]: value });
    };

    const updateStopLogic = (key: string, value: any) => {
        onChange({
            ...settings,
            stop_condition: { ...settings.stop_condition, [key]: value }
        });
    };

    const updateConstraints = (key: string, value: any) => {
        onChange({
            ...settings,
            constraints: { ...settings.constraints, [key]: value }
        });
    };

    return (
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                Advanced Settings
            </h4>

            {/* Stop Logic */}
            <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase font-bold">Stop Logic</label>
                <div className="flex gap-2">
                    <button
                        onClick={() => updateStopLogic('type', 'standard')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-bold border transition-colors ${settings.stop_condition?.type === 'standard'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => updateStopLogic('type', 'hysteresis')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-bold border transition-colors ${settings.stop_condition?.type === 'hysteresis'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Hysteresis
                    </button>
                </div>
                {settings.stop_condition?.type === 'hysteresis' && (
                    <div className="flex items-center gap-2 mt-2 bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="text-xs text-slate-400">Stop when value drops by:</span>
                        <input
                            type="number"
                            value={settings.stop_condition?.value || 0}
                            onChange={(e) => updateStopLogic('value', parseFloat(e.target.value))}
                            className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                        />
                    </div>
                )}
            </div>

            {/* Constraints */}
            <div className="space-y-2 pt-2 border-t border-slate-700">
                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-2">
                    <Clock size={14} /> Constraints
                </label>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Min Run Time (min):</span>
                    <input
                        type="number"
                        value={settings.constraints?.min_run_time || 0}
                        onChange={(e) => updateConstraints('min_run_time', parseInt(e.target.value))}
                        className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                    />
                </div>
            </div>

            {/* Cycle Mode */}
            <div className="space-y-2 pt-2 border-t border-slate-700">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-2">
                        <RefreshCw size={14} /> Cycle Mode
                    </label>
                    <input
                        type="checkbox"
                        checked={settings.cycle?.enabled || false}
                        onChange={(e) => onChange({ ...settings, cycle: { ...settings.cycle, enabled: e.target.checked } })}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                </div>

                {settings.cycle?.enabled && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase">Run (min)</span>
                            <input
                                type="number"
                                value={settings.cycle?.run_duration || 0}
                                onChange={(e) => onChange({ ...settings, cycle: { ...settings.cycle, run_duration: parseInt(e.target.value) } })}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase">Pause (min)</span>
                            <input
                                type="number"
                                value={settings.cycle?.pause_duration || 0}
                                onChange={(e) => onChange({ ...settings, cycle: { ...settings.cycle, pause_duration: parseInt(e.target.value) } })}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Time Schedules */}
            <div className="space-y-2 pt-2 border-t border-slate-700">
                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-2">
                    <Clock size={14} /> Time Schedules
                </label>
                <div className="space-y-2">
                    {(settings.schedules || []).map((schedule: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                            <input
                                type="time"
                                value={schedule.start}
                                onChange={(e) => {
                                    const newSchedules = [...(settings.schedules || [])];
                                    newSchedules[idx].start = e.target.value;
                                    onChange({ ...settings, schedules: newSchedules });
                                }}
                                className="bg-slate-900 border border-slate-600 rounded px-1 text-white text-xs w-20"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                                type="time"
                                value={schedule.end}
                                onChange={(e) => {
                                    const newSchedules = [...(settings.schedules || [])];
                                    newSchedules[idx].end = e.target.value;
                                    onChange({ ...settings, schedules: newSchedules });
                                }}
                                className="bg-slate-900 border border-slate-600 rounded px-1 text-white text-xs w-20"
                            />
                            <span className="text-slate-500">Target:</span>
                            <input
                                type="number"
                                value={schedule.threshold}
                                onChange={(e) => {
                                    const newSchedules = [...(settings.schedules || [])];
                                    newSchedules[idx].threshold = e.target.value;
                                    onChange({ ...settings, schedules: newSchedules });
                                }}
                                className="bg-slate-900 border border-slate-600 rounded px-1 text-white text-xs w-16"
                            />
                            <button
                                onClick={() => {
                                    const newSchedules = settings.schedules.filter((_: any, i: number) => i !== idx);
                                    onChange({ ...settings, schedules: newSchedules });
                                }}
                                className="ml-auto text-slate-500 hover:text-red-400"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => onChange({ ...settings, schedules: [...(settings.schedules || []), { start: '08:00', end: '18:00', threshold: 28 }] })}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                    >
                        + Add Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSettings;
