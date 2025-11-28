export interface DosingTank {
  id: number;
  name: string; 
  capacity: number; // Liters
  currentLevel: number; // 0-100%
  ph: number;
  ec: number;
  chemicalType: string;
}

export interface RackNutrientTank {
  rackId: string;
  position: [number, number, number];
  level: 0 | 1 | 2 | 3 | 4; // 0=Empty, 1=L1(Low), 4=L4(Full)
  ph: number;
  ec: number;
  valveOpen: boolean; 
  pumpActive: boolean; 
  // 新增狀態欄位以支援 UI 顯示
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

// 新增混合器狀態介面
export interface MixerState {
  level: number;
  ph: number;
  ec: number;
  status: 'Ready' | 'Mixing' | 'Transferring' | 'Error'; // 狀態列舉
  isMixing: boolean;
  valveOpen: boolean;
  pumpActive: boolean;
  currentRecipeId?: string; // 當前正在執行的配方
  progress?: number; // 0-100%
}