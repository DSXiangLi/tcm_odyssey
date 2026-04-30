# 场景并行运行时 isTransitioning 状态未重置

**日期**: 2026-04-30
**场景**: DiagnosisScene/DecoctionScene 退出后，Z/C/D键盘操作失效

## 问题现象

用户点击 Z 键能进入诊断游戏（第一次），但退出后：
- 再按 Z 无法进入诊断
- 按 C 无法看病案
- 按 D 无法进入煎药
- 但按 B 能打开背包（正常）

**关键线索**：背包正常，其他功能失效 → 问题与特定键盘操作相关。

## 根本原因分析

**Phase 1: 追踪键盘响应逻辑**

检查 ClinicScene 的键盘处理：

```typescript
// 第1052行
if (Phaser.Input.Keyboard.JustDown(this.diagnosisKey) && !this.isTransitioning) {
  this.startDiagnosis('case-001');
}
```

所有 Z/C/D 键盘操作都检查 `!this.isTransitioning` 条件。

**Phase 2: 追踪 isTransitioning 生命周期**

```typescript
// startDiagnosis 方法（第677行）
this.isTransitioning = true;
this.scene.launch(SCENES.DIAGNOSIS, { caseId, returnScene: SCENES.CLINIC });
```

当启动诊断场景时，`isTransitioning` 设为 `true`。

ClinicScene 监听 `wake` 事件来重置：

```typescript
// 第117-122行
this.events.on('wake', () => {
  this.isTransitioning = false;
  ...
});
```

**关键发现**：`scene.launch()` + `scene.stop()` 组合不会触发 `wake` 事件！

- `scene.launch()` - 启动新场景，当前场景保持 running 状态
- `scene.stop()` - 停止子场景，父场景仍在 running（未被 sleep）
- `wake` 事件 - 只有从 sleep 状态唤醒时才触发

所以 `isTransitioning` 永远不会被重置！

## 修复方案

**监听 SCENE_SWITCH 事件重置状态**：

```typescript
// ClinicScene.ts create() 方法中添加
this.eventBus.on(GameEvents.SCENE_SWITCH, (data: EventData) => {
  // 当子场景退出并返回 ClinicScene 时，重置 isTransitioning
  if (data.to === SCENES.CLINIC && data.from !== SCENES.CLINIC) {
    this.isTransitioning = false;
    console.log(`[ClinicScene] SCENE_SWITCH from ${data.from} to ${data.to}, isTransitioning reset`);
  }
});
```

DiagnosisScene/DecoctionScene 退出时都会发送 SCENE_SWITCH 事件：

```typescript
// DiagnosisScene.ts
this.eventBus.emit(GameEvents.SCENE_SWITCH, {
  from: 'DiagnosisScene',
  to: this.returnScene
});
this.scene.stop();
```

## 教训总结

### Phaser 场景切换机制

| 方法 | 当前场景状态 | 新场景状态 | wake事件 |
|------|-------------|-----------|---------|
| `scene.start()` | 停止 | 启动 | ❌ |
| `scene.launch()` | 保持running | 启动 | ❌ |
| `scene.sleep()` | sleep | - | - |
| `scene.stop()` | -（停止自己） | - | ❌ |

**关键理解**：
- `wake` 事件只在 `sleep()` → `wake()` 时触发
- `launch()` + `stop()` 组合：父场景始终 running，不会触发 wake
- 需要通过 EventBus 事件通信来重置状态

### 状态管理原则

1. **明确状态所有权** - `isTransitioning` 属于 ClinicScene，必须由 ClinicScene 管理
2. **跨场景通信使用 EventBus** - 不要依赖 Phaser 内部事件（wake/shutdown）
3. **测试需验证恢复** - 测试不仅要验证"能进入"，还要验证"退出后能再次进入"

## E2E测试补充建议

```typescript
test('should be able to re-enter diagnosis after closing', async ({ page }) => {
  // 第一次进入
  await enterDiagnosis(page);
  await closeDiagnosis(page);

  // 等待状态重置
  await page.waitForTimeout(1000);

  // 第二次进入 - 验证状态已恢复
  await enterDiagnosis(page);
  const uiVisible = await page.locator('.app').isVisible();
  expect(uiVisible).toBe(true);
});
```

## 影响范围

- ClinicScene.ts - 已修复（添加 SCENE_SWITCH 监听）
- DiagnosisScene.ts - 正常（已发送 SCENE_SWITCH）
- DecoctionScene.ts - 正常（已发送 SCENE_SWITCH）

---

# 事件监听器移除失败（之前的修复）

**日期**: 2026-04-30
**场景**: DiagnosisScene/DecoctionScene 退出后游戏卡死

## 问题现象

用户点击"退出诊断"按钮后，虽然诊断弹窗关闭了，但整个游戏页面卡住，无法继续操作。

## 根本原因

**错误的 removeEventListener 用法**:

```typescript
// ❌ 错误：传入空函数无法移除原始监听器
window.removeEventListener(DIAGNOSIS_EVENTS.CLOSE, (() => {}) as EventListener);
```

**原因分析**:
- `addEventListener` 和 `removeEventListener` 需要传入**相同的函数引用**才能正确移除
- 传入空函数 `(() => {})` 创建了一个新的函数，与原始监听器不同
- 导致原始监听器未被移除，继续占用事件队列
- 可能导致内存泄漏和事件处理混乱

## 修复方案

**保存监听器引用**:

```typescript
// ✅ 正确：保存监听器引用
export class DiagnosisScene extends Phaser.Scene {
  // 添加监听器引用属性
  private boundCompleteHandler: EventListener | null = null;
  private boundCloseHandler: EventListener | null = null;

  private setupBridgeEventListeners(): void {
    // 保存监听器引用
    this.boundCompleteHandler = ((e: CustomEvent) => {
      const result = e.detail as DiagnosisResult;
      this.handleDiagnosisComplete(result);
    }) as EventListener;

    this.boundCloseHandler = (() => {
      this.returnToPreviousScene();
    }) as EventListener;

    // 使用保存的引用添加监听器
    window.addEventListener(DIAGNOSIS_EVENTS.COMPLETE, this.boundCompleteHandler);
    window.addEventListener(DIAGNOSIS_EVENTS.CLOSE, this.boundCloseHandler);
  }

  private cleanupReactUI(): void {
    // 使用保存的引用正确移除监听器
    if (this.boundCompleteHandler) {
      window.removeEventListener(DIAGNOSIS_EVENTS.COMPLETE, this.boundCompleteHandler);
      this.boundCompleteHandler = null;
    }
    if (this.boundCloseHandler) {
      window.removeEventListener(DIAGNOSIS_EVENTS.CLOSE, this.boundCloseHandler);
      this.boundCloseHandler = null;
    }
  }
}
```

## 教训总结

1. **removeEventListener 必须使用相同引用** - 传入新函数无法移除原始监听器
2. **类属性保存引用** - 在类中添加属性保存监听器函数引用
3. **清理时检查引用** - 移除后立即设为 null，避免重复移除
4. **测试需验证退出后恢复** - E2E测试不仅要验证弹窗关闭，还要验证游戏可继续操作

## E2E测试补充建议

现有测试只验证场景状态，未验证游戏是否可继续操作。建议添加：

```typescript
test('should resume game after closing diagnosis', async ({ page }) => {
  // ... 关闭诊断后 ...

  // 验证玩家可以继续操作
  const playerCanMove = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const clinicScene = game.scene.getScene('ClinicScene');
    return clinicScene?.input?.enabled ?? false;
  });
  expect(playerCanMove).toBe(true);
});
```

## 检测方法

退出小游戏后尝试：
1. 键盘移动玩家
2. 点击NPC对话
3. 打开背包（B键）

如果以上操作无响应，说明事件监听器未正确清理。