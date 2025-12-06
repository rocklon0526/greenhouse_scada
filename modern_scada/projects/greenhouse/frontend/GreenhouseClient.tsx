import React from 'react';
import { NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, Split, Leaf, Activity, LucideIcon, FlaskConical, Settings, Languages, Home, FileText, User } from 'lucide-react';
import OverviewPage from './OverviewPage';
import { useAppStore } from '@core/stores/useAppStore';
import { translations } from '@core/i18n/translations';
import { useWebSocket } from '@core/hooks/useWebSocket';
import { WAREHOUSE_LAYOUT } from '@core/configs/layoutConfig';

const GreenhouseClient = () => {
  // @ts-ignore
  const { connectionStatus, language, setLanguage, layoutConfig } = useAppStore();
  const t = translations[language as keyof typeof translations];
  const { projectId } = useParams();

  // Initialize WebSocket connection with dynamic layoutConfig
  // Fallback to WAREHOUSE_LAYOUT if layoutConfig is not yet loaded
  useWebSocket(layoutConfig || WAREHOUSE_LAYOUT);

  const location = useLocation();

  const isOverview = location.pathname === `/perspective/${projectId}` ||
    location.pathname === `/perspective/${projectId}/` ||
    location.pathname.includes('/overview');

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans text-slate-100 selection:bg-green-500/30 flex flex-col">

      {/* Fixed Header Bar - Always on Top */}
      <header className="relative z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Project Title & Status */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">{t.appTitle}</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{connectionStatus === 'connected' ? t.systemOnline : t.systemOffline}</p>
              </div>
            </div>
          </div>

          {/* Center: Navigation Menu */}
          <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-full">
            <NavButton to="/home" icon={Home} label="Home" />
            <NavButton to="overview" icon={LayoutDashboard} label={t.navMonitor} />
            <NavButton to="dashboard" icon={Activity} label={t.navControl} />
            <NavButton to="formula" icon={FlaskConical} label={t.navFormula} />
            <NavButton to="logic" icon={Split} label={t.navLogic} />
            <NavButton to="recipes" icon={FileText} label="Recipes" />
            <NavButton to="dosing-config" icon={Settings} label={t.navDosing} />
          </nav>

          {/* Right: User & Language */}
          <div className="flex items-center gap-3">
            {/* User Info (Placeholder) */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <User size={16} className="text-blue-400" />
              </div>
              <span className="text-sm font-medium text-slate-300">Admin</span>
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 px-3 py-2 rounded-lg transition-colors group"
            >
              <div className="p-1 bg-blue-500/20 rounded text-blue-400 group-hover:text-blue-300">
                <Languages size={16} />
              </div>
              <span className="text-sm font-bold text-white">{language === 'en' ? 'EN' : 'ZH'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Area - Below Header */}
      <div className="relative flex-1 overflow-hidden">
        {/* 3D Background for Overview Page */}
        {isOverview && (
          <div className="absolute inset-0 z-0">
            <OverviewPage />
          </div>
        )}

        {/* Foreground Content (Dashboard, Logic, etc.) */}
        {!isOverview && (
          <div className="absolute inset-0 z-10 overflow-auto p-6">
            <div className="container mx-auto max-w-5xl h-full animate-in fade-in zoom-in-95 duration-300">
              <Outlet />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NavButton = ({ to, icon: Icon, label, end }: { to: string, icon: LucideIcon, label: string, end?: boolean }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    {/* @ts-ignore */}
    <Icon size={18} /><span className="text-xs whitespace-nowrap">{label}</span>
  </NavLink>
);

export default GreenhouseClient;