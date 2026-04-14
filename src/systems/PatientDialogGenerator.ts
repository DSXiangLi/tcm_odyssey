// src/systems/PatientDialogGenerator.ts
/**
 * 病人对话生成器
 * 功能:
 * - 根据病人模板(template)和病案(case)生成对话
 * - 支持5种病人模板: farmer/merchant/scholar/elder/child
 * - 生成符合说话风格的主诉和追问回答
 *
 * Phase 2 S4 实现
 */

import { SSEClient } from '../utils/sseClient';

// 病人模板结构
export interface PatientTemplate {
  template_id: string;
  occupation: string;
  speaking_style: string;
  age_range: [number, number];
  example_phrases: {
    greeting: string;
    complaint_intro: string;
    pain_description: string;
    cold_description?: string;
    heat_description?: string;
  };
  possible_contexts?: string[];
}

// 病案信息（简化版本）
export interface CaseInfo {
  case_id: string;
  syndrome: {
    type: string;
    category: string;
  };
  chief_complaint_template: string;
  clues: {
    required: string[];
    auxiliary: string[];
  };
}

export interface PatientDialogConfig {
  template: PatientTemplate;
  caseInfo: CaseInfo;
  playerId: string;
  patientName: string;
  patientAge: number;
}

export interface DialogResponse {
  text: string;
  revealedClues: string[];  // 该回答中揭示的线索
}

export class PatientDialogGenerator {
  private template: PatientTemplate;
  private caseInfo: CaseInfo;
  private playerId: string;
  private patientName: string;
  private patientAge: number;
  private sseClient: SSEClient;
  private dialogueHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(config: PatientDialogConfig) {
    this.template = config.template;
    this.caseInfo = config.caseInfo;
    this.playerId = config.playerId;
    this.patientName = config.patientName;
    this.patientAge = config.patientAge;
    this.sseClient = new SSEClient();
  }

  /**
   * 生成初始主诉（病人进门时说的话）
   */
  async generateChiefComplaint(
    onChunk: (text: string) => void,
    onComplete: (response: DialogResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const prompt = this.buildChiefComplaintPrompt();

    let fullResponse = '';
    await this.sseClient.chatStream(
      {
        npc_id: `patient_${this.template.template_id}`,
        player_id: this.playerId,
        user_message: prompt
      },
      (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      },
      (full) => {
        fullResponse = full;
        this.dialogueHistory.push({ role: 'assistant', content: fullResponse });
        const revealedClues = this.extractRevealedClues(fullResponse);
        onComplete({ text: fullResponse, revealedClues });
      },
      (error) => onError(error)
    );
  }

  /**
   * 生成追问回答
   */
  async generateFollowUpResponse(
    playerQuestion: string,
    onChunk: (text: string) => void,
    onComplete: (response: DialogResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    // 记录玩家问题
    this.dialogueHistory.push({ role: 'user', content: playerQuestion });

    const prompt = this.buildFollowUpPrompt(playerQuestion);

    let fullResponse = '';
    await this.sseClient.chatStream(
      {
        npc_id: `patient_${this.template.template_id}`,
        player_id: this.playerId,
        user_message: prompt
      },
      (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      },
      (full) => {
        fullResponse = full;
        this.dialogueHistory.push({ role: 'assistant', content: fullResponse });
        const revealedClues = this.extractRevealedClues(fullResponse);
        onComplete({ text: fullResponse, revealedClues });
      },
      (error) => onError(error)
    );
  }

  /**
   * 构建主诉提示
   */
  private buildChiefComplaintPrompt(): string {
    const phrases = this.template.example_phrases;
    const contexts = this.template.possible_contexts || [];

    // 从病案主诉模板提取关键信息
    const chiefComplaint = this.caseInfo.chief_complaint_template;

    return `你现在是一个病人，来到诊所看病。

病人信息:
- 姓名: ${this.patientName}
- 职业: ${this.template.occupation}
- 年龄: ${this.patientAge}岁
- 说话风格: ${this.template.speaking_style}

病情背景（请根据这个生成描述）:
- 主诉模板: ${chiefComplaint}
- 可能的发病场景: ${contexts.join(', ')}

说话示例（请参考这种风格）:
- 进门问候: "${phrases.greeting}"
- 症状描述开头: "${phrases.complaint_intro}"
- 疼痛描述: "${phrases.pain_description}"

请用病人的说话风格，描述你今天来看病的原因（主诉）。
要求:
1. 使用符合${this.template.occupation}职业特点的语言
2. 自然描述症状，不要过于专业
3. 大约100-150字

直接开始说话，不要加任何解释或引言。`;
  }

  /**
   * 构建追问提示
   */
  private buildFollowUpPrompt(playerQuestion: string): string {
    // 构建对话历史上下文
    const historyContext = this.dialogueHistory
      .slice(-4)  // 最近4轮对话
      .map(d => `${d.role === 'user' ? '大夫问' : '病人答'}: ${d.content}`)
      .join('\n');

    // 提取病案中需要揭示的线索（排除已揭示的）
    const allClues = [...this.caseInfo.clues.required, ...this.caseInfo.clues.auxiliary];
    const revealedClues = this.getAllRevealedClues();
    const remainingClues = allClues.filter(c => !revealedClues.includes(c));

    return `你是病人${this.patientName}（${this.template.occupation}，${this.patientAge}岁），正在和大夫问诊。

对话历史:
${historyContext}

大夫刚才问: "${playerQuestion}"

你需要回答的问题。回答要求:
1. 用${this.template.speaking_style}的风格回答
2. 自然、真实，不要过于专业
3. 如果问题涉及以下信息，可以在回答中自然透露:
   - 可揭示的线索: ${remainingClues.slice(0, 3).join(', ')}
4. 如果问题不相关，如实回答不知道或不记得

请直接回答，大约50-100字。`;
  }

  /**
   * 从回答中提取已揭示的线索
   */
  private extractRevealedClues(response: string): string[] {
    const allClues = [...this.caseInfo.clues.required, ...this.caseInfo.clues.auxiliary];
    const revealed: string[] = [];

    // 线索关键词映射
    const clueKeywords: Record<string, string[]> = {
      '恶寒重': ['怕冷', '恶寒', '冷得很', '裹了棉袄还是冷'],
      '无汗': ['无汗', '身上干', '不出汗', '一点汗都没有', '身上干干的'],
      '发热轻': ['有点热', '发热', '发烧', '体温有点高'],
      '脉浮紧': [],  // 脉象不在问诊环节揭示
      '恶风': ['怕风', '恶风', '风吹不舒服'],
      '有汗': ['出汗', '有汗', '汗出', '身上湿'],
      '发热': ['发热', '发烧', '热'],
      '脉浮缓': [],  // 脉象不在问诊环节揭示
      '发热重': ['高热', '烧得厉害', '发热重', '体温很高'],
      '咽痛': ['咽痛', '嗓子疼', '喉咙痛', '嗓子不舒服'],
      '恶寒轻': ['有点怕冷', '轻微怕冷', '恶寒轻'],
      '脉浮数': [],  // 脉象不在问诊环节揭示
      '咳嗽': ['咳嗽', '咳', '咳得'],
      '微恶风': ['有点怕风', '微风', '微恶风'],
      '身痛': ['身痛', '身上疼', '浑身疼', '身体疼'],
      '头痛': ['头痛', '头疼', '头疼'],
      '起病原因': ['昨天', '前天', '冒雨', '吹风', '淋雨'],
      '口渴情况': ['口渴', '渴', '想喝水', '不渴', '喝水']
    };

    for (const clueId of allClues) {
      const keywords = clueKeywords[clueId] || [];
      for (const keyword of keywords) {
        if (response.includes(keyword)) {
          revealed.push(clueId);
          break;
        }
      }
    }

    return revealed;
  }

  /**
   * 获取所有已揭示的线索
   */
  private getAllRevealedClues(): string[] {
    const allRevealed: string[] = [];
    for (const dialogue of this.dialogueHistory) {
      if (dialogue.role === 'assistant') {
        const revealed = this.extractRevealedClues(dialogue.content);
        allRevealed.push(...revealed);
      }
    }
    return [...new Set(allRevealed)];  // 去重
  }

  /**
   * 获取对话历史
   */
  getDialogueHistory(): { role: 'user' | 'assistant'; content: string }[] {
    return this.dialogueHistory;
  }

  /**
   * 生成本地主诉（备用方案，当Hermes不可用时）
   */
  generateLocalChiefComplaint(): DialogResponse {
    const phrases = this.template.example_phrases;
    const chiefComplaint = this.caseInfo.chief_complaint_template;

    // 基于模板和主诉模板拼接简单的主诉
    const localText = `${phrases.greeting}

${phrases.complaint_intro}${chiefComplaint}。

${phrases.pain_description || ''}`;

    this.dialogueHistory.push({ role: 'assistant', content: localText });
    const revealedClues = this.extractRevealedClues(localText);

    return { text: localText, revealedClues };
  }

  /**
   * 生成本地追问回答（备用方案）
   */
  generateLocalFollowUpResponse(playerQuestion: string): DialogResponse {
    this.dialogueHistory.push({ role: 'user', content: playerQuestion });

    // 简化的关键词匹配回答
    const allClues = [...this.caseInfo.clues.required, ...this.caseInfo.clues.auxiliary];
    const revealedClues = this.getAllRevealedClues();
    const remainingClues = allClues.filter(c => !revealedClues.includes(c));

    // 根据问题类型生成简单回答
    let responseText = '';

    if (playerQuestion.includes('冷') || playerQuestion.includes('热')) {
      if (remainingClues.includes('恶寒重')) {
        responseText = `${this.template.example_phrases.cold_description || '冷得很，一直打哆嗦。'}`;
      } else if (remainingClues.includes('发热轻')) {
        responseText = '有点热，但不厉害。';
      }
    } else if (playerQuestion.includes('汗')) {
      if (remainingClues.includes('无汗')) {
        responseText = '身上一点汗都没有，干干的。';
      } else if (remainingClues.includes('有汗')) {
        responseText = '有点出汗，身上湿湿的。';
      }
    } else if (playerQuestion.includes('疼') || playerQuestion.includes('痛')) {
      if (remainingClues.includes('身痛')) {
        responseText = `${this.template.example_phrases.pain_description}`;
      } else if (remainingClues.includes('头痛')) {
        responseText = '头疼，像戴了个帽子似的。';
      }
    } else {
      responseText = `这个嘛，${this.template.speaking_style === '朴实直白' ? '我也不太清楚，您再问问。' : '容我想想...'}`;
    }

    this.dialogueHistory.push({ role: 'assistant', content: responseText });
    const revealed = this.extractRevealedClues(responseText);

    return { text: responseText, revealedClues: revealed };
  }

  /**
   * 检查Hermes服务是否可用
   */
  async checkConnection(): Promise<boolean> {
    return this.sseClient.checkConnection();
  }

  /**
   * 停止生成
   */
  stopGeneration(): void {
    this.sseClient.stop();
  }

  /**
   * 获取病人信息
   */
  getPatientInfo(): { name: string; age: number; occupation: string; templateId: string } {
    return {
      name: this.patientName,
      age: this.patientAge,
      occupation: this.template.occupation,
      templateId: this.template.template_id
    };
  }

  /**
   * 获取病案信息
   */
  getCaseInfo(): CaseInfo {
    return this.caseInfo;
  }

  /**
   * 重置
   */
  reset(): void {
    this.dialogueHistory = [];
    this.sseClient.stop();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.sseClient.stop();
    this.dialogueHistory = [];
  }
}