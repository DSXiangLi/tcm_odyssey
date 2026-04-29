// src/systems/NPCInteraction.ts
/**
 * NPC交互系统
 * 管理: NPC触发、对话流程、记忆同步
 *
 * Phase 2 S3 实现
 */

import { SSEClient, ToolCallCallback } from '../utils/sseClient';

export interface NPCConfig {
  id: string;
  name: string;
  sceneId: string;  // 所在场景
  position: { x: number; y: number };
  triggerDistance: number;  // 触发距离
}

export interface NPCInteractionEvent {
  type: 'enter' | 'dialog' | 'leave';
  npcId: string;
  playerId: string;
  timestamp: number;
}

export class NPCInteractionSystem {
  private npcs: Map<string, NPCConfig> = new Map();
  private sseClient: SSEClient;
  private playerId: string;
  private eventHistory: NPCInteractionEvent[] = [];
  private currentDialogNpcId: string | null = null;
  private nearbyNpc: NPCConfig | null = null;

  constructor(playerId: string) {
    this.playerId = playerId;
    this.sseClient = new SSEClient();
  }

  /**
   * 注册NPC
   */
  registerNPC(config: NPCConfig): void {
    this.npcs.set(config.id, config);
  }

  /**
   * 获取NPC配置
   */
  getNPCConfig(npcId: string): NPCConfig | undefined {
    return this.npcs.get(npcId);
  }

  /**
   * 获取所有NPC配置
   */
  getAllNPCs(): NPCConfig[] {
    return Array.from(this.npcs.values());
  }

  /**
   * 检查NPC触发
   */
  checkTrigger(playerPosition: { x: number; y: number }, currentScene: string): NPCConfig | null {
    for (const npc of this.npcs.values()) {
      if (npc.sceneId !== currentScene) continue;

      const distance = Math.sqrt(
        Math.pow(playerPosition.x - npc.position.x, 2) +
        Math.pow(playerPosition.y - npc.position.y, 2)
      );

      if (distance <= npc.triggerDistance) {
        return npc;
      }
    }
    return null;
  }

  /**
   * 检查附近NPC触发（用于提示显示）
   */
  checkNearbyTrigger(
    playerPosition: { x: number; y: number },
    currentScene: string
  ): NPCConfig | null {
    this.nearbyNpc = null;

    for (const npc of this.npcs.values()) {
      if (npc.sceneId !== currentScene) continue;

      const distance = Math.sqrt(
        Math.pow(playerPosition.x - npc.position.x, 2) +
        Math.pow(playerPosition.y - npc.position.y, 2)
      );

      if (distance <= npc.triggerDistance) {
        this.nearbyNpc = npc;
        return npc;
      }
    }

    return null;
  }

  /**
   * 获取附近NPC
   */
  getNearbyNPC(): NPCConfig | null {
    return this.nearbyNpc;
  }

  /**
   * 获取触发提示文本
   */
  getTriggerHint(npcId: string): string {
    const npc = this.npcs.get(npcId);
    if (!npc) return '';
    return `按空格与${npc.name}对话`;
  }

  /**
   * 发送消息给NPC
   */
  async sendNPCMessage(
    npcId: string,
    message: string,
    onChunk: (text: string) => void
  ): Promise<string> {
    // 记录事件
    this.eventHistory.push({
      type: 'dialog',
      npcId,
      playerId: this.playerId,
      timestamp: Date.now()
    });

    this.currentDialogNpcId = npcId;

    // 获取响应
    let fullResponse = '';
    await this.sseClient.chatStream(
      {
        npc_id: npcId,
        player_id: this.playerId,
        user_message: message
      },
      onChunk,
      (full) => { fullResponse = full; },
      (error) => { throw error; }
    );

    this.currentDialogNpcId = null;
    return fullResponse;
  }

  /**
   * 发送消息给NPC（支持工具调用回调）
   */
  async sendNPCMessageWithTools(
    npcId: string,
    message: string,
    onChunk: (text: string) => void,
    onToolCall?: ToolCallCallback
  ): Promise<string> {
    // 记录事件
    this.eventHistory.push({
      type: 'dialog',
      npcId,
      playerId: this.playerId,
      timestamp: Date.now()
    });

    this.currentDialogNpcId = npcId;

    let fullResponse = '';
    await this.sseClient.chatStream(
      {
        npc_id: npcId,
        player_id: this.playerId,
        user_message: message
      },
      onChunk,
      (full) => { fullResponse = full; },
      (error) => { throw error; },
      onToolCall
    );

    this.currentDialogNpcId = null;
    return fullResponse;
  }

  /**
   * 停止当前对话
   */
  stopCurrentDialog(): void {
    if (this.currentDialogNpcId) {
      this.sseClient.stop();
      this.currentDialogNpcId = null;
    }
  }

  /**
   * 记录进入场景
   */
  recordEnter(npcId: string): void {
    this.eventHistory.push({
      type: 'enter',
      npcId,
      playerId: this.playerId,
      timestamp: Date.now()
    });
  }

  /**
   * 记录离开场景
   */
  recordLeave(npcId: string): void {
    this.eventHistory.push({
      type: 'leave',
      npcId,
      playerId: this.playerId,
      timestamp: Date.now()
    });
  }

  /**
   * 获取交互历史
   */
  getHistory(): NPCInteractionEvent[] {
    return this.eventHistory;
  }

  /**
   * 清空交互历史
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 获取当前对话状态
   */
  isDialogActive(): boolean {
    return this.currentDialogNpcId !== null;
  }

  /**
   * 获取当前对话NPC ID
   */
  getCurrentDialogNpcId(): string | null {
    return this.currentDialogNpcId;
  }

  /**
   * 检查SSE连接状态
   */
  async checkConnection(): Promise<boolean> {
    return this.sseClient.checkConnection();
  }

  /**
   * 销毁系统
   */
  destroy(): void {
    this.sseClient.stop();
    this.npcs.clear();
    this.eventHistory = [];
    this.currentDialogNpcId = null;
  }
}