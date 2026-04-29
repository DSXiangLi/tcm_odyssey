# 弹窗尺寸与旧代码清理原则

**创建日期**: 2026-04-29
**触发事件**:
1. 弹窗尺寸超过游戏视窗，感觉像切换到另一个游戏
2. 旧的问诊系统残留，与新诊断游戏功能重叠

---

## 问题1: 弹窗尺寸不一致

### 发现

用户反馈："煎药和诊断游戏是否应该比游戏本身的视窗要小一点？不然感觉都像是两个游戏了"

### 分析

| 组件 | 原尺寸 | 游戏视窗 | 问题 |
|------|--------|---------|------|
| 煎药弹窗 | 1200×760 | 1280×720 | 高度超过游戏（760>720）|
| 诊断弹窗 | 1200×720 | 1280×720 | 完全覆盖，无边距 |

### 正确做法

**弹窗应该比游戏视窗小10-15%**：
- 游戏视窗：1280×720
- 弹窗尺寸：1020×640
- 边距：左右130px，上下40px

这样玩家能感知这是游戏内的弹窗/活动，而不是切换到另一个独立游戏。

### 统一标准

```
// src/ui/html/*.css 中统一弹窗尺寸
.modal-or-app {
  width: 1020px;   // 比1280小约20%
  height: 640px;   // 比720小约12%
}
```

---

## 问题2: 旧代码残留

### 发现

新的诊断游戏(DiagnosisScene)已整合：
- 舌诊
- 脉诊
- 问诊
- 辨证
- 选方

但旧的InquiryScene仍在game.config.ts中注册，导致代码重复和混淆。

### 分析

旧场景残留：
- `InquiryScene.ts` - 问诊场景
- `PulseScene.ts` - 脉诊场景
- `TongueScene.ts` - 舌诊场景
- `SyndromeScene.ts` - 辨证场景
- `PrescriptionScene.ts` - 选方场景

这些场景仍在：
- `src/config/game.config.ts` 的 scene 数组中
- `src/scenes/ClinicScene.ts` 的入口引用中
- `src/data/constants.ts` 的 SCENES 常量中

### 正确做法

**功能合并后立即清理**：

1. 从 `game.config.ts` 移除旧场景import和注册
2. 更新入口场景引用（如ClinicScene中的场景切换）
3. 在旧文件头部添加 `@deprecated` 注释
4. 更新 `constants.ts` 移除或标记废弃常量

### 清理流程

```typescript
// 1. game.config.ts - 移除旧场景
// 以下场景已废弃，由 DiagnosisScene 整合：
// - InquiryScene → DiagnosisScene.wenzhen
// - PulseScene → DiagnosisScene.pulse
// ...

// 2. ClinicScene.ts - 更新入口
this.scene.start(SCENES.DIAGNOSIS, { caseId });  // 新入口

// 3. 旧场景文件 - 添加废弃注释
/**
 * @deprecated Phase 2.5 后已废弃
 * 请使用 DiagnosisScene (HTML直接迁移版本)
 */
```

---

## 检查清单

每次功能合并或重构后：

- [ ] 是否从 `game.config.ts` 移除了旧场景？
- [ ] 是否更新了所有入口场景引用？
- [ ] 是否在旧文件添加了 `@deprecated` 注释？
- [ ] 是否统一了弹窗尺寸（比游戏视窗小）？
- [ ] 是否更新了 `constants.ts` 的场景常量？

---

*本文档由 Phase 2.5 诊断游戏开发过程中发现的问题触发创建*
*日期: 2026-04-29*