// tests/visual_acceptance/screenshot_config.ts

export interface SceneConfig {
  id: string;
  name: string;
  operations: OperationStep[];
  waitForState?: string;
  screenshotCount: number;
}

export interface OperationStep {
  type: 'navigate' | 'move' | 'interact' | 'keypress' | 'click' | 'wait';
  params: Record<string, any>;
  delayAfter?: number;
}

export const SCREENSHOT_SCENES: SceneConfig[] = [
  // 室外场景 (3张)
  {
    id: 'SCENE-01',
    name: '百草镇室外探索',
    operations: [
      { type: 'navigate', params: { scene: 'TitleScene' } },
      { type: 'click', params: { x: 400, y: 350 } },
      { type: 'wait', params: { condition: '__GAME_READY__', timeout: 10000 } },
    ],
    screenshotCount: 3,
  },
  // 室内场景 (6张)
  {
    id: 'SCENE-02',
    name: '青木诊所室内',
    operations: [
      { type: 'navigate', params: { scene: 'ClinicScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 2,
  },
  {
    id: 'SCENE-03',
    name: '老张药园室内',
    operations: [
      { type: 'navigate', params: { scene: 'GardenScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 2,
  },
  {
    id: 'SCENE-04',
    name: '玩家之家室内',
    operations: [
      { type: 'navigate', params: { scene: 'HomeScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 2,
  },
  // NPC对话 (4张)
  {
    id: 'NPC-01',
    name: '与NPC开始对话',
    operations: [
      { type: 'navigate', params: { scene: 'ClinicScene' } },
      { type: 'keypress', params: { key: ' ' }, delayAfter: 500 },
      { type: 'wait', params: { condition: '__DIALOG_ACTIVE__', timeout: 5000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'NPC-02',
    name: 'AI流式输出中',
    operations: [
      { type: 'navigate', params: { scene: 'ClinicScene' } },
      { type: 'keypress', params: { key: ' ' }, delayAfter: 1000 },
      { type: 'wait', params: { condition: '__STREAMING__', timeout: 10000 } },
    ],
    screenshotCount: 2,
  },
  {
    id: 'NPC-03',
    name: '对话历史浏览',
    operations: [
      { type: 'navigate', params: { scene: 'ClinicScene' } },
      { type: 'keypress', params: { key: ' ' }, delayAfter: 500 },
      { type: 'wait', params: { condition: '__DIALOG_ACTIVE__', timeout: 5000 } },
      { type: 'keypress', params: { key: 'ArrowUp' }, delayAfter: 300 },
    ],
    screenshotCount: 1,
  },
  // 问诊流程 (2张)
  {
    id: 'INQUIRY-01',
    name: '问诊主界面',
    operations: [
      { type: 'navigate', params: { scene: 'InquiryScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'INQUIRY-02',
    name: '线索追踪界面',
    operations: [
      { type: 'navigate', params: { scene: 'InquiryScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
      { type: 'keypress', params: { key: 'Tab' }, delayAfter: 500 },
      { type: 'wait', params: { condition: '__CLUE_TRACKER_VISIBLE__', timeout: 5000 } },
    ],
    screenshotCount: 1,
  },
  // 诊治流程 (5张)
  {
    id: 'DIAG-01',
    name: '脉诊界面',
    operations: [
      { type: 'navigate', params: { scene: 'PulseScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'DIAG-02',
    name: '舌诊界面',
    operations: [
      { type: 'navigate', params: { scene: 'TongueScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'DIAG-03',
    name: '辨证界面',
    operations: [
      { type: 'navigate', params: { scene: 'SyndromeScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'DIAG-04',
    name: '选方界面',
    operations: [
      { type: 'navigate', params: { scene: 'PrescriptionScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'DIAG-05',
    name: '评分结果界面',
    operations: [
      { type: 'navigate', params: { scene: 'TitleScene' } },
      { type: 'click', params: { x: 400, y: 350 } },
      { type: 'wait', params: { condition: '__GAME_READY__', timeout: 10000 } },
      { type: 'navigate', params: { scene: 'ClinicScene' } },
      { type: 'keypress', params: { key: ' ' }, delayAfter: 500 },
      { type: 'wait', params: { condition: '__RESULT_UI_VISIBLE__', timeout: 10000 } },
    ],
    screenshotCount: 1,
  },
  // 子游戏 (6张)
  {
    id: 'SUBGAME-01',
    name: '煎药界面',
    operations: [
      { type: 'navigate', params: { scene: 'DecoctionScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 2,
  },
  {
    id: 'SUBGAME-02',
    name: '炮制界面',
    operations: [
      { type: 'navigate', params: { scene: 'ProcessingScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 2,
  },
  {
    id: 'SUBGAME-03',
    name: '种植界面',
    operations: [
      { type: 'navigate', params: { scene: 'PlantingScene' } },
      { type: 'wait', params: { condition: '__SCENE_READY__', timeout: 10000 } },
    ],
    screenshotCount: 2,
  },
  // 系统UI (5张)
  {
    id: 'SYSTEM-01',
    name: '背包界面',
    operations: [
      { type: 'navigate', params: { scene: 'ClinicScene' } },
      { type: 'keypress', params: { key: 'b' }, delayAfter: 500 },
      { type: 'wait', params: { condition: '__INVENTORY_OPEN__', timeout: 5000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'SYSTEM-02',
    name: '存档界面',
    operations: [
      { type: 'keypress', params: { key: 'Escape' }, delayAfter: 500 },
      { type: 'wait', params: { condition: '__SAVE_UI_OPEN__', timeout: 5000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'SYSTEM-03',
    name: '经验值UI',
    operations: [
      { type: 'navigate', params: { scene: 'TitleScene' } },
      { type: 'wait', params: { condition: '__EXPERIENCE_UI_VISIBLE__', timeout: 5000 } },
    ],
    screenshotCount: 1,
  },
  {
    id: 'SYSTEM-04',
    name: '新手引导',
    operations: [
      { type: 'navigate', params: { scene: 'TitleScene' } },
      { type: 'click', params: { x: 400, y: 350 } },
      { type: 'wait', params: { condition: '__TUTORIAL_ACTIVE__', timeout: 10000 } },
    ],
    screenshotCount: 2,
  },
];

export const TOTAL_SCREENSHOT_COUNT = SCREENSHOT_SCENES.reduce(
  (sum, scene) => sum + scene.screenshotCount, 0
);
