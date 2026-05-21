// src/utils/DiagnosisScorer.ts
/**
 * 诊断评分计算器
 *
 * 功能：对比用户诊断结果与正确答案，计算各阶段得分
 * 权重：舌诊20% + 脉诊20% + 辨证40% + 选方20%（问诊不计分）
 */

import type { DiagnosisResult } from '../ui/html/DiagnosisUI';
import type { DiagnosisCase } from '../ui/html/data/diagnosis-cases';

export interface DiagnosisScoreResult {
  totalScore: number;           // 总分（0-100）
  breakdown: {
    tongue: { score: number; errors: string[] };    // 舌诊评分（满分20）
    pulse: { score: number; errors: string[] };     // 脉诊评分（满分20）
    syndrome: { score: number; errors: string[] };  // 辨证评分（满分40）
    prescription: { score: number; errors: string[] }; // 选方评分（满分20）
  };
  overallErrors: string[];      // 主要错误汇总（用于NPC点评）
}

/**
 * 计算诊断评分
 * @param userResult 用户诊断结果（从DiagnosisUI state获取）
 * @param correctCase 原始病案正确答案（从DiagnosisScene.caseData获取）
 */
export function calculateDiagnosisScore(
  userResult: DiagnosisResult,
  correctCase: DiagnosisCase
): DiagnosisScoreResult {
  const tongueResult = scoreTongue(userResult.diagnosis.tongue, correctCase.tongue.correct);
  const pulseResult = scorePulse(userResult.diagnosis.pulse, correctCase.pulse.correct);
  const syndromeResult = scoreSyndrome(userResult.diagnosis.syndrome, correctCase.bianzheng.options);
  const prescriptionResult = scorePrescription(userResult.diagnosis.prescription, correctCase.fang.options);

  const totalScore = tongueResult.score + pulseResult.score + syndromeResult.score + prescriptionResult.score;

  const overallErrors: string[] = [];
  if (tongueResult.errors.length > 0) overallErrors.push(`舌诊: ${tongueResult.errors.join(', ')}`);
  if (pulseResult.errors.length > 0) overallErrors.push(`脉诊: ${pulseResult.errors.join(', ')}`);
  if (syndromeResult.errors.length > 0) overallErrors.push(`辨证: ${syndromeResult.errors.join(', ')}`);
  if (prescriptionResult.errors.length > 0) overallErrors.push(`选方: ${prescriptionResult.errors.join(', ')}`);

  return {
    totalScore,
    breakdown: {
      tongue: tongueResult,
      pulse: pulseResult,
      syndrome: syndromeResult,
      prescription: prescriptionResult
    },
    overallErrors
  };
}

/**
 * 评分权重：
 * - 舌诊 20分（舌色5+舌苔5+舌型5+润燥5）
 * - 脉诊 20分（脉位10+脉势10）
 * - 辨证 40分（正确证型全选得分，部分得分）
 * - 选方 20分（正确方剂全选得分，部分得分）
 */

function scoreTongue(
  user: { color?: string; coating?: string; shape?: string; moisture?: string },
  correct: { color: string; coating: string; shape: string; moisture: string }
): { score: number; errors: string[] } {
  let score = 0;
  const errors: string[] = [];

  if (user.color === correct.color) score += 5;
  else errors.push(`舌色应为'${correct.color}'而非'${user.color || '未选'}'`);

  if (user.coating === correct.coating) score += 5;
  else errors.push(`舌苔应为'${correct.coating}'而非'${user.coating || '未选'}'`);

  if (user.shape === correct.shape) score += 5;
  else errors.push(`舌型应为'${correct.shape}'而非'${user.shape || '未选'}'`);

  if (user.moisture === correct.moisture) score += 5;
  else errors.push(`润燥应为'${correct.moisture}'而非'${user.moisture || '未选'}'`);

  return { score, errors };
}

function scorePulse(
  user: { position?: string; quality?: string },
  correct: { position: string; quality: string }
): { score: number; errors: string[] } {
  let score = 0;
  const errors: string[] = [];

  if (user.position === correct.position) score += 10;
  else errors.push(`脉位应为'${correct.position}'而非'${user.position || '未选'}'`);

  if (user.quality === correct.quality) score += 10;
  else errors.push(`脉势应为'${correct.quality}'而非'${user.quality || '未选'}'`);

  return { score, errors };
}

function scoreSyndrome(
  userSelected: string[],
  options: { id: string; label: string; correct: boolean }[]
): { score: number; errors: string[] } {
  const correctOptions = options.filter(o => o.correct);
  const correctIds = correctOptions.map(o => o.id);

  // 完全匹配得满分40分
  const allCorrectSelected = correctIds.every(id => userSelected.includes(id));
  const noWrongSelected = userSelected.every(id => options.find(o => o.id === id)?.correct);

  if (allCorrectSelected && noWrongSelected) {
    return { score: 40, errors: [] };
  }

  // 部分得分：每个正确选项10分，错误选项扣分
  let score = 0;
  const errors: string[] = [];

  correctIds.forEach(id => {
    if (userSelected.includes(id)) score += 10;
  });

  // 遗漏正确选项
  const missed = correctIds.filter(id => !userSelected.includes(id));
  if (missed.length > 0) {
    const missedLabels = missed.map(id => options.find(o => o.id === id)?.label);
    errors.push(`遗漏'${missedLabels.join("', '")}'证型`);
  }

  // 选择了错误选项
  const wrong = userSelected.filter(id => !options.find(o => o.id === id)?.correct);
  if (wrong.length > 0) {
    const wrongLabels = wrong.map(id => options.find(o => o.id === id)?.label);
    errors.push(`错误选择'${wrongLabels.join("', '")}'证型`);
  }

  return { score: Math.max(0, score), errors };
}

function scorePrescription(
  userSelected: string[],
  options: { id: string; name: string; correct: boolean }[]
): { score: number; errors: string[] } {
  const correctOptions = options.filter(o => o.correct);
  const correctIds = correctOptions.map(o => o.id);

  // 完全匹配得满分20分
  const allCorrectSelected = correctIds.every(id => userSelected.includes(id));
  const noWrongSelected = userSelected.every(id => options.find(o => o.id === id)?.correct);

  if (allCorrectSelected && noWrongSelected) {
    return { score: 20, errors: [] };
  }

  // 部分得分
  let score = 0;
  const errors: string[] = [];

  correctIds.forEach(id => {
    if (userSelected.includes(id)) score += 10;
  });

  const missed = correctIds.filter(id => !userSelected.includes(id));
  if (missed.length > 0) {
    const missedNames = missed.map(id => options.find(o => o.id === id)?.name);
    errors.push(`应选'${missedNames.join("', '")}'配合`);
  }

  const wrong = userSelected.filter(id => !options.find(o => o.id === id)?.correct);
  if (wrong.length > 0) {
    const wrongNames = wrong.map(id => options.find(o => o.id === id)?.name);
    errors.push(`不应选'${wrongNames.join("', '")}'`);
  }

  return { score: Math.max(0, Math.min(20, score)), errors };
}

/**
 * 格式化评分结果为NPC可理解的prompt
 */
export function formatScoreForNPC(
  result: DiagnosisScoreResult,
  patientName: string,
  userAnswers: DiagnosisResult
): string {
  const scoreLevel = result.totalScore >= 90 ? '优秀'
    : result.totalScore >= 70 ? '良好'
    : result.totalScore >= 60 ? '合格'
    : '需加强';

  const tongueStatus = result.breakdown.tongue.errors.length === 0
    ? '正确'
    : '错误：' + result.breakdown.tongue.errors.join(', ');

  const pulseStatus = result.breakdown.pulse.errors.length === 0
    ? '正确'
    : '错误：' + result.breakdown.pulse.errors.join(', ');

  const syndromeStatus = result.breakdown.syndrome.errors.length === 0
    ? '正确'
    : '错误：' + result.breakdown.syndrome.errors.join(', ');

  const prescriptionStatus = result.breakdown.prescription.errors.length === 0
    ? '正确'
    : '错误：' + result.breakdown.prescription.errors.join(', ');

  const userSyndrome = userAnswers.diagnosis.syndrome.join(', ') || '未选';
  const userPrescription = userAnswers.diagnosis.prescription.join(', ') || '未选';

  return `[诊断结果反馈请求]
患者：${patientName}
评分：${result.totalScore}分（${scoreLevel}）
详情：
- 舌诊：${result.breakdown.tongue.score}分（${tongueStatus}）
- 脉诊：${result.breakdown.pulse.score}分（${pulseStatus}）
- 辨证：${result.breakdown.syndrome.score}分（${syndromeStatus}）
- 选方：${result.breakdown.prescription.score}分（${prescriptionStatus}）

用户答案：${userSyndrome}, 选方${userPrescription}

请按feedback-evaluation技能标准给出点评，评分等级为${result.totalScore >= 90 ? '90分以上（优秀）' : result.totalScore >= 70 ? '70-89分（良好）' : result.totalScore >= 60 ? '60-69分（合格）' : '低于60分（需加强）'}。`;
}