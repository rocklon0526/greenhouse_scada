import React from 'react';
import { useScadaStore } from '../hooks/useScadaStore';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AlarmBanner: React.FC = () => {
    const activeAlarms = useScadaStore((state) => state.activeAlarms);
    const navigate = useNavigate();

    // Find critical unacknowledged alarms
    const unackedAlarms = Object.values(activeAlarms).filter(
        (alarm: any) => alarm.status === 'ACTIVE_UNACKED'
    );

    if (unackedAlarms.length === 0) return null;

    const count = unackedAlarms.length;
    const latestAlarm = unackedAlarms[unackedAlarms.length - 1];

    return (
        <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center shadow-md animate-pulse-slow">
            <div className="flex items-center gap-3">
                <AlertTriangle className="animate-bounce" />
                <span className="font-bold text-lg">
                    {count} Active Alarm{count > 1 ? 's' : ''}!
                </span>
                <span className="text-red-100 hidden md:inline">
                    Latest: {latestAlarm.ruleId} - Value: {latestAlarm.valueAtTrigger}
                </span>
            </div>

            <button
                onClick={() => navigate('/web/alarms')}
                className="bg-white text-red-600 px-4 py-1 rounded-full font-bold text-sm hover:bg-red-50 transition-colors"
            >
                View Alarms
            </button>
        </div>
    );
};
