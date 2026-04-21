# 舌诊小游戏开发计划

**版本**: v1.1
**日期**: 2026-04-21
**状态**: 待执行
**前置依赖**: SelectionButtonComponent, ModalUI, Phaser DOMElement
**设计文档**: [舌诊游戏设计](../specs/minigames/2026-04-19-tongue-minigame-design.md)

---

## 一、开发概述

### 1.1 改造目标

根据设计文档完善舌诊游戏，核心改造聚焦于：
1. 舌象图片预留slot（用户收集图片，无需AI生图）
2. 增加补充说明文字输入框（记录个性化舌象观察）
3. 移除脉诊参考显示（舌诊与脉诊独立）
4. 补充教学引导系统和难度分级机制

### 1.2 改造范围

| 改造项 | 当前状态 | 目标状态 |
|-------|---------|---------|
| 舌象图片 | 无 | 预留slot+点击放大 |
| 补充说明 | 无 | 文字输入框(可选填写) |
| 脉诊参考 | 显示"已判断脉象" | 移除，舌诊独立 |
| 教学引导 | 无 | TutorialUI集成 |
| 难度分级 | 固定识别项数 | 基于经验值动态调整 |
| 错误反馈 | 简单提示 | 正确答案+临床意义解释 |

### 1.3 开发阶段划分

```
Phase 1: 舌象图片预留slot
    │
    ▼
Phase 2: 补充说明输入框
    │
    ▼
Phase 3: 移除脉诊参考显示
    │
    ▼
Phase 4: 教学引导系统
    │
    ▼
Phase 5: 难度分级机制
    │
    ▼
Phase 6: 错误反馈完善
    │
    ▼
Phase 7: 测试验收
```

---

## 二、Phase 1: 舌象图片预留slot

### 2.1 图片slot设计

**目标**: 预留舌象图片展示区域，用户收集图片后直接填充。

**图片规格**:
| 参数 | 值 |
|-----|-----|
| **尺寸** | 200×150像素 |
| **格式** | PNG/JPG |
| **存放路径** | `public/assets/tongue/` |
| **命名规则** | `{caseId}_tongue.png` |

### 2.2 图片加载逻辑

```typescript
// 图片路径配置
interface TongueImageConfig {
  caseId: string;
  imagePath: string;  // 如 'public/assets/tongue/case_001_tongue.png'
  hasImage: boolean;  // 是否有图片(可选)
}

// 图片加载(Phaser)
function loadTongueImage(scene: Phaser.Scene, config: TongueImageConfig): void {
  if (config.hasImage) {
    scene.load.image(`tongue_${config.caseId}`, config.imagePath);
  } else {
    // 无图片时显示占位符"暂无图片"
  }
}
```

### 2.3 图片点击放大

**目标**: 点击舌象图片后弹出放大弹窗(400×300)。

```
点击舌象图片
    │
    ▼
弹出放大弹窗(ModalUI)
    │
    ├── 图片放大展示(400×300)
    │
    ├── 关闭按钮
    │
    ▼
点击关闭返回选择界面
```

### 2.4 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建tongueImageSlot容器 | src/ui/TongueUI.ts |
| Step 2 | 实现图片加载逻辑(有图片/无图片) | 同上 |
| Step 3 | 实现图片点击放大弹窗 | 同上 |
| Step 4 | 创建图片占位符样式 | 同上 |
| Step 5 | 创建单元测试 | tests/unit/ui/TongueUI-image.test.ts |

---

## 三、Phase 2: 补充说明输入框

### 3.1 输入框设计

**目标**: 增加可选的文字输入框，记录个性化舌象观察信息。

| 属性 | 值 |
|-----|-----|
| **类型** | Phaser DOMElement (HTML input) |
| **位置** | 选择区域下方 |
| **尺寸** | 300×60像素 |
| **最大字符** | 100字符 |
| **占位符** | "补充说明(可选): 如齿痕、舌根苔厚..." |
| **字体** | 16px 常规字体 |
| **边框** | 1px solid #80a040 |

### 3.2 DOMElement实现

```typescript
// Phaser DOMElement输入框
const supplementInput = scene.add.dom(x, y, 'input', {
  type: 'text',
  placeholder: '补充说明(可选): 如齿痕、舌根苔厚...',
  maxlength: '100',
  style: 'width: 300px; height: 60px; font-size: 16px; border: 1px solid #80a040;'
});

// 获取输入值
function getSupplementNote(): string {
  return supplementInput.node.value || '';
}
```

### 3.3 数据传递

```typescript
// 输出数据增加supplementNote
interface TongueOutputData {
  // ... 其他字段
  supplementNote: string;  // 补充说明(新增)
}

// 传递给辨证阶段
function passToSyndromeScene(data: TongueOutputData): void {
  // supplementNote作为参考信息传递
}
```

### 3.4 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建supplementInputBox DOMElement | src/ui/TongueUI.ts |
| Step 2 | 设置输入框样式和位置 | 同上 |
| Step 3 | 实现输入值获取逻辑 | 同上 |
| Step 4 | 更新TongueOutputData增加supplementNote | 同上 |
| Step 5 | 传递supplementNote到辨证场景 | src/scenes/TongueScene.ts |
| Step 6 | 创建单元测试 | tests/unit/ui/TongueUI-input.test.ts |

---

## 四、Phase 3: 移除脉诊参考显示

### 4.1 移除内容

**目标**: 移除舌诊界面中的脉诊结果参考显示。

| 移除项 | 当前状态 | 目标状态 |
|-----|---------|---------|
| pulseReferenceText组件 | 显示"已判断脉象: 浮紧" | 移除组件 |
| TongueInputData.pulseData | 包含脉诊数据 | 移除字段 |
| 界面布局脉诊参考行 | 存在 | 移除 |

### 4.2 界面调整

```
调整前:
┌─────────────────────────────────────┐
│ 舌象描述:                            │
│ "舌质淡红，苔薄白，舌体正常"          │
│                                      │
│ 已判断脉象: 浮紧  ← 移除这行          │
└─────────────────────────────────────┘

调整后:
┌─────────────────────────────────────┐
│ 舌象描述:                            │
│ "舌质淡红，苔薄白，舌体正常"          │
│                                      │
│ (仅舌象描述，无脉诊参考)              │
└─────────────────────────────────────┘
```

### 4.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 移除pulseReferenceText组件 | src/ui/TongueUI.ts |
| Step 2 | 移除TongueInputData.pulseData字段 | src/data/tongue-data.ts |
| Step 3 | 移除界面布局中的脉诊参考行 | src/ui/TongueUI.ts |
| Step 4 | 更新集成测试 | tests/integration/ui/TongueUI.test.ts |

---

## 五、Phase 4: 教学引导系统

### 5.1 首次舌诊引导

**目标**: 集成TutorialManager，首次进入舌诊时显示青木先生讲解。

**引导内容**:
```
青木先生讲解:
1. 舌诊基本概念 - "舌诊是通过观察舌象了解病情..."
2. 舌体颜色解释 - "淡红为正常，红主热，青紫主血瘀..."
3. 舌苔解释 - "薄白为正常，厚白主湿，黄苔主热..."
4. 舌形解释 - "胖大主水湿，瘦薄主阴虚..."
5. 润燥解释 - "润为正常，燥主津伤，滑主湿..."
6. 补充说明 - "如有个性化观察，可填写补充说明..."
```

### 5.2 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 在tutorial-data.ts增加舌诊引导数据 | src/data/tutorial-data.ts |
| Step 2 | 在TongueScene检查引导触发条件 | src/scenes/TongueScene.ts |
| Step 3 | 显示TutorialUI后进入舌诊 | 同上 |
| Step 4 | 创建集成测试 | tests/integration/scenes/TongueScene.test.ts |

---

## 六、Phase 5: 难度分级机制

### 6.1 难度定义

**目标**: 基于ExperienceManager的玩家经验值，动态调整识别项数。

| 难度等级 | 经验值范围 | 识别项数 | 描述形式 |
|---------|-----------|---------|---------|
| 初级 | <100经验 | 1项(舌体颜色) | 图片+现代描述 |
| 中级 | 100-500经验 | 2项(舌体+舌苔) | 文字描述 |
| 高级 | >500经验 | 4项(全部) | 古文描述 |

### 6.2 选项显示逻辑

```typescript
// 根据难度控制显示项数
function getVisibleOptionsByDifficulty(
  playerLevel: string
): { body: boolean; coat: boolean; shape: boolean; moist: boolean } {
  if (playerLevel === 'beginner') {
    return { body: true, coat: false, shape: false, moist: false };
  }
  if (playerLevel === 'intermediate') {
    return { body: true, coat: true, shape: false, moist: false };
  }
  // 高级显示全部
  return { body: true, coat: true, shape: true, moist: true };
}
```

### 6.3 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 在TongueUI增加难度判断逻辑 | src/ui/TongueUI.ts |
| Step 2 | 从ExperienceManager获取玩家等级 | 同上 |
| Step 3 | 实现选项显示控制函数 | 同上 |
| Step 4 | 更新UI渲染逻辑 | 同上 |
| Step 5 | 创建单元测试 | tests/unit/ui/TongueUI-difficulty.test.ts |

---

## 七、Phase 6: 错误反馈完善

### 7.1 错误反馈设计

**目标**: 选择错误时显示正确答案+临床意义解释。

```
错误反馈界面:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ❌ 选择错误                                             │
│                                                         │
│  你的选择: 舌体-红                                       │
│  正确答案: 舌体-淡红                                     │
│                                                         │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  解释:                                                   │
│  淡红舌为正常舌色，气血调和。                             │
│  根据病案"恶寒发热"症状，风寒表证舌色偏淡。               │
│                                                         │
│  [继续]                                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 实现步骤

| 步骤 | 内容 | 文件 |
|-----|------|------|
| Step 1 | 创建generateTongueFeedback函数 | src/ui/TongueUI.ts |
| Step 2 | 增加临床意义解释数据 | src/data/tongue-data.ts |
| Step 3 | 实现错误反馈弹窗显示 | src/ui/TongueUI.ts |
| Step 4 | 增加症状关联提示 | 同上 |
| Step 5 | 创建单元测试 | tests/unit/ui/TongueUI-feedback.test.ts |

---

## 八、前后依赖关系

### 8.1 上游依赖

| 依赖 | 说明 |
|-----|------|
| SelectionButtonComponent | ○/●选项按钮(已存在) |
| ModalUI | 弹窗基类(已存在) |
| TutorialManager | 教学引导管理器(已存在) |
| ExperienceManager | 经验值管理器(已存在) |
| Phaser DOMElement | 文字输入框(内置) |

### 8.2 下游输出

| 输出 | 目标 | 说明 |
|-----|------|------|
| tongueData | 辨证场景 | 舌诊结果传递(含supplementNote) |
| supplementNote | 辨证场景 | 补充说明传递(新增) |

---

## 九、测试验收标准

### 9.1 单元测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| 舌象图片slot | 4 | 图片加载/无图片占位/点击放大 |
| 补充说明输入框 | 6 | 输入框渲染/输入获取/最大字符限制 |
| 脉诊移除验证 | 2 | 确认脉诊组件移除 |
| 难度分级逻辑 | 6 | 选项显示控制正确性 |
| 错误反馈生成 | 4 | 反馈内容正确性 |
| **小计** | **22** | |

### 9.2 集成测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| TongueScene引导触发 | 2 | 首次进入显示引导 |
| 舌诊→辨证切换 | 2 | tongueData+supplementNote传递 |
| 难度分级集成 | 2 | ExperienceManager集成 |
| 图片放大弹窗 | 1 | 点击图片弹出放大 |
| **小计** | **7** | |

### 9.3 E2E测试

| 测试项 | 数量 | 内容 |
|-------|------|------|
| 完整舌诊流程 | 2 | 问诊→舌诊→辨证 |
| 补充说明填写 | 1 | 输入补充说明并传递 |
| **小计** | **3** | |

---

## 十、开发任务汇总

| Phase | 内容 | 任务数 |
|-----|------|-------|
| Phase 1 | 舌象图片预留slot | 5 |
| Phase 2 | 补充说明输入框 | 6 |
| Phase 3 | 移除脉诊参考显示 | 4 |
| Phase 4 | 教学引导系统 | 4 |
| Phase 5 | 难度分级机制 | 5 |
| Phase 6 | 错误反馈完善 | 5 |
| Phase 7 | 测试验收 | 32测试 |
| **总计** | - | **29任务+32测试** |

---

## 十一、图片素材预留说明

> **重要**: 舌象图片由用户自行收集，系统仅预留slot。
>
> **图片存放路径**: `public/assets/tongue/`
>
> **命名规范**: `{caseId}_tongue.png`
>
> **示例**:
> - `case_001_tongue.png` - 病案001舌象图
> - `case_002_tongue.png` - 病案002舌象图
> - ...

---

*本文档由 Claude Code 创建，更新于 2026-04-21*