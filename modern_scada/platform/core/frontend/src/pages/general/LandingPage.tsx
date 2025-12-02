import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, FolderOpen, ArrowRight } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    description: string;
    role: string;
}

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('username');
        const userRole = localStorage.getItem('role');
        if (user) setUsername(user);
        if (userRole) setRole(userRole);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // Mock Project List
    const projects: Project[] = [
        {
            id: 'default',
            name: 'Greenhouse Alpha',
            description: 'Main production facility with 2 aisles and 6 dosing tanks.',
            role: 'Production'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
            {/* Header */}
            <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                            <LayoutDashboard className="text-emerald-500" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                Modern SCADA
                            </h1>
                            <p className="text-xs text-slate-400">Enterprise Edition</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white">{username}</p>
                            <p className="text-xs text-slate-400 uppercase">{role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {username}</h2>
                    <p className="text-slate-400">Select a project to monitor or manage system settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Project Cards */}
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/perspective/${project.id}`)}
                            className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FolderOpen size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 mb-4 group-hover:scale-110 transition-transform">
                                    <FolderOpen className="text-blue-400" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                                <p className="text-slate-400 text-sm mb-4">{project.description}</p>
                                <div className="flex items-center text-emerald-400 text-sm font-medium">
                                    Enter Project <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Web Admin Card - For SysAdmin and Project Admin */}
                    {(role === 'sysadmin' || role === 'admin') && (
                        <div
                            onClick={() => navigate('/web')}
                            className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-purple-500/50 hover:bg-slate-800/50 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Settings size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 mb-4 group-hover:scale-110 transition-transform">
                                    <Settings className="text-purple-400" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Web Administration</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Manage users, database connections, and system configurations.
                                </p>
                                <div className="flex items-center text-purple-400 text-sm font-medium">
                                    Manage System <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
