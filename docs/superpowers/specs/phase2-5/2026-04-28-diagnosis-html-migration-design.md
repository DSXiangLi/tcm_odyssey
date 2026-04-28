# 诊断游戏 HTML 直接迁移设计

**创建日期**: 2026-04-28
**状态**: 设计阶段
**参考方案**: 煎药游戏 HTML 直接迁移（已完成）

---

## 一、设计稿结构分析

### 文件清单

| 文件 | 行数 | 功能 |
|------|------|------|
| `诊室门厅.html` | 25 | 门厅入口页面（省略） |
| `中医诊断游戏.html` | 29 | 诊断游戏主入口 |
| `entry-app.jsx` | 203 | 门厅场景+NPC对话+病案弹窗 |
| `app.jsx` | 201 | 诊断游戏主应用（5阶段Tab导航） |
| `case-data.js` | 149 | 病案数据结构 |
| `styles.css` | 435 | 主样式系统 |
| `entry.css` | 54 | 门厅附加样式（省略） |
| `assets.jsx` | ~200 | 印章/头像等组件 |
| `stage-tongue.jsx` | ~250 | 舌诊阶段 |
| `stage-pulse.jsx` | ~250 | 脉诊阶段 |
| `stage-wenzhen.jsx` | ~300 | 问诊阶段 |
| `stage-bianzheng.jsx` | ~150 | 辨证阶段 |
| `stage-xuanfang.jsx` | ~280 | 选方阶段 |
| `tweaks-panel.jsx` | ~350 | 主题切换面板（省略） |

### 核心结构

**诊断游戏布局** (1440×900):
```
┌────────────────────────────────────────────────────┐
│  左侧导航 (220px)     │    主内容区 (1220px)         │
│  ┌─────────────┐      │  ┌──────────────────────┐   │
│  │ 品牌: 悬壶   │      │  │ 页面头部             │   │
│  ├─────────────┤      │  │ - 标题/阶段/病人信息 │   │
│  │ 壹 舌诊 ✓   │      │  ├──────────────────────┤   │
│  │ 贰 脉诊 ○   │      │  │ 页面内容             │   │
│  │ 叁 问诊 ○   │      │  │ - 各阶段组件         │   │
│  │ 肆 辨证 ○   │      │  ├──────────────────────┤   │
│  │ 伍 选方 ○   │      │  │ 底部操作栏           │   │
│  ├─────────────┤      │  │ - 返回/进入下一诊    │   │
│  │ 病案信息    │      │  └──────────────────────┘   │
│  └─────────────┘      │                             │
└────────────────────────────────────────────────────┘
```

**5阶段流程**:
1. **舌诊** - 选择舌色/舌苔/舌型/润燥
2. **脉诊** - 选择脉位/脉势，显示经典脉象文本
3. **问诊** - 对话树选择提问，收集症状线索
4. **辨证** - 汇总前三诊信息，选择证型
5. **选方** - 选择方剂，查看方剂详情

---

## 二、迁移策略

### 入口简化

**省略**: 门厅背景、NPC门铃对话、entry.css
**保留**: 病案弹窗作为诊断游戏入口

**新流程**:
```
病案列表点击 → 病案弹窗 → 开始诊断 → 诊断游戏(5阶段)
NPC对话触发 → 病案弹窗 → 开始诊断 → 诊断游戏(5阶段)
```

### UI简化

**省略**: tweaks-panel.jsx（主题切换面板）
**保留**: 核心诊断流程 + 病案弹窗

---

## 三、触发方式设计

### 方式A: 病案库直接点击

**入口**: `CasesListUI` 病案列表
**触发**: 点击"诊断"按钮
**流程**:
```
CasesListUI → 点击病案 → 弹出病案弹窗 → 点击"开始诊断" → 进入诊断游戏
```

### 方式B: NPC对话触发

**入口**: NPC对话工具调用
**触发**: Hermes Agent 通过 tool_use 调用
**流程**:
```
NPC对话 → tool_use: start_diagnosis → 弹出病案弹窗 → 开始诊断
```

**替换**: 去掉诊所场景快捷键问诊入口（当前可能有快捷键触发问诊）

---

## 四、数据结构设计

### 病案库设计

**文件**: `src/data/diagnosis-cases.ts`

**病案分类**: 外感类内科疾病
- 感冒类（风寒、风热、暑湿）
- 咳嗽类（风寒咳嗽、风热咳嗽、痰湿咳嗽）
- 其他外感（湿阻中焦等）

**数据结构** (参考 case-data.js):
```typescript
interface DiagnosisCase {
  id: string;
  category: string;           // 病案分类
  patient: {
    name: string;
    age: number;
    gender: '男' | '女';
    occupation: string;
    chief: string;             // 主诉
    portrait_desc: string;     // 面容描述
    intro_brief: string;       // 案前引子（不透露病机）
    intro_meta: string[];      // 元信息标签
  };
  tongue: {
    image_caption?: string;    // 舌象图片描述
    correct: {
      color: string;           // 舌色
      coating: string;         // 舌苔
      shape: string;           // 舌型
      moisture: string;        // 润燥
    }
  };
  pulse: {
    classical: string;         // 经典脉象描述
    plain: string;             //通俗脉象描述
    correct: {
      position: string;        // 脉位
      quality: string;         // 脉势
    }
  };
  wenzhen: {
    suggested_questions: string[];
    dialog_tree: Record<string, string>;
    clues: { id: string; label: string; found_by: string[] }[];
  };
  bianzheng: {
    options: { id: string; label: string; correct: boolean }[];
  };
  fang: {
    options: {
      id: string;
      name: string;
      correct: boolean;
      source: string;
      composition: string;
      function: string;
      indication: string;
      note: string;
    }[];
  };
}
```

### 状态传递

**阶段间状态传递** (参考 app.jsx):
```typescript
interface DiagnosisState {
  tongueData: TongueResult;
  pulseData: PulseResult;
  wenzhenData: WenZhenResult;
  bianzhengData: BianZhengResult;
  xuanfangData: XuanFangResult;
}
```

---

## 五、结果处理流程

### 选方完成后

```
诊断完成 → 拼接所有答案 → 调用 Hermes NPC → 获取评分点评 → 记录病案得分 → 进入煎药游戏
```

**答案拼接格式**:
```typescript
interface DiagnosisResult {
  caseId: string;
  patient: PatientInfo;
  diagnosis: {
    tongue: TongueResult;
    pulse: PulseResult;
    symptoms: string[];        // 问诊收集的症状
    syndrome: string;          // 辨证结果
    prescription: string;      // 选方结果
  };
}
```

**Hermes调用**:
```typescript
// 通过 SSE 调用 NPC 评分
eventBus.emit('NPC_EVALUATE_DIAGNOSIS', {
  caseId: case.id,
  diagnosis: diagnosisResult,
  npcId: 'qingmu'
});
```

### 病案库得分显示

**更新**: `CasesListUI` 显示本次诊断得分
**状态**: 病案状态从"待诊"变为"已诊"

---

## 六、迁移文件规划

### 新增文件

| 文件 | 功能 |
|------|------|
| `src/ui/html/diagnosis.css` | 合并 styles.css（去掉主题切换相关） |
| `src/ui/html/data/diagnosis-cases.ts` | 病案库数据 |
| `src/ui/html/DiagnosisUI.tsx` | React 主组件（合并 app.jsx） |
| `src/ui/html/CaseIntroModal.tsx` | 病案弹窗组件（从 entry-app.jsx 提取） |
| `src/ui/html/components/TongueStage.tsx` | 舌诊阶段 |
| `src/ui/html/components/PulseStage.tsx` | 脉诊阶段 |
| `src/ui/html/components/WenZhenStage.tsx` | 问诊阶段 |
| `src/ui/html/components/BianZhengStage.tsx` | 辨证阶段 |
| `src/ui/html/components/XuanFangStage.tsx` | 选方阶段 |
| `src/ui/html/components/Assets.tsx` | 印章/头像组件（从 assets.jsx） |

### 修改文件

| 文件 | 修改 |
|------|------|
| `src/scenes/ClinicScene.ts` | 添加诊断游戏入口（去掉问诊快捷键） |
| `src/ui/CasesListUI.ts` | 添加"诊断"按钮触发病案弹窗 |
| `src/systems/CaseManager.ts` | 添加诊断结果记录 |
| `gateway/platforms/game_adapter.py` | 添加 start_diagnosis 工具 |

### Phaser 集成

**参考煎药游戏方案**:
- DOM 容器挂载 React UI
- CustomEvent 桥接双向通信
- 场景切换时清理 React Root

---

## 七、与现有代码的关系

### 废弃文件

诊断游戏完成后，以下文件将废弃：
- `src/scenes/InquiryScene.ts` → 合并入诊断游戏问诊阶段
- `src/scenes/PulseScene.ts` → 合并入诊断游戏脉诊阶段
- `src/scenes/TongueScene.ts` → 合并入诊断游戏舌诊阶段
- `src/scenes/DiagnosisPrescriptionScene.ts` → 合并入诊断游戏辨证选方阶段
- `src/ui/InquiryUI.ts` → 废弃
- `src/ui/PulseUI.ts` → 废弃
- `src/ui/TongueUI.ts` → 废弃
- `src/ui/SyndromeUI.ts` → 废弃
- `src/ui/PrescriptionUI.ts` → 废弃

### 保留系统

- `CaseManager` - 病案管理（更新数据结构）
- `ScoringSystem` - 评分逻辑（可能需要适配）
- `DiagnosisFlowManager` - 可能废弃，流程由 React 组件管理

---

## 八、已确认事项

### 1. 病案库数量 ✅
**10个病案**，覆盖外感类内科疾病：
- 感冒类：风寒感冒、风热感冒、暑湿感冒
- 咳嗽类：风寒咳嗽、风热咳嗽、痰湿咳嗽
- 其他：湿阻中焦、外感风寒兼内伤湿滞、风寒袭肺、风热犯肺

### 2. 舌诊图片 ✅
**方案B**: 预留占位符，后续填充真实舌象图片
- 图片存放路径: `public/assets/tongue/{caseId}.png`
- 当前使用文字描述占位
- 组件预留 `<img>` 标签位置

### 3. NPC评分处理 ✅
**暂不实现**，预留触发点：
- 选方完成后 → 触发事件 `DIAGNOSIS_COMPLETE`
- 事件携带完整诊断结果
- NPC对话框由 Hermes Agent 管理，不在本游戏内实现

### 4. 煎药衔接 ✅
**暂不实现**，由 NPC 工具调用触发：
- 诊断游戏不直接跳转煎药
- NPC 评分结束后通过 tool_use 调用 `start_decoction`
- 本游戏仅需预留诊断结果输出接口

---

## 九、参考文档

- [煎药游戏 HTML 直接迁移设计](./2026-04-26-decoction-direct-migration-design.md)
- [煎药流程串联 TODO](./2026-04-28-decoction-flow-integration-todo.md)
- [辨证选方小游戏设计](./minigames/2026-04-21-diagnosis-prescription-minigame-design.md)

---

*本文档由 Claude Code 维护，创建于 2026-04-28*