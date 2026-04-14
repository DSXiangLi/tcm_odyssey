// src/ui/index.ts
/**
 * UI组件模块导出
 *
 * Phase 2 S3 实现 - DialogUI, StreamingText
 * Phase 2 S5 实现 - CasesListUI, CaseDetailUI
 * Phase 2 S6 实现 - PulseUI, TongueUI, SyndromeUI, PrescriptionUI, ResultUI, NPCFeedbackUI
 * Phase 2 S7 实现 - SaveUI
 * Phase 2 S8 实现 - InventoryUI
 */

export { DialogUI } from './DialogUI';
export type { DialogUIConfig } from './DialogUI';

export { StreamingText } from './StreamingText';
export type { StreamingTextConfig } from './StreamingText';

// Phase 2 S5: 病案系统UI
export { CasesListUI } from './CasesListUI';
export type { CasesListUIConfig } from './CasesListUI';

export { CaseDetailUI } from './CaseDetailUI';
export type { CaseDetailUIConfig } from './CaseDetailUI';

// Phase 2 S6: 诊治系统UI
export { PulseUI } from './PulseUI';
export type { PulseUIConfig } from './PulseUI';

export { TongueUI } from './TongueUI';
export type { TongueUIConfig } from './TongueUI';

export { SyndromeUI } from './SyndromeUI';
export type { SyndromeUIConfig, InfoSummaryData } from './SyndromeUI';

export { PrescriptionUI } from './PrescriptionUI';
export type { PrescriptionUIConfig } from './PrescriptionUI';

export { ResultUI } from './ResultUI';
export type { ResultUIConfig } from './ResultUI';

export { NPCFeedbackUI } from './NPCFeedbackUI';
export type { NPCFeedbackUIConfig } from './NPCFeedbackUI';

// Phase 2 S4: 问诊系统UI（之前遗漏）
export { InquiryUI } from './InquiryUI';
export type { InquiryUIConfig } from './InquiryUI';

// Phase 2 S7: 存档系统UI
export { SaveUI } from './SaveUI';
export type { SaveUIConfig } from './SaveUI';
export { createSaveUI } from './SaveUI';

// Phase 2 S8: 背包系统UI
export { InventoryUI } from './InventoryUI';
export type { InventoryUIConfig, InventoryTabType } from './InventoryUI';
export { createInventoryUI } from './InventoryUI';

// Phase 2 S13: 新手引导UI
export { TutorialUI } from './TutorialUI';
export type { TutorialUIConfig } from './TutorialUI';
export { createCentralTutorialUI, createSceneTipUI } from './TutorialUI';