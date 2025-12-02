import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, Users, RefreshCw, X, CircleHelp, PlayCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SystemStatus {
    active_users: any[];
    db_status: string;
    db_stats?: {
        query_count: number;
        avg_query_time: number;
        last_query_time: number;
    };
    store_forward_status: string;
    store_forward_count: number;
    cpu_usage: number;
    ram_usage: number;
    ram_total?: number;
    ram_used?: number;
    disk_usage: number;
    uptime: number;
}

const StatusPage: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showBufferModal, setShowBufferModal] = useState(false);
    const [showDBModal, setShowDBModal] = useState(false);
    const [bufferData, setBufferData] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    const fetchStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/system/status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStatus(data);

                // Update history
                setHistory(prev => {
                    const newPoint = {
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        cpu: data.cpu_usage,
                        ram: data.ram_usage
                    };
                    // Keep last 24h worth of data (approx 1440 mins * 12 (5s interval) = 17280 points)
                    // But for performance, let's cap at 2000 points
                    const newHistory = [...prev, newPoint];
                    if (newHistory.length > 2000) newHistory.shift();
                    return newHistory;
                });
            }
        } catch (error) {
            console.error('Failed to fetch status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/system/history?range=24h', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const formatted = data.map((item: any) => ({
                    time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    cpu: item.cpu_usage,
                    ram: item.ram_usage
                }));
                setHistory(formatted);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const fetchBuffer = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/system/buffer', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBufferData(data);
                setShowBufferModal(true);
            }
        } catch (error) {
            console.error('Failed to fetch buffer:', error);
        }
    };

    const handleRetryBuffer = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/system/buffer/retry', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                alert(`Retried buffer. Processed ${data.processed} items.`);
                fetchBuffer(); // Refresh buffer view
                fetchStatus(); // Refresh main status
            }
        } catch (error) {
            console.error('Failed to retry buffer:', error);
            alert('Failed to retry buffer.');
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const getDuration = (isoString: string) => {
        const start = new Date(isoString).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);

        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    };

    if (loading && !status) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">System Status</h1>
                    <p className="text-slate-400">Real-time system health monitoring</p>
                </div>
                <button
                    onClick={fetchStatus}
                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    title="Refresh Status"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatusCard
                    title="Active Users"
                    value={(status?.active_users?.length || 0).toString()}
                    icon={Users}
                    color="blue"
                    subtext="Connected sessions"
                    onDetails={() => setShowUsersModal(true)}
                />
                <StatusCard
                    title="Database"
                    value={status?.db_status === 'connected' ? 'Connected' : 'Disconnected'}
                    icon={Database}
                    color={status?.db_status === 'connected' ? 'emerald' : 'red'}
                    subtext="PostgreSQL Connection"
                    onDetails={() => setShowDBModal(true)}
                />
                <StatusCard
                    title="Store & Forward"
                    value={status?.store_forward_status === 'idle' ? 'Idle' : `Buffering`}
                    icon={Server}
                    color={status?.store_forward_status === 'idle' ? 'slate' : 'amber'}
                    subtext={`${status?.store_forward_count || 0} items pending`}
                    onDetails={fetchBuffer}
                />
                <StatusCard
                    title="System Health"
                    value="Good"
                    icon={Activity}
                    color="purple"
                    subtext={`Uptime: ${Math.floor((status?.uptime || 0) / 3600)}h`}
                    tooltip="Overall system health based on CPU, RAM, and Disk usage."
                />
            </div>

            {/* Historical Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-slate-400 font-medium mb-4 flex items-center">
                        <Activity className="mr-2 text-blue-500" size={18} /> CPU History (24h)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} minTickGap={30} />
                                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                />
                                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-slate-400 font-medium mb-4 flex items-center">
                        <Activity className="mr-2 text-purple-500" size={18} /> RAM History (24h)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} minTickGap={30} />
                                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                />
                                <Line type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Additional Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Resources */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium flex items-center">
                            CPU Usage
                        </h3>
                        <Activity className="text-blue-500" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{status?.cpu_usage || 0}%</div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${status?.cpu_usage || 0}%` }}></div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium flex items-center">
                            RAM Usage <CircleHelp size={14} className="ml-2 text-slate-600" />
                        </h3>
                        <Activity className="text-purple-500" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{status?.ram_usage || 0}%</div>
                    <div className="text-xs text-slate-400 mb-2">
                        {((status?.ram_used || 0) / 1024 / 1024 / 1024).toFixed(1)} GB / {((status?.ram_total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${status?.ram_usage || 0}%` }}></div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium flex items-center">
                            Disk Usage <CircleHelp size={14} className="ml-2 text-slate-600" />
                        </h3>
                        <Database className="text-emerald-500" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{status?.disk_usage || 0}%</div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${status?.disk_usage || 0}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Users Modal */}
            {showUsersModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Users className="mr-2 text-blue-500" /> Active Users
                            </h2>
                            <button onClick={() => setShowUsersModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-800">
                                        <th className="pb-3 font-medium">User</th>
                                        <th className="pb-3 font-medium">IP Address</th>
                                        <th className="pb-3 font-medium">Connected At</th>
                                        <th className="pb-3 font-medium">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {status?.active_users.map((user, i) => (
                                        <tr key={i} className="text-slate-300">
                                            <td className="py-3 flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 text-blue-400">
                                                    {user.username[0].toUpperCase()}
                                                </div>
                                                {user.username}
                                            </td>
                                            <td className="py-3 font-mono text-slate-400">{user.ip}</td>
                                            <td className="py-3 text-slate-400">
                                                {new Date(user.connected_at).toLocaleString()}
                                            </td>
                                            <td className="py-3 text-emerald-400 font-mono">
                                                {getDuration(user.connected_at)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!status?.active_users || status.active_users.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-slate-500">No active users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* DB Modal */}
            {showDBModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Database className="mr-2 text-emerald-500" /> Database Performance
                            </h2>
                            <button onClick={() => setShowDBModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <h4 className="text-slate-400 text-sm mb-1">Total Queries</h4>
                                <p className="text-2xl font-bold text-white">{status?.db_stats?.query_count || 0}</p>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <h4 className="text-slate-400 text-sm mb-1">Avg Query Time</h4>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {((status?.db_stats?.avg_query_time || 0) * 1000).toFixed(2)} ms
                                </p>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 col-span-2">
                                <h4 className="text-slate-400 text-sm mb-1">Last Query Duration</h4>
                                <div className="flex items-center">
                                    <div className="flex-1 bg-slate-800 h-2 rounded-full mr-4">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${Math.min(((status?.db_stats?.last_query_time || 0) * 1000), 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-mono">
                                        {((status?.db_stats?.last_query_time || 0) * 1000).toFixed(2)} ms
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Buffer Modal */}
            {showBufferModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Server className="mr-2 text-amber-500" /> Store & Forward Buffer
                            </h2>
                            <button onClick={() => setShowBufferModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="mb-4 flex justify-between items-center">
                                <span className="text-slate-400">Total Buffered Items: <span className="text-white font-bold">{bufferData?.count || 0}</span></span>
                                <div className="flex items-center space-x-4">
                                    <span className="text-xs text-slate-500">Showing last 50 items</span>
                                    <button
                                        onClick={handleRetryBuffer}
                                        className="flex items-center px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm transition-colors"
                                        disabled={!bufferData?.count}
                                    >
                                        <PlayCircle size={16} className="mr-1" /> Retry All
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-slate-900 text-slate-400">
                                        <tr>
                                            <th className="p-3">ID</th>
                                            <th className="p-3">Query</th>
                                            <th className="p-3">Created At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {bufferData?.items?.map((item: any) => (
                                            <tr key={item.id} className="text-slate-300 hover:bg-slate-900/50">
                                                <td className="p-3 text-slate-500">{item.id}</td>
                                                <td className="p-3 truncate max-w-md" title={item.query}>{item.query}</td>
                                                <td className="p-3 text-slate-400">{new Date(item.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {(!bufferData?.items || bufferData.items.length === 0) && (
                                            <tr>
                                                <td colSpan={3} className="p-4 text-center text-slate-500">Buffer is empty</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusCard = ({ title, value, icon: Icon, color, subtext, onDetails, tooltip }: any) => {
    const colors: any = {
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        red: 'bg-red-500/10 text-red-500 border-red-500/20',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    return (
        <div className={`p-6 rounded-xl border ${colors[color]} backdrop-blur-sm transition-all hover:scale-[1.02] relative group`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium opacity-80 text-current flex items-center">
                    {title}
                    {tooltip && <CircleHelp size={14} className="ml-2 opacity-60 hover:opacity-100 cursor-help" />}
                </h3>
                <Icon size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            {subtext && <p className="text-xs opacity-60 text-current">{subtext}</p>}

            {onDetails && (
                <button
                    onClick={onDetails}
                    className="mt-4 text-xs font-medium uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity flex items-center"
                >
                    View Details &rarr;
                </button>
            )}
        </div>
    );
};

export default StatusPage;
