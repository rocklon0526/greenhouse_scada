import React, { useEffect, useState } from 'react';
import { Trash2, UserPlus, Shield, User, Loader2 } from 'lucide-react';

interface UserData {
    id: number;
    username: string;
    role: string;
    created_at: string;
}

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    // New User Form State
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('user');
    const [isCreating, setIsCreating] = useState(false);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access denied. Admin only.');
                }
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to delete user');
            }

            setUsers(users.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    role: newRole
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to create user');
            }

            await fetchUsers();
            setShowModal(false);
            setNewUsername('');
            setNewPassword('');
            setNewRole('user');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block p-4 bg-red-500/10 rounded-full mb-4">
                    <Shield className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-slate-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-slate-400">Manage system access and roles</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add User
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-950 border-b border-slate-800">
                            <th className="p-4 text-slate-400 font-medium">ID</th>
                            <th className="p-4 text-slate-400 font-medium">Username</th>
                            <th className="p-4 text-slate-400 font-medium">Role</th>
                            <th className="p-4 text-slate-400 font-medium">Created At</th>
                            <th className="p-4 text-slate-400 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 text-slate-500">#{user.id}</td>
                                <td className="p-4 text-white font-medium flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mr-3">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    {user.username}
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${user.role === 'sysadmin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                            user.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                        {user.role === 'sysadmin' ? 'System Admin' : user.role === 'admin' ? 'Project Admin' : 'Viewer'}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-400 text-sm">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Delete User"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-6">Create New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="sysadmin">System Admin</option>
                                    <option value="admin">Project Admin</option>
                                    <option value="user">Viewer</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center"
                                >
                                    {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
