// src/systems/ClueTracker.ts
/**
 * 线索追踪系统
 * 功能:
 * - 追踪必须线索(required)和辅助线索(auxiliary)的收集状态
 * - AI语义分析判定线索获取
 * - 必须线索机制：必须线索未收集齐时阻断进入下一环节
 *
 * Phase 2 S4 实现
 */

import { SSEClient } from '../utils/sseClient';

export interface ClueDefinition {
  required: string[];    // 必须线索 - 必须收集齐才能进入下一环节
  auxiliary: string[];   // 辅助线索 - 不强制，收集可获得经验值
}

export interface ClueState {
  clueId: string;
  collected: boolean;
  collectedAt?: number;  // 收集时间戳
  source?: string;       // 来源对话内容片段
}

export interface ClueTrackerConfig {
  caseId: string;
  clues: ClueDefinition;
  playerId: string;
}

export interface ClueAnalysisResult {
  collectedClues: { clueId: string; source: string }[];
  confidence: number;  // AI置信度 0-1
}

export class ClueTracker {
  private caseId: string;
  private clues: ClueDefinition;
  private playerId: string;
  private collectedClues: Map<string, ClueState> = new Map();
  private sseClient: SSEClient;
  private dialogueHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(config: ClueTrackerConfig) {
    this.caseId = config.caseId;
    this.clues = config.clues;
    this.playerId = config.playerId;
    this.sseClient = new SSEClient();

    // 初始化所有线索为未收集状态
    this.initializeClues();
  }

  /**
   * 初始化所有线索状态
   */
  private initializeClues(): void {
    // 初始化必须线索
    for (const clueId of this.clues.required) {
      this.collectedClues.set(clueId, {
        clueId,
        collected: false
      });
    }
    // 初始化辅助线索
    for (const clueId of this.clues.auxiliary) {
      this.collectedClues.set(clueId, {
        clueId,
        collected: false
      });
    }
  }

  /**
   * 添加对话记录
   */
  addDialogue(role: 'user' | 'assistant', content: string): void {
    this.dialogueHistory.push({ role, content });
  }

  /**
   * 获取对话历史
   */
  getDialogueHistory(): { role: 'user' | 'assistant'; content: string }[] {
    return this.dialogueHistory;
  }

  /**
   * AI语义分析线索获取状态
   * 调用Hermes API分析对话内容，判断哪些线索已被收集
   */
  async analyzeClues(): Promise<ClueAnalysisResult> {
    // 构建分析请求
    const allClueIds = [...this.clues.required, ...this.clues.auxiliary];
    const prompt = this.buildAnalysisPrompt(allClueIds);

    try {
      // 发送分析请求到Hermes
      let fullResponse = '';
      await this.sseClient.chatStream(
        {
          npc_id: 'clue_analyzer',
          player_id: this.playerId,
          user_message: prompt
        },
        (chunk) => { fullResponse += chunk; },
        (full) => { fullResponse = full; },
        (error) => { throw error; }
      );

      // 解析响应
      return this.parseAnalysisResponse(fullResponse, allClueIds);
    } catch (error) {
      console.error('[ClueTracker] Analysis error:', error);
      // 返回空结果
      return { collectedClues: [], confidence: 0 };
    }
  }

  /**
   * 构建分析提示
   */
  private buildAnalysisPrompt(clueIds: string[]): string {
    const dialogueText = this.dialogueHistory
      .map(d => `${d.role === 'user' ? '玩家' : '病人'}: ${d.content}`)
      .join('\n');

    return `请分析以下问诊对话，判断以下线索是否已被获取:

对话记录:
${dialogueText}

需要识别的线索:
${clueIds.map(id => `- ${id}`).join('\n')}

请以JSON格式返回分析结果:
{
  "collected_clues": ["线索1", "线索2", ...],
  "confidence": 0.8
}

只返回JSON，不要其他内容。`;
  }

  /**
   * 解析分析响应
   */
  private parseAnalysisResponse(response: string, clueIds: string[]): ClueAnalysisResult {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { collectedClues: [], confidence: 0 };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const collectedClues: { clueId: string; source: string }[] = [];

      // 验证每个收集的线索是否在定义范围内
      for (const clueId of parsed.collected_clues || []) {
        if (clueIds.includes(clueId)) {
          collectedClues.push({
            clueId,
            source: this.findClueSource(clueId)
          });
        }
      }

      return {
        collectedClues,
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      console.error('[ClueTracker] Parse error:', error);
      return { collectedClues: [], confidence: 0 };
    }
  }

  /**
   * 查找线索来源
   */
  private findClueSource(clueId: string): string {
    // 在对话历史中查找包含该线索关键词的片段
    for (const dialogue of this.dialogueHistory) {
      if (dialogue.role === 'assistant') {
        // 简化的关键词匹配
        const keywords = this.getClueKeywords(clueId);
        for (const keyword of keywords) {
          if (dialogue.content.includes(keyword)) {
            return dialogue.content.substring(0, 100);
          }
        }
      }
    }
    return '';
  }

  /**
   * 获取线索关键词（简化版本）
   */
  private getClueKeywords(clueId: string): string[] {
    // 简化关键词映射
    const keywordMap: Record<string, string[]> = {
      '恶寒重': ['怕冷', '恶寒', '冷得很'],
      '无汗': ['无汗', '身上干', '不出汗'],
      '发热轻': ['发热', '发烧', '有点热'],
      '脉浮紧': ['脉', '浮', '紧'],
      '恶风': ['怕风', '恶风'],
      '有汗': ['出汗', '有汗', '汗出'],
      '发热': ['发热', '发烧', '热'],
      '脉浮缓': ['脉', '浮', '缓'],
      '发热重': ['发热重', '高热', '烧得厉害'],
      '咽痛': ['咽痛', '嗓子疼', '喉咙痛'],
      '恶寒轻': ['有点怕冷', '恶寒轻'],
      '脉浮数': ['脉', '浮', '数'],
      '咳嗽': ['咳嗽', '咳'],
      '微恶风': ['微恶风', '有点怕风'],
      '身痛': ['身痛', '身上疼', '浑身疼'],
      '头痛': ['头痛', '头疼'],
      '起病原因': ['昨天', '前天', '冒雨', '吹风'],
      '口渴情况': ['口渴', '渴', '喝水']
    };

    return keywordMap[clueId] || [clueId];
  }

  /**
   * 更新线索状态
   */
  updateClueState(clueId: string, collected: boolean, source?: string): void {
    const existingState = this.collectedClues.get(clueId);
    if (existingState) {
      existingState.collected = collected;
      if (collected) {
        existingState.collectedAt = Date.now();
        existingState.source = source;
      }
    }
  }

  /**
   * 基于分析结果批量更新线索状态
   */
  applyAnalysisResult(result: ClueAnalysisResult): void {
    for (const { clueId, source } of result.collectedClues) {
      this.updateClueState(clueId, true, source);
    }
  }

  /**
   * 检查必须线索是否全部收集完成
   */
  areRequiredCluesComplete(): boolean {
    for (const clueId of this.clues.required) {
      const state = this.collectedClues.get(clueId);
      if (!state || !state.collected) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取必须线索收集进度
   */
  getRequiredCluesProgress(): { collected: number; total: number; percentage: number } {
    let collected = 0;
    const total = this.clues.required.length;

    for (const clueId of this.clues.required) {
      const state = this.collectedClues.get(clueId);
      if (state && state.collected) {
        collected++;
      }
    }

    return {
      collected,
      total,
      percentage: Math.round((collected / total) * 100)
    };
  }

  /**
   * 获取辅助线索收集进度
   */
  getAuxiliaryCluesProgress(): { collected: number; total: number; percentage: number } {
    let collected = 0;
    const total = this.clues.auxiliary.length;

    for (const clueId of this.clues.auxiliary) {
      const state = this.collectedClues.get(clueId);
      if (state && state.collected) {
        collected++;
      }
    }

    return {
      collected,
      total,
      percentage: Math.round((collected / total) * 100)
    };
  }

  /**
   * 获取所有线索状态
   */
  getAllClueStates(): ClueState[] {
    return Array.from(this.collectedClues.values());
  }

  /**
   * 获取必须线索状态
   */
  getRequiredClueStates(): ClueState[] {
    return this.clues.required
      .map(id => this.collectedClues.get(id))
      .filter((state): state is ClueState => state !== undefined);
  }

  /**
   * 获取辅助线索状态
   */
  getAuxiliaryClueStates(): ClueState[] {
    return this.clues.auxiliary
      .map(id => this.collectedClues.get(id))
      .filter((state): state is ClueState => state !== undefined);
  }

  /**
   * 获取未收集的必须线索
   */
  getMissingRequiredClues(): string[] {
    return this.clues.required.filter(clueId => {
      const state = this.collectedClues.get(clueId);
      return !state || !state.collected;
    });
  }

  /**
   * 获取病案ID
   */
  getCaseId(): string {
    return this.caseId;
  }

  /**
   * 获取线索定义
   */
  getClueDefinition(): ClueDefinition {
    return this.clues;
  }

  /**
   * 重置线索状态
   */
  reset(): void {
    this.collectedClues.clear();
    this.dialogueHistory = [];
    this.initializeClues();
  }

  /**
   * 本地语义分析（简化版本，不调用AI）
   * 用于Hermes服务不可用时的备用方案
   */
  localAnalyzeClues(): ClueAnalysisResult {
    const collectedClues: { clueId: string; source: string }[] = [];

    // 遍历所有线索定义
    const allClueIds = [...this.clues.required, ...this.clues.auxiliary];

    for (const clueId of allClueIds) {
      const keywords = this.getClueKeywords(clueId);

      // 在对话历史中查找关键词
      for (const dialogue of this.dialogueHistory) {
        if (dialogue.role === 'assistant') {
          for (const keyword of keywords) {
            if (dialogue.content.includes(keyword)) {
              collectedClues.push({
                clueId,
                source: dialogue.content.substring(0, 100)
              });
              break;
            }
          }
        }
      }
    }

    return {
      collectedClues,
      confidence: 0.7  // 本地分析置信度较低
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
    this.collectedClues.clear();
    this.dialogueHistory = [];
  }
}