# 玩家移动诊断报告

## 用户反馈问题
1. "人物移动很奇怪，左右跳来跳去"
2. "只走了几步就卡住了"

## 诊断过程

### 第一步：检查动画方向映射 (D-001)
- **结果**: 动画方向映射正确
- velocity设置正确，按键被Phaser正确检测

### 第二步：检查碰撞检测系统 (D-002)
- **结果**: 玩家velocity=150但position不变
- **发现**: 玩家有速度但没有实际移动

### 第三步：检查可行走区域配置 (D-005)
- **结果**: 出生点(47,24)是可行走的
- 出生点周围有5个可行走方向（上、下、右等）
- walkableTiles是正确的Set对象，有932个元素

### 第四步：检查物理引擎状态
- **关键发现**: `physicsWorld.exists: false`（使用错误访问方式）
- 修正后：物理世界存在且正常工作

### 第五步：检查碰撞体尺寸
- **关键发现**: body.size只有 4.13 x 2.75 像素
- **预期值**: 应该是 19 x 13 像素
- **根因**: `body.setSize()`的参数被`sprite.scale`自动缩放了

### 第六步：验证修复方案
- **修复碰撞体后**: sprite成功移动了2.5像素
- **但随后velocity被清零**: 说明`canMoveInDirection()`返回false

### 第七步：检查enforceWalkablePosition
- **结果**: 当前位置(47,24)是可行走的，不会触发推回
- **但**: 手动移动后位置有轻微变化，说明有某种自动调整

## 根因分析

### 问题1: 碰撞体尺寸过小
- **代码位置**: `src/entities/Player.ts` init()方法
- **问题**: `body.setSize(collisionWidth, collisionHeight)`被scale缩放
- **计算**:
  - 设置值: 19.24 x 12.8
  - scale: 0.214
  - 实际值: 19.24 * 0.214 = 4.13

### 问题2: canMoveInDirection检测可能过于严格
- **代码位置**: `src/scenes/TownOutdoorScene.ts` canMoveInDirection()方法
- **问题**: checkDistance = TILE_SIZE * 0.5 = 16像素
- 玩家从(1520,784)向右移动时检查瓦片(48,24)
- 检查逻辑可能返回false导致stop()

## 修复建议

### 修复1: Player.ts碰撞体尺寸
```typescript
// 当前代码（有问题）
const collisionWidth = scaledWidth * 0.4; // 19
const collisionHeight = scaledHeight * 0.2; // 13
body.setSize(collisionWidth, collisionHeight); // 实际只有4x3

// 修复方案：传入未缩放的值
const collisionWidth = scaledWidth * 0.4 / this.playerScale; // 19/0.214 = 89
const collisionHeight = scaledHeight * 0.2 / this.playerScale; // 13/0.214 = 61
body.setSize(collisionWidth, collisionHeight); // 实际19x13
```

### 修复2: 调整canMoveInDirection检测逻辑
- 当前检测可能过于严格
- 考虑放宽检测范围或调整checkDistance

## 测试验证结果

| 测试项 | 修复前 | 修复后 |
|-------|-------|-------|
| 碰撞体宽度 | 4.13px | 19px |
| 碰撞体高度 | 2.75px | 13px |
| velocity设置 | 成功(150) | 成功(150) |
| position变化 | 0px | 2.5px |
| 移动触发 | 失败 | 成功(短暂) |

## 结论

**主要问题**: 碰撞体尺寸过小导致Phaser物理引擎无法正确驱动sprite移动

**次要问题**: 碰撞体修复后，canMoveInDirection()检测可能仍然导致移动被中断

**优先修复**: Player.ts中的碰撞体尺寸设置