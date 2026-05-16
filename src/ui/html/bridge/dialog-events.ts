// src/ui/html/bridge/dialog-events.ts
/**
 * 对话UI桥接事件常量
 * React DialogUI ↔ Phaser Scene 双向通信
 */

export const DIALOG_EVENTS = {
  // React → Phaser
  TOOL_CALL: 'dialog:tool:call',      // NPC触发工具调用
  CLOSE: 'dialog:close',              // 关闭对话UI
};

export interface DialogToolCallEvent {
  name: string;
  args: Record<string, unknown>;
}

export interface DialogMessage {
  role: 'npc' | 'player' | 'narration' | 'system';
  name?: string;
  title?: string;
  mood?: string;
  text: string;
  timestamp?: number;
}