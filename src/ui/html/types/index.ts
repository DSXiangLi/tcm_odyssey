// src/ui/html/types/index.ts
/**
 * 煎药 UI React 组件类型定义
 */

import { ScoreResultData } from '../bridge/types';

export interface HerbPixelData {
  id: string;
  name: string;
  prop: string;
  grid: string[];
  pal: Record<string, string>;
  count: number;
}

export interface FormulaData {
  name: string;
  hint: string;
  count: number;
  correct: string[];
}

export interface VialData {
  name: string;
  color: string;
}

export interface DecoctionUIProps {
  herbs: HerbPixelData[];
  targetFormula: FormulaData;
  completedVials: (VialData | null)[];
  onHerbDrop: (herbId: string) => void;
  onFireSelect: (type: 'martial' | 'civil' | 'gentle') => void;
  onComplete: (herbs: string[], fireType: string) => ScoreResultData;
  onClose: () => void;
}