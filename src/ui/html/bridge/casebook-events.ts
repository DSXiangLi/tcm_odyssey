// src/ui/html/bridge/casebook-events.ts
/**
 * 病案集 UI 桥接事件常量
 *
 * React UI <-> Phaser CasebookScene 双向通信
 */

export const CASEBOOK_EVENTS = {
  // React -> Phaser
  START_CASE: 'casebook:start_case',    // 开案问诊
  REPLAY_CASE: 'casebook:replay_case',  // 重新参详
  CLOSE: 'casebook:close',              // 关闭病案集

  // Phaser -> React
  RESULT: 'casebook:result',            // 诊断结果返回
  STATE_UPDATE: 'casebook:state:update', // 更新状态
};