import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface TrendChartProps {
    deviceId: string;
    paramId: string; // e.g., "speed"
    title?: string;
    color?: string;
}

interface DataPoint {
    time: string;
    value: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    deviceId,
    paramId,
    title,
    color = "#3b82f6"
}) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const tagId = `${deviceId}:${paramId}`;
                const res = await fetch(`http://localhost:8000/api/history?tag_id=${tagId}&limit=50`);
                if (!res.ok) throw new Error('Failed to fetch history');

                const json = await res.json();
                // Reverse to show oldest to newest (API returns newest first)
                const chartData = json.reverse().map((d: any) => ({
                    ...d,
                    time: new Date(d.time).toLocaleTimeString(), // Format time for X-axis
                    fullTime: d.time // Keep full time for tooltip
                }));

                setData(chartData);
            } catch (err) {
                console.error(err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [deviceId, paramId]);

    if (loading && data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mr-2" /> Loading History...
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-64 flex items-center justify-center text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="w-full h-64 bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            {title && <h4 className="text-slate-300 text-sm font-bold mb-2">{title}</h4>}
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="time"
                        stroke="#94a3b8"
                        fontSize={12}
                        tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tick={{ fill: '#94a3b8' }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
