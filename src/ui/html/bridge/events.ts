// src/ui/html/bridge/events.ts
/**
 * 煎药 UI 桥接事件常量
 *
 * React UI ↔ Phaser DecoctionManager 双向通信
 */

export const DECOCTION_EVENTS = {
  // React → Phaser
  HERB_DROP: 'decoction:herb:drop',
  HERB_DRAG_START: 'decoction:herb:dragstart',
  FIRE_SELECT: 'decoction:fire:select',
  COMPLETE: 'decoction:complete',
  CLOSE: 'decoction:close',

  // Phaser → React
  HERB_RESULT: 'decoction:herb:result',
  SCORE_RESULT: 'decoction:score:result',
  STATE_UPDATE: 'decoction:state:update',
  RESET: 'decoction:reset',
};