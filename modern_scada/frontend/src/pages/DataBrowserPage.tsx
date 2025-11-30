import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, RefreshCw, Database, Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface TagConfig {
    name: string;
    address: number;
    type: string;
    unit: string;
    connection_name?: string;
}

interface TagValue {
    value: number;
    timestamp: string;
}

const DataBrowserPage: React.FC = () => {
    const [tags, setTags] = useState<TagConfig[]>([]);
    const [tagValues, setTagValues] = useState<Record<string, number | boolean | string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConnection, setSelectedConnection] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const wsRef = useRef<WebSocket | null>(null);

    // Fetch Tag Configuration
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/config/tags', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTags(data);
                }
            } catch (err) {
                console.error("Failed to fetch tags", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTags();
    }, []);

    // WebSocket Connection
    useEffect(() => {
        const connectWs = () => {
            const token = localStorage.getItem('token');
            const wsUrl = `ws://${window.location.hostname}:8000/ws?token=${token}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("DataBrowser WS Connected");
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'update' && message.data && message.data.rawTags) {
                        setTagValues(prev => ({ ...prev, ...message.data.rawTags }));
                    }
                } catch (e) {
                    console.error("WS Parse Error", e);
                }
            };

            ws.onclose = () => {
                console.log("DataBrowser WS Disconnected, retrying...");
                setTimeout(connectWs, 3000);
            };

            wsRef.current = ws;
        };

        connectWs();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connections = Array.from(new Set(tags.map(t => t.connection_name || 'Default'))).sort();

    const filteredTags = tags.filter(tag => {
        const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tag.address.toString().includes(searchTerm);
        const matchesConn = selectedConnection === 'all' ||
            (tag.connection_name || 'Default') === selectedConnection;
        return matchesSearch && matchesConn;
    });

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Data Browser</h1>
                    <p className="text-slate-400">Real-time tag monitoring and diagnostics</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg flex items-center px-3 py-2">
                        <Activity size={18} className="text-emerald-400 mr-2" />
                        <span className="text-slate-300 text-sm font-mono">
                            {Object.keys(tagValues).length} Active Tags
                        </span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-t-xl p-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search tags by name or address..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                    <div className="relative min-w-[200px]">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                        <select
                            value={selectedConnection}
                            onChange={e => setSelectedConnection(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                            <option value="all">All Connections</option>
                            {connections.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-900 border-x border-b border-slate-800 rounded-b-xl flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-medium w-[30%]">Tag Name</th>
                                <th className="p-4 font-medium w-[15%]">Value</th>
                                <th className="p-4 font-medium w-[10%]">Unit</th>
                                <th className="p-4 font-medium w-[15%]">Address</th>
                                <th className="p-4 font-medium w-[10%]">Type</th>
                                <th className="p-4 font-medium w-[20%]">Connection</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredTags.map(tag => {
                                const val = tagValues[tag.name];
                                const hasValue = val !== undefined;
                                return (
                                    <tr key={tag.name} className="text-slate-300 hover:bg-slate-800/50 transition-colors font-mono">
                                        <td className="p-4 font-medium text-white font-sans">{tag.name}</td>
                                        <td className="p-4">
                                            {hasValue ? (
                                                <span className={`font-bold ${typeof val === 'boolean'
                                                    ? (val ? 'text-emerald-400' : 'text-slate-500')
                                                    : 'text-blue-400'
                                                    }`}>
                                                    {typeof val === 'number' ? val.toFixed(2) : val.toString()}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-500">{tag.unit}</td>
                                        <td className="p-4 text-slate-400">{tag.address}</td>
                                        <td className="p-4 text-slate-500 text-xs uppercase">{tag.type}</td>
                                        <td className="p-4 text-slate-500 text-xs">
                                            {tag.connection_name || 'Default'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTags.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No tags found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataBrowserPage;
