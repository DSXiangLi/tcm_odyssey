// src/ui/html/bridge/paozhi-events.ts
/**
 * 炮制 UI 桥接事件常量
 *
 * React UI <-> Phaser PaozhiScene 双向通信
 */

export const PAOZHI_EVENTS = {
  // React -> Phaser
  COMPLETE: 'paozhi:complete',      // 炮制完成（携带炮制品信息）
  CLOSE: 'paozhi:close',            // 关闭炮制游戏

  // Phaser -> React
  PAOZHI_ADDED: 'paozhi:added',     // 炮制品已添加到背包
  STATE_UPDATE: 'paozhi:state:update', // 更新状态
  QUEST_UPDATE: 'paozhi:quest:update',  // 更新任务进度
};