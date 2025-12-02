import React, { useState } from 'react';
import { useAppStore } from '@core/stores/useAppStore';
import Card from '@core/components/ui/Card';
import { Plus, Trash2, Edit2, Save, X, FlaskConical } from 'lucide-react';
import { Chemical } from '@core/types/farming';
import { translations } from '@core/i18n/translations';

const ChemicalsPage = () => {
    // @ts-ignore
    const { chemicals, addChemical, updateChemical, deleteChemical, language } = useAppStore();
    const t = translations[language as keyof typeof translations];

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Chemical>>({});
    const [isAdding, setIsAdding] = useState(false);
    const [newChemical, setNewChemical] = useState<Partial<Chemical>>({});

    const handleEdit = (chem: Chemical) => {
        setIsEditing(chem.id);
        setEditForm(chem);
    };

    const handleSaveEdit = () => {
        if (isEditing && editForm.name) {
            updateChemical(isEditing, editForm);
            setIsEditing(null);
            setEditForm({});
        }
    };

    const handleAdd = () => {
        if (newChemical.name && newChemical.formula) {
            addChemical({
                id: `chem_${Date.now()}`,
                name: newChemical.name,
                formula: newChemical.formula,
                description: newChemical.description || '',
                ...newChemical
            } as Chemical);
            setIsAdding(false);
            setNewChemical({});
        } else {
            alert('Name and Formula are required');
        }
    };

    return (
        <div className="h-full p-4 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                        <FlaskConical size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Chemical Ingredients Master</h1>
                        <p className="text-xs text-slate-400">Manage available chemical ingredients for dosing</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
                >
                    <Plus size={18} />
                    <span>Add Chemical</span>
                </button>
            </div>

            {isAdding && (
                <Card className="mb-6 border-green-500/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Name</label>
                            <input
                                value={newChemical.name || ''}
                                onChange={e => setNewChemical({ ...newChemical, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                placeholder="e.g. Nitrate Potassium"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Formula</label>
                            <input
                                value={newChemical.formula || ''}
                                onChange={e => setNewChemical({ ...newChemical, formula: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                                placeholder="e.g. KNO3"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Description</label>
                            <input
                                value={newChemical.description || ''}
                                onChange={e => setNewChemical({ ...newChemical, description: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                placeholder="Optional description"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={handleAdd} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded">Save</button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chemicals.map((chem: Chemical) => (
                    <Card key={chem.id} className="group hover:border-blue-500/50 transition-colors">
                        {isEditing === chem.id ? (
                            <div className="space-y-3">
                                <input
                                    value={editForm.name || ''}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                                />
                                <input
                                    value={editForm.formula || ''}
                                    onChange={e => setEditForm({ ...editForm, formula: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-sm"
                                />
                                <input
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setIsEditing(null)} className="p-1 text-slate-500 hover:text-white"><X size={16} /></button>
                                    <button onClick={handleSaveEdit} className="p-1 text-green-500 hover:text-green-400"><Save size={16} /></button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-white">{chem.name}</h3>
                                        <div className="text-xs text-blue-400 font-mono bg-blue-900/20 px-2 py-0.5 rounded inline-block mt-1">
                                            {chem.formula}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(chem)} className="p-1.5 text-slate-500 hover:text-blue-400 bg-slate-800/50 rounded"><Edit2 size={14} /></button>
                                        <button onClick={() => deleteChemical(chem.id)} className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-800/50 rounded"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{chem.description}</p>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ChemicalsPage;
