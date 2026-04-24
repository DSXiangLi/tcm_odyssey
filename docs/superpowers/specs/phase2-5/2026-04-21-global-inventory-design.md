# 全局背包系统设计

**日期**: 2026-04-21
**状态**: ✅ 已完成
**优先级**: 中

---

## 1. 变更目标

将背包从诊所专属功能改为全局功能，确保玩家在任意场景都能按B键打开背包。

---

## 2. 当前架构分析

### 2.1 现有实现

| 组件 | 当前状态 | 问题 |
|-----|---------|------|
| `InventoryManager` | 单例模式 | ✅ 数据已全局共享 |
| `InventoryUI` | 场景内创建 | ❌ 每个场景独立创建，非全局 |
| B键监听 | 仅ClinicScene | ❌ 其他场景无法触发 |
| 全局状态暴露 | `__INVENTORY_OPEN__` | ⚠️ 仅用于UI状态检查 |

### 2.2 涉及场景

| 场景 | 当前背包支持 | 需要变更 |
|-----|-------------|---------|
| TownOutdoorScene | ❌ 无 | 添加B键监听 |
| ClinicScene | ✅ 完整 | 移除本地逻辑，改用全局 |
| GardenScene | ❌ 无 | 添加B键监听 |
| HomeScene | ❌ 无 | 添加B键监听 |
| InquiryScene | ❌ 无 | 添加B键监听（可选） |
| DecoctionScene | ❌ 无 | 不需要（游戏内场景） |
| ProcessingScene | ❌ 无 | 不需要（游戏内场景） |

---

## 3. 变更方案

### 方案A: 全局背包管理器（推荐）

创建 `GlobalInventoryManager` 类，管理背包UI的生命周期：

```typescript
// src/systems/GlobalInventoryManager.ts
class GlobalInventoryManager {
  private static instance: GlobalInventoryManager;
  private currentUI: InventoryUI | null = null;
  private currentScene: Phaser.Scene | null = null;

  // 核心方法
  toggle(scene: Phaser.Scene): void;
  show(scene: Phaser.Scene): void;
  hide(): void;
  isShowing(): boolean;
}
```

**优点**:
- 背包UI跨场景复用，避免重复创建
- 统一管理，逻辑集中
- 与现有单例模式一致

**缺点**:
- 需要处理场景切换时UI销毁/重建
- Phaser UI组件跨场景传递较复杂

### 方案B: 场景本地UI + 全局监听（简化）

每个需要背包的场景都添加B键监听和本地InventoryUI：

```typescript
// 每个场景的create()
this.inventoryKey = this.input.keyboard.addKey('B');
this.inventoryUI = null; // 初始为空

// 每个场景的update()
if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
  this.toggleInventory();
}

// 每个场景的toggleInventory()
if (!this.inventoryUI) {
  this.inventoryUI = createInventoryUI(this);
}
this.inventoryUI.toggle();
```

**优点**:
- 实现简单，变更范围小
- UI天然适配场景生命周期
- 无跨场景复杂性

**缺点**:
- 每个场景都有重复代码
- UI每次场景切换会重建

---

## 4. 推荐方案

**选择方案B（场景本地UI + 全局监听）**

理由：
1. 变更范围小，风险低
2. InventoryManager已是单例，数据共享已解决
3. UI组件在Phaser中跨场景传递复杂，本地创建更稳定
4. 可通过BaseScene基类进一步简化重复代码

---

## 5. 实施步骤

### Step 1: 创建背包场景基类（可选但推荐）

创建 `BaseSceneWithInventory.ts`，包含背包相关逻辑：

```typescript
export abstract class BaseSceneWithInventory extends Phaser.Scene {
  protected inventoryKey!: Phaser.Input.Keyboard.Key;
  protected inventoryUI: InventoryUI | null = null;

  protected setupInventoryInput(): void;
  protected toggleInventory(): void;
  protected cleanupInventory(): void;
}
```

### Step 2: 修改各场景继承基类

| 场景 | 变更内容 |
|-----|---------|
| TownOutdoorScene | 继承基类，调用 `setupInventoryInput()` |
| ClinicScene | 继承基类，移除本地背包逻辑 |
| GardenScene | 继承基类，调用 `setupInventoryInput()` |
| HomeScene | 继承基类，调用 `setupInventoryInput()` |

### Step 3: 更新测试

- 验证各场景B键功能
- 验证背包数据跨场景一致性

---

## 6. 影响评估

### 6.1 代码变更

| 文件 | 变更类型 | 变更内容 |
|-----|---------|---------|
| `src/scenes/BaseSceneWithInventory.ts` | 新增 | 背包场景基类 |
| `src/scenes/TownOutdoorScene.ts` | 修改 | 继承基类，添加背包 |
| `src/scenes/ClinicScene.ts` | 修改 | 继承基类，移除本地逻辑 |
| `src/scenes/GardenScene.ts` | 修改 | 继承基类，添加背包 |
| `src/scenes/HomeScene.ts` | 修改 | 继承基类，添加背包 |

### 6.2 测试影响

| 测试类型 | 影响 |
|---------|-----|
| 现有背包单元测试 | 无影响（InventoryManager不变） |
| ClinicScene集成测试 | 需更新（背包逻辑位置变化） |
| E2E测试 | 需添加跨场景背包测试 |

### 6.3 用户体验影响

| 影响 | 说明 |
|-----|------|
| 功能增强 | 玩家可在任意场景查看背包 |
| 操作一致 | B键在任何场景统一响应 |
| 数据一致 | 背包内容跨场景保持一致 |

---

## 7. 验收标准

1. ✅ TownOutdoorScene 按 B 键可打开背包
2. ✅ ClinicScene 按 B 键可打开背包（原有功能保持）
3. ✅ GardenScene 按 B 键可打开背包
4. ✅ HomeScene 按 B 键可打开背包
5. ✅ 背包内容跨场景一致（InventoryManager单例）
6. ✅ 背包打开时玩家无法移动（UI层级独立）
7. ✅ 背包关闭后场景恢复正常

---

## 8. 实际实施方案

采用 **方案B简化版**：直接在各场景添加背包逻辑，未使用基类继承。

**修改文件**：

| 文件 | 变更 |
|-----|------|
| `src/scenes/TownOutdoorScene.ts` | 添加背包导入、字段、setupInput、update、shutdown、toggleInventory |
| `src/scenes/GardenScene.ts` | 添加背包导入、字段、setupInput、update、shutdown、toggleInventory |
| `src/scenes/HomeScene.ts` | 添加背包导入、字段、setupInput、update、shutdown、toggleInventory |
| `src/scenes/ClinicScene.ts` | 保持原有背包逻辑不变 |

**关键代码片段**：
```typescript
// 导入
import { InventoryManager, createInventoryManager } from '../systems/InventoryManager';
import { InventoryUI, createInventoryUI } from '../ui/InventoryUI';

// 字段
private inventoryKey!: Phaser.Input.Keyboard.Key;
private inventoryUI: InventoryUI | null = null;
private inventoryManager!: InventoryManager;

// setupInput
this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

// update
if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
  this.toggleInventory();
}

// shutdown
if (this.inventoryUI) {
  this.inventoryUI.destroy();
  this.inventoryUI = null;
}

// toggleInventory方法
private toggleInventory(): void {
  if (!this.inventoryUI) {
    this.inventoryUI = createInventoryUI(this, () => {...});
  }
  this.inventoryUI.toggle();
}
```