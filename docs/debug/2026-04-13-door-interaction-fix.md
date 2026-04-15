# 2026-04-13 门交互问题修复记录

## 问题现象

1. **游戏无法打开** - 编译错误导致游戏启动失败
2. **诊所门无法进入** - 玩家走到门口按空格无反应
3. **药园门无法进入** - 玩家走到门口按空格跳到出生点
4. **再次进入失败** - 第一次进入成功，返回后无法再次进入

## 根本原因分析

### 问题1：游戏无法打开

**错误信息**:
```
src/data/map-config.ts(160,26): error TS2448: Block-scoped variable 'TOWN_OUTDOOR_CONFIG' used before its declaration.
```

**根因**: 第160行在`TOWN_OUTDOOR_CONFIG`定义过程中引用了自身属性`playerSpawnPoint`，造成循环引用。

**修复**: 将`TOWN_OUTDOOR_CONFIG.playerSpawnPoint`改为硬编码`{ x: 47, y: 24 }`

**文件**: `src/data/map-config.ts` 第160行

### 问题2：玩家无法向上移动到门

**AI E2E测试收集的证据**:
```
玩家移动轨迹:
右移30次后: (58, 24)
上移全部失败: 停在(58, 24)

x=58纵向路径分析:
58,11~15: ✗不可行走 ← 阻碍区1
58,20~23: ✗不可行走 ← 阻碍区2（玩家第一步就被阻挡）
```

**根因**:
- 原始路径配置只添加了x=60一条纵向路径
- 玩家实际移动会偏离到x=58~62
- 这些偏离路径上有大量不可行走瓦片阻挡

**修复**: 添加宽带路径覆盖（x=45~63多条纵向路径）

**文件**: `src/data/map-config.ts` walkableTiles初始化

### 问题3：路径连接不完整

**原始配置问题**:
```typescript
// 只添加了单条路径
for (let y = 8; y <= 24; y++) {
  baseSet.add(`60,${y}`);  // 只有x=60
}
```

**修复后配置**:
```typescript
// 添加宽带路径覆盖（覆盖整个横向路径范围）
for (let x = 45; x <= 63; x++) {  // 原来是57~62
  for (let y = 8; y <= 24; y++) {
    baseSet.add(`${x},${y}`);  // x=45~63全部可行走
  }
}
// 药园路径同理
for (let x = 13; x <= 47; x++) {  // 原来是13~18
  for (let y = 8; y <= 24; y++) {
    baseSet.add(`${x},${y}`);
  }
}
```

### 问题4：门检测逻辑不覆盖对角位置 ⭐ 关键发现

**AI E2E测试收集的证据**:
```
玩家位置: (61, 10)
诊所门位置: (60, 8)
距离: x=1, y=2

门检测结果: 附近发现的门: []
```

**根因**:
- 原始门检测逻辑只检查上下左右4个方向（距离1-2格）
- 玩家在(61,10)，门在(60,8)是对角位置（偏移x=1,y=2）
- 原始逻辑不检查对角位置，导致门检测失败

**原始检测逻辑**:
```typescript
// 只检查上下左右
for (let distance = 1; distance <= 2; distance++) {
  const nearbyPositions = [
    { x: playerTileX, y: playerTileY - distance },     // 上
    { x: playerTileX, y: playerTileY + distance },     // 下
    { x: playerTileX - distance, y: playerTileY },     // 左
    { x: playerTileX + distance, y: playerTileY },     // 右
  ];
}
```

**修复后检测逻辑**:
```typescript
// 检查±2格范围内的所有位置（包括对角）
for (let dx = -2; dx <= 2; dx++) {
  for (let dy = -2; dy <= 2; dy++) {
    if (dx === 0 && dy === 0) continue;
    const nearbyKey = `${playerTileX + dx},${playerTileY + dy}`;
    if (doorTiles.has(nearbyKey)) {
      return doorTiles.get(nearbyKey) || null;
    }
  }
}
```

**文件**: `src/systems/SceneManager.ts` checkDoorInteraction方法

## AI验证方法

使用Playwright E2E测试收集证据：

1. **移动轨迹监控** - 每5次按键检查位置变化
2. **路径可行走检查** - 验证x=60/61/62纵向路径每格状态
3. **玩家周围状态检查** - 分析当前位置±2格的可行走状态
4. **门检测逻辑模拟** - 在浏览器中模拟SceneManager的门检测逻辑

关键发现代码:
```typescript
// 检查门检测是否覆盖对角位置
const clinicDoor = { x: 60, y: 8 };
const playerPos = { x: 61, y: 10 };
const offset = { dx: playerPos.x - clinicDoor.x, dy: playerPos.y - clinicDoor.y };
// offset = { dx: 1, dy: 2 }
// 原始逻辑不检查(60, 8)这个位置！
```

## 最终验证结果

官方门交互测试全部通过:
```
npx playwright test tests/visual/phase1-5/functional/door-interaction.spec.ts
11 passed (32.6s)
```

- ✅ F-004: 药园门可达
- ✅ F-005: 诊所门可达
- ✅ F-006: 家门可达
- ✅ F-007~F-009: 门交互验证
- ✅ D-001~D-003: 门触发范围验证

简单门测试验证完整流程（进入→返回→再次进入）:
```
npx playwright test tests/visual/manual/door-reentry-debug.spec.ts
✅ 第一次进入诊所成功
✅ 返回室外成功
✅ 再次进入成功（门检测找到门）
```

## 文件修改清单

| 文件 | 修改内容 | 行数 |
|-----|---------|------|
| `src/data/map-config.ts` | 修复循环引用 | 160 |
| `src/data/map-config.ts` | 添加宽带路径覆盖 | walkableTiles初始化 (196-216) |
| `src/systems/SceneManager.ts` | 修复门检测逻辑（覆盖对角） | checkDoorInteraction方法 |
| `src/scenes/TownOutdoorScene.ts` | 添加调试日志（后续可移除） | update方法 |
| `tests/visual/asset-test/resplit_user2_sprite.py` | 修正sprite方向顺序 | directions数组 |
| `src/scenes/BootScene.ts` | 更新帧尺寸和帧数 | PLAYER_FRAME_WIDTH, 动画帧数 |

## 验证命令

```bash
# 编译验证
npm run build

# 门交互测试
npx playwright test tests/visual/phase1-5/functional/door-interaction.spec.ts

# 调试测试（收集证据）
npx playwright test tests/visual/manual/door-reentry-debug.spec.ts
```

## 修复总结

本次修复共解决4个根本问题：

1. **编译错误** - 循环引用修复（硬编码spawnPoint）
2. **路径连通性** - 扩大纵向路径范围覆盖整个横向路径
3. **门检测逻辑** - 修复为检查±2格所有位置（包括对角）
4. **再次进入问题** - 门检测逻辑修复后自动解决

关键经验：
- 系统调试流程有效：收集证据→定位根因→修复→验证
- AI E2E测试能发现代码逻辑缺陷（门检测遗漏对角位置）
- 路径配置需要覆盖玩家实际移动范围，而非理想路径

---
记录时间: 2026-04-13
调试方法: Systematic Debugging (四阶段流程)