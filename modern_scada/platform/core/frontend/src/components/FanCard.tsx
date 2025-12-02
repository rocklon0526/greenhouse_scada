import React, { useState } from 'react';
import { useScadaStore } from '../hooks/useScadaStore';
import { Activity, Fan, Play, Square, LineChart as ChartIcon, X } from 'lucide-react';
import { TrendChart } from './TrendChart';

interface FanCardProps {
    deviceId: string; // e.g., "fan_01"
    name: string;
}

export const FanCard: React.FC<FanCardProps> = ({ deviceId, name }) => {
    // Construct tag IDs
    const speedTag = `${deviceId}: speed`; // Matches backend param_id
    const vibrationTag = `${deviceId}: vibration`;
    // const statusTag = `${ deviceId }: status`; // Not yet implemented in backend simulation

    // Selector Pattern: Only re-render when these specific values change
    const speed = useScadaStore((state) => state.tags[speedTag]?.value ?? 0);
    const vibration = useScadaStore((state) => state.tags[vibrationTag]?.value ?? 0.0);

    // Get control function
    const sendCommand = useScadaStore((state) => state.sendCommand);

    const handleStart = () => sendCommand(deviceId, 'speed', 1000); // Mock Start = Set Speed to 1000
    const handleStop = () => sendCommand(deviceId, 'speed', 0);     // Mock Stop = Set Speed to 0

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        sendCommand(deviceId, 'speed', Number(e.target.value));
    };

    // Derived status (Mock logic for now until status param exists)
    const isRunning = Number(speed) > 0;
    const isAlarm = Number(vibration) > 5.0;

    const statusColor =
        isAlarm ? 'bg-red-500 animate-pulse' :
            isRunning ? 'bg-green-500' : 'bg-gray-400';

    // Modal State
    const [showHistory, setShowHistory] = useState(false);

    return (
        <>
            <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg border border-slate-700 w-72">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p - 2 rounded - full ${statusColor} bg - opacity - 20`}>
                            <Fan className={`w - 6 h - 6 ${isRunning ? 'animate-spin' : ''} `} />
                        </div>
                        <h3 className="font-bold text-lg">{name}</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowHistory(true)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                            title="View History"
                        >
                            <ChartIcon size={18} />
                        </button>
                        <div className={`w - 3 h - 3 rounded - full ${statusColor} mt - 1`} />
                    </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                    {/* Speed */}
                    <div className="flex justify-between items-end">
                        <span className="text-slate-400 text-sm">Speed</span>
                        <div className="text-right">
                            <span className="text-2xl font-mono font-bold">{Number(speed).toFixed(0)}</span>
                            <span className="text-xs text-slate-500 ml-1">RPM</span>
                        </div>
                    </div>

                    {/* Vibration */}
                    <div className="flex justify-between items-end">
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                            <Activity size={14} /> Vib
                        </span>
                        <div className="text-right">
                            <span className={`text - xl font - mono font - bold ${Number(vibration) > 5 ? 'text-red-400' : 'text-blue-400'} `}>
                                {Number(vibration).toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500 ml-1">mm/s</span>
                        </div>
                    </div>
                </div>

                {/* --- Control Panel --- */}
                <div className="mt-4 pt-4 border-t border-slate-700 bg-slate-900/50 -mx-4 px-4 pb-2 rounded-b-xl">
                    <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">Manual Control</p>

                    {/* Start/Stop Buttons */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={handleStart}
                            className="flex-1 bg-green-900/40 hover:bg-green-700 text-green-400 border border-green-800 py-2 rounded-md flex justify-center items-center gap-2 transition-all active:scale-95"
                        >
                            <Play size={16} /> Start
                        </button>
                        <button
                            onClick={handleStop}
                            className="flex-1 bg-red-900/40 hover:bg-red-700 text-red-400 border border-red-800 py-2 rounded-md flex justify-center items-center gap-2 transition-all active:scale-95"
                        >
                            <Square size={16} /> Stop
                        </button>
                    </div>

                    {/* Speed Setpoint Slider */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Target Speed</span>
                            <span>(0-2000 RPM)</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="2000" step="50"
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            onChange={handleSpeedChange}
                            defaultValue={0}
                        />
                    </div>
                </div>

                {/* Footer / Last Update */}
                <div className="mt-4 pt-2 border-t border-slate-700 text-xs text-slate-500 text-right">
                    ID: {deviceId}
                </div>
            </div>

            {/* History Modal Overlay */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ChartIcon className="text-blue-400" />
                                History: {name}
                            </h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <TrendChart deviceId={deviceId} paramId="speed" title="Fan Speed (RPM)" color="#3b82f6" />
                            <TrendChart deviceId={deviceId} paramId="vibration" title="Vibration (mm/s)" color="#ef4444" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
