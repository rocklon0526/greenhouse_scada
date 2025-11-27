import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import Card from '../components/ui/Card';
import { Plus, Trash2, FlaskConical, Scale } from 'lucide-react';
import { Recipe } from '../types/farming';

const WATER_TONS = 15;
const WATER_GRAMS = 15 * 1000 * 1000;

const FormulaPage = () => {
  // @ts-ignore
  const { recipes, dosingTanks, addRecipe, deleteRecipe } = useAppStore();
  const [name, setName] = useState('');
  const [ratios, setRatios] = useState<Record<number, string>>({});

  // 1:Ratio calculation -> Grams
  const calculateWeight = (ratioStr: string) => {
    const ratio = parseFloat(ratioStr);
    if (!ratio || ratio <= 0) return 0;
    return WATER_GRAMS / ratio; 
  };

  const handleSave = () => {
    if (!name) return alert("Please enter a name");
    const ingredients = dosingTanks
      .map((tank: any) => {
        const ratioVal = parseFloat(ratios[tank.id] || '0');
        if (ratioVal <= 0) return null;
        return {
          dosingTankId: tank.id,
          ratio: ratioVal,
          weight: calculateWeight(ratios[tank.id] || '0')
        };
      })
      .filter((i: any): i is any => i !== null);

    if (ingredients.length === 0) return alert("Add at least one ingredient ratio");

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name,
      targetWaterVolume: WATER_TONS,
      ingredients,
      createdAt: new Date().toLocaleDateString()
    };

    addRecipe(newRecipe);
    setName('');
    setRatios({});
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-2 overflow-y-auto">
      {/* Left: Creator */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <Card title={`Formula Calculator (${WATER_TONS}T Water)`}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Recipe Name</label>
              <input 
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Vegetative Stage Mix"
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mt-1" 
              />
            </div>
            
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {dosingTanks.map((tank: any) => {
                const grams = calculateWeight(ratios[tank.id] || '0');
                return (
                  <div key={tank.id} className="bg-slate-800/50 p-3 rounded border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{tank.name}</div>
                      <div className="text-xs text-slate-500">Current Lvl: {tank.currentLevel}%</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                         <span className="text-xs text-slate-500">1 :</span>
                         <input 
                           type="number" 
                           placeholder="Ratio" 
                           value={ratios[tank.id] || ''}
                           onChange={e => setRatios({...ratios, [tank.id]: e.target.value})}
                           className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-sm text-white"
                         />
                      </div>
                      <div className="text-xs text-orange-400 font-mono">
                        {grams > 1000 ? `${(grams/1000).toFixed(2)} kg` : `${grams.toFixed(0)} g`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleSave} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center justify-center gap-2 transition-colors">
              <Plus size={18} /> Save Formula
            </button>
          </div>
        </Card>
      </div>

      {/* Right: Database */}
      <div className="flex-1">
        <Card title="Recipe Database" className="h-full">
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 overflow-y-auto h-full pb-10">
              {recipes.map((r: any) => (
                <div key={r.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><FlaskConical size={20} /></div>
                        <div>
                            <h3 className="font-bold text-white">{r.name}</h3>
                            <p className="text-xs text-slate-500">Base: {r.targetWaterVolume} Tonnes Water</p>
                        </div>
                    </div>
                    <button onClick={() => deleteRecipe(r.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={18} /></button>
                  </div>
                  <div className="space-y-1">
                    {r.ingredients.map((ing: any) => (
                        <div key={ing.dosingTankId} className="flex justify-between text-sm border-b border-slate-800 pb-1 last:border-0">
                            <span className="text-slate-400">Tank {ing.dosingTankId} (1:{ing.ratio})</span>
                            <span className="text-white font-mono">{(ing.weight / 1000).toFixed(2)} kg</span>
                        </div>
                    ))}
                  </div>
                </div>
              ))}
              {recipes.length === 0 && <div className="col-span-2 text-center text-slate-500 mt-10">No recipes defined.</div>}
           </div>
        </Card>
      </div>
    </div>
  );
};
export default FormulaPage;