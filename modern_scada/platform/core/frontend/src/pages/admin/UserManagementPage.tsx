import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Trash2, Edit, Check, X, Loader2, RefreshCw, Key } from 'lucide-react';

interface User {
    id: number;
    username: string;
    role: string;
    created_at?: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
}

const UserManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // User Form State
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ role: '', password: '' });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [usersRes, rolesRes] = await Promise.all([
                fetch('/api/users', { headers }),
                fetch('/api/roles', { headers })
            ]);

            if (usersRes.ok && rolesRes.ok) {
                setUsers(await usersRes.json());
                setRoles(await rolesRes.json());
            } else {
                setError('Failed to load data. Ensure you have admin privileges.');
            }
        } catch (err) {
            console.error(err);
            setError('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                setIsAddingUser(false);
                setNewUser({ username: '', password: '', role: 'operator' });
                fetchData();
            } else {
                const data = await res.json();
                alert(data.detail || 'Failed to create user');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating user');
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.detail || 'Failed to delete user');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting user');
        }
    };

    const handleUpdateUser = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            const body: any = {};
            if (editForm.role) body.role = editForm.role;
            if (editForm.password) body.password = editForm.password;

            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setEditingUserId(null);
                setEditForm({ role: '', password: '' });
                fetchData();
            } else {
                alert('Failed to update user');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating user');
        }
    };

    if (loading && users.length === 0) return <div className="p-8 text-white flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Loading users...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-slate-400">Manage system access and security roles</p>
                </div>
                <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-4 font-medium transition-colors relative ${activeTab === 'users' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                        <Users size={18} /> Users
                    </div>
                    {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`pb-4 px-4 font-medium transition-colors relative ${activeTab === 'roles' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                        <Shield size={18} /> Roles
                    </div>
                    {activeTab === 'roles' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />}
                </button>
            </div>

            {error && <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-lg mb-6">{error}</div>}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[500px]">
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">System Users</h3>
                            <button
                                onClick={() => setIsAddingUser(true)}
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                                <Plus size={18} className="mr-2" /> Add User
                            </button>
                        </div>

                        {isAddingUser && (
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Username</label>
                                    <input type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Password</label>
                                    <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Role</label>
                                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white">
                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAddUser} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-500"><Check size={18} /></button>
                                    <button onClick={() => setIsAddingUser(false)} className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600"><X size={18} /></button>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {users.map((user) => (
                                <div key={user.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex justify-between items-center group hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{user.username}</h4>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Shield size={12} />
                                                <span className="uppercase text-xs font-bold tracking-wider">{user.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {editingUserId === user.id ? (
                                        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                                            <select
                                                value={editForm.role || user.role}
                                                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-sm"
                                            >
                                                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                            </select>
                                            <input
                                                type="password"
                                                placeholder="New Password"
                                                value={editForm.password}
                                                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-sm w-32"
                                            />
                                            <button onClick={() => handleUpdateUser(user.id)} className="text-emerald-400 hover:text-emerald-300"><Check size={18} /></button>
                                            <button onClick={() => setEditingUserId(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingUserId(user.id); setEditForm({ role: user.role, password: '' }); }}
                                                className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 hover:bg-red-900/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'roles' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Security Roles</h3>
                        </div>
                        <div className="grid gap-4">
                            {roles.map((role) => (
                                <div key={role.id} className="bg-slate-950 border border-slate-800 p-6 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield className="text-emerald-500" size={20} />
                                        <h4 className="text-lg font-bold text-white">{role.name}</h4>
                                    </div>
                                    <p className="text-slate-400">{role.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagementPage;
