// tests/visual/ai/analyzers/result-judge.ts
import { GLMClient } from '../glm-client';
import { GameLog } from '../utils/log-reader';
import { GameState } from '../utils/state-extractor';

/**
 * 判定结果
 */
export interface JudgmentResult {
  passed: boolean;
  judgmentType: 'hard' | 'soft' | 'visual';
  confidence: number;
  evidence: {
    stateVerification?: string;
    logValidation?: string;
    screenshotAnalysis?: string;
  };
  conclusion: string;
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  type: 'state' | 'log' | 'screenshot';
  passed: boolean;
  details: string;
  confidence: number;
}

/**
 * 测试用例
 */
export interface TestCase {
  id: string;
  name: string;
  category: string;
  judgmentType: 'hard' | 'soft' | 'visual';
  expectedValue?: unknown;
  tolerance?: number;
}

/**
 * 结果判定器
 */
export class ResultJudge {
  private glmClient: GLMClient;

  constructor() {
    this.glmClient = new GLMClient();
  }

  /**
   * 硬性判定 - 必须100%匹配
   */
  hardJudge(actual: unknown, expected: unknown): JudgmentResult {
    const passed = actual === expected;
    return {
      passed,
      judgmentType: 'hard',
      confidence: passed ? 1.0 : 0,
      evidence: {
        stateVerification: `期望: ${expected}, 实际: ${actual}`
      },
      conclusion: passed ? '硬性标准验证通过' : '硬性标准验证失败'
    };
  }

  /**
   * 软性判定 - 允许误差范围
   */
  softJudge(actual: number, expected: number, tolerance: number = 0.05): JudgmentResult {
    const diff = Math.abs(actual - expected);
    const maxDiff = expected * tolerance;
    const passed = diff <= maxDiff;

    return {
      passed,
      judgmentType: 'soft',
      confidence: passed ? 1 - (diff / maxDiff) : 0,
      evidence: {
        stateVerification: `期望: ${expected} ±${(tolerance * 100)}%, 实际: ${actual}`
      },
      conclusion: passed
        ? `软性标准验证通过，误差: ${(diff / expected * 100).toFixed(2)}%`
        : `软性标准验证失败，误差超出范围: ${(diff / expected * 100).toFixed(2)}%`
    };
  }

  /**
   * 视觉阈值判定 - 置信度≥80%
   */
  visualJudge(confidence: number, threshold: number = 0.8): JudgmentResult {
    const passed = confidence >= threshold;
    return {
      passed,
      judgmentType: 'visual',
      confidence,
      evidence: {
        screenshotAnalysis: `AI分析置信度: ${(confidence * 100).toFixed(1)}%`
      },
      conclusion: passed
        ? `视觉验证通过，置信度: ${(confidence * 100).toFixed(1)}%`
        : `视觉验证失败，置信度不足: ${(confidence * 100).toFixed(1)}% < ${(threshold * 100)}%`
    };
  }

  /**
   * 日志验证
   */
  logJudge(logs: GameLog[], expectedEvents: string[]): JudgmentResult {
    const foundEvents = expectedEvents.filter(event =>
      logs.some(log => log.event === event)
    );
    const passed = foundEvents.length === expectedEvents.length;

    return {
      passed,
      judgmentType: 'hard',
      confidence: passed ? 1.0 : foundEvents.length / expectedEvents.length,
      evidence: {
        logValidation: `预期事件: ${expectedEvents.join(', ')}, 找到: ${foundEvents.join(', ')}`
      },
      conclusion: passed
        ? '日志验证通过，所有预期事件均已记录'
        : `日志验证失败，缺少事件: ${expectedEvents.filter(e => !foundEvents.includes(e)).join(', ')}`
    };
  }

  /**
   * 综合判定
   */
  async judge(
    testCase: TestCase,
    stateResult: AnalysisResult | null,
    logResult: AnalysisResult | null,
    screenshotResult: AnalysisResult | null
  ): Promise<JudgmentResult> {
    // 根据判定类型选择主要判定方式
    switch (testCase.judgmentType) {
      case 'hard':
        if (stateResult) {
          return this.hardJudge(stateResult.passed, true);
        }
        break;

      case 'soft':
        if (stateResult) {
          return this.softJudge(
            parseFloat(stateResult.details) || 0,
            testCase.expectedValue as number || 0,
            testCase.tolerance || 0.05
          );
        }
        break;

      case 'visual':
        if (screenshotResult) {
          return this.visualJudge(screenshotResult.confidence);
        }
        break;
    }

    // 默认返回失败
    return {
      passed: false,
      judgmentType: testCase.judgmentType,
      confidence: 0,
      evidence: {},
      conclusion: '无法完成判定：缺少必要数据'
    };
  }
}

export const resultJudge = new ResultJudge();