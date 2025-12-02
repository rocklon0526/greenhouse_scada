import React, { useEffect, useState } from 'react';
import { useScadaStore } from '@core/hooks/useScadaStore';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AlarmPage() {
    const { activeAlarms, acknowledgeAlarm } = useScadaStore();
    const [history, setHistory] = useState<any[]>([]);

    // Fetch history on mount
    useEffect(() => {
        fetch('http://localhost:8000/api/alarms/history?limit=50')
            .then(res => res.json())
            .then(setHistory)
            .catch(console.error);
    }, []);

    const activeList = Object.values(activeAlarms).sort((a: any, b: any) => b.triggerTime - a.triggerTime);

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-100">
            <header className="mb-8 border-b border-slate-800 pb-4">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <AlertTriangle className="text-red-500" />
                    Alarm Management Center
                </h1>
                <p className="text-slate-500 mt-1">ISA-18.2 Compliant Alarm List</p>
            </header>

            {/* Active Alarms Section */}
            <section className="mb-10">
                <h2 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    Active Alarms
                </h2>

                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="p-4">Time</th>
                                <th className="p-4">Rule ID</th>
                                <th className="p-4">Value</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {activeList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <CheckCircle className="inline mb-1 mr-2 text-green-500" />
                                        No active alarms. System Normal.
                                    </td>
                                </tr>
                            ) : (
                                activeList.map((alarm: any) => (
                                    <tr key={alarm.ruleId} className={alarm.status === 'ACTIVE_UNACKED' ? 'bg-red-900/10' : ''}>
                                        <td className="p-4 font-mono text-sm text-slate-400">
                                            {new Date(alarm.triggerTime * 1000).toLocaleTimeString()}
                                        </td>
                                        <td className="p-4 font-bold text-white">{alarm.ruleId}</td>
                                        <td className="p-4 font-mono text-yellow-400">{alarm.valueAtTrigger}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${alarm.status === 'ACTIVE_UNACKED'
                                                ? 'bg-red-500 text-white animate-pulse'
                                                : 'bg-yellow-600 text-yellow-100'
                                                }`}>
                                                {alarm.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {alarm.status === 'ACTIVE_UNACKED' && (
                                                <button
                                                    onClick={() => acknowledgeAlarm(alarm.ruleId)}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold transition-colors"
                                                >
                                                    ACK
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Alarm History Section */}
            <section>
                <h2 className="text-xl font-bold mb-4 text-slate-400 flex items-center gap-2">
                    <Clock size={20} />
                    Recent History
                </h2>
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden opacity-75">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="p-4">Start Time</th>
                                <th className="p-4">Tag</th>
                                <th className="p-4">Message</th>
                                <th className="p-4">End Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {history.map((row: any) => (
                                <tr key={row.id}>
                                    <td className="p-4 font-mono text-sm text-slate-400">
                                        {new Date(row.start_time).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-slate-300">{row.tag_name}</td>
                                    <td className="p-4 text-slate-300">{row.message}</td>
                                    <td className="p-4 font-mono text-sm text-slate-500">
                                        {row.end_time ? new Date(row.end_time).toLocaleTimeString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
