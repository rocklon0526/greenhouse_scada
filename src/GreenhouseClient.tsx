import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Split, Leaf, Activity, LucideIcon } from 'lucide-react';
import OverviewPage from './pages/OverviewPage';
import { useAppStore } from './stores/useAppStore';

const GreenhouseClient = () => {
  const connectionStatus = useAppStore(state => state.connectionStatus);
  const location = useLocation();
  const isOverview = location.pathname === '/';

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans text-slate-100 selection:bg-green-500/30">
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isOverview ? 'opacity-100' : 'opacity-20 blur-sm'}`}>
        <OverviewPage />
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20"><Leaf size={20} className="text-white" /></div>
            <div><h1 className="font-bold text-lg tracking-wide text-white">Greenhouse OS</h1><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span><p className="text-[10px] text-slate-400 uppercase tracking-wider">{connectionStatus === 'connected' ? 'System Online' : 'Offline'}</p></div></div>
          </div>
        </header>
        <div className="flex-1 min-h-0 py-6 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="h-full container mx-auto max-w-5xl">
            <Outlet />
          </div>
        </div>
        <nav className="flex justify-center pointer-events-auto pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl shadow-black/50">
            <NavButton to="/" icon={LayoutDashboard} label="3D Monitor" />
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <NavButton to="/dashboard" icon={Activity} label="Control Panel" />
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <NavButton to="/logic" icon={Split} label="Automation Logic" />
          </div>
        </nav>
      </div>
    </div>
  );
};

const NavButton = ({ to, icon: Icon, label }: { to: string, icon: LucideIcon, label: string }) => (
  <NavLink to={to} className={({ isActive }) => `flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${isActive ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-105 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={20} /><span className="text-sm">{label}</span>
  </NavLink>
);

export default GreenhouseClient;