import React, { useState, useEffect } from 'react';
import { Settings, Database, Tag, Save, Plus, Trash2, Edit, Check, X, Server, Loader2, RefreshCw } from 'lucide-react';

interface ModbusConnection {
    name: string;
    host: string;
    port: number;
    poll_interval: number;
}

interface TagConfig {
    name: string;
    address: number;
    type: string;
    unit: string;
    connection_name?: string;
}

const ConfigPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'modbus' | 'tags'>('modbus');
    const [connections, setConnections] = useState<ModbusConnection[]>([]);
    const [tags, setTags] = useState<TagConfig[]>([]);
    const [selectedConnectionName, setSelectedConnectionName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New Item State
    const [isAddingConnection, setIsAddingConnection] = useState(false);
    const [newConnection, setNewConnection] = useState<ModbusConnection>({ name: '', host: '', port: 502, poll_interval: 1.0 });

    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState<TagConfig>({ name: '', address: 0, type: 'float', unit: '', connection_name: '' });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [modbusRes, tagsRes] = await Promise.all([
                fetch('/api/config/modbus', { headers }),
                fetch('/api/config/tags', { headers })
            ]);

            if (modbusRes.ok && tagsRes.ok) {
                const modbusData = await modbusRes.json();
                const tagsData = await tagsRes.json();
                setConnections(modbusData.connections || []);
                setTags(tagsData || []);
            } else {
                setError('Failed to load configuration');
            }
        } catch (err) {
            console.error(err);
            setError('Error loading configuration');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveConnections = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/config/modbus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ connections })
            });
            if (res.ok) alert('Connections saved successfully');
            else alert('Failed to save connections');
        } catch (err) {
            console.error(err);
            alert('Error saving connections');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTags = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/config/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(tags)
            });
            if (res.ok) alert('Tags saved successfully');
            else alert('Failed to save tags');
        } catch (err) {
            console.error(err);
            alert('Error saving tags');
        } finally {
            setSaving(false);
        }
    };

    const handleAddConnection = () => {
        if (!newConnection.name || !newConnection.host) return;
        setConnections([...connections, newConnection]);
        setNewConnection({ name: '', host: '', port: 502, poll_interval: 1.0 });
        setIsAddingConnection(false);
    };

    const handleRemoveConnection = (index: number) => {
        const newConns = [...connections];
        newConns.splice(index, 1);
        setConnections(newConns);
    };

    const handleAddTag = () => {
        if (!newTag.name) return;
        const tagToAdd = { ...newTag };
        if (!tagToAdd.connection_name) delete tagToAdd.connection_name; // Handle default
        setTags([...tags, tagToAdd]);
        setNewTag({ name: '', address: 0, type: 'float', unit: '', connection_name: selectedConnectionName || '' });
        setIsAddingTag(false);
    };

    const handleRemoveTag = (index: number) => {
        const newTags = [...tags];
        newTags.splice(index, 1);
        setTags(newTags);
    };

    const handleEditTags = (connectionName: string) => {
        setSelectedConnectionName(connectionName);
        setActiveTab('tags');
    };

    const filteredTags = selectedConnectionName
        ? tags.filter(t => t.connection_name === selectedConnectionName)
        : tags;

    if (loading) return <div className="p-8 text-white flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Loading configuration...</div>;
    if (error) return <div className="p-8 text-red-400 flex items-center justify-center">{error} <button onClick={fetchData} className="ml-4 text-white underline">Retry</button></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">System Configuration</h1>
                    <p className="text-slate-400">Manage connections and data points</p>
                </div>
                <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('modbus')}
                    className={`pb-4 px-4 font-medium transition-colors relative ${activeTab === 'modbus' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Server size={18} /> Modbus Connections
                    </div>
                    {activeTab === 'modbus' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('tags')}
                    className={`pb-4 px-4 font-medium transition-colors relative ${activeTab === 'tags' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Tag size={18} /> Tags ({selectedConnectionName || 'All'})
                    </div>
                    {activeTab === 'tags' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[500px]">
                {activeTab === 'modbus' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Modbus TCP Connections</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsAddingConnection(true)}
                                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus size={18} className="mr-2" /> Add Connection
                                </button>
                                <button
                                    onClick={handleSaveConnections}
                                    disabled={saving}
                                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />} Save Changes
                                </button>
                            </div>
                        </div>

                        {isAddingConnection && (
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Name</label>
                                    <input type="text" value={newConnection.name} onChange={e => setNewConnection({ ...newConnection, name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Host</label>
                                    <input type="text" value={newConnection.host} onChange={e => setNewConnection({ ...newConnection, host: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Port</label>
                                    <input type="number" value={newConnection.port} onChange={e => setNewConnection({ ...newConnection, port: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Poll (s)</label>
                                    <input type="number" step="0.1" value={newConnection.poll_interval} onChange={e => setNewConnection({ ...newConnection, poll_interval: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAddConnection} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-500"><Check size={18} /></button>
                                    <button onClick={() => setIsAddingConnection(false)} className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600"><X size={18} /></button>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {connections.map((conn, idx) => (
                                <div key={idx} className="bg-slate-950 border border-slate-800 p-6 rounded-lg flex justify-between items-center group hover:border-slate-700 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-bold text-white">{conn.name}</h4>
                                            {idx === 0 && (
                                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-slate-400 text-sm font-mono flex items-center gap-4">
                                            <span>{conn.host}:{conn.port}</span>
                                            <span className="text-slate-600">|</span>
                                            <span>Poll: {conn.poll_interval}s</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditTags(conn.name)}
                                            className="flex items-center px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 rounded text-sm transition-colors"
                                        >
                                            <Tag size={14} className="mr-2" /> Edit Tags
                                        </button>
                                        <button onClick={() => handleRemoveConnection(idx)} className="p-2 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {connections.length === 0 && <div className="text-center text-slate-500 py-8">No Modbus connections configured.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'tags' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-bold text-white">Tags Configuration</h3>
                                {selectedConnectionName && (
                                    <div className="flex items-center px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                                        <span className="text-slate-400 text-xs mr-2">Filtering by:</span>
                                        <span className="text-white text-sm font-medium">{selectedConnectionName}</span>
                                        <button
                                            onClick={() => setSelectedConnectionName(null)}
                                            className="ml-2 text-slate-400 hover:text-white"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsAddingTag(true)}
                                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus size={18} className="mr-2" /> Add Tag
                                </button>
                                <button
                                    onClick={handleSaveTags}
                                    disabled={saving}
                                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />} Save Changes
                                </button>
                            </div>
                        </div>

                        {isAddingTag && (
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Name</label>
                                    <input type="text" value={newTag.name} onChange={e => setNewTag({ ...newTag, name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Address</label>
                                    <input type="number" value={newTag.address} onChange={e => setNewTag({ ...newTag, address: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Type</label>
                                    <select value={newTag.type} onChange={e => setNewTag({ ...newTag, type: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white">
                                        <option value="float">Float</option>
                                        <option value="int">Int</option>
                                        <option value="bool">Bool</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Unit</label>
                                    <input type="text" value={newTag.unit} onChange={e => setNewTag({ ...newTag, unit: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Connection</label>
                                    <select value={newTag.connection_name || ''} onChange={e => setNewTag({ ...newTag, connection_name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white">
                                        <option value="">Default</option>
                                        {connections.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAddTag} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-500"><Check size={18} /></button>
                                    <button onClick={() => setIsAddingTag(false)} className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600"><X size={18} /></button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="p-4 font-medium">Name</th>
                                        <th className="p-4 font-medium">Address</th>
                                        <th className="p-4 font-medium">Type</th>
                                        <th className="p-4 font-medium">Unit</th>
                                        <th className="p-4 font-medium">Connection</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredTags.map((tag, idx) => (
                                        <tr key={idx} className="text-slate-300 hover:bg-slate-950/50 transition-colors">
                                            <td className="p-4 font-medium text-white">{tag.name}</td>
                                            <td className="p-4 font-mono text-emerald-400">{tag.address}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono">{tag.type}</span>
                                            </td>
                                            <td className="p-4 text-slate-400">{tag.unit}</td>
                                            <td className="p-4 text-slate-400">
                                                {tag.connection_name || <span className="text-slate-600 italic">Default</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleRemoveTag(idx)} className="p-1.5 hover:bg-red-900/20 rounded text-slate-400 hover:text-red-400 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTags.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500">
                                                No tags found for this selection.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfigPage;
