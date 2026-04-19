# 舌诊游戏设计文档

**版本**: v1.0
**日期**: 2026-04-19
**状态**: 设计阶段
**所属场景**: TongueScene
**关联NPC**: 青木先生

---

## 一、游戏概述

### 1.1 游戏定位

舌诊是中医诊断流程的第三环节（问诊→脉诊→舌诊→辨证→选方），玩家通过观察舌象描述或图片，判断舌体颜色、舌苔、舌形、润燥，为辨证提供关键信息。

### 1.2 核心玩法

| 玩法要素 | 描述 |
|---------|------|
| **学习目标** | 掌握常见舌象特征与临床意义(舌体颜色/舌苔/舌形/润燥) |
| **操作方式** | 根据描述或图片选择舌体颜色、舌苔、舌形、润燥 |
| **难度设计** | 初级(识别1项+图片)→中级(识别2项+文字描述)→高级(识别4项+古文) |
| **反馈机制** | 选择正确显示解析，选择错误显示正确答案+临床意义 |

### 1.3 游戏时长

- 单次舌诊: 45-90秒
- 完整流程(含教学): 3-4分钟

---

## 二、与其他游戏关联

### 2.1 上游依赖

| 来源游戏 | 数据依赖 | 说明 |
|---------|---------|------|
| **问诊(Inquiry)** | clueData.symptoms | 症状可提示舌象特征 |
| **脉诊(Pulse)** | pulseData.position/tension | 脉诊结果作为舌诊参考 |
| **病案数据(core_cases)** | caseData.tongue | 正确答案来自病案定义 |

### 2.2 下游输出

| 输出数据 | 目标游戏 | 说明 |
|---------|---------|------|
| tongueBody: string | 辨证(Syndrome) | 辨证时显示舌体颜色 |
| tongueCoat: string | 辨证(Syndrome) | 辨证时显示舌苔 |
| tongueShape: string | 辨证(Syndrome) | 辨证时显示舌形 |
| tongueMoist: string | 辨证(Syndrome) | 辨证时显示润燥 |
| tongueCorrect: boolean | DiagnosisFlowManager | 记录舌诊正确性 |

### 2.3 数据流向图

```
问诊(Inquiry) + 脉诊(Pulse)          病案数据(core_cases)
     │                                  │
     │ clueData + pulseData             │ caseData.tongue
     │                                  │
     ▼                                  ▼
┌─────────────────────────────────────────────┐
│              舌诊 (TongueScene)              │
│                                             │
│  输入: 症状+脉象提示 + 舌象描述/图片          │
│  输出: tongueBody + tongueCoat              │
│       + tongueShape + tongueMoist           │
│       + tongueCorrect                       │
└─────────────────────────────────────────────┘
     │
     │ tongueData
     ▼
辨证(Syndrome) → 选方(Prescription)
```

---

## 三、游戏流程设计

### 3.1 主流程

```
开始舌诊
    │
    ▼
接收脉诊数据 (作为参考)
    │
    ▼
显示教学引导 (首次进入时)
    │
    ▼
显示舌象描述/图片 ──────────────────────┐
    │                                  │
    ▼                                  │ 可点击放大
选择舌体颜色 (淡红/红/绛红/青紫)        │ 查看详情
    │                                  │
    ▼                                  │
选择舌苔 (薄白/厚白/薄黄/厚黄)          │
    │                                  │
    ▼                                  │
选择舌形 (正常/胖大/瘦薄/裂纹)          │
    │                                  │
    ▼                                  │
选择润燥 (润/燥/滑)                     │
    │                                  │
    ▼                                  │
确认选择                                 │
    │                                   │
    ▼                                   │
验证正确性                               │
    │                                   │
    ├── 正确 ──► 显示解析 + 继续         │
    │                                   │
    ├── 部分正确 ──► 显示部分正确解析   │
    │                                   │
    ├── 错误 ──► 显示正确答案 + 解释    │
    │                                   │
    ▼                                   │
记录到DiagnosisFlowManager              │
    │                                   │
    ▼                                   │
切换到辨证场景                           │
    ▼
结束舌诊
```

### 3.2 舌象图片查看流程

```
点击舌象图片
    │
    ▼
放大显示舌象图片
    │
    ├── 可标注区域
    │   ├── 舌体颜色区域 (高亮)
    │   ├── 舔苔分布区域 (高亮)
    │   └── 舌形特征区域 (高亮)
    │
    ▼
点击区域显示解释
    │
    ▼
点击关闭返回选择界面
```

---

## 四、UI组件设计

### 4.1 界面布局

```
┌─────────────────────────────────────────────────────┐
│                     [退出诊断]                        │
│                                                     │
│                    青木诊所 - 望舌                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌───────────────┐  ┌─────────────────────────────┐│
│   │               │  │ 舌象描述:                    ││
│   │  舌象图片     │  │ "舌质淡红，苔薄白，舌体正常" ││
│   │   (可点击)    │  │                              ││
│   │               │  │ 已判断脉象: 浮紧             ││  ← 参考信息
│   │               │  │                              ││
│   └───────────────┘  └─────────────────────────────┘│
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   舌体颜色: ○淡红 ○红 ○绛红 ○青紫                    │
│                                                     │
│   舌苔:    ○薄白 ○厚白 ○薄黄 ○厚黄                   │
│                                                     │
│   舌形:    ○正常 ○胖大 ○瘦薄 ○裂纹                   │
│                                                     │
│   润燥:    ○润 ○燥 ○滑                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [确认选择]                                         │
│                                                     │
│   提示: 根据"恶寒"症状，舌质可能偏淡                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 组件清单

| 组件名 | 类型 | 数量 | 说明 |
|-------|------|-----|------|
| backgroundGraphics | Graphics | 1 | 3D边框背景 |
| titleText | Text | 1 | "青木诊所 - 望舌" |
| exitButton | Text | 1 | [退出诊断] |
| tongueImageCard | Container | 1 | 舌象图片卡片(可点击放大) |
| tongueDescriptionText | Text | 1 | 舌象描述 |
| pulseReferenceText | Text | 1 | 已判断脉象参考 |
| bodyButtons | SelectionButton | 4 | 舌体颜色选择 |
| coatButtons | SelectionButton | 4 | 舌苔选择 |
| shapeButtons | SelectionButton | 4 | 舌形选择 |
| moistButtons | SelectionButton | 3 | 润燥选择 |
| confirmButton | Text | 1 | [确认选择] |
| hintText | Text | 1 | 症状提示 |

---

## 五、数据结构

### 5.1 输入数据

```typescript
interface TongueInputData {
  caseId: string;
  tongueDescription: string;    // 古文描述
  tongueImage?: string;         // 舌象图片路径(可选)
  correctBody: string;          // 正确舌体颜色
  correctCoat: string;          // 正确舌苔
  correctShape: string;         // 正确舌形
  correctMoist: string;         // 正确润燥

  // 上游数据
  pulseData?: {
    position: string;
    tension: string;
  };
  clueData?: {
    symptoms: string[];
  };

  playerLevel: 'beginner' | 'intermediate' | 'advanced';
}
```

### 5.2 输出数据

```typescript
interface TongueOutputData {
  tongueBody: string;           // 玩家选择舌体颜色
  tongueCoat: string;           // 玩家选择舌苔
  tongueShape: string;          // 玩家选择舌形
  tongueMoist: string;          // 玩家选择润燥
  isCorrect: boolean;           // 是否完全正确
  partialScore: {
    bodyCorrect: boolean;
    coatCorrect: boolean;
    shapeCorrect: boolean;
    moistCorrect: boolean;
  };
  score: number;                // 总分(0-100)
  feedback: string;
  timeSpent: number;
}
```

### 5.3 舌象知识卡片数据

```typescript
interface TongueKnowledgeCard {
  category: 'body' | 'coat' | 'shape' | 'moist';
  type: string;                 // 类型(淡红/红/...)
  description: string;          // 古文描述
  modernDescription: string;    // 现代描述
  clinicalSignificance: string; // 临床意义
  relatedSymptoms: string[];
  relatedSyndromes: string[];
  image?: string;               // 示意图
}
```

---

## 六、评分系统

### 6.1 评分维度

| 维度 | 权重 | 评分标准 |
|-----|-----|---------|
| 舌体颜色 | 25% | 正确25分，错误0分 |
| 舌苔 | 25% | 正确25分，错误0分 |
| 舌形 | 25% | 正确25分，错误0分 |
| 润燥 | 25% | 正确25分，错误0分 |
| 用时加分 | +10% | <45秒+10分，45-90秒+5分 |

---

## 七、当前实现状态

### 7.1 已实现功能

| 功能 | 状态 |
|-----|------|
| TongueUI基础框架 | ✅ |
| 舌体颜色选项(淡红/红/绛红/青紫) | ✅ |
| 舌苔选项(薄白/厚白/薄黄/厚黄) | ✅ |
| 舌形选项(正常/胖大/瘦薄/裂纹) | ✅ |
| 润燥选项(润/燥/滑) | ✅ |
| ○/●选中状态 | ✅ |
| 退出按钮 | ✅ |
| 正确性验证 | ✅ |

### 7.2 缺失功能

| 功能 | 优先级 |
|-----|-------|
| 舌象图片展示 | P0 |
| 图片放大查看 | P1 |
| 区域标注高亮 | P2 |
| 教学引导系统 | P0 |
| 难度分级机制 | P0 |
| 错误反馈解释 | P0 |
| 脉诊结果参考显示 | P1 |
| 舌象知识卡片 | P1 |
| 对比学习(正常vs病理) | P2 |
| 部分正确评分 | P1 |

---

## 八、相关文档

- [UI组件系统设计](../2026-04-19-ui-component-system-design.md)
- [脉诊游戏设计](./2026-04-19-pulse-minigame-design.md)
- [辨证游戏设计](./2026-04-19-syndrome-minigame-design.md)

---

*本文档由 Claude Code 创建，更新于 2026-04-19*