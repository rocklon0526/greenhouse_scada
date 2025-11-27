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
  level: 0 | 1 | 2 | 3 | 4; // 0=Empty, 4=Full
  ph: number;
  ec: number;
  valveOpen: boolean; 
  pumpActive: boolean; 
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