# 脉诊游戏设计文档

**版本**: v1.0
**日期**: 2026-04-19
**状态**: 设计阶段
**所属场景**: PulseScene
**关联NPC**: 青木先生

---

## 一、游戏概述

### 1.1 游戏定位

脉诊是中医诊断流程的第二环节（问诊→脉诊→舌诊→辨证→选方），玩家通过观察脉象描述，判断脉位和脉势，为辨证提供关键信息。

### 1.2 核心玩法

| 玩法要素 | 描述 |
|---------|------|
| **学习目标** | 掌握28种常见脉象的特征与临床意义 |
| **操作方式** | 根据古文描述选择脉位(浮沉迟数虚实)和脉势(紧缓滑涩弦濡) |
| **难度设计** | 初级(2选项)→中级(4选项)→高级(6选项) |
| **反馈机制** | 选择正确显示解析，选择错误显示正确答案+解释 |

### 1.3 游戏时长

- 单次脉诊: 30-60秒
- 完整流程(含教学): 2-3分钟

---

## 二、与其他游戏关联

### 2.1 上游依赖

| 来源游戏 | 数据依赖 | 说明 |
|---------|---------|------|
| **问诊(Inquiry)** | clueData.symptoms | 问诊获取的症状可提示脉象特征 |
| **病案数据(core_cases)** | caseData.pulse | 正确答案来自病案定义 |

### 2.2 下游输出

| 输出数据 | 目标游戏 | 说明 |
|---------|---------|------|
| pulsePosition: string | 舌诊(Tongue) | 舌诊显示脉诊结果参考 |
| pulseTension: string | 辨证(Syndrome) | 辨证时显示已判断的脉象 |
| pulseCorrect: boolean | DiagnosisFlowManager | 记录脉诊正确性 |

### 2.3 数据流向图

```
问诊(Inquiry)                     病案数据(core_cases)
     │                                  │
     │ clueData.symptoms                │ caseData.pulse
     │ (症状提示)                        │ (正确答案)
     ▼                                  ▼
┌─────────────────────────────────────────────┐
│              脉诊 (PulseScene)               │
│                                             │
│  输入: 症状提示 + 脉象古文描述               │
│  输出: pulsePosition + pulseTension         │
│       + pulseCorrect                        │
└─────────────────────────────────────────────┘
     │
     │ pulseData
     ▼
舌诊(Tongue) → 辨证(Syndrome) → 选方(Prescription)
```

---

## 三、游戏流程设计

### 3.1 主流程

```
开始脉诊
    │
    ▼
显示教学引导 (首次进入时)
    │
    ▼
显示脉象古文描述 ──────────────────────┐
    │                                  │
    ▼                                  │
选择脉位 (浮/沉/迟/数/虚/实)            │
    │                                  │
    ▼                                  │ 可点击查看
选择脉势 (紧/缓/滑/涩/弦/濡)            │ 知识卡片
    │                                  │
    ▼                                  │
确认选择                                 │
    │                                   │
    ▼                                   │
验证正确性                               │
    │                                   │
    ├── 正确 ──► 显示解析 + 继续         │
    │                                   │
    ├── 错误 ──► 显示正确答案 + 解释     │
    │                                   │
    ▼                                   │
记录到DiagnosisFlowManager              │
    │                                   │
    ▼                                   │
切换到舌诊场景                           │
    ▼
结束脉诊
```

### 3.2 教学引导流程

```
首次进入脉诊
    │
    ▼
青木先生语音/文字讲解
    │
    ├── 脉诊基本概念
    │   "脉诊是通过切按患者脉搏，了解病情的诊断方法..."
    │
    ├── 脉位解释
    │   "浮脉轻取即得，沉脉重取始得..."
    │
    ├── 脉势解释
    │   "紧脉如转索，缓脉来去舒缓..."
    │
    ▼
显示脉象对比图 (浮vs沉, 紧vs缓)
    │
    ▼
进入正式脉诊
```

### 3.3 难度分级流程

```
难度判断 (基于experienceData)
    │
    ├── 初级 (<100经验)
    │   │
    │   ├── 选项数量: 2个(正确+明显错误)
    │   ├── 提示显示: 高亮症状关联脉象
    │   └── 评分权重: 正确80分，错误0分
    │
    ├── 中级 (100-500经验)
    │   │
    │   ├── 选项数量: 4个
    │   ├── 提示显示: 简要提示
    │   └── 评分权重: 正确60分，部分正确30分
    │
    ├── 高级 (>500经验)
    │   │
    │   ├── 选项数量: 6个(全部选项)
    │   ├── 提示显示: 无提示
    │   └── 评分权重: 正确40分，部分正确20分
    │
    ▼
显示对应难度选项
```

---

## 四、UI组件设计

### 4.1 界面布局

```
┌─────────────────────────────────────────────────────┐
│                     [退出诊断]                        │  ← 退出按钮(340, -250)
│                                                     │
│                    青木诊所 - 切脉                    │  ← 标题
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌───────────────────────────────────────────────┐ │
│   │  脉象描述:                                      │ │
│   │  "脉来浮取即得，重按稍减，紧如转索无常"          │ │  ← 古文描述区
│   │                                                │ │
│   │  [查看脉象知识卡片]                             │ │  ← 知识卡片按钮
│   └───────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   脉位选择:                                          │
│   ○ 浮脉  ○ 沉脉  ○ 迟脉  ○ 数脉  ○ 虚脉  ○ 实脉    │  ← SelectionButton组件
│                                                     │
│   脉势选择:                                          │
│   ○ 紧脉  ○ 缓脉  ○ 滑脉  ○ 涩脉  ○ 弦脉  ○ 濡脉    │  ← SelectionButton组件
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [确认选择]                                         │  ← 确认按钮
│                                                     │
│   提示: 根据问诊症状"恶寒发热"，提示浮脉可能性较高   │  ← 症状提示(初级显示)
│                                                     │
└─────────────────────────────────────────────────────┘
│                                                     │
│                     720×480                         │  ← DIAGNOSIS_MODAL尺寸
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 组件清单

| 组件名 | 类型 | 数量 | 说明 |
|-------|------|-----|------|
| backgroundGraphics | Graphics | 1 | 3D边框背景 |
| titleText | Text | 1 | "青木诊所 - 切脉" |
| exitButton | Text | 1 | [退出诊断] |
| descriptionBox | Rectangle | 1 | 古文描述背景 |
| descriptionText | Text | 1 | 脉象古文描述 |
| knowledgeButton | Text | 1 | [查看脉象知识卡片] |
| positionButtons | SelectionButton | 6 | 脉位选择 |
| tensionButtons | SelectionButton | 6 | 脉势选择 |
| confirmButton | Text | 1 | [确认选择] |
| hintText | Text | 1 | 症状提示 |

---

## 五、数据结构

### 5.1 输入数据

```typescript
interface PulseInputData {
  // 来自病案
  caseId: string;
  pulseDescription: string;      // 古文描述
  correctPosition: string;       // 正确脉位
  correctTension: string;        // 正确脉势

  // 来自问诊(可选)
  clueData?: {
    symptoms: string[];          // 症状列表
    relevantPulseHint?: string;  // 提示脉象
  };

  // 来自经验系统
  playerLevel: 'beginner' | 'intermediate' | 'advanced';
}
```

### 5.2 输出数据

```typescript
interface PulseOutputData {
  pulsePosition: string;         // 玩家选择的脉位
  pulseTension: string;          // 玩家选择的脉势
  isCorrect: boolean;            // 是否正确
  partialCorrect?: {
    positionCorrect: boolean;    // 脉位是否正确
    tensionCorrect: boolean;     // 脉势是否正确
  };
  score: number;                 // 评分(0-100)
  feedback: string;              // 反馈文字
  timeSpent: number;             // 用时(秒)
}
```

### 5.3 脉象知识卡片数据

```typescript
interface PulseKnowledgeCard {
  pulseType: string;             // 脉象类型(浮/沉/...)
  description: string;           // 古文描述
  modernDescription: string;     // 现代描述
  clinicalSignificance: string;  // 临床意义
  relatedSymptoms: string[];     // 相关症状
  relatedSyndromes: string[];    // 相关证型
  image?: string;                // 脉象示意图
}
```

---

## 六、交互设计

### 6.1 核心交互

| 交互 | 触发条件 | 效果 |
|-----|---------|------|
| 选择脉位 | 点击选项按钮 | ○→●切换，其他选项重置为○ |
| 选择脉势 | 点击选项按钮 | ○→●切换，其他选项重置为○ |
| 查看知识卡片 | 点击[查看脉象知识卡片] | 弹出知识卡片弹窗 |
| 确认选择 | 点击[确认选择] | 验证正确性，显示结果 |
| 退出诊断 | 点击[退出诊断] | 返回诊所场景 |

### 6.2 辅助交互

| 交互 | 触发条件 | 效果 |
|-----|---------|------|
| hover选项 | 鼠标悬停选项按钮 | 凸起效果+颜色高亮 |
| hover确认 | 鼠标悬停确认按钮 | 颜色高亮(#00ffaa) |
| 快捷键1-6 | 按数字键 | 快速选择对应脉位选项 |
| 快捷键Q-Y | 按字母键 | 快速选择对应脉势选项 |
| ESC键 | 按ESC | 退出诊断 |

### 6.3 脉象动画(可选)

| 动画 | 触发时机 | 效果 |
|-----|---------|------|
| 脉搏跳动 | 显示描述时 | 模拟脉搏强弱/快慢动画 |
| 选中反馈 | 选择正确时 | 绿色脉冲+正解标记 |
| 错误反馈 | 选择错误时 | 红色闪烁+正确答案显示 |

---

## 七、评分系统

### 7.1 评分维度

| 维度 | 权重 | 评分标准 |
|-----|-----|---------|
| **脉位正确** | 50% | 完全正确50分，错误0分 |
| **脉势正确** | 50% | 完全正确50分，错误0分 |
| **用时加分** | +10% | <30秒+10分，30-60秒+5分，>60秒+0分 |

### 7.2 评分计算

```typescript
function calculatePulseScore(
  positionCorrect: boolean,
  tensionCorrect: boolean,
  timeSpent: number,
  playerLevel: string
): PulseScoreResult {
  let baseScore = 0;

  // 脉位评分(50%)
  baseScore += positionCorrect ? 50 : 0;

  // 脉势评分(50%)
  baseScore += tensionCorrect ? 50 : 0;

  // 用时加分
  if (timeSpent < 30) baseScore += 10;
  else if (timeSpent < 60) baseScore += 5;

  // 难度系数(高级得分权重降低，鼓励挑战)
  const difficultyFactor = playerLevel === 'advanced' ? 0.8 : 1.0;

  const finalScore = Math.round(baseScore * difficultyFactor);

  return {
    total_score: finalScore,
    position_score: positionCorrect ? 50 : 0,
    tension_score: tensionCorrect ? 50 : 0,
    time_bonus: timeSpent < 30 ? 10 : (timeSpent < 60 ? 5 : 0),
    passed: finalScore >= 60,
    feedback: generateFeedback(positionCorrect, tensionCorrect)
  };
}
```

---

## 八、当前实现状态

### 8.1 已实现功能

| 功能 | 文件 | 状态 |
|-----|------|------|
| PulseUI基础框架 | src/ui/PulseUI.ts | ✅ 完成 |
| 脉位选项(浮沉迟数虚实) | src/ui/PulseUI.ts | ✅ 完成 |
| 脉势选项(紧缓滑涩弦濡) | src/ui/PulseUI.ts | ✅ 完成 |
| ○/●选中状态切换 | src/ui/PulseUI.ts | ✅ 完成 |
| 正确性验证 | src/ui/PulseUI.ts | ✅ 完成 |
| 退出按钮 | src/ui/PulseUI.ts | ✅ 完成 |
| 场景切换到舌诊 | src/scenes/PulseScene.ts | ✅ 完成 |
| 3D边框背景 | src/ui/PulseUI.ts | ✅ 完成 |

### 8.2 缺失功能

| 功能 | 优先级 | 说明 |
|-----|-------|------|
| 教学引导系统 | P0 | 青木先生讲解脉诊要点 |
| 脉象动画效果 | P1 | 脉搏跳动视觉模拟 |
| 难度分级机制 | P0 | 基于经验值调整选项数量 |
| 错误反馈解释 | P0 | 选择错误显示正确答案+临床意义 |
| 线索提示系统 | P1 | 问诊症状提示脉象特征 |
| 脉象知识卡片 | P1 | 各脉象详情卡片弹窗 |
| 历史记录系统 | P2 | 脉诊判断历史供复盘 |
| 快捷键支持 | P2 | 数字键/字母键快速选择 |
| 对比学习功能 | P2 | 相似脉象对比(浮vs虚) |
| 评分细项展示 | P1 | 各维度分数详细展示 |
| 进步曲线追踪 | P3 | 多次练习进步可视化 |

---

## 九、实现计划

### 9.1 Phase 1: 核心功能补充

| 任务 | 内容 | 依赖 |
|-----|------|-----|
| Task 1 | 创建PulseKnowledgeData数据定义 | 无 |
| Task 2 | 实现教学引导弹窗(TutorialUI) | TutorialManager |
| Task 3 | 实现难度分级逻辑 | ExperienceManager |
| Task 4 | 实现错误反馈解释组件 | 无 |
| Task 5 | 集成问诊线索提示 | ClueTracker |

### 9.2 Phase 2: UI组件标准化

| 任务 | 内容 | 依赖 |
|-----|------|-----|
| Task 1 | 重构PulseUI使用SelectionButtonComponent | BaseUIComponent |
| Task 2 | 实现脉象知识卡片弹窗 | InfoCardComponent |
| Task 3 | 统一退出按钮位置和样式 | ModalUI基类 |
| Task 4 | 统一边框绘制方法 | UIBorderStyles |

### 9.3 Phase 3: 增强功能

| 任务 | 内容 | 依赖 |
|-----|------|-----|
| Task 1 | 实现脉搏跳动动画 | Phaser动画系统 |
| Task 2 | 实现快捷键支持 | Phaser键盘事件 |
| Task 3 | 实现历史记录系统 | SaveManager |
| Task 4 | 实现进步曲线追踪 | ExperienceManager |

---

## 十、测试验收标准

### 10.1 单元测试

| 测试项 | 测试内容 |
|-------|---------|
| PulseUI渲染 | 标题、描述、选项、按钮正确显示 |
| 选中状态切换 | ○→●切换，单选正确 |
| 正确性验证 | position+tension组合验证 |
| 评分计算 | 各维度分数计算正确 |
| 教学引导触发 | 首次进入触发，再次进入不触发 |

### 10.2 集成测试

| 测试项 | 测试内容 |
|-------|---------|
| 问诊→脉诊切换 | clueData正确传递，提示显示 |
| 脉诊→舌诊切换 | pulseData正确传递到下一场景 |
| DiagnosisFlowManager集成 | 脉诊数据正确记录 |
| ExperienceManager集成 | 难度分级正确触发 |

### 10.3 E2E测试

| 测试项 | 测试内容 |
|-------|---------|
| 完整脉诊流程 | 问诊→脉诊→确认→舌诊 |
| 错误处理流程 | 选择错误→显示解释→继续 |
| 退出流程 | 点击退出→返回诊所 |

---

## 十一、相关文档

- [UI组件系统设计](../2026-04-19-ui-component-system-design.md)
- [舌诊游戏设计](./2026-04-19-tongue-minigame-design.md)
- [辨证游戏设计](./2026-04-19-syndrome-minigame-design.md)
- [诊断流程管理](../../systems/DiagnosisFlowManager.md)

---

*本文档由 Claude Code 创建，更新于 2026-04-19*