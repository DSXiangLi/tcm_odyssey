# 选方游戏设计文档

**版本**: v1.0
**日期**: 2026-04-19
**状态**: 设计阶段
**所属场景**: PrescriptionScene
**关联NPC**: 青木先生

---

## 一、游戏概述

### 1.1 游戏定位

选方是诊断流程的最后环节（问诊→脉诊→舌诊→辨证→选方），玩家根据辨证结果选择合适的方剂，是中医治疗的核心决策环节。

### 1.2 核心玩法

| 玩法要素 | 描述 |
|---------|------|
| **学习目标** | 掌握解表类方剂(桂枝汤/麻黄汤/银翘散/桑菊饮)的适应证与组成 |
| **操作方式** | 选择方剂 + 查看组成详情 + 方剂加减(解锁后) |
| **难度设计** | 初级(提示证型)→中级(无提示)→高级(方剂加减) |
| **反馈机制** | 正确显示方剂分析，错误显示正确方剂+对比解释 |

### 1.3 游戏时长

- 单次选方: 45-90秒
- 完整流程: 2-3分钟

---

## 二、与其他游戏关联

### 2.1 上游依赖

| 来源 | 数据依赖 | 说明 |
|-----|---------|------|
| 辨证 | syndromeData.syndromeType | 证型决定方剂选择 |
| 病案 | caseData.prescription | 正确答案 |
| 经验值 | experienceData | 方剂加减解锁状态 |

### 2.2 下游输出

| 输出数据 | 目标 | 说明 |
|---------|-----|------|
| prescriptionId: string | 煎药 | 煎药时使用所选方剂 |
| prescriptionCorrect: boolean | FlowManager | 记录选方正确性 |
| adjustmentData | 煎药(高级) | 方剂加减修改 |

### 2.3 数据流向图

```
辨证(Syndrome)                     病案数据 + 经验值
     │                                  │
     │ syndromeType                     │ prescription + unlocks
     │                                  │
     ▼                                  ▼
┌─────────────────────────────────────────────┐
│              选方 (PrescriptionScene)        │
│                                             │
│  输入: syndromeType + 解锁状态              │
│  输出: prescriptionId + adjustmentData      │
│       + prescriptionCorrect                 │
└─────────────────────────────────────────────┘
     │
     │ prescriptionData
     ▼
煎药(Decoction) → NPC反馈 → ResultUI
```

---

## 三、游戏流程设计

### 3.1 主流程

```
开始选方
    │
    ▼
显示辨证结果 + 症状舌脉汇总
    │
    ▼
显示方剂选项列表 ──────────────────────┐
    │                                  │ 可点击查看
    │ ○ 麻黄汤                         │ 方剂详情
    │ ○ 桂枝汤                         │
    │ ○ 银翘散                         │
    │ ○ 桑菊饮                         │
    │                                  │
    ▼                                  │
选择方剂                                │
    │                                  │
    ▼                                  │
查看方剂详情                             │
    │                                   │
    ├── 组成药材                        │
    ├── 功效主治                        │
    ├── 方剂加减(已解锁时显示)           │
    │                                   │
    ▼                                   │
确认选方                                 │
    │                                   │
    ▼                                   │
验证正确性                               │
    │                                   │
    ├── 正确 ──► 显示方剂分析           │
    │                                   │
    ├── 错误 ──► 显示正确方剂+对比      │
    │                                   │
    ▼                                   │
记录到DiagnosisFlowManager              │
    │                                   │
    ▼                                   │
切换到煎药场景                           │
```

### 3.2 方剂加减流程(高级解锁)

```
点击[方剂加减]按钮
    │
    ▼
显示加减界面
    │
    ├── 原方组成显示
    │
    ├── 可加减药材选择
    │   ├── 加: 选择额外药材
    │   └── 减: 移除原有药材
    │
    ▼
加减理由输入
    │
    ▼
保存加减方案
    │
    ▼
返回方剂选择界面
```

---

## 四、方剂知识系统

### 4.1 一期方剂数据

| 方剂 | 适应证 | 核心区别 |
|-----|-------|---------|
| 麻黄汤 | 风寒表实证 | 恶寒无汗+浮紧脉 |
| 桂枝汤 | 风寒表虚证 | 恶风有汗+浮缓脉 |
| 银翘散 | 风热表证 | 发热咽痛+浮数脉 |
| 桑菊饮 | 风温初起 | 发热咳嗽+浮数脉 |

### 4.2 方剂对比要点

```
麻黄汤 vs 桂枝汤:
- 共同点: 治风寒表证
- 区别点: 无汗vs有汗, 表实vs表虚
- 脉象区分: 紧脉vs缓脉

银翘散 vs 桑菊饮:
- 共同点: 治风热表证
- 区别点: 咽痛为主vs咳嗽为主
- 方向区分: 清热解毒vs宣肺止咳
```

---

## 五、数据结构

### 5.1 输入数据

```typescript
interface PrescriptionInputData {
  caseId: string;
  correctPrescription: string;

  // 上游数据
  syndromeType: string;         // 辨证结果
  clueData: {...};
  pulseData: {...};
  tongueData: {...};

  // 解锁状态
  unlockedAdjustments: boolean; // 是否解锁方剂加减
}
```

### 5.2 输出数据

```typescript
interface PrescriptionOutputData {
  prescriptionId: string;
  prescriptionName: string;
  isCorrect: boolean;
  adjustmentData?: {
    addedHerbs: string[];
    removedHerbs: string[];
    reason: string;
  };
  score: number;
  feedback: string;
}
```

---

## 六、当前实现状态

### 6.1 已实现功能

| 功能 | 状态 |
|-----|------|
| PrescriptionUI基础框架 | ✅ |
| 方剂列表(4个) | ✅ |
| 方剂详情展示 | ✅ |
| 方剂加减按钮(锁定) | ✅ |
| ○/●选中状态 | ✅ |
| 退出按钮 | ✅ |
| 正确性验证 | ✅ |
| prescriptions.json数据 | ✅ |

### 6.2 缺失功能

| 功能 | 优先级 |
|-----|-------|
| 方剂加减解锁机制 | P0 |
| 加减药材选择界面 | P1 |
| 方剂对比功能 | P1 |
| 组成可视化(君臣佐使) | P1 |
| 配伍禁忌检查 | P1 |
| 方歌背诵辅助 | P2 |
| 剂量计算 | P2 |
| 煎法提示 | P1 |
| 教学引导系统 | P0 |
| 错误对比反馈 | P0 |
| 辨证结果参考显示 | P0 |
| 方剂知识卡片 | P1 |

---

## 七、相关文档

- [UI组件系统设计](../2026-04-19-ui-component-system-design.md)
- [辨证游戏设计](./2026-04-19-syndrome-minigame-design.md)
- [煎药游戏设计](./2026-04-19-decoction-minigame-design.md)

---

*本文档由 Claude Code 创建，更新于 2026-04-19*