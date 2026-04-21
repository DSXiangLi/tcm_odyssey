# 辨证选方小游戏开发计划

**版本**: v1.0
**日期**: 2026-04-21
**状态**: 待执行
**前置依赖**: 舌诊完成, SelectionButtonComponent, ModalUI, DOMElement
**设计文档**: [辨证选方游戏设计](../specs/minigames/2026-04-21-diagnosis-prescription-minigame-design.md)

---

## 一、开发概述

### 1.1 改造目标

将辨证和选方两个小游戏合并为一个"辨证选方游戏"，核心改造聚焦于：
1. 创建合并场景(DiagnosisPrescriptionScene)
2. 实现两步决策流程(证型→方剂)
3. 诊断信息汇总展示(接收舌诊补充说明)
4. 论述分析评分系统
5. 方剂详情弹窗

### 1.2 改造范围

| 改造项 | 当前状态 | 目标状态 |
|-------|---------|---------|
| 场景数量 | 2个(SyndromeScene + PrescriptionScene) | 1个(合并) |
| 决策流程 | 两个独立环节 | 两步连续决策 |
| 诊断信息 | 分散在两处 | 统一汇总展示 |
| 舌诊补充 | 未传递 | 接收supplementNote |
| 论述评分 | 简单验证 | AI关键词评分 |
| 方剂详情 | 基础展示 | 详情弹窗 |

### 1.3 开发阶段划分

```
Phase 1: 场景合并与UI整合
    │
    ▼
Phase 2: 诊断信息汇总
    │
    ▼
Phase 3: 方剂详情弹窗
    │
    ▼
Phase 4: 论述评分系统
    │
    ▼
Phase 5: 方剂加减功能
    │
    ▼
Phase 6: 教学引导系统
    │
    ▼
Phase 7: 测试验收
```

---

## 二、Phase 1: 场景合并与UI整合

### 2.1 场景合并

**目标**: 创建DiagnosisPrescriptionScene，合并两个独立场景。

**场景文件**: `src/scenes/DiagnosisPrescriptionScene.ts`

```typescript
// 场景结构
export class DiagnosisPrescriptionScene extends Phaser.Scene {
  // 从舌诊接收数据
  private diagnosisData: TongueOutputData;
  private pulseData: PulseOutputData;
  private clueData: ClueData;

  // UI组件
  private ui: DiagnosisPrescriptionUI;

  // 两步决策状态
  private step: 'syndrome' | 'prescription' | 'confirm';
  private selectedSyndrome: string;
  private selectedPrescription: string;
}
```

### 2.2 UI整合

**目标**: 合并SyndromeUI + PrescriptionUI为统一界面。

**UI文件**: `src/ui/DiagnosisPrescriptionUI.ts`

```
界面布局:
┌─────────────────────────────────────────────────────────┐
│ [退出诊断]                                               │
│                                                         │
│ 青木诊所 - 辨证选方                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 诊断信息汇总:                     [查看全部详情]          │
│ 症状: 恶寒、发热、无汗                                   │
│ 脉象: 浮紧                                               │
│ 舌象: 淡红舌、薄白苔                                      │
│ 补充: 舌边略有齿痕 ← 舌诊补充说明                         │
├─────────────────────────────────────────────────────────┤
│ 步骤1: 请判断证型                                         │
│ ○ 风寒表实证                                             │
│ ○ 风寒表虚证                                             │
│ ○ 风热表证                                               │
│ ○ 阳虚证                                                 │
├─────────────────────────────────────────────────────────┤
│ 步骤2: 选择方剂                                           │
│ ○ 麜黄汤           [查看详情]                            │
│ ○ 桂枝汤           [查看详情]                            │
│ [方剂加减] (高级解锁后可用)                               │
├─────────────────────────────────────────────────────────┤
│ 论述分析(可选):                                          │
│ [输入框]                                                 │
├─────────────────────────────────────────────────────────┤
│ 已选: 风寒表实证 → 麜黄汤                                 │
│ [确认辨证选方]                                           │
└─────────────────────────────────────────────────────────┘
```

### 2.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建DiagnosisPrescriptionScene.ts | src/scenes/DiagnosisPrescriptionScene.ts |
| Step 2 | 创建DiagnosisPrescriptionUI.ts | src/ui/DiagnosisPrescriptionUI.ts |
| Step 3 | 实现诊断信息汇总展示 | 同上 |
| Step 4 | 实现证型选择(SelectionButton) | 同上 |
| Step 5 | 实现方剂选择(SelectionButton) | 同上 |
| Step 6 | 实现两步状态切换逻辑 | 同上 |
| Step 7 | 更新诊断流程管理器 | src/systems/DiagnosisFlowManager.ts |
| Step 8 | 创建单元测试 | tests/unit/scenes/DiagnosisPrescriptionScene.test.ts |

---

## 三、Phase 2: 诊断信息汇总

### 3.1 数据接收

**目标**: 从舌诊接收完整的诊断数据，包括supplementNote。

```typescript
interface DiagnosisSummaryData {
  // 问诊数据
  symptoms: string[];

  // 脉诊数据
  pulsePosition: string;
  pulseTension: string;

  // 舌诊数据
  tongueBody: string;
  tongueCoat: string;
  tongueShape: string;
  tongueMoist: string;
  supplementNote: string;   // 舌诊补充说明(新增)
}
```

### 3.2 汇总展示

**目标**: 在界面顶部展示诊断信息汇总。

| 展示项 | 格式 |
|-----|------|
| 症状 | "症状: 恶寒、发热、无汗、头身痛" |
| 脉象 | "脉象: 浮紧" |
| 舌象 | "舌象: 淡红舌、薄白苔" |
| 补充 | "补充: 舌边略有齿痕"(如有填写) |

### 3.3 诊断详情弹窗

**目标**: 点击[查看全部详情]弹出完整诊断信息弹窗。

```
诊断详情弹窗内容:
┌─────────────────────────────────────────────────────────┐
│ 诊断信息详情                                              │
│                                                         │
│ 问诊症状:                                                 │
│ - 恶寒重                                                 │
│ - 发热轻                                                 │
│ - 无汗                                                   │
│                                                          │
│ 脉诊结果:                                                 │
│ - 脉位: 浮                                               │
│ - 脉势: 紧                                               │
│                                                          │
│ 舌诊结果:                                                 │
│ - 舌体: 淡红                                             │
│ - 舌苔: 薄白                                             │
│ - 舌形: 正常                                             │
│ - 润燥: 润                                               │
│ - 补充: 舌边略有齿痕                                     │
│                                                          │
│ [关闭]                                                   │
└─────────────────────────────────────────────────────────┘
```

### 3.4 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建DiagnosisSummaryData接口 | src/ui/DiagnosisPrescriptionUI.ts |
| Step 2 | 从TongueScene接收数据(含supplementNote) | src/scenes/DiagnosisPrescriptionScene.ts |
| Step 3 | 实现diagnosisSummaryBox组件 | src/ui/DiagnosisPrescriptionUI.ts |
| Step 4 | 实现诊断详情弹窗 | 同上 |
| Step 5 | 创建单元测试 | tests/unit/ui/DiagnosisSummary.test.ts |

---

## 四、Phase 3: 方剂详情弹窗

### 4.1 弹窗设计

**目标**: 点击[查看详情]弹出方剂详情弹窗。

**弹窗尺寸**: 480×360 (ModalUI标准)

### 4.2 弹窗内容

```
方剂详情弹窗:
┌─────────────────────────────────────────────────────────┐
│ 方剂详情                                                  │
│                                                         │
│ 麜黄汤                                                    │
│                                                         │
│ 组成:                                                    │
│ 麜黄(君) 桂枝(臣) 杏仁(佐) 甘草(使)                        │
│                                                         │
│ 功效: 发汗解表，宣肺平喘                                  │
│ 主治: 风寒表实证                                          │
│                                                         │
│ 方解:                                                    │
│ 麜黄宣肺发汗为君，桂枝温通经脉为臣...                      │
│                                                         │
│ 适应证特征:                                               │
│ - 恶寒重、发热轻                                          │
│ - 无汗、头身痛                                            │
│ - 脉浮紧                                                  │
│                                                         │
│ [关闭]                                                   │
└─────────────────────────────────────────────────────────┘
```

### 4.3 数据来源

**文件**: `src/data/prescriptions.json`

```json
{
  "prescriptions": [
    {
      "id": "mahuang_tang",
      "name": "麻黄汤",
      "composition": ["麻黄", "桂枝", "杏仁", "甘草"],
      "roles": ["君", "臣", "佐", "使"],
      "effect": "发汗解表，宣肺平喘",
      "indication": "风寒表实证",
      "analysis": "麻黄宣肺发汗为君...",
      "keySymptoms": ["恶寒重", "发热轻", "无汗", "脉浮紧"]
    }
  ]
}
```

### 4.4 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建PrescriptionDetailUI.ts | src/ui/PrescriptionDetailUI.ts |
| Step 2 | 继承ModalUI基类 | 同上 |
| Step 3 | 加载prescriptions.json数据 | 同上 |
| Step 4 | 实现方剂详情展示 | 同上 |
| Step 5 | 实现与证型对应提示 | 同上 |
| Step 6 | 创建单元测试 | tests/unit/ui/PrescriptionDetailUI.test.ts |

---

## 五、Phase 4: 论述评分系统

### 5.1 论述输入框

**目标**: 高级难度时显示论述输入框(可选填写)。

| 属性 | 值 |
|-----|-----|
| 类型 | Phaser DOMElement |
| 尺寸 | 400×80像素 |
| 最大字符 | 300字符 |
| 占位符 | "请说明辨证依据..." |

### 5.2 关键词评分逻辑

**目标**: 分析论述内容，基于关键词覆盖评分。

```typescript
interface AnalysisKeywords {
  symptoms: ['恶寒', '发热', '无汗', '头痛', '身痛'],
  pulse: ['浮脉', '紧脉', '表', '寒', '实'],
  tongue: ['淡红', '薄白', '正常'],
  logic: ['风寒', '表实', '寒邪', '闭阻']
}

function analyzeInputText(text: string, keywords: AnalysisKeywords): AnalysisScore {
  let score = 0;

  // 症状覆盖检查(每个关键词+5分)
  keywords.symptoms.forEach(kw => {
    if (text.includes(kw)) score += 5;
  });

  // 脉象分析检查(每个关键词+8分)
  keywords.pulse.forEach(kw => {
    if (text.includes(kw)) score += 8;
  });

  // 舌象分析检查(每个关键词+5分)
  keywords.tongue.forEach(kw => {
    if (text.includes(kw)) score += 5;
  });

  // 证型逻辑检查(每个关键词+10分)
  keywords.logic.forEach(kw => {
    if (text.includes(kw)) score += 10;
  });

  return {
    symptomCoverage: 症状得分,
    pulseAnalysis: 脉象得分,
    tongueAnalysis: 舌象得分,
    logicScore: 逻辑得分,
    total: score
  };
}
```

### 5.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建论述输入框DOMElement | src/ui/DiagnosisPrescriptionUI.ts |
| Step 2 | 定义关键词评分规则 | src/data/analysis-keywords.ts |
| Step 3 | 实现analyzeInputText函数 | src/systems/AnalysisScorer.ts |
| Step 4 | 生成论述反馈建议 | 同上 |
| Step 5 | 创建单元测试 | tests/unit/systems/AnalysisScorer.test.ts |

---

## 六、Phase 5: 方剂加减功能

### 6.1 解锁判断

**目标**: 从ExperienceManager获取方剂加减解锁状态。

```typescript
// 解锁条件: 完成基础诊断10次以上
function checkAdjustmentUnlock(experience: number): boolean {
  return experience >= 1000; // 经验值阈值
}
```

### 6.2 加减界面设计

**目标**: 点击[方剂加减]弹出加减选择界面。

```
方剂加减界面:
┌─────────────────────────────────────────────────────────┐
│ 方剂加减                                                  │
│                                                         │
│ 当前方剂: 麜黄汤                                          │
│ 原方组成: 麜黄、桂枝、杏仁、甘草                          │
│                                                         │
│ 可加减药材:                                              │
│ [加] ┌─────┐ ┌─────┐ ┌─────┐                           │
│      │生姜 │ │大枣 │ │石膏 │                           │
│      └─────┘ └─────┘ └─────┘                           │
│                                                         │
│ [减] ┌─────┐ ┌─────┐                                    │
│      │杏仁 │ │甘草 │                                    │
│      └─────┘ └─────┘                                    │
│                                                         │
│ 加减理由:                                                │
│ [输入框: 例如: 加生姜增强散寒...]                        │
│                                                         │
│ [保存加减] [取消]                                        │
└─────────────────────────────────────────────────────────┘
```

### 6.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建AdjustmentUI.ts | src/ui/AdjustmentUI.ts |
| Step 2 | 继承ModalUI基类 | 同上 |
| Step 3 | 实现加减药材选择 | 同上 |
| Step 4 | 实现加减理由输入 | 同上 |
| Step 5 | 保存加减方案到adjustmentData | 同上 |
| Step 6 | 创建单元测试 | tests/unit/ui/AdjustmentUI.test.ts |

---

## 七、Phase 6: 教学引导系统

### 7.1 首次辨证选方引导

**目标**: 集成TutorialManager，首次进入时显示青木先生讲解。

**引导内容**:
```
青木先生讲解:
1. 辨证选方概念 - "辨证是中医诊断的核心..."
2. 两步决策流程 - "先判断证型，再选择对应方剂..."
3. 诊断信息汇总 - "综合症状、脉象、舌象进行判断..."
4. 方剂与证型对应 - "风寒表实证选麻黄汤..."
5. 论述分析(高级) - "可填写辨证依据..."
```

### 7.2 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 在tutorial-data.ts增加引导数据 | src/data/tutorial-data.ts |
| Step 2 | 在Scene检查引导触发条件 | src/scenes/DiagnosisPrescriptionScene.ts |
| Step 3 | 显示TutorialUI后进入游戏 | 同上 |
| Step 4 | 创建集成测试 | tests/integration/scenes/DiagnosisPrescriptionScene.test.ts |

---

## 八、前后依赖关系

### 8.1 上游依赖

| 依赖 | 说明 |
|-----|------|
| TongueScene | 舌诊完成，传递tongueData+supplementNote |
| PulseScene | 脉诊完成，传递pulseData |
| InquiryScene | 问诊完成，传递clueData |
| SelectionButtonComponent | ○/●选项按钮(已存在) |
| ModalUI | 弹窗基类(已存在) |
| TutorialManager | 教学引导(已存在) |
| ExperienceManager | 经验值管理(已存在) |

### 8.2 下游输出

| 输出 | 目标 | 说明 |
|-----|------|------|
| diagnosisData | 煎药场景 | 证型+方剂+加减数据 |
| feedback | NPC反馈 | 青木先生评述 |

---

## 九、测试验收标准

### 9.1 单元测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| 场景合并渲染 | 6 | 两步决策布局+状态切换 |
| 诊断信息汇总 | 6 | 症状/脉象/舌象/补充显示 |
| 方剂详情弹窗 | 4 | 弹窗渲染+数据加载 |
| 论述评分逻辑 | 8 | 关键词分析+评分计算 |
| 方剂加减逻辑 | 6 | 加减选择+解锁判断 |
| **小计** | **30** | |

### 9.2 集成测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| 舌诊→辨证选方切换 | 2 | tongueData+supplementNote传递 |
| 两步决策流程 | 4 | 证型→方剂→确认 |
| 论述分析流程 | 2 | 输入论述→评分 |
| 方剂加减流程 | 2 | 加减选择→保存 |
| **小计** | **10** | |

### 9.3 E2E测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| 完整诊断流程 | 2 | 问诊→脉诊→舌诊→辨证选方→煎药 |
| 论述+加减流程 | 1 | 高级难度完整流程 |
| **小计** | **3** | |

---

## 十、开发任务汇总

| Phase | 内容 | 任务数 |
|-----|------|-------|
| Phase 1 | 场景合并与UI整合 | 8 |
| Phase 2 | 诊断信息汇总 | 5 |
| Phase 3 | 方剂详情弹窗 | 6 |
| Phase 4 | 论述评分系统 | 5 |
| Phase 5 | 方剂加减功能 | 6 |
| Phase 6 | 教学引导系统 | 4 |
| Phase 7 | 测试验收 | 43测试 |
| **总计** | - | **34任务+43测试** |

---

## 十一、需要废弃的旧文件

> **重要**: 开发完成后需废弃以下旧文件：
>
> - `src/scenes/SyndromeScene.ts` (合并后废弃)
> - `src/scenes/PrescriptionScene.ts` (合并后废弃)
> - `src/ui/SyndromeUI.ts` (合并后废弃)
> - `src/ui/PrescriptionUI.ts` (合并后废弃)

---

*本文档由 Claude Code 创建，更新于 2026-04-21*