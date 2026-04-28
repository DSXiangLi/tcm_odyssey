// src/ui/html/bridge/diagnosis-events.ts
/**
 * 诊断 UI 桥接事件常量
 *
 * React UI ↔ Phaser DiagnosisScene 双向通信
 *
 * 创建日期: 2026-04-28
 */

export const DIAGNOSIS_EVENTS = {
  // React → Phaser
  START: 'diagnosis:start',        // 开始诊断（携带 caseId）
  COMPLETE: 'diagnosis:complete',  // 诊断完成（携带结果）
  CLOSE: 'diagnosis:close',        // 关闭诊断游戏

  // Phaser → React
  CASE_UPDATE: 'diagnosis:case:update',  // 更新病案数据
  STATE_UPDATE: 'diagnosis:state:update', // 更新诊断状态
  RESET: 'diagnosis:reset',               // 重置诊断流程
};