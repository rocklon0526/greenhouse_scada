// src/types/rules.ts
export interface Rule {
  id: number;
  name: string;
  condition: string;
  action: string;
  active: boolean;
  rawConditions?: any[];
  rawActions?: any[];
  logicMode?: 'AND' | 'OR';
}
