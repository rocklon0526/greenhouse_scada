import React, { useState } from 'react';
import { LayoutDashboard, Split, Leaf, Activity } from 'lucide-react'; // 新增 Activity icon
import OverviewPage from './pages/OverviewPage';
import LogicPage from './pages/LogicPage';
import DashboardPage from './pages/DashboardPage'; // 引入 Dashboard
import { useAppStore } from './store/useAppStore';

const GreenhouseClient = () => {
  const [activePage, setActivePage] = useState('overview');
  const connectionStatus = useAppStore(state => state.connectionStatus);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans text-slate-100 selection:bg-green-500/30">
      
      {/* 背景層：3D 場景永遠渲染，保持狀態 */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${activePage === 'overview' ? 'opacity-100' : 'opacity-20 blur-sm'}`}>
        <OverviewPage />
      </div>

      {/* 前景層：UI */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">Greenhouse OS</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {connectionStatus === 'connected' ? 'System Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area (Dashboard / Logic) */}
        {(activePage === 'dashboard' || activePage === 'logic') && (
          <div className="flex-1 min-h-0 py-6 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
             <div className="h-full container mx-auto max-w-5xl">
                {activePage === 'dashboard' && <DashboardPage />}
                {activePage === 'logic' && <LogicPage />}
             </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="flex justify-center pointer-events-auto pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl shadow-black/50">
            
            <NavButton 
              active={activePage === 'overview'} 
              onClick={() => setActivePage('overview')} 
              icon={LayoutDashboard} 
              label="3D Monitor" 
            />
            
            <div className="w-px h-8 bg-white/10 mx-2"></div>

            {/* 新增 Dashboard 按鈕 */}
            <NavButton 
              active={activePage === 'dashboard'} 
              onClick={() => setActivePage('dashboard')} 
              icon={Activity} 
              label="Control Panel" 
            />

            <div className="w-px h-8 bg-white/10 mx-2"></div>
            
            <NavButton 
              active={activePage === 'logic'} 
              onClick={() => setActivePage('logic')} 
              icon={Split} 
              label="Automation Logic" 
            />
            
          </div>
        </nav>

      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300
      ${active 
        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-105 font-bold' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'}
    `}
  >
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </button>
);

export default GreenhouseClient;