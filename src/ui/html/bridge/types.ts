// src/ui/html/bridge/types.ts
/**
 * 煎药 UI 桥接数据类型
 */

export interface HerbDropData {
  herbId: string;
}

export interface HerbResultData {
  success: boolean;
  herbId: string;
  message?: string;
}

export interface FireSelectData {
  type: 'martial' | 'civil' | 'gentle';
}

export interface CompleteData {
  herbs: string[];
  fireType: 'martial' | 'civil' | 'gentle';
}

export interface ScoreResultData {
  score: number;
  breakdown: {
    composition: number;
    fire: number;
    time: number;
  };
  passed: boolean;
  prescriptionName?: string;
}

export interface StateUpdateData {
  phase: 'idle' | 'selecting' | 'brewing' | 'complete';
  progress: number;
}