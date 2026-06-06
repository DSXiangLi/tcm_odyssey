/**
 * NPC反馈桥接器
 *
 * 功能：组装游戏结果为NPC对话上下文，触发DialogUI
 * 支持：诊断结果反馈、心跳数据注入
 */

import { showDialogUI } from '../dialog-entry';
import type { DialogUIOptions } from '../DialogUI';
import type { DiagnosisResult } from '../DiagnosisUI';
import type { DiagnosisCase } from '../data/diagnosis-cases';
import type { DiagnosisScoreResult } from '../../../utils/DiagnosisScorer';
import { calculateDiagnosisScore, formatScoreForNPC } from '../../../utils/DiagnosisScorer';
import { GameStateManager } from '../../../utils/GameStateManager';

/**
 * 游戏上下文类型
 * 用于向NPC Agent提供当前游戏状态信息
 */
export interface GameContextForNPC {
  type: 'diagnosis' | 'heartbeat';

  // diagnosis类型专用字段
  diagnosisResult?: {
    caseId: string;
    patientName: string;
    userAnswers: DiagnosisResult;
    correctAnswers: DiagnosisCase;
    score: DiagnosisScoreResult;
  };

  // heartbeat类型专用字段（后续实现）
  heartbeatData?: {
    inventory: Record<string, unknown>;
    progress: Record<string, unknown>;
    cases: Record<string, unknown>;
  };
}

/**
 * 触发NPC反馈对话
 *
 * 流程：
 * 1. 计算评分（如为诊断类型）
 * 2. 组装GameContextForNPC
 * 3. 调用showDialogUI并注入context
 *
 * @param context 游戏上下文（诊断结果或心跳数据）
 * @param onClose 关闭回调（可选，用于场景切换）
 */
export function triggerNPCFeedback(context: GameContextForNPC, onClose?: () => void): void {
  if (context.type === 'diagnosis' && context.diagnosisResult) {
    triggerDiagnosisFeedback(context.diagnosisResult, onClose);
  }
  // heartbeat类型后续实现
}

/**
 * 触发诊断结果反馈
 *
 * @param data 诊断结果数据
 * @param onClose 关闭回调（可选，用于场景切换）
 */
function triggerDiagnosisFeedback(data: {
  caseId: string;
  patientName: string;
  userAnswers: DiagnosisResult;
  correctAnswers: DiagnosisCase;
  score?: DiagnosisScoreResult; // 可选，如未传入则计算
}, onClose?: () => void): void {
  // 计算评分（如未提供）- 使用 ?? 避免 falsy score=0 问题
  const score = data.score ?? calculateDiagnosisScore(data.userAnswers, data.correctAnswers);

  // 组装完整上下文
  const fullContext: GameContextForNPC = {
    type: 'diagnosis',
    diagnosisResult: {
      caseId: data.caseId,
      patientName: data.patientName,
      userAnswers: data.userAnswers,
      correctAnswers: data.correctAnswers,
      score: score,
    },
  };

  // 使用扩展后的DialogUIOptions
  const dialogOptions: DialogUIOptions = {
    npcId: 'qingmu',
    npcName: '青木先生',
    playerId: GameStateManager.getInstance().getPlayerId(),
    gameContext: fullContext,
    mode: 'feedback',
    onClose: onClose,  // 关闭回调用于场景切换
  };

  // 调用showDialogUI（DialogUIOptions已扩展支持gameContext和mode）
  showDialogUI(dialogOptions);
}

/**
 * 导出供DiagnosisScene使用
 */
export { calculateDiagnosisScore, formatScoreForNPC };