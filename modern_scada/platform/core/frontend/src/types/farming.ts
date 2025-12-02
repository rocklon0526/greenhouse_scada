export interface Chemical {
  id: string;
  name: string;
  formula?: string; // e.g. KNO3
  description?: string;
  defaultConcentration?: number; // Optional default concentration
}

export interface DosingTank {
  id: number;
  name: string;
  capacity: number; // Liters
  currentLevel: number; // 0-100%
  ph: number;
  ec: number;
  chemicalType: string; // Keep for backward compatibility or display
  chemicalId?: string; // Link to Chemical Master
}

export interface RackNutrientTank {
  rackId: string;
  position: [number, number, number];
  level: 0 | 1 | 2 | 3 | 4; // 0=Empty, 1=L1(Low), 4=L4(Full)
  ph: number;
  ec: number;
  valveOpen: boolean;
  pumpActive: boolean;
  status?: 'IDLE' | 'FILLING' | 'DRAINING' | 'ERROR';
}

export interface RecipeIngredient {
  dosingTankId: number;
  ratio: number; // Dilution ratio
  weight: number; // Calculated grams
}

export interface Recipe {
  id: string;
  name: string;
  targetWaterVolume: number; // e.g. 15T
  ingredients: RecipeIngredient[];
  createdAt: string;
}

export interface MixerState {
  level: number;
  ph: number;
  ec: number;
  status: 'Ready' | 'Mixing' | 'Transferring' | 'Error';
  isMixing: boolean;
  valveOpen: boolean;
  pumpActive: boolean;
  currentRecipeId?: string;
  progress?: number;
}