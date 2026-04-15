# 玩家移动诊断报告（最终版）

## 执行时间
2026-04-12

## 用户反馈问题
1. "人物移动很奇怪，左右跳来跳去"
2. "只走了几步就卡住了"

## 诊断发现

### 根因1: 碰撞体尺寸过小（已修复）

**问题描述**：
- 原碰撞体尺寸：4.13 x 2.75 像素
- 预期尺寸：19 x 13 像素

**根因分析**：
- `body.setSize()`的参数被`sprite.scale`自动缩放
- Player.ts中传入的collisionWidth=19，但实际显示只有19*0.214=4.13

**修复状态**：已修复
- Player.ts中已调整setSize参数，传入未缩放的值

### 根因2: 物理引擎未正确更新sprite.position（待修复）

**问题描述**：
- velocity=150持续1秒
- 但sprite.position始终不变（sprite.x=1520）

**验证数据**：
```
采样结果（每50ms）：
  50ms: sprite=1520.0, vel=150.0
  100ms: sprite=1520.0, vel=150.0
  ...
  1000ms: sprite=1520.0, vel=150.0
```

**关键发现**：
- velocity正确设置（150）
- canMoveInDirection正确返回true
- 但sprite.position没有被物理引擎更新

**可能原因**：
1. Phaser的preUpdate中body→sprite同步机制没有工作
2. sprite和body初始化时的位置关系不正确
3. scale和setSize/setOffset的顺序问题

### 验证数据汇总

| 检查项 | 状态 | 详情 |
|-------|------|------|
| 物理世界存在 | OK | scene.physics.world存在 |
| 物理世界暂停 | OK | isPaused=false |
| body.enable | OK | true |
| body.moves | OK | true |
| body.immovable | OK | false |
| velocity设置 | OK | 150正确设置 |
| 碰撞体尺寸（修复后） | OK | 19x13像素 |
| canMoveInDirection | OK | 所有位置返回true |
| sprite.position更新 | FAIL | 始终不变 |
| 可行走区域 | OK | 出生点(47,24)可行走 |

### sprite与body位置关系分析

```
sprite.x = 1520
body.position.x = 1510.38
body.offset.x = 67.2
scale = 0.2147

理论计算：sprite.x = body.position.x + offset.x * scale
         = 1510.38 + 67.2 * 0.2147 = 1524.7

实际sprite.x = 1520
差异 = 4.7像素
```

这个差异可能导致Phaser的同步机制异常。

## 建议修复方案

### 方案A: 调整setScale和body设置的顺序

在Player.ts中，尝试：
1. 先设置body的尺寸和offset（使用原始frame尺寸）
2. 然后再调用setScale

这样可以让Phaser正确处理scale对body的影响。

### 方案B: 使用不同的碰撞体设置方式

在Phaser Arcade Physics中，另一种方式是：
- 不手动设置body.size，让它使用默认值
- 只设置sprite的scale，碰撞体自动跟随

### 方案C: 检查并修复sprite/body同步机制

添加代码在每帧update中手动同步：
```typescript
// 在TownOutdoorScene.update()中
if (body.moves) {
  this.player.x = body.position.x + body.offset.x * this.player.scaleX;
  this.player.y = body.position.y + body.offset.y * this.player.scaleY;
}
```

## 测试文件位置

- `/home/lixiang/Desktop/zhongyi_game_v3/tests/visual/phase1-5/diagnostic/`

## 修复进度

| 问题 | 状态 | 文件 |
|-----|------|------|
| 碰撞体尺寸 | 已修复 | Player.ts |
| sprite/body同步 | 待修复 | Player.ts/TownOutdoorScene.ts |

## 下一步行动

1. 尝试方案A：调整Player.ts中setScale和body设置的顺序
2. 如果方案A不工作，尝试方案C：手动同步
3. 运行验证测试确认修复效果

---

*报告生成时间: 2026-04-12*