# Phaser场景Reuse机制问题 - 2026-04-13

## 问题描述

**症状**: 玩家第一次可以成功进入建筑（药园、诊所、家），但从室内返回后无法再次进入同一建筑。

**表象**:
- 第一次进入成功
- 返回室外成功
- 再次按空格键无法触发门交互

## 根本原因

**Phaser场景Reuse机制**: 当调用`scene.start(sleepingScene)`时，Phaser会reuse现有场景实例，而不是完全重新创建。

**关键发现**:
```
// 测试日志显示:
LOG: [TownOutdoorScene] create() called, initializing scene...
// 但检查场景状态:
townIsTransitioning: true  // ← 应该是false，但保留了旧值！
```

这意味着：
1. `create()`被调用（日志可见）
2. 但类字段`isTransitioning`保留了旧值`true`
3. TypeScript类字段的默认值`private isTransitioning: boolean = false`只在第一次创建时生效
4. 场景reuse时，字段不会被重置

## Phaser场景生命周期

```
首次启动: new Scene() → 字段初始化(默认值) → create()
再次启动: reuse实例 → 字段保留旧值 → create()  ← 问题所在！
```

**错误假设**: 认为每次`create()`调用时，类字段会自动重置为默认值。
**实际情况**: 场景实例被reuse，字段值被保留。

## 解决方案

在所有场景的`create()`方法开头**显式重置**关键状态字段：

```typescript
create(): void {
  // ⭐ 关键修复：显式重置isTransitioning
  // Phaser场景reuse时，类字段可能保留旧值
  this.isTransitioning = false;

  // 初始化其他组件...
}
```

**需要显式重置的字段类型**:
- 状态标志位（如`isTransitioning`）
- 计数器/索引
- 临时存储的数据
- 任何会影响场景行为的字段

**不需要重置的字段**:
- 在`create()`中会被重新赋值的字段（如`this.player = new Player()`）
- 在`shutdown()`中已清理的资源引用

## 修改文件清单

| 文件 | 修改位置 | 修改内容 |
|-----|---------|---------|
| `src/scenes/TownOutdoorScene.ts` | create()开头 | `this.isTransitioning = false;` |
| `src/scenes/ClinicScene.ts` | create()开头 | `this.isTransitioning = false;` |
| `src/scenes/GardenScene.ts` | create()开头 | `this.isTransitioning = false;` |
| `src/scenes/HomeScene.ts` | create()开头 | `this.isTransitioning = false;` |

## 验证方法

使用E2E测试验证完整流程：
```typescript
// 测试流程
1. 进入建筑 → 验证场景切换
2. 返回室外 → 验证场景切换
3. 再次进入 → 验证场景切换（关键！）
```

## 相关陷阱

### 陷阱1: shutdown()中重置 ≠ create()中重置

```typescript
// ❌ 错误做法：只在shutdown()中重置
shutdown(): void {
  this.isTransitioning = false;  // 场景reuse时不调用shutdown()
}

// ✅ 正确做法：在create()中显式重置
create(): void {
  this.isTransitioning = false;  // 每次场景激活都会执行
}
```

### 陷阱2: wake事件监听器不触发

尝试在create()中订阅wake事件：
```typescript
this.events.on('wake', () => {
  this.isTransitioning = false;
});
```

**实际行为**: Phaser调用`scene.start()`时，场景被重新创建（create被调用），而不是从sleep状态唤醒。wake事件不会被触发。

### 陷阱3: 类字段默认值误导

```typescript
private isTransitioning: boolean = false;  // 只在首次创建时生效
```

这个语法糖让人误以为每次create()字段都会重置，但实际上：
- 首次创建: 字段初始化为false
- Reuse场景: 字段保持旧值

## 最佳实践

**原则**: 所有状态标志位必须在`create()`开头显式重置。

```typescript
create(): void {
  // 1. 重置所有状态标志
  this.isTransitioning = false;
  this.dialogShown = false;
  this.casesInitialized = false;
  // ... 其他状态字段

  // 2. 初始化事件系统
  this.eventBus = EventBus.getInstance();

  // 3. 创建场景组件
  this.createBackground();
  this.createPlayer();
  // ...
}
```

## 参考资料

- Phaser Scene生命周期: https://phaser.io/docs/3.60.0/Phaser.Scene.html
- 场景Reuse机制: scene.start()对sleeping场景的处理

---

**教训**: 不要依赖类字段默认值在场景reuse时生效。必须在create()中显式重置关键状态。