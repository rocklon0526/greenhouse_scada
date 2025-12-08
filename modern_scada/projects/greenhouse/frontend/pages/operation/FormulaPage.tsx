import React, { useState } from 'react';
import { useAppStore } from '@core/stores/useAppStore';
import Card from '@core/components/ui/Card';
import { Plus, Trash2, FlaskConical, PlayCircle, Droplets } from 'lucide-react';
import { Recipe } from '@core/types/farming';
import { translations } from '@core/i18n/translations';

const FormulaPage = () => {
  // @ts-ignore
  const { recipes, dosingTanks, addRecipe, deleteRecipe, startMixingProcess, mixerData, language } = useAppStore();
  const t = translations[language as keyof typeof translations];
  const [name, setName] = useState('');

  // Change from ratios to weights (grams)
  const [weights, setWeights] = useState<Record<number, string>>({});

  // 新增水量變數 (預設 15T)
  const [waterTons, setWaterTons] = useState<number>(15);

  // Calculate Ratio based on Weight (Grams)
  // Ratio = Total Water (g) / Ingredient Weight (g)
  const calculateRatio = (weightStr: string) => {
    const weight = parseFloat(weightStr);
    if (!weight || weight <= 0) return 0;
    // 使用動態設定的水量進行計算 (T -> g)
    const waterGrams = waterTons * 1000 * 1000;
    return waterGrams / weight;
  };

  const handleSave = () => {
    if (!name) return alert("Please enter a name");
    const ingredients = dosingTanks
      .map((tank: any) => {
        const weightVal = parseFloat(weights[tank.id] || '0');
        if (weightVal <= 0) return null;

        const calculatedRatio = calculateRatio(weights[tank.id] || '0');

        return {
          dosingTankId: tank.id,
          ratio: calculatedRatio,
          weight: weightVal
        };
      })
      .filter((i: any): i is any => i !== null);

    if (ingredients.length === 0) return alert("Add at least one ingredient weight");

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name,
      targetWaterVolume: waterTons, // 儲存設定的水量
      ingredients,
      createdAt: new Date().toLocaleDateString()
    };

    addRecipe(newRecipe);
    setName('');
    setWeights({});
    // Reset water tons to default if needed, or keep last used
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-2 overflow-y-auto">
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        {/* 卡片標題現在動態顯示設定的水量 */}
        <Card title={`${t.formulaCalc} (Target: ${waterTons}T)`}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t.recipeNameLabel}</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder={t.recipeNamePlaceholder}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mt-1"
              />
            </div>

            {/* 新增水量設定輸入框 */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Droplets size={12} />
                {t.waterVolume} (Tons)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={waterTons}
                  onChange={e => setWaterTons(Number(e.target.value))}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                />
                <span className="text-sm text-slate-400 font-bold">T</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {dosingTanks.map((tank: any) => {
                const ratio = calculateRatio(weights[tank.id] || '0');
                return (
                  <div key={tank.id} className="bg-slate-800/50 p-3 rounded border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{tank.name}</div>
                      <div className="text-xs text-slate-500">Lvl: {tank.currentLevel}%</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Grams"
                          value={weights[tank.id] || ''}
                          onChange={e => setWeights({ ...weights, [tank.id]: e.target.value })}
                          className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-sm text-white"
                        />
                        <span className="text-xs text-slate-500">g</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-orange-400 font-mono">
                          {ratio > 0 ? `1 : ${ratio < 100 ? ratio.toFixed(2) : ratio.toFixed(0)}` : '-'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {ratio > 0 ? `${(1000000 / ratio).toFixed(1)} PPM` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleSave} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center justify-center gap-2 transition-colors">
              <Plus size={18} /> {t.saveFormula}
            </button>
          </div>
        </Card>
      </div>

      <div className="flex-1">
        <Card title={t.recipeDb} className="h-full">
          {/* 狀態列 */}
          {mixerData.status === 'Mixing' && (
            <div className="mb-4 bg-green-900/20 border border-green-500/50 p-3 rounded-lg flex items-center justify-between animate-pulse">
              <span className="text-green-400 font-bold flex items-center gap-2">
                <FlaskConical className="animate-bounce" size={18} />
                Processing Recipe... (Status: {mixerData.mixStatus})
              </span>
              <span className="font-mono text-white">{mixerData.progress}%</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 overflow-y-auto h-full pb-10">
            {recipes.map((r: any) => (
              <div key={r.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><FlaskConical size={20} /></div>
                    <div>
                      <h3 className="font-bold text-white">{r.name}</h3>
                      <p className="text-xs text-slate-500">{t.baseWater}: {r.targetWaterVolume} T</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 測試按鈕：開始混合 */}
                    <button
                      onClick={() => startMixingProcess(r.id)}
                      disabled={mixerData.status === 'Mixing'}
                      className="p-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      title="Start Mixing"
                    >
                      <PlayCircle size={18} />
                    </button>
                    <button onClick={() => deleteRecipe(r.id)} className="p-2 text-slate-600 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="space-y-1">
                  {r.ingredients.map((ing: any) => (
                    <div key={ing.dosingTankId} className="flex justify-between text-sm border-b border-slate-800 pb-1 last:border-0">
                      <span className="text-slate-400">{t.tankId} {ing.dosingTankId} (1:{ing.ratio.toFixed(0)})</span>
                      <span className="text-white font-mono">{(ing.weight / 1000).toFixed(2)} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {recipes.length === 0 && <div className="col-span-2 text-center text-slate-500 mt-10">{t.noRecipes}</div>}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default FormulaPage;