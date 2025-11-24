import React, { useState, useEffect } from 'react';
import { 
  Wind, Droplets, Thermometer, Activity, Settings, 
  LayoutDashboard, Split, Save, Power, RefreshCw, AlertTriangle, Menu, X
} from 'lucide-react';
import { useIgnitionSystem } from './hooks/useIgnitionSystem';
import OverviewPage from './pages/OverviewPage';
import LogicPage from './pages/LogicPage';


// ============================================================================
// 主應用框架 (MAIN APP SHELL)
// ============================================================================
const GreenhouseClient = () => {
  const [activePage, setActivePage] = useState('overview'); // overview, logic
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sys = useIgnitionSystem(); // 引用我們的資料層

  // Navigation Items
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logic', label: 'Logic Builder', icon: Split },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="font-bold text-white">G</span>
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight">Greenhouse OS</h1>
            <p className="text-[10px] text-slate-500">Headless SCADA v1.0</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${activePage === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800/50 rounded p-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${sys.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <div className="flex-1">
                 <div className="text-[10px] text-slate-400 uppercase font-bold">System Status</div>
                 <div className="text-xs text-white">{sys.status === 'connected' ? 'Online' : 'Offline'}</div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
          <span className="font-bold">Greenhouse OS</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 p-4 md:hidden">
            <nav className="space-y-2 mt-10">
               {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActivePage(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg text-lg font-medium
                    ${activePage === item.id ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  <item.icon size={24} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-hidden p-4 md:p-6">
          {activePage === 'overview' && <OverviewPage sys={sys} />}
          {activePage === 'logic' && <LogicPage sys={sys} />}
        </div>

      </main>
    </div>
  );
};

export default GreenhouseClient;