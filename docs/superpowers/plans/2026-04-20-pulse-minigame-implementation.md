# 脉诊小游戏开发计划

**版本**: v1.1
**日期**: 2026-04-20
**状态**: 待执行
**前置依赖**: SelectionButtonComponent, ModalUI
**设计文档**: [脉诊游戏设计](../specs/minigames/2026-04-19-pulse-minigame-design.md)

---

## 一、开发概述

### 1.1 改造目标

根据设计文档完善脉诊游戏，核心改造聚焦于：
1. 增加"正常脉象"选项（脉位平脉、脉势不明显）
2. 补充教学引导系统
3. 实现难度分级机制
4. 完善错误反馈解释

### 1.2 改造范围

| 改造项 | 当前状态 | 目标状态 |
|-------|---------|---------|
| 脉位选项 | 6种(浮沉迟数虚实) | 7种(增加平脉) |
| 脉势选项 | 6种(紧缓滑涩弦濡) | 7种(增加不明显) |
| 教学引导 | 无 | TutorialUI集成 |
| 难度分级 | 固定选项数 | 基于经验值动态调整 |
| 错误反馈 | 简单提示 | 正确答案+临床意义解释 |

### 1.3 开发阶段划分

```
Phase 1: 数据层改造(正常脉象)
    │
    ▼
Phase 2: UI层改造(选项增加)
    │
    ▼
Phase 3: 教学引导系统
    │
    ▼
Phase 4: 难度分级机制
    │
    ▼
Phase 5: 错误反馈完善
    │
    ▼
Phase 6: 测试验收
```

---

## 二、Phase 1: 数据层改造

### 2.1 脉象数据更新

**目标**: 在现有脉象数据中增加"正常脉象"选项。

**文件**: `src/data/pulse-data.ts`（已存在，需更新）

```typescript
// 脉位选项更新
const PULSE_POSITIONS = [
  { id: 'fu', name: '浮脉', desc: '轻取即得' },
  { id: 'chen', name: '沉脉', desc: '重按始得' },
  { id: 'chi', name: '迟脉', desc: '一息三至' },
  { id: 'shu', name: '数脉', desc: '一息六至' },
  { id: 'xu', name: '虚脉', desc: '无力空虚' },
  { id: 'shi', name: '实脉', desc: '有力充实' },
  { id: 'ping', name: '平脉', desc: '正常脉位' },  // 新增
];

// 脉势选项更新
const PULSE_TENSIONS = [
  { id: 'jin', name: '紧脉', desc: '如转索无常' },
  { id: 'huan', name: '缓脉', desc: '来去舒缓' },
  { id: 'hua', name: '滑脉', desc: '如珠走盘' },
  { id: 'se', name: '涩脉', desc: '往来艰涩' },
  { id: 'xian', name: '弦脉', desc: '如按琴弦' },
  { id: 'ru', name: '濡脉', desc: '软弱浮细' },
  { id: 'normal', name: '不明显', desc: '脉势正常' },  // 新增
];
```

### 2.2 病案数据更新

**目标**: 在病案数据中增加正常脉象的正确答案定义。

**文件**: `src/data/cases/core_cases.json`

```json
// 病案脉象字段更新示例
{
  "caseId": "case_001",
  "pulse": {
    "position": "ping",      // 脉位正常
    "tension": "normal",     // 脉势正常
    "description": "脉来从容和缓，不浮不沉，不快不慢"
  }
}
```

### 2.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 在pulse-data.ts增加平脉选项 | src/data/pulse-data.ts |
| Step 2 | 在pulse-data.ts增加不明显选项 | src/data/pulse-data.ts |
| Step 3 | 更新病案数据支持正常脉象 | src/data/cases/core_cases.json |
| Step 4 | 创建单元测试 | tests/unit/data/pulse-data.test.ts |

---

## 三、Phase 2: UI层改造

### 3.1 PulseUI选项更新

**目标**: 在现有PulseUI基础上增加第7个选项按钮。

**改造方式**: 保持现有文字选项形式，仅增加选项数量。

```
改造后界面:
脉位选择:
○ 浮脉  ○ 沉脉  ○ 迟脉  ○ 数脉  ○ 虚脉  ○ 实脉  ○ 平脉(正常)

脉势选择:
○ 紧脉  ○ 缓脉  ○ 滑脉  ○ 涩脉  ○ 弦脉  ○ 濡脉  ○ 不明显
```

### 3.2 布局调整

**目标**: 7个选项需要重新计算布局间距。

| 参数 | 当前值 | 目标值 |
|-----|-------|-------|
| 选项间距 | 80px | 70px（紧凑） |
| 脉位区域宽度 | 480px | 510px（增加30px） |
| 脉势区域宽度 | 480px | 510px（增加30px） |

### 3.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 更新PULSE_POSITIONS常量(增加平脉) | src/ui/PulseUI.ts |
| Step 2 | 更新PULSE_TENSIONS常量(增加不明显) | src/ui/PulseUI.ts |
| Step 3 | 调整选项布局间距 | 同上 |
| Step 4 | 更新正确性验证逻辑(支持ping/normal) | 同上 |
| Step 5 | 创建集成测试 | tests/integration/ui/PulseUI.test.ts |

---

## 四、Phase 3: 教学引导系统

### 4.1 首次脉诊引导

**目标**: 集成TutorialManager，首次进入脉诊时显示青木先生讲解。

**引导内容**:
```
青木先生讲解:
1. 脉诊基本概念 - "脉诊是通过切按患者脉搏..."
2. 脉位解释 - "浮脉轻取即得，沉脉重按始得..."
3. 脉势解释 - "紧脉如转索，缓脉来去舒缓..."
4. 正常脉象 - "平脉从容和缓，脉势不明显时选正常..."
```

### 4.2 TutorialUI集成

**目标**: 使用已有的TutorialManager和TutorialUI系统。

| 集成点 | 说明 |
|-----|------|
| triggerId | 'pulse_first_entry' |
| triggerCondition | 首次进入PulseScene |
| content | 脉诊教学引导数据 |
| onComplete | 标记tutorialCompleted.pulse = true |

### 4.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 在tutorial-data.ts增加脉诊引导数据 | src/data/tutorial-data.ts |
| Step 2 | 在PulseScene检查引导触发条件 | src/scenes/PulseScene.ts |
| Step 3 | 显示TutorialUI后进入脉诊 | 同上 |
| Step 4 | 创建集成测试 | tests/integration/scenes/PulseScene.test.ts |

---

## 五、Phase 4: 难度分级机制

### 5.1 难度定义

**目标**: 基于ExperienceManager的玩家经验值，动态调整选项数量。

| 难度等级 | 经验值范围 | 选项策略 |
|---------|-----------|---------|
| 初级 | <100经验 | 显示正确选项+2个明显错误选项 |
| 中级 | 100-500经验 | 显示正确选项+4个混淆选项 |
| 高级 | >500经验 | 显示全部7个选项 |

### 5.2 选项过滤逻辑

```typescript
// 根据难度筛选选项
function filterOptionsByDifficulty(
  allOptions: PulseOption[],
  correctId: string,
  playerLevel: string
): PulseOption[] {
  if (playerLevel === 'beginner') {
    // 初级: 正确选项 + 2个明显错误选项
    return [correct, wrong1, wrong2];
  }
  if (playerLevel === 'intermediate') {
    // 中级: 正确选项 + 4个混淆选项
    return [correct, conf1, conf2, conf3, conf4];
  }
  // 高级: 全部7个选项
  return allOptions;
}
```

### 5.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 在PulseUI增加难度判断逻辑 | src/ui/PulseUI.ts |
| Step 2 | 从ExperienceManager获取玩家等级 | 同上 |
| Step 3 | 实现选项过滤函数 | 同上 |
| Step 4 | 更新UI渲染逻辑 | 同上 |
| Step 5 | 创建单元测试 | tests/unit/ui/PulseUI-difficulty.test.ts |

---

## 六、Phase 5: 错误反馈完善

### 6.1 错误反馈设计

**目标**: 选择错误时显示正确答案+临床意义解释。

```
错误反馈界面:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ❌ 选择错误                                             │
│                                                         │
│  你的选择: 浮脉                                          │
│  正确答案: 沉脉                                          │
│                                                         │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  解释:                                                   │
│  沉脉重按始得，主里证。                                   │
│  根据病案"腹胀便秘"症状，提示里实证，故选沉脉。           │
│                                                         │
│  [继续]                                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 反馈数据结构

```typescript
interface PulseFeedback {
  selectedPosition: string;      // 玩家选择的脉位
  selectedTension: string;       // 玩家选择的脉势
  correctPosition: string;       // 正确脉位
  correctTension: string;        // 正确脉势
  positionCorrect: boolean;      // 脉位是否正确
  tensionCorrect: boolean;       // 脉势是否正确
  explanation: string;           // 临床意义解释
  symptomHint?: string;          // 症状提示(可选)
}
```

### 6.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建generatePulseFeedback函数 | src/ui/PulseUI.ts |
| Step 2 | 增加临床意义解释数据 | src/data/pulse-data.ts |
| Step 3 | 实现错误反馈弹窗显示 | src/ui/PulseUI.ts |
| Step 4 | 增加症状关联提示 | 同上 |
| Step 5 | 创建单元测试 | tests/unit/ui/PulseUI-feedback.test.ts |

---

## 七、前后依赖关系

### 7.1 上游依赖

| 依赖 | 说明 |
|-----|------|
| SelectionButtonComponent | ○/●选项按钮(已存在) |
| ModalUI | 弹窗基类(已存在) |
| TutorialManager | 教学引导管理器(已存在) |
| ExperienceManager | 经验值管理器(已存在) |

### 7.2 下游输出

| 输出 | 目标 | 说明 |
|-----|------|------|
| pulseData | 舌诊场景 | 脉诊结果传递 |
| 正常脉象选项 | 舌诊/辨证 | 可参考脉诊设计 |

---

## 八、测试验收标准

### 8.1 单元测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| pulse-data更新 | 4 | 平脉/不明显数据完整性 |
| PulseUI选项渲染 | 6 | 7选项正确显示 |
| 正确性验证(正常脉象) | 4 | ping/normal验证逻辑 |
| 难度分级逻辑 | 8 | 选项过滤正确性 |
| 错误反馈生成 | 6 | 反馈内容正确性 |
| **小计** | **28** | |

### 8.2 集成测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| PulseScene引导触发 | 2 | 首次进入显示引导 |
| 脉诊→舌诊切换 | 2 | pulseData正确传递 |
| 难度分级集成 | 2 | ExperienceManager集成 |
| **小计** | **6** | |

### 8.3 E2E测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| 完整脉诊流程 | 2 | 问诊→脉诊→舌诊 |
| 正常脉象选择 | 1 | 选择平脉+不明显 |
| 错误反馈流程 | 1 | 选择错误→显示解释 |
| **小计** | **4** | |

---

## 九、开发任务汇总

| Phase | 内容 | 任务数 |
|-----|------|-------|
| Phase 1 | 数据层改造 | 4 |
| Phase 2 | UI层改造 | 5 |
| Phase 3 | 教学引导系统 | 4 |
| Phase 4 | 难度分级机制 | 5 |
| Phase 5 | 错误反馈完善 | 5 |
| Phase 6 | 测试验收 | 38测试 |
| **总计** | - | **23任务+38测试** |

---

*本文档由 Claude Code 创建，更新于 2026-04-20*