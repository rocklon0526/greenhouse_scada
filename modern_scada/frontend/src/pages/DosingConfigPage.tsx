import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import Card from '../components/ui/Card';
import { Beaker, Settings, Scale, Save } from 'lucide-react'; // 引入 Save icon
import { translations } from '../i18n/translations';

const DosingConfigPage = () => {
  // @ts-ignore
  const { dosingTanks, updateDosingTank, language } = useAppStore();
  const t = translations[language];

  const elementColors: Record<string, string> = {
    'Nitrogen': 'text-blue-400',
    'Phosphorus': 'text-orange-400',
    'Potassium': 'text-purple-400',
    'Calcium': 'text-slate-200',
    'Acid': 'text-red-400',
    'Base': 'text-green-400',
  };

  const handleSaveAll = () => {
    // 這裡可以加入儲存到後端的邏輯
    // 目前僅顯示 alert 作為範例
    alert("所有設定已儲存！");
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-2 pb-24">
      <div className="mb-6 flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                <Settings size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-white">{t.dosingConfigTitle}</h1>
                <p className="text-xs text-slate-400">{t.dosingDesc}</p>
            </div>
         </div>
         {/* 新增儲存按鈕 */}
         <button 
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20"
         >
            <Save size={18} />
            <span>儲存變更</span>
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dosingTanks.map((tank: any) => (
          <Card key={tank.id} className="group hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-600 font-mono font-bold text-slate-300">
                        {tank.id}
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">{t.tankId}</div>
                        <div className="text-sm font-bold text-white">{tank.name}</div>
                    </div>
                </div>
                <Beaker size={20} className={elementColors[tank.chemicalType] || 'text-slate-600'} />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.displayName}</label>
                    <input 
                        type="text" 
                        value={tank.name}
                        onChange={(e) => updateDosingTank(tank.id, { name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder={t.displayNamePlaceholder}
                    />
                </div>

                <div>
                    <label className="text-[10px] uppercase font-bold text-blue-400 mb-1 block">{t.chemElement}</label>
                    <input 
                        type="text" 
                        value={tank.chemicalType}
                        onChange={(e) => updateDosingTank(tank.id, { chemicalType: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-yellow-400 font-mono font-bold focus:border-yellow-500 focus:outline-none transition-colors"
                        placeholder={t.chemPlaceholder}
                    />
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {['N', 'P', 'K', 'Ca', 'Mg', 'Acid'].map(el => (
                            <button 
                                key={el}
                                onClick={() => updateDosingTank(tank.id, { chemicalType: el })}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-400 border border-slate-700 transition-colors"
                            >
                                {el}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/50">
                     <div>
                        <div className="flex items-center gap-1 mb-1">
                            <Scale size={12} className="text-slate-500"/>
                            <label className="text-[10px] text-slate-500 block">{t.capacity}</label>
                        </div>
                        <input 
                            type="number" 
                            value={tank.capacity} // 這裡現在代表總重量 (kg)
                            onChange={(e) => updateDosingTank(tank.id, { capacity: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 font-mono"
                        />
                     </div>
                     <div>
                        <div className="flex items-center gap-1 mb-1">
                            <Scale size={12} className="text-blue-400"/>
                            <label className="text-[10px] text-slate-500 block">{t.currLevel}</label>
                        </div>
                        <input 
                            type="number" 
                            value={tank.currentLevel} // 這裡現在代表當前重量 (kg)
                            onChange={(e) => updateDosingTank(tank.id, { currentLevel: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-blue-300 font-bold font-mono"
                        />
                     </div>
                </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DosingConfigPage;