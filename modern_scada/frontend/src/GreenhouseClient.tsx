import React from 'react';
import { NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, Split, Leaf, Activity, LucideIcon, FlaskConical, Settings, Languages, Shield, Home } from 'lucide-react';
import OverviewPage from './pages/OverviewPage';
import { useAppStore } from './stores/useAppStore';
import { translations } from './i18n/translations';
import { useWebSocket } from './hooks/useWebSocket';
import { WAREHOUSE_LAYOUT } from './configs/layoutConfig';

const GreenhouseClient = () => {
  const { connectionStatus, language, setLanguage, userRole } = useAppStore();
  const t = translations[language as keyof typeof translations];
  const { projectId } = useParams();

  // Initialize WebSocket connection
  useWebSocket(WAREHOUSE_LAYOUT);

  const location = useLocation();
  // Check if we are at the root of the project view (OverviewPage)
  const isOverview = location.pathname === `/perspective/${projectId}` || location.pathname === `/perspective/${projectId}/`;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans text-slate-100 selection:bg-green-500/30">
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isOverview ? 'opacity-100' : 'opacity-20 blur-sm'}`}>
        <OverviewPage />
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20"><Leaf size={20} className="text-white" /></div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">{t.appTitle}</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{connectionStatus === 'connected' ? t.systemOnline : t.systemOffline}</p>
              </div>
            </div>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl hover:bg-slate-800 transition-colors pointer-events-auto group"
          >
            <div className="p-1 bg-blue-500/20 rounded text-blue-400 group-hover:text-blue-300">
              <Languages size={20} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-slate-400 uppercase font-bold">{t.language}</span>
              <span className="text-sm font-bold text-white">{language === 'en' ? 'English' : '繁體中文'}</span>
            </div>
          </button>
        </header>

        <div className={`flex-1 min-h-0 py-6 animate-in fade-in zoom-in-95 duration-300 ${isOverview ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <div className="h-full container mx-auto max-w-5xl">
            <Outlet />
          </div>
        </div>

        <nav className="flex justify-center pointer-events-auto pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl shadow-black/50">
            <NavButton to="/home" icon={Home} label="Home" />
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <NavButton to="." icon={LayoutDashboard} label={t.navMonitor} end />
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <NavButton to="dashboard" icon={Activity} label={t.navControl} />
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <NavButton to="formula" icon={FlaskConical} label={t.navFormula} />
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <NavButton to="logic" icon={Split} label={t.navLogic} />
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <NavButton to="dosing-config" icon={Settings} label={t.navDosing} />
          </div>
        </nav>
      </div>
    </div>
  );
};

const NavButton = ({ to, icon: Icon, label, end }: { to: string, icon: LucideIcon, label: string, end?: boolean }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${isActive ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-105 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={20} /><span className="text-sm whitespace-nowrap">{label}</span>
  </NavLink>
);

export default GreenhouseClient;