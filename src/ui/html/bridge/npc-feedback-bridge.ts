/**
 * NPC反馈桥接器
 *
 * 功能：组装游戏结果为NPC对话上下文，触发DialogUI
 * 支持：诊断结果反馈、心跳数据注入
 */

import { showDialogUI } from '../dialog-entry';
import type { DiagnosisResult } from '../DiagnosisUI';
import type { DiagnosisCase } from '../data/diagnosis-cases';
import type { DiagnosisScoreResult } from '../../../utils/DiagnosisScorer';
import { calculateDiagnosisScore, formatScoreForNPC } from '../../../utils/DiagnosisScorer';

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
 * 扩展的DialogUI选项（Task 3将正式添加到DialogUIOptions接口）
 * 当前用于内部类型检查，实际传递时使用DialogUIOptions
 */
interface ExtendedDialogUIOptions {
  npcId: string;
  npcName: string;
  playerId: string;
  gameContext?: GameContextForNPC;
  mode?: 'normal' | 'feedback';
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onClose?: () => void;
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
 */
export function triggerNPCFeedback(context: GameContextForNPC): void {
  if (context.type === 'diagnosis' && context.diagnosisResult) {
    triggerDiagnosisFeedback(context.diagnosisResult);
  }
  // heartbeat类型后续实现
}

/**
 * 触发诊断结果反馈
 *
 * @param data 诊断结果数据
 */
function triggerDiagnosisFeedback(data: {
  caseId: string;
  patientName: string;
  userAnswers: DiagnosisResult;
  correctAnswers: DiagnosisCase;
  score?: DiagnosisScoreResult; // 可选，如未传入则计算
}): void {
  // 计算评分（如未提供）
  const score = data.score || calculateDiagnosisScore(data.userAnswers, data.correctAnswers);

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

  // 组装扩展选项
  const extendedOptions: ExtendedDialogUIOptions = {
    npcId: 'qingmu',
    npcName: '青木先生',
    playerId: 'player_001',
    gameContext: fullContext,
    mode: 'feedback',
    onToolCall: (name, args) => {
      console.log('[NPCFeedbackBridge] Tool call:', name, args);
    },
    onClose: () => {
      console.log('[NPCFeedbackBridge] Feedback dialog closed');
    },
  };

  // TODO: Task 3将扩展DialogUIOptions接口以接受gameContext和mode
  // 当前使用类型断言以避免TypeScript错误
  // 实际集成将在Task 3-4完成
  showDialogUI(extendedOptions as Parameters<typeof showDialogUI>[0]);

  console.log('[NPCFeedbackBridge] Diagnosis feedback triggered:', {
    caseId: data.caseId,
    score: formatScoreForNPC(score, data.patientName, data.userAnswers),
  });
}

/**
 * 导出供DiagnosisScene使用
 */
export { calculateDiagnosisScore, formatScoreForNPC };