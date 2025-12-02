import React from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { Activity, Settings, LayoutGrid, ArrowLeft, Database, Box, Users } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const WebLayout: React.FC = () => {
    const location = useLocation();
    console.log("WebLayout rendering, path:", location.pathname);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <LayoutGrid size={18} className="text-white" />
                        </div>
                        <h1 className="font-bold text-lg tracking-wide text-white">Web Admin</h1>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavButton to="/web/status" icon={Activity} label="System Status" />
                    <NavButton to="/web/data" icon={Database} label="Data Browser" />
                    <NavButton to="/web/config" icon={Settings} label="Configuration" />
                    <NavButton to="/web/users" icon={Users} label="User Management" />
                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tools</div>
                    <ExternalNavButton href="http://localhost:5050" icon={Database} label="pgAdmin 4" />
                    <ExternalNavButton href="http://localhost:9000" icon={Box} label="Portainer" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="px-4 py-2 mb-2">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Logged in as</div>
                        <div className="text-sm font-medium text-emerald-400 truncate">{useAppStore((state: any) => state.userName) || 'Unknown'}</div>
                    </div>
                    <Link
                        to="/home"
                        className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors mb-2"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Home</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-950 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 pointer-events-none" />
                <div className="relative z-10 p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const NavButton = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
        }
    >
        <Icon size={20} className="group-hover:scale-110 transition-transform" />
        <span className="font-medium">{label}</span>
    </NavLink>
);

const ExternalNavButton = ({ href, icon: Icon, label }: { href: string, icon: React.ElementType, label: string }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-slate-400 hover:text-white hover:bg-white/5"
    >
        <Icon size={20} className="group-hover:scale-110 transition-transform" />
        <span className="font-medium">{label}</span>
    </a>
);

export default WebLayout;
