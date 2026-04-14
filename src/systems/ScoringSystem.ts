// src/systems/ScoringSystem.ts
/**
 * 评分系统
 * 功能:
 * - 各环节加权评分计算
 * - 辨证论述AI评分
 * - 综合表现评分
 *
 * Phase 2 S6e 实现
 */

import { SSEClient } from '../utils/sseClient';

// 各环节权重
export const SCORING_WEIGHTS = {
  inquiry: 0.15,      // 问诊 15%
  pulse: 0.15,        // 脉诊 15%
  tongue: 0.10,       // 舌诊 10%
  syndrome: 0.30,     // 辨证 30%
  prescription: 0.20, // 选方 20%
  overall: 0.10       // 综合表现 10%
};

// 评分结果结构
export interface StageScore {
  stage: string;
  maxScore: number;
  earnedScore: number;
  percentage: number;
  details: {
    item: string;
    correct: boolean;
    score: number;
  }[];
}

export interface DiagnosisScore {
  total: number;
  maxTotal: number;
  percentage: number;
  stages: {
    inquiry: StageScore;
    pulse: StageScore;
    tongue: StageScore;
    syndrome: StageScore;
    prescription: StageScore;
    overall: StageScore;
  };
  weaknesses: string[];
  strengths: string[];
}

export interface InquiryScoringData {
  requiredCluesCollected: number;
  requiredCluesTotal: number;
  auxiliaryCluesCollected: number;
  auxiliaryCluesTotal: number;
}

export interface PulseScoringData {
  positionCorrect: boolean;
  tensionCorrect: boolean;
  correctPosition: string;
  correctTension: string;
  selectedPosition: string;
  selectedTension: string;
}

export interface TongueScoringData {
  bodyColorCorrect: boolean;
  coatingCorrect: boolean;
  shapeCorrect: boolean;
  moistureCorrect: boolean;
  correctBodyColor: string;
  correctCoating: string;
  correctShape: string;
  correctMoisture: string;
  selectedBodyColor: string;
  selectedCoating: string;
  selectedShape: string;
  selectedMoisture: string;
}

export interface SyndromeScoringData {
  syndromeCorrect: boolean;
  correctSyndrome: string;
  selectedSyndrome: string;
  reasoningText: string;
  reasoningScore?: number;  // AI评分，0-100
}

export interface PrescriptionScoringData {
  prescriptionCorrect: boolean;
  correctPrescription: string;
  selectedPrescription: string;
}

export interface OverallScoringData {
  totalTime: number;       // 总用时（秒）
  clueEfficiency: number;  // 线索收集效率
  errorCount: number;      // 错误次数
}

export class ScoringSystem {
  private sseClient: SSEClient;
  private playerId: string;

  constructor(playerId: string = 'player_001') {
    this.sseClient = new SSEClient();
    this.playerId = playerId;
  }

  /**
   * 计算问诊评分
   * 必须线索收集率 + 辅助线索收集加成
   */
  calculateInquiryScore(data: InquiryScoringData): StageScore {
    const details: { item: string; correct: boolean; score: number }[] = [];

    // 必须线索评分（每个必须线索满分 100/requiredCluesTotal）
    const requiredScorePerClue = 100 / data.requiredCluesTotal;
    let requiredScore = 0;

    for (let i = 0; i < data.requiredCluesTotal; i++) {
      const collected = i < data.requiredCluesCollected;
      const score = collected ? requiredScorePerClue : 0;
      requiredScore += score;
      details.push({
        item: `必须线索${i + 1}`,
        correct: collected,
        score: score
      });
    }

    // 辅助线索加成（每个辅助线索额外5分）
    const auxiliaryBonus = data.auxiliaryCluesCollected * 5;
    for (let i = 0; i < data.auxiliaryCluesTotal; i++) {
      const collected = i < data.auxiliaryCluesCollected;
      details.push({
        item: `辅助线索${i + 1}`,
        correct: collected,
        score: collected ? 5 : 0
      });
    }

    const earnedScore = Math.min(100, requiredScore + auxiliaryBonus);

    return {
      stage: '问诊',
      maxScore: 100,
      earnedScore: earnedScore,
      percentage: earnedScore,
      details
    };
  }

  /**
   * 计算脉诊评分
   * 脉位判断 + 脉势判断
   */
  calculatePulseScore(data: PulseScoringData): StageScore {
    const details: { item: string; correct: boolean; score: number }[] = [];

    // 脉位评分（50分）
    const positionScore = data.positionCorrect ? 50 : 0;
    details.push({
      item: `脉位判断 (${data.selectedPosition})`,
      correct: data.positionCorrect,
      score: positionScore
    });

    // 脉势评分（50分）
    const tensionScore = data.tensionCorrect ? 50 : 0;
    details.push({
      item: `脉势判断 (${data.selectedTension})`,
      correct: data.tensionCorrect,
      score: tensionScore
    });

    const earnedScore = positionScore + tensionScore;

    return {
      stage: '脉诊',
      maxScore: 100,
      earnedScore: earnedScore,
      percentage: earnedScore,
      details
    };
  }

  /**
   * 计算舌诊评分
   * 四个特征各占25分
   */
  calculateTongueScore(data: TongueScoringData): StageScore {
    const details: { item: string; correct: boolean; score: number }[] = [];

    // 舌体颜色（25分）
    const bodyColorScore = data.bodyColorCorrect ? 25 : 0;
    details.push({
      item: `舌体颜色 (${data.selectedBodyColor})`,
      correct: data.bodyColorCorrect,
      score: bodyColorScore
    });

    // 舌苔（25分）
    const coatingScore = data.coatingCorrect ? 25 : 0;
    details.push({
      item: `舌苔 (${data.selectedCoating})`,
      correct: data.coatingCorrect,
      score: coatingScore
    });

    // 舌形（25分）
    const shapeScore = data.shapeCorrect ? 25 : 0;
    details.push({
      item: `舌形 (${data.selectedShape})`,
      correct: data.shapeCorrect,
      score: shapeScore
    });

    // 润燥（25分）
    const moistureScore = data.moistureCorrect ? 25 : 0;
    details.push({
      item: `润燥 (${data.selectedMoisture})`,
      correct: data.moistureCorrect,
      score: moistureScore
    });

    const earnedScore = bodyColorScore + coatingScore + shapeScore + moistureScore;

    return {
      stage: '舌诊',
      maxScore: 100,
      earnedScore: earnedScore,
      percentage: earnedScore,
      details
    };
  }

  /**
   * 计算辨证评分
   * 证型选择（50分） + 论述评分（50分，AI评分）
   */
  calculateSyndromeScore(data: SyndromeScoringData): StageScore {
    const details: { item: string; correct: boolean; score: number }[] = [];

    // 证型评分（50分）
    const syndromeScore = data.syndromeCorrect ? 50 : 0;
    details.push({
      item: `证型选择 (${data.selectedSyndrome})`,
      correct: data.syndromeCorrect,
      score: syndromeScore
    });

    // 论述评分（50分）
    // 如果没有AI评分，使用简化评分逻辑
    const reasoningScore = data.reasoningScore ?? this.calculateReasoningScoreLocal(data);
    details.push({
      item: '论述评分',
      correct: reasoningScore >= 25,  // 一半以上算正确
      score: Math.min(50, reasoningScore)
    });

    const earnedScore = syndromeScore + Math.min(50, reasoningScore);

    return {
      stage: '辨证',
      maxScore: 100,
      earnedScore: earnedScore,
      percentage: earnedScore,
      details
    };
  }

  /**
   * 计算选方评分
   * 方剂选择正确性（满分100）
   */
  calculatePrescriptionScore(data: PrescriptionScoringData): StageScore {
    const details: { item: string; correct: boolean; score: number }[] = [];

    const score = data.prescriptionCorrect ? 100 : 0;
    details.push({
      item: `方剂选择 (${data.selectedPrescription})`,
      correct: data.prescriptionCorrect,
      score: score
    });

    return {
      stage: '选方',
      maxScore: 100,
      earnedScore: score,
      percentage: score,
      details
    };
  }

  /**
   * 计算综合表现评分
   * 操作效率评分
   */
  calculateOverallScore(data: OverallScoringData): StageScore {
    const details: { item: string; correct: boolean; score: number }[] = [];

    // 时间效率评分（满分50，5分钟内满分，超过10分钟0分）
    let timeScore = 50;
    if (data.totalTime > 300) {  // 5分钟
      timeScore = Math.max(0, 50 - (data.totalTime - 300) / 12);
    }
    details.push({
      item: '时间效率',
      correct: timeScore >= 25,
      score: Math.round(timeScore)
    });

    // 线索效率评分（满分30）
    const efficiencyScore = Math.round(data.clueEfficiency * 30);
    details.push({
      item: '线索效率',
      correct: efficiencyScore >= 15,
      score: efficiencyScore
    });

    // 错误次数扣分（满分20，每个错误扣5分）
    const errorScore = Math.max(0, 20 - data.errorCount * 5);
    details.push({
      item: '准确性',
      correct: data.errorCount <= 2,
      score: errorScore
    });

    const earnedScore = Math.round(timeScore) + efficiencyScore + errorScore;

    return {
      stage: '综合表现',
      maxScore: 100,
      earnedScore: earnedScore,
      percentage: earnedScore,
      details
    };
  }

  /**
   * 本地论述评分（简化版本）
   */
  private calculateReasoningScoreLocal(data: SyndromeScoringData): number {
    if (!data.reasoningText || data.reasoningText.length < 10) {
      return 0;
    }

    let score = 25;  // 基础分（只要论述就有基础分）

    // 检查是否包含关键术语
    const keyTerms = ['病机', '证', '表', '寒', '热', '汗', '脉', '舌'];
    for (const term of keyTerms) {
      if (data.reasoningText.includes(term)) {
        score += 5;
      }
    }

    // 论述长度加成
    if (data.reasoningText.length > 50) {
      score += 10;
    }
    if (data.reasoningText.length > 100) {
      score += 5;
    }

    // 如果证型正确，论述加分
    if (data.syndromeCorrect) {
      score += 10;
    }

    return Math.min(50, score);
  }

  /**
   * AI评分论述（调用Hermes）
   */
  async calculateReasoningScoreAI(
    syndromeType: string,
    reasoningText: string,
    correctSyndrome: string
  ): Promise<number> {
    const prompt = `请评分以下辨证论述（0-50分）：

证型选择: ${syndromeType}
正确证型: ${correctSyndrome}

论述内容:
${reasoningText}

评分标准:
- 是否正确识别病机 (0-15分)
- 是否正确关联症状与证型 (0-15分)
- 论述逻辑是否清晰 (0-10分)
- 是否体现辨证思维 (0-10分)

请只返回一个数字（0-50），不要其他内容。`;

    try {
      let fullResponse = '';
      await this.sseClient.chatStream(
        {
          npc_id: 'scorer',
          player_id: this.playerId,
          user_message: prompt
        },
        (chunk) => { fullResponse += chunk; },
        (full) => { fullResponse = full; },
        (error) => { throw error; }
      );

      // 解析数字
      const numberMatch = fullResponse.match(/\d+/);
      if (numberMatch) {
        return Math.min(50, Math.max(0, parseInt(numberMatch[0])));
      }
      return 25;  // 默认中等分数
    } catch (error) {
      console.error('[ScoringSystem] AI scoring error:', error);
      return 25;  // 出错时返回中等分数
    }
  }

  /**
   * 计算综合评分
   */
  calculateTotalScore(
    inquiryScore: StageScore,
    pulseScore: StageScore,
    tongueScore: StageScore,
    syndromeScore: StageScore,
    prescriptionScore: StageScore,
    overallScore: StageScore
  ): DiagnosisScore {
    // 加权计算总分
    const weightedTotal =
      inquiryScore.earnedScore * SCORING_WEIGHTS.inquiry +
      pulseScore.earnedScore * SCORING_WEIGHTS.pulse +
      tongueScore.earnedScore * SCORING_WEIGHTS.tongue +
      syndromeScore.earnedScore * SCORING_WEIGHTS.syndrome +
      prescriptionScore.earnedScore * SCORING_WEIGHTS.prescription +
      overallScore.earnedScore * SCORING_WEIGHTS.overall;

    // 识别薄弱点和优势
    const weaknesses: string[] = [];
    const strengths: string[] = [];

    const stages = [
      { name: '问诊', score: inquiryScore },
      { name: '脉诊', score: pulseScore },
      { name: '舌诊', score: tongueScore },
      { name: '辨证', score: syndromeScore },
      { name: '选方', score: prescriptionScore }
    ];

    for (const stage of stages) {
      if (stage.score.percentage < 60) {
        weaknesses.push(stage.name);
      } else if (stage.score.percentage >= 80) {
        strengths.push(stage.name);
      }
    }

    return {
      total: Math.round(weightedTotal),
      maxTotal: 100,
      percentage: Math.round(weightedTotal),
      stages: {
        inquiry: inquiryScore,
        pulse: pulseScore,
        tongue: tongueScore,
        syndrome: syndromeScore,
        prescription: prescriptionScore,
        overall: overallScore
      },
      weaknesses,
      strengths
    };
  }

  /**
   * 检查Hermes服务是否可用
   */
  async checkConnection(): Promise<boolean> {
    return this.sseClient.checkConnection();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.sseClient.stop();
  }
}