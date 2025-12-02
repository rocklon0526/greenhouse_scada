import React, { useState, useEffect } from 'react';
import { Play, Plus, Trash2, Save, FileText } from 'lucide-react';

interface RecipeStep {
    id: string;
    description: string;
    duration_seconds: number;
    actions: Record<string, string>;
}

interface Recipe {
    id: string;
    name: string;
    steps: RecipeStep[];
}

export const RecipeManager: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const fetchRecipes = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/recipes');
            const data = await res.json();
            setRecipes(data);
        } catch (err) {
            console.error("Failed to fetch recipes", err);
        }
    };

    const executeRecipe = async (id: string) => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/api/recipes/${id}/execute`, { method: 'POST' });
            if (res.ok) {
                alert("Recipe Execution Started!");
            } else {
                alert("Failed to start recipe");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    return (
        <div className="p-6 bg-slate-900 min-h-screen text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="text-blue-400" />
                    Recipe Management
                </h1>
                <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18} /> New Recipe
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recipe List */}
                <div className="space-y-4">
                    {recipes.map(recipe => (
                        <div key={recipe.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{recipe.name}</h3>
                                    <p className="text-slate-400 text-sm">{recipe.steps.length} Steps</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); executeRecipe(recipe.id); }}
                                        disabled={loading}
                                        className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40 disabled:opacity-50"
                                    >
                                        <Play size={20} />
                                    </button>
                                    <button className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recipe Details */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    {selectedRecipe ? (
                        <div>
                            <h2 className="text-xl font-bold mb-4">{selectedRecipe.name}</h2>
                            <div className="space-y-4">
                                {selectedRecipe.steps.map((step, idx) => (
                                    <div key={step.id} className="flex items-center gap-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold">{step.description}</div>
                                            <div className="text-xs text-slate-400 font-mono">
                                                Duration: {step.duration_seconds}s | Actions: {JSON.stringify(step.actions)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 py-20">
                            Select a recipe to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
