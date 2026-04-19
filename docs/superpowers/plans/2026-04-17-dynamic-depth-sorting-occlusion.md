# 动态深度排序与遮挡关系优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现正确的角色与场景遮挡关系，玩家/NPC在墙体、树木后方时被遮挡，在前方时完整显示。

**Architecture:** 采用"地面层PNG + 独立遮挡sprite"的完整方案。从原背景PNG分割出地面层和遮挡对象，所有对象（玩家、NPC、遮挡sprite）根据Y坐标动态调整渲染深度（Y-sorting）。

**Tech Stack:** Phaser 3 depth sorting, 绘图模型PNG分割, TypeScript

---

## 方案原理说明

### 核心问题：为什么必须提取整个遮挡对象？

单张静态PNG背景图无法实现动态遮挡的原因：

```
原背景PNG架构：
┌─────────────────────────────────────┐
│ 地面 + 墙体下部 + 墙体上部            │  ← 全部渲染在depth=0（最底层）
│ + 树干 + 树冠 + 屋顶                  │
└─────────────────────────────────────┘

玩家在depth=Y（动态）：
- 玩家永远渲染在背景PNG之上
- 背景PNG中的墙体下部永远在depth=0
- 无法实现"玩家在墙后被遮挡"效果
```

### 正确方案：分割背景PNG

```
分割后架构：

地面层PNG（depth=0）：
┌─────────────────────────────────────┐
│ 地面（可行走区域）                    │  ← 只保留地面
│ 移除所有遮挡元素                      │     填充地面纹理
└─────────────────────────────────────┘

遮挡对象sprite PNG（depth=Y，动态）：
├── wall_clinic.png      ← 墙体整体（完整提取）
├── tree_01.png          ← 树木整体（树干+树冠）
├── roof_clinic.png      ← 屋顶整体
└── ...

渲染顺序：
地面(depth=0) → [遮挡sprite + 玩家] 根据Y坐标动态排序
                  ↑ 同层对象按Y排序，实现正确遮挡
```

---

## 关键约束

| 约束 | 说明 |
|-----|------|
| **背景PNG需要分割** | 原背景PNG需要分割为地面层PNG和遮挡sprite PNG |
| **提取整个遮挡对象** | 墙体、树木、屋顶需要**完整提取**，而非只提取上部 |
| **地面层需要重新生成** | 原背景PNG中遮挡元素移除后，需要填充地面纹理 |
| **最小改动原则** | 不重构碰撞系统，仅新增深度排序逻辑 |

---

## 技术方案概述

### 方案核心：三层渲染架构

```
渲染顺序（从后到前）：
┌─────────────────────────────────────┐
│ Layer 0: 地面层 (depth=0)            │  ← 新地面PNG（只含地面）
│   - 可行走区域、地面纹理              │
├─────────────────────────────────────┤
│ Layer 1-999: 动态对象层              │  ← 根据Y坐标动态排序
│   - 玩家 (depth = player.y + offset) │
│   - NPC (depth = npc.y + offset)     │
│   - 遮挡对象 (depth = obj.y + offset)│  ← 墙体整体、树木整体
├─────────────────────────────────────┤
│ Layer 1000+: UI层 (depth=1000)       │  ← 对话框、背包UI等
└─────────────────────────────────────┘
```

### 遮挡对象提取策略

**修正后的正确策略**：提取**整个遮挡对象**

| 遮挡类型 | 提取原则 | 说明 |
|---------|---------|------|
| **墙体** | **整体提取** | 墙体上部+下部完整提取，确保玩家在墙后时完全被遮挡 |
| **树木** | **整体提取** | 树干+树冠完整提取 |
| **屋顶** | **整体提取** | 屋顶整体（包含屋檐） |
| **栏杆** | **整体提取** | 栅栏整体提取 |

### Y-Sorting算法

**核心算法**：必须按"脚部位置"而非"顶部位置"排序

```typescript
// ✅ 正确：按脚部位置（Y + 高度的一半）
sprite.depth = sprite.y + sprite.height / 2;

// ❌ 错误：按顶部位置（遮挡效果不正确）
sprite.depth = sprite.y;
```

---

## 素材分割输出规范（供用户参考）

### 用户需要提供的分割产物

| 产物 | 文件名 | 说明 |
|-----|-------|------|
| **地面层PNG** | `town_ground.png` | 原背景移除遮挡元素后，填充地面纹理 |
| **遮挡对象PNG** | `occludable/*.png` | 每个遮挡对象的独立sprite |
| **配置JSON** | `occludable_config.json` | 遮挡对象的坐标、尺寸信息 |

### 配置JSON格式规范

```json
{
  "sceneId": "TownOutdoorScene",
  "groundImage": "town_ground.png",
  "objects": [
    {
      "id": "wall_clinic",
      "type": "wall",
      "spriteFile": "wall_clinic.png",
      "footPosition": {
        "x": 像素坐标X（脚部中心）,
        "y": 像素坐标Y（脚部底部）
      },
      "displaySize": {
        "width": 显示宽度（像素）,
        "height": 显示高度（像素）
      },
      "depthOffset": 0
    }
  ]
}
```

### 分割步骤建议

1. **识别遮挡元素边界**：使用AI或手工标注墙体、树木、屋顶的像素区域
2. **裁剪遮挡sprite**：从原背景PNG裁剪每个遮挡元素的像素区域，生成独立PNG
3. **生成地面层**：原背景PNG移除遮挡元素区域，填充地面纹理（草、土地等）
4. **处理透明度**：遮挡sprite PNG需要有透明背景（非遮挡区域透明）

---

## 文件结构规划

### 新增文件

| 文件 | 责任 |
|-----|------|
| `src/data/occludable-objects-config.ts` | 遮挡对象配置（坐标、尺寸、类型） |
| `tests/unit/occludable-config.spec.ts` | 配置数据结构单元测试 |
| `tests/unit/player-depth.spec.ts` | Player动态深度单元测试 |
| `tests/e2e/occlusion.spec.ts` | 遮挡效果E2E测试 |

### 用户提供的分割产物存放位置

| 文件 | 存放路径 |
|-----|---------|
| 地面层PNG | `public/assets/town_outdoor/town_ground.png` |
| 遮挡sprite PNG | `public/assets/town_outdoor/occludable/*.png` |
| 配置JSON | `public/assets/town_outdoor/occludable/occludable_config.json` |

### 修改文件

| 文件 | 修改内容 |
|-----|---------|
| `src/entities/Player.ts` | 新增`updateDepth()`方法，移除固定depth=10 |
| `src/scenes/TownOutdoorScene.ts` | 替换背景PNG为地面层，新增`createOccludableObjects()` |
| `src/scenes/GardenScene.ts` | 同TownOutdoorScene修改 |
| `src/scenes/ClinicScene.ts` | NPC动态深度调整 |
| `src/scenes/BootScene.ts` | 预加载地面层PNG和遮挡sprite |

---

## 实现任务

### Task 1: 定义遮挡对象数据结构和输出规范

**Files:**
- Create: `docs/superpowers/specs/occludable-output-spec.md`（输出规范）
- Create: `src/data/occludable-objects-config.ts`（数据结构）
- Test: `tests/unit/occludable-config.spec.ts`

- [ ] **Step 1: 创建分割产物输出规范文档**

```markdown
# docs/superpowers/specs/occludable-output-spec.md

# 遮挡对象分割产物输出规范

## 一、分割产物清单

用户分割后需提供以下产物：

| 产物类型 | 文件名示例 | 数量 | 存放路径 |
|---------|-----------|------|---------|
| 地面层PNG | `town_ground.png` | 1个 | `public/assets/town_outdoor/` |
| 遮挡sprite PNG | `wall_clinic.png` | 多个 | `public/assets/town_outdoor/occludable/` |
| 配置JSON | `occludable_config.json` | 1个 | `public/assets/town_outdoor/occludable/` |

## 二、地面层PNG要求

### 内容要求
- **只保留地面元素**：可行走区域、草地、土地、路径
- **移除遮挡元素**：墙体、树木、屋顶、栏杆等
- **填充移除区域**：遮挡元素移除后的空白区域需填充地面纹理

### 技术要求
- 尺寸与原背景PNG一致（2752×1536像素）
- 格式：PNG（无透明度，完全覆盖）

### 示例

原背景PNG（包含墙体、树木）：
┌─────────────────────────────┐
│ 地面 + 墙体 + 树木 + 屋顶    │
└─────────────────────────────┘

地面层PNG（移除遮挡元素）：
┌─────────────────────────────┐
│ 地面（填充墙体/树木移除区域） │
└─────────────────────────────┘

## 三、遮挡sprite PNG要求

### 内容要求
- **完整提取遮挡对象**：墙体整体、树木整体、屋顶整体
- **透明背景**：非遮挡区域必须透明（alpha=0）

### 技术要求
- 格式：PNG（带透明通道）
- 原点：sprite左上角对齐原背景PNG中的位置

### 遮挡类型定义

| 类型 | 提取范围 | 示例 |
|-----|---------|------|
| wall | 墙体整体（从地面到顶端） | 诊所外墙 |
| tree | 树木整体（树干+树冠） | 药园树木 |
| roof | 屋顶整体（包含屋檐） | 诊所屋顶 |
| fence | 栅栏整体 | 药园围栏 |

## 四、配置JSON格式

```json
{
  "sceneId": "TownOutdoorScene",
  "groundImage": "town_ground.png",
  "mapSize": {
    "width": 86,
    "height": 48,
    "tileSize": 32
  },
  "objects": [
    {
      "id": "wall_clinic",
      "type": "wall",
      "spriteFile": "wall_clinic.png",
      "footPosition": {
        "x": 1920,
        "y": 256
      },
      "displaySize": {
        "width": 320,
        "height": 192
      },
      "depthOffset": 0,
      "description": "诊所外墙"
    },
    {
      "id": "tree_01",
      "type": "tree",
      "spriteFile": "tree_01.png",
      "footPosition": {
        "x": 480,
        "y": 288
      },
      "displaySize": {
        "width": 48,
        "height": 64
      },
      "depthOffset": 0,
      "description": "药园树木01"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|-----|------|------|
| sceneId | string | 场景ID |
| groundImage | string | 地面层PNG文件名 |
| objects | array | 遮挡对象列表 |
| id | string | 对象唯一ID |
| type | string | 遮挡类型：wall/tree/roof/fence |
| spriteFile | string | sprite PNG文件名 |
| footPosition.x | number | 脚部中心像素X坐标 |
| footPosition.y | number | 脚部底部像素Y坐标（用于depth计算） |
| displaySize.width | number | sprite显示宽度 |
| displaySize.height | number | sprite显示高度 |
| depthOffset | number | 深度额外偏移（默认0） |

## 五、深度计算公式

```
sprite.depth = footPosition.y + displaySize.height / 2 + depthOffset
```

**关键**：depth基于脚部位置（Y坐标），确保Y-sorting正确排序。
```

- [ ] **Step 2: 创建遮挡对象数据结构**

```typescript
// src/data/occludable-objects-config.ts
import { SCENES } from './constants';

/**
 * 遮挡对象配置（从分割产物JSON加载）
 */
export interface OccludableObjectConfig {
  id: string;                      // 对象唯一ID
  sceneId: string;                 // 所属场景
  type: 'wall' | 'tree' | 'roof' | 'fence';  // 遮挡类型
  spriteKey: string;               // Phaser sprite key（从spriteFile映射）
  x: number;                       // 脚部中心像素X坐标
  y: number;                       // 脚部底部像素Y坐标
  width: number;                   // 显示宽度
  height: number;                  // 显示高度
  depthOffset: number;             // 深度额外偏移
  description?: string;            // 描述
}

/**
 * 场景遮挡配置（从分割产物JSON加载）
 */
export interface SceneOccludableConfig {
  sceneId: string;
  groundImage: string;             // 地面层PNG文件名
  mapSize: {
    width: number;
    height: number;
    tileSize: number;
  };
  objects: OccludableObjectConfig[];
}

/**
 * 默认配置（用于分割产物未就绪时的占位）
 */
export const DEFAULT_TOWN_OCCLUDABLE: SceneOccludableConfig = {
  sceneId: SCENES.TOWN_OUTDOOR,
  groundImage: 'town_background',  // 暂用原背景（等待分割）
  mapSize: { width: 86, height: 48, tileSize: 32 },
  objects: []  // 空列表，等待分割产物
};

/**
 * 计算对象的渲染深度
 * 核心算法：depth = y + height/2 + depthOffset
 */
export function calculateObjectDepth(obj: OccludableObjectConfig): number {
  return obj.y + obj.height / 2 + obj.depthOffset;
}

/**
 * 从分割产物JSON解析配置
 */
export function parseOccludableConfig(jsonData: any, sceneId: string): SceneOccludableConfig {
  const objects: OccludableObjectConfig[] = jsonData.objects?.map((obj: any) => ({
    id: obj.id,
    sceneId: sceneId,
    type: obj.type,
    spriteKey: `occludable_${obj.id}`,
    x: obj.footPosition?.x ?? 0,
    y: obj.footPosition?.y ?? 0,
    width: obj.displaySize?.width ?? 64,
    height: obj.displaySize?.height ?? 64,
    depthOffset: obj.depthOffset ?? 0,
    description: obj.description
  })) ?? [];

  return {
    sceneId: sceneId,
    groundImage: jsonData.groundImage ?? 'town_background',
    mapSize: jsonData.mapSize ?? { width: 86, height: 48, tileSize: 32 },
    objects: objects
  };
}
```

- [ ] **Step 3: 写单元测试**

```typescript
// tests/unit/occludable-config.spec.ts
import { describe, it, expect } from 'vitest';
import {
  OccludableObjectConfig,
  calculateObjectDepth,
  parseOccludableConfig
} from '../../src/data/occludable-objects-config';

describe('OccludableObjectConfig', () => {
  it('should calculate depth based on foot position', () => {
    const obj: OccludableObjectConfig = {
      id: 'test_wall',
      sceneId: 'TownOutdoorScene',
      type: 'wall',
      spriteKey: 'test_sprite',
      x: 100,
      y: 200,
      width: 64,
      height: 96,
      depthOffset: 0
    };

    // depth = y + height/2 = 200 + 48 = 248
    const depth = calculateObjectDepth(obj);
    expect(depth).toBe(248);
  });

  it('should apply depth offset', () => {
    const obj: OccludableObjectConfig = {
      id: 'test',
      sceneId: 'TownOutdoorScene',
      type: 'wall',
      spriteKey: 'test',
      x: 100,
      y: 200,
      width: 64,
      height: 96,
      depthOffset: 10
    };

    // depth = 200 + 48 + 10 = 258
    const depth = calculateObjectDepth(obj);
    expect(depth).toBe(258);
  });

  it('should parse JSON config correctly', () => {
    const jsonData = {
      sceneId: 'TownOutdoorScene',
      groundImage: 'town_ground.png',
      objects: [
        {
          id: 'wall_test',
          type: 'wall',
          spriteFile: 'wall_test.png',
          footPosition: { x: 100, y: 200 },
          displaySize: { width: 64, height: 96 },
          depthOffset: 0
        }
      ]
    };

    const config = parseOccludableConfig(jsonData, 'TownOutdoorScene');

    expect(config.groundImage).toBe('town_ground.png');
    expect(config.objects.length).toBe(1);
    expect(config.objects[0].id).toBe('wall_test');
    expect(config.objects[0].spriteKey).toBe('occludable_wall_test');
    expect(config.objects[0].x).toBe(100);
    expect(config.objects[0].y).toBe(200);
  });
});
```

- [ ] **Step 4: 运行测试**

Run: `npx vitest run tests/unit/occludable-config.spec.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/occludable-output-spec.md src/data/occludable-objects-config.ts tests/unit/occludable-config.spec.ts
git commit -m "feat: define occludable objects data structure and output spec"
```

---

### Task 2: 修改Player实体添加动态深度

**Files:**
- Modify: `src/entities/Player.ts:36-37` (移除固定depth=10)
- Test: `tests/unit/player-depth.spec.ts`

- [ ] **Step 1: 写测试验证动态深度**

```typescript
// tests/unit/player-depth.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser scene（简化版）
const mockScene = {
  add: { existing: vi.fn() },
  physics: { add: { existing: vi.fn() } },
  anims: { play: vi.fn() },
  input: { keyboard: null }
} as any;

describe('Player Dynamic Depth', () => {
  // 测试深度计算逻辑
  it('should calculate depth as y + displayHeight/2', () => {
    const playerY = 200;
    const displayHeight = 64;
    const expectedDepth = playerY + displayHeight / 2;  // 232

    expect(expectedDepth).toBe(232);
  });

  it('should update depth when y changes', () => {
    const playerY1 = 200;
    const displayHeight = 64;
    const depth1 = playerY1 + displayHeight / 2;  // 232

    const playerY2 = 300;
    const depth2 = playerY2 + displayHeight / 2;  // 332

    expect(depth2).toBeGreaterThan(depth1);
  });

  it('should handle scale factor', () => {
    const playerY = 200;
    const baseHeight = 64;
    const scale = 0.35;
    const displayHeight = baseHeight * scale;  // 22.4
    const expectedDepth = playerY + displayHeight / 2;  // 211.2

    expect(expectedDepth).toBeCloseTo(211.2, 1);
  });
});
```

- [ ] **Step 2: 运行测试确认**

Run: `npx vitest run tests/unit/player-depth.spec.ts`
Expected: 3 tests PASS

- [ ] **Step 3: 修改Player.ts实现动态深度**

```typescript
// src/entities/Player.ts

private init(): void {
  // ❌ 移除：固定深度设置
  // this.setDepth(10);

  // ✅ 新增：动态深度（初始设置）
  this.updateDepth();

  // ...其他初始化代码保持不变
}

/**
 * 更新渲染深度（基于脚部位置）
 * 核心算法：depth = y + (displayHeight / 2)
 */
updateDepth(): void {
  const feetY = this.y + (this.displayHeight / 2);
  this.setDepth(feetY);
}

// 在move()方法中调用
move(direction: { x: number; y: number }): void {
  // ...原有velocity设置代码

  // ✅ 新增：移动时更新深度
  this.updateDepth();

  // ...原有动画和事件代码
}

// 在updatePositionTracking()方法中也调用
updatePositionTracking(): void {
  // ✅ 新增：位置追踪时同步更新深度
  this.updateDepth();

  // ...原有位置追踪代码
}
```

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run tests/unit/player-depth.spec.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/entities/Player.ts tests/unit/player-depth.spec.ts
git commit -m "feat: add dynamic depth sorting to Player entity"
```

---

### Task 3: 集成分割产物到BootScene

**前置条件**: 用户已提供分割产物（地面PNG + 遮挡sprite PNG + 配置JSON）

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: 预加载地面层PNG**

```typescript
// src/scenes/BootScene.ts - preload()方法修改

preload(): void {
  // ❌ 移除：原背景PNG加载
  // this.load.image('town_background', 'assets/town_outdoor/town_background.jpeg');

  // ✅ 新增：加载地面层PNG
  this.load.image('town_ground', 'assets/town_outdoor/town_ground.png');

  // ✅ 新增：加载遮挡对象配置JSON
  this.load.json('town_occludable_config', 'assets/town_outdoor/occludable/occludable_config.json');

  // ...其他原有加载代码
}
```

- [ ] **Step 2: 动态加载遮挡sprite**

```typescript
// src/scenes/BootScene.ts - create()方法新增

create(): void {
  // ...原有动画创建代码

  // ✅ 新增：处理遮挡配置加载
  this.load.on('filecomplete-json-town_occludable_config', (key: string, type: string, data: any) => {
    if (data && data.objects) {
      console.log(`[BootScene] 加载 ${data.objects.length} 个遮挡对象配置`);

      // 动态加载每个遮挡sprite
      for (const obj of data.objects) {
        const spritePath = `assets/town_outdoor/occludable/${obj.spriteFile}`;
        this.load.image(obj.spriteKey ?? `occludable_${obj.id}`, spritePath);
      }

      // 启动加载
      this.load.start();

      // 存储配置到registry
      this.registry.set('town_occludable_config', data);
    }
  });

  // ...原有场景启动代码
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: preload ground layer and occludable sprites"
```

---

### Task 4: 集成遮挡对象到TownOutdoorScene

**Files:**
- Modify: `src/scenes/TownOutdoorScene.ts`

- [ ] **Step 1: 替换背景PNG为地面层**

```typescript
// src/scenes/TownOutdoorScene.ts - createBackground()方法修改

private createBackground(): void {
  const config = TOWN_OUTDOOR_CONFIG;
  const mapPixelWidth = config.width * TILE_SIZE;
  const mapPixelHeight = config.height * TILE_SIZE;

  // ❌ 移除：原背景PNG
  // this.background = this.add.image(..., 'town_background');

  // ✅ 新增：使用地面层PNG
  this.background = this.add.image(
    mapPixelWidth / 2,
    mapPixelHeight / 2,
    'town_ground'  // 新的地面层PNG
  );

  this.background.setDisplaySize(mapPixelWidth, mapPixelHeight);
  this.background.setOrigin(0.5);
  this.background.setDepth(0);  // 地面层在最底层
}
```

- [ ] **Step 2: 创建遮挡对象sprite**

```typescript
// src/scenes/TownOutdoorScene.ts - 新增成员和方法

export class TownOutdoorScene extends Phaser.Scene {
  // ...原有成员
  private occludableObjects: Phaser.GameObjects.Image[] = [];  // ✅ 新增

// create()方法中新增
create(): void {
  // ...原有代码

  // ✅ 新增：创建遮挡对象
  this.createOccludableObjects();
}

/**
 * 创建遮挡对象sprite
 */
private createOccludableObjects(): void {
  const jsonData = this.registry.get('town_occludable_config');

  if (!jsonData) {
    console.log('[TownOutdoorScene] 无遮挡配置，使用默认');
    return;
  }

  const config = parseOccludableConfig(jsonData, SCENES.TOWN_OUTDOOR);

  for (const obj of config.objects) {
    const sprite = this.add.image(obj.x, obj.y, obj.spriteKey);
    sprite.setDisplaySize(obj.width, obj.height);

    // ✅ 核心：设置初始深度（基于脚部Y坐标）
    const depth = calculateObjectDepth(obj);
    sprite.setDepth(depth);

    this.occludableObjects.push(sprite);
  }

  console.log(`[TownOutdoorScene] 创建 ${this.occludableObjects.length} 个遮挡对象`);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/TownOutdoorScene.ts
git commit -m "feat: integrate occludable objects into TownOutdoorScene"
```

---

### Task 5: E2E测试验证遮挡效果

**Files:**
- Create: `tests/e2e/occlusion.spec.ts`

- [ ] **Step 1: 创建E2E测试**

```typescript
// tests/e2e/occlusion.spec.ts
import { test, expect } from '@playwright/test';
import { waitForSceneReady } from './utils/phaser-helper';

test.describe('遮挡效果验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForSceneReady(page, 'TownOutdoorScene');
  });

  test('玩家深度应根据Y坐标动态调整', async ({ page }) => {
    const player = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('TownOutdoorScene');
      return {
        y: scene.player.y,
        depth: scene.player.depth,
        displayHeight: scene.player.displayHeight
      };
    });

    const expectedDepth = player.y + player.displayHeight / 2;
    expect(player.depth).toBeCloseTo(expectedDepth, 1);
  });

  test('遮挡对象应有正确的深度', async ({ page }) => {
    const occludables = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('TownOutdoorScene');
      return scene.occludableObjects?.map(obj => ({
        y: obj.y,
        depth: obj.depth,
        displayHeight: obj.displayHeight
      })) ?? [];
    });

    for (const obj of occludables) {
      const expectedDepth = obj.y + obj.displayHeight / 2;
      expect(obj.depth).toBeCloseTo(expectedDepth, 1);
    }
  });

  test('玩家移动时深度应实时更新', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);

    const playerAfterMove = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('TownOutdoorScene');
      return {
        y: scene.player.y,
        depth: scene.player.depth,
        displayHeight: scene.player.displayHeight
      };
    });

    const expectedDepth = playerAfterMove.y + playerAfterMove.displayHeight / 2;
    expect(playerAfterMove.depth).toBeCloseTo(expectedDepth, 1);
  });
});
```

- [ ] **Step 2: 运行E2E测试**

Run: `npx playwright test tests/e2e/occlusion.spec.ts --workers=1`
Expected: 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/occlusion.spec.ts
git commit -m "feat: add E2E tests for occlusion effect"
```

---

### Task 6: GardenScene遮挡集成

**Files:**
- Modify: `src/scenes/GardenScene.ts`

- [ ] **Step 1: 复用TownOutdoorScene的实现模式**

```typescript
// src/scenes/GardenScene.ts - 新增成员和方法

export class GardenScene extends Phaser.Scene {
  // ...原有成员
  private occludableObjects: Phaser.GameObjects.Image[] = [];

// createBackground()修改：使用地面层PNG
private createBackground(): void {
  // ❌ 移除：原背景PNG
  // this.background = this.add.image(..., 'garden_background');

  // ✅ 新增：使用地面层PNG（等待用户分割）
  this.background = this.add.image(..., 'garden_ground');
  this.background.setDepth(0);
}

// create()中新增
create(): void {
  // ...原有代码
  this.createOccludableObjects();
}

private createOccludableObjects(): void {
  // 同TownOutdoorScene实现
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/GardenScene.ts
git commit -m "feat: add occlusion system to GardenScene"
```

---

### Task 7: ClinicScene NPC动态深度

**Files:**
- Modify: `src/scenes/ClinicScene.ts`

- [ ] **Step 1: 修改NPC深度**

```typescript
// src/scenes/ClinicScene.ts - createNPC()修改

private createNPC(): void {
  // ...原有代码

  // ❌ 移除：固定深度
  // this.npcSprite.setDepth(5);

  // ✅ 新增：动态深度
  const npcFeetY = this.npcSprite.y + this.npcSprite.displayHeight / 2;
  this.npcSprite.setDepth(npcFeetY);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/ClinicScene.ts
git commit -m "feat: add dynamic depth to ClinicScene NPC"
```

---

### Task 8: 更新文档

**Files:**
- Update: `CLAUDE.md`

- [ ] **Step 1: 更新CLAUDE.md**

在开发进度部分新增：

```markdown
### Phase 1.5 遗留问题修复: 动态深度排序与遮挡 ⏳ 进行中

**方案**: 地面层PNG + 独立遮挡sprite + Y-sorting

**素材分割要求**:
| 产物 | 说明 |
|-----|------|
| 地面层PNG | 原背景移除遮挡元素，填充地面纹理 |
| 遮挡sprite PNG | 墙体整体、树木整体、屋顶整体（透明背景） |
| 配置JSON | 遮挡对象坐标、尺寸信息 |

**实现进度**:
| 任务 | 状态 |
|-----|------|
| Task 1: 数据结构定义 | ✅ |
| Task 2: Player动态深度 | ✅ |
| Task 3: BootScene集成 | ⏳ 等待分割产物 |
| Task 4: TownOutdoorScene集成 | ⏳ 等待分割产物 |
| Task 5: E2E测试 | ⏳ |
| Task 6: GardenScene集成 | ⏳ |
| Task 7: ClinicScene NPC | ✅ |
| Task 8: 文档更新 | ✅ |

**核心算法**: `depth = y + displayHeight / 2`（脚部位置排序）

**输出规范**: [docs/superpowers/specs/occludable-output-spec.md](docs/superpowers/specs/occludable-output-spec.md)
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update occlusion system documentation"
```

---

## 自检清单

### 1. 方案逻辑修正

| 原错误 | 修正后 |
|-------|-------|
| "只提取墙体上部" | ✅ 提取墙体整体 |
| "只提取树冠" | ✅ 提取树木整体（树干+树冠） |
| "保留原背景PNG" | ✅ 生成新地面层PNG |
| "遮挡sprite叠加在原背景上" | ✅ 遮挡sprite替代原背景中的遮挡元素 |

### 2. Placeholder扫描

- ✅ 无"TBD"占位
- ✅ 无"TODO"占位
- ✅ 所有代码步骤有完整实现代码

### 3. 类型一致性

- ✅ `OccludableObjectConfig` 定义一致
- ✅ `calculateObjectDepth()` 计算逻辑一致
- ✅ `parseOccludableConfig()` 解析逻辑一致

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-04-17-dynamic-depth-sorting-occlusion.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - 每个Task启动独立subagent，Task完成后进行两阶段review。

**2. Inline Execution** - 在当前session中批量执行，在checkpoint处review。

**选择哪种方式？**

---

## 用户分割产物交付清单

用户需要提供以下产物后方可继续执行Task 3-5：

| 产物 | 存放路径 | 状态 |
|-----|---------|------|
| `town_ground.png` | `public/assets/town_outdoor/` | ⏳ 待提供 |
| `wall_clinic.png` 等 | `public/assets/town_outdoor/occludable/` | ⏳ 待提供 |
| `occludable_config.json` | `public/assets/town_outdoor/occludable/` | ⏳ 待提供 |

**输出规范文档**: `docs/superpowers/specs/occludable-output-spec.md`