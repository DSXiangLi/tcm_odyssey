# 药灵山谷 - 素材制作方案对比测试设计

**版本**: v1.0
**日期**: 2026-04-06
**状态**: 待审批
**目的**: 通过实际效果对比确定素材制作方案（AI生成 vs 开源素材 vs 混合方案）

---

## 1. 背景

### 1.1 问题陈述

Phase 1.5视觉实现计划中，设计规范提出"全部AI生成"的策略。但实际制作中需要考虑：
- **开源素材可用性**: 存在大量32x32像素风格的开源瓦片素材库
- **AI生成一致性**: AI生成的瓦片风格统一性需要验证
- **中医特色准确性**: 中医元素（竹林、药田、经络图）需要辨识度
- **TileMap拼接效果**: 瓹片拼接无缝隙是关键质量指标

### 1.2 决策目标

通过实际效果对比测试，确定每类素材的最佳制作方案：
- **方案A**: 开源素材（直接使用或修改颜色）
- **方案B**: AI生成（使用设计规范Prompt模板）
- **方案C**: 混合方案（开源基础瓦片 + AI生成中医特色元素）
- **方案D**: AI全景 + 透明瓦片叠加

---

## 2. 测试策略

### 2.1 测试流程

```
Step 1: 准备开源素材
    → 搜索符合32x32像素风格的开源瓦片素材库
    → 下载草地、路径、竹林、农场类瓦片

Step 2: AI生成素材
    → 使用设计规范中的Prompt模板
    → 生成32x32像素瓦片
    → 调整颜色匹配设计规范

Step 3: TileMap拼接测试
    → 创建小型测试地图（10x10瓦片）
    → 测试拼接无缝隙
    → 测试多种瓦片组合

Step 4: Visual Companion展示
    → 在浏览器中展示对比效果
    → 分组展示：单瓦片对比 / 拼接对比 / 组合对比
    → 用户评分并记录决策

Step 5: 输出决策结果
    → 每类素材确定制作方案
    → 记录推荐工具/素材来源
    → 更新制作计划
```

### 2.2 测试范围

**测试元素选择**（按优先级排序）:

| 测试ID | 元素 | 选择理由 | 代表性 |
|-------|-----|---------|--------|
| T1 | 草地瓦片 | 最基础、大面积重复 | 基础元素类 |
| T2 | 路径瓦片 | 需边缘过渡与草地融合 | 过渡元素类 |
| T3 | 竹林瓦片 | 中医特色元素 | 中医特色类 |
| T4 | 药田瓦片 | 农场风格+标识牌 | 功能元素类 |

---

## 3. 详细测试设计

### 3.1 测试元素对比内容

#### T1: 草地瓦片

**对比组A（开源素材）**:
- 来源: OpenGameArt、itch.io像素素材库
- 要求: 32x32像素风格，符合田园治愈氛围
- 处理: 调整颜色匹配#4a9→#6c7渐变

**对比组B（AI生成）**:
- Prompt: `"32x32 pixel art tile, lush green grass field, soft green #4a9 to #6c7 gradient, warm pastoral atmosphere, subtle height variation, detailed grass blades, reference Stardew Valley style"`
- 工具: Stable Diffusion / Midjourney / DALL-E 3

**测试重点**:
- 拼接无缝隙（大面积重复测试）
- 重复不单调（是否有细节变化）
- 颜色匹配设计规范

#### T2: 路径瓦片

**对比组A（开源素材）**:
- 来源: 同上开源素材库
- 要求: 路径瓦片，有边缘过渡效果
- 处理: 调整为米黄#e8d色系

**对比组B（AI生成）**:
- Prompt: `"32x32 pixel art tile, dirt path, beige #e8d to warm brown transition, winding path texture, natural edge blending with grass, detailed pebble texture"`

**测试重点**:
- 与草地边缘过渡效果
- 蜿蜒路径视觉效果
- 路径瓦片与草地组合协调性

#### T3: 竹林瓦片

**对比组A（开源素材）**:
- 来源: 东方风格像素素材库
- 要求: 竹子丛瓦片，有竹节细节
- 处理: 调整为深绿#2d5色系

**对比组B（AI生成）**:
- Prompt: `"32x32 pixel art tile, bamboo grove cluster, deep green #2d5 color, visible bamboo nodes, Chinese medicine garden atmosphere, detailed leaf texture"`

**测试重点**:
- 竹节细节辨识度
- 深绿#2d5色系匹配
- 中医特色风格感知

#### T4: 药田瓦片

**对比组A（开源素材）**:
- 来源: 农场类像素素材库
- 要求: 农田瓦片，规整布局
- 处理: 添加标识牌元素（叠加或修改）

**对比组B（AI生成）**:
- Prompt: `"32x32 pixel art tile, medicinal herb garden plot, deep green #2d5 area, herb variety label, organized farming layout, subtle tool marks, detailed plant shapes"`

**测试重点**:
- 规整布局与自然野趣平衡
- 标识牌融合效果
- 功能性与视觉美观平衡

### 3.2 TileMap拼接测试

**测试地图规格**:
| 规格 | 值 |
|-----|-----|
| 尺寸 | 10x10瓦片（320x320像素） |
| 格式 | JSON（使用Tiled工具或手动创建） |

**拼接测试内容**:
| 测试项 | 测试地图布局 |
|-------|-------------|
| 草地重复测试 | 100%草地瓦片填充 |
| 草地+路径组合 | 蜿蜒路径穿过草地 |
| 多元素组合 | 草地+路径+竹林+药田组合 |

**测试工具**:
- Tiled地图编辑器（可选）
- 或直接在Phaser游戏中加载测试

### 3.3 Visual Companion展示方案

**展示分组**:
| 分组 | 内容 | 展示方式 |
|-----|-----|---------|
| 组1: 单瓦片对比 | 4个测试元素的开源 vs AI单瓦片并排展示 | 2列并排 |
| 组2: 拼接测试对比 | 10x10测试地图效果并排展示 | 2列并排 |
| 组3: 组合场景对比 | 多种瓦片组合场景效果 | 整体场景截图 |

**评分界面设计**:
```
┌─────────────────────────────────────────────────────────────┐
│  [开源素材截图]          [AI生成截图]                        │
│                                                             │
│  评分维度:                                                   │
│  ├─ 单独视觉效果: [1-5分] 开源 vs AI                         │
│  ├─ 拼接无缝隙:   [1-5分] 开源 vs AI                         │
│  ├─ 重复不单调:   [1-5分] 开源 vs AI                         │
│  ├─ 组合一致性:   [1-5分] 开源 vs AI                         │
│  ├─ 制作效率:     [1-5分] 开源 vs AI                         │
│  └─ 中医特色准确: [1-5分] 开源 vs AI                         │
│                                                             │
│  决策: [开源] / [AI] / [混合]                                │
│  备注: _____________________                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 评审标准

### 4.1 评分维度与权重

| 维度 | 权重 | 评分标准 | 说明 |
|-----|-----|---------|-----|
| **单独视觉效果** | 20% | 1-5分 | 像素风格统一、细节清晰、颜色匹配设计规范 |
| **拼接无缝隙** | 25% | 1-5分 | 边缘平滑过渡、无明显接缝、大面积重复无断裂 |
| **重复不单调** | 15% | 1-5分 | 大面积重复时有细节变化、不显机械感 |
| **组合一致性** | 20% | 1-5分 | 多种瓦片组合时风格协调、颜色和谐、层次清晰 |
| **制作效率** | 10% | 1-5分 | 制作时间、可复用性、后续扩展难度 |
| **中医特色准确** | 10% | 1-5分 | 竹林/药田的中医辨识度、符合中医文化感知 |

### 4.2 决策判定标准

| 总分差距 | 决策建议 |
|---------|---------|
| AI总分 > 开源总分 + 1分 | 采用AI生成方案 |
| 开源总分 > AI总分 + 1分 | 采用开源素材方案 |
| 总分差距 ≤ 1分 | 考虑混合方案或进一步测试 |

### 4.3 特殊情况处理

| 情况 | 处理方式 |
|-----|---------|
| 开源素材无合适来源 | 直接采用AI生成 |
| AI生成颜色不匹配 | 调整Prompt或后处理调色 |
| 中医特色评分差距大 | 中医元素优先考虑高分方案 |
| 拼接评分差距大 | 基础元素优先考虑高分方案 |

---

## 5. 输出物清单

### 5.1 测试输出物

| 输出物 | 文件路径 | 格式 |
|-------|---------|-----|
| 开源素材原始文件 | `tests/visual/asset-test/opensource/` | PNG |
| AI生成素材原始文件 | `tests/visual/asset-test/ai-generated/` | PNG |
| 单瓦片对比截图 | `tests/visual/asset-test/comparison/single-tile/` | PNG |
| 拼接测试截图 | `tests/visual/asset-test/comparison/tilemap/` | PNG |
| 组合场景截图 | `tests/visual/asset-test/comparison/composite/` | PNG |
| 评分记录表 | `tests/visual/asset-test/scoring-table.md` | Markdown |

### 5.2 决策输出物

| 输出物 | 文件路径 | 格式 |
|-------|---------|-----|
| 素材制作方案决策表 | `docs/superpowers/specs/2026-04-06-asset-production-decision.md` | Markdown |
| 推荐素材来源清单 | `docs/superpowers/specs/2026-04-06-recommended-asset-sources.md` | Markdown |
| Prompt模板优化建议 | `src/data/ai-prompts.json`（更新） | JSON |

---

## 6. 决策结果应用

### 6.1 决策表结构

**素材制作方案决策表**模板：

| 素材类别 | 推荐方案 | 推荐来源/Prompt | 理由 | 备注 |
|---------|---------|----------------|-----|-----|
| 草地瓦片 | [待定] | [待定] | [待定] | [待定] |
| 路径瓦片 | [待定] | [待定] | [待定] | [待定] |
| 竹林瓦片 | [待定] | [待定] | [待定] | [待定] |
| 药田瓦片 | [待定] | [待定] | [待定] | [待定] |
| ... | ... | ... | ... | ... |

### 6.2 后续扩展

测试完成后，决策表将扩展覆盖所有49种瓦片和30张高清图：

| 扩展阶段 | 覆盖内容 |
|---------|---------|
| 阶段1（本次测试） | 草地、路径、竹林、药田 |
| 阶段2 | 室外其他元素（山脉、水面、小桥、花田等） |
| 阶段3 | 室内基础元素（地板、墙壁、家具） |
| 阶段4 | 中医特色元素（经络图、药柜、祖师爷） |
| 阶段5 | 高清图和动画帧 |

---

## 7. 与其他任务的协作

### 7.1 与Phase 1测试的关系

| 任务 | 文件范围 | 是否冲突 |
|-----|---------|---------|
| 本次素材对比测试 | `tests/visual/asset-test/`、素材图片文件 | ❌ 无冲突 |
| Phase 1 AI端到端测试 | `src/systems/`、`src/utils/`、`tests/visual/布局测试` | ❌ 无冲突 |

**结论**: 本次素材对比测试与Phase 1测试完全无文件冲突，可以安全并行进行。

### 7.2 完成后的下一步

素材制作方案确定后：
1. 更新Phase 1.5实现计划
2. 开始批量素材制作（Task 1.5.5-1.5.6）
3. 等Phase 1验收通过后，进行场景视觉替换（Task 1.5.7）

---

## 8. 附录

### 8.1 Seedream API 最佳实践（火山引擎官方）

#### 8.1.1 API 概述

**Seedream** 是字节跳动(ByteDance)火山引擎推出的AI图像生成模型，支持文生图、图像编辑、多图融合和批量序列生成。

| 特性 | 详情 |
|-----|-----|
| 模型版本 | Seedream 4.0 / 4.5 / 5.0-Lite |
| 最大分辨率 | 4096x4096 (4K) |
| 特色能力 | 文字渲染、布局感知、多图一致性、联网搜索(5.0) |
| API平台 | 火山引擎（国内）、BytePlus（海外）、WaveSpeedAI、一步API |
| 官方文档 | https://www.volcengine.com/docs/82379/1541523 |

#### 8.1.2 模型版本选择

| 版本 | 定位 | 最适合场景 | 推荐指数 |
|-----|-----|-----------|---------|
| **4.0** | 高效率 | 快速迭代、网格布局、成本敏感 | ⭐⭐⭐ |
| **4.5** | 深度编辑与排版 | 文字渲染、品牌视觉、4K海报 | ⭐⭐⭐⭐⭐ |
| **5.0-Lite** | 轻量级智能 | 联网搜索、知识推理、快速生成 | ⭐⭐⭐⭐ |

**像素瓦片推荐**: 使用 **Seedream 4.5**，文字渲染能力强，支持精确控制。

#### 8.1.3 API 接入方式

**方式一: 火山引擎（国内官方，推荐）**
```python
import requests
import os

# 配置火山引擎 API
api_key = os.getenv("VOLCANO_API_KEY")
endpoint = "https://ark.cn-beijing.volces.com/api/v3/images/generations"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

payload = {
    "model": "doubao-seedream-4-5-251128",  # 火山引擎模型标识符
    "prompt": "32x32像素瓦片，草地，柔和绿色渐变，温馨田园氛围",
    "size": "1024x1024"
}

response = requests.post(endpoint, headers=headers, json=payload)
result = response.json()
image_url = result["data"][0]["url"]
```

**方式二: WaveSpeedAI（API聚合平台）**
```python
import wavespeed

output = wavespeed.run(
    "bytedance/seedream-v4.5",
    {
        "prompt": "32x32 pixel art tile, grass field, soft green gradient, warm pastoral atmosphere",
        "size": "1024x1024"
    }
)
print(output["outputs"][0])  # Output image URL
```

**方式三: 一步API（国内便捷接入）**
```python
from openai import OpenAI

client = OpenAI(
    api_key="your-yibu-api-key",
    base_url="https://yibuapi.com/v1"
)

response = client.images.generate(
    model="doubao-seedream-5-0-lite",
    prompt="32x32像素瓦片，草地，柔和绿色渐变",
    size="1024x1024"
)
print(response.data[0].url)
```

#### 8.1.4 核心参数配置

| 参数名 | 类型 | 说明 | 推荐值 |
|-------|-----|------|-------|
| `model` | string | 模型标识符 | `doubao-seedream-4-5-251128` |
| `prompt` | string | 文本提示词 | 50-200字，结构化描述 |
| `size` | string | 输出分辨率 | `"1024x1024"` 或 `"2048x2048"` |
| `seed` | integer | 随机种子，可重复生成 | 固定值保持一致性 |
| `guidance_scale` | float | 提示词遵循度 (1-20) | 7-9 (推荐7.5) |
| `image` | string | 参考图URL（编辑模式） | 图生图时使用 |

**guidance_scale 调优指南**:
- **7-9**: 大多数场景最佳，平衡提示词遵循和自然度
- **5-7**: 更自然、更艺术，适合创意探索
- **9-12**: 强提示词遵循，适合精确控制
- **>12**: 不推荐，可能出现过饱和

#### 8.1.5 Prompt 最佳实践（官方指南）

**结构化Prompt公式**:
```
[主体] + [动作/状态] + [环境/背景] + [风格] + [技术细节] + [文字内容]
```

**像素瓦片生成Prompt模板**:
```
32x32像素瓦片，[元素描述]，[颜色要求]，[氛围关键词]，[细节要求]，像素艺术风格
```

**关键技巧**:

| 技巧 | 说明 | 示例 |
|-----|-----|-----|
| 使用自然语言 | 写连贯叙述而非关键词列表 | ✅ "一片柔和的草地，绿色渐变，温馨田园氛围" |
| 明确尺寸 | 指定像素尺寸 | "32x32像素瓦片" |
| 颜色精确控制 | 使用HEX或中文描述 | "柔和绿色#4a9渐变" |
| 氛围词 | 描述整体感觉 | "温馨田园氛围"、"中医古风" |
| 风格参考 | 引用目标风格 | "像素艺术风格"、"星露谷物语风格" |

**文字渲染技巧（Seedream 4.5特色）**:
```
# 使用双引号括住必须出现的文字
咖啡店菜单板，标题"每日特惠"，项目：美式$3、拿铁$4

# 指定字体特征
极简海报，标题"AI创新峰会"，粗体无衬线字体，深蓝色背景
```

**像素瓦片Prompt示例**:

```python
# 草地瓦片
grass_prompt = """
32x32像素瓦片，一片茂盛的草地，柔和的绿色从#4a9渐变到#6c7，
温馨的田园氛围，有细微的高度变化，草叶细节清晰，像素艺术风格
"""

# 路径瓦片
path_prompt = """
32x32像素瓦片，泥土小径，米黄色#e8d到暖棕色的过渡，
蜿蜒小路纹理，边缘自然融入草地，鹅卵石纹理细节，像素艺术风格
"""

# 竹林瓦片
bamboo_prompt = """
32x32像素瓦片，竹林丛，深绿色#2d5色系，
可见竹节细节，中医园林氛围，叶片纹理清晰，像素艺术风格
"""

# 药田瓦片
herb_field_prompt = """
32x32像素瓦片，药田种植区，深绿色#2d5区域，
有品种标识牌，规整的种植布局，工具痕迹细节，植物形态清晰，像素艺术风格
"""
```

#### 8.1.6 保持多图一致性的技巧

**使用固定seed**:
```python
# 批量生成同风格草地变体
base_prompt = "32x32像素瓦片，草地，柔和绿色渐变，像素艺术风格"
variations = ["清晨光照", "傍晚氛围", "有花朵点缀"]

for variation in variations:
    output = wavespeed.run(
        "bytedance/seedream-v4.5",
        {
            "prompt": f"{base_prompt}，{variation}",
            "seed": 42,  # 固定seed保持风格一致
            "size": "1024x1024"
        }
    )
```

**使用序列生成模式**:
```python
# 一次生成多张一致风格图片
output = wavespeed.run(
    "bytedance/seedream-v4.5/sequential",
    {
        "prompt": "生成4张草地瓦片变体。图1：浅绿；图2：中绿；图3：深绿；图4：带小花点缀。统一像素艺术风格",
        "max_images": 4,
        "size": "1024x1024"
    }
)
for url in output["outputs"]:
    print(url)
```

#### 8.1.7 像素艺术生成注意事项

| 问题 | 解决方案 |
|-----|---------|
| AI生成非精确32x32 | 生成后用Aseprite/Photoshop裁切缩放 |
| 颜色不够精确 | 后处理调色或使用颜色描述词 |
| 风格不统一 | 使用固定seed和相同风格关键词 |
| 边缘有抗锯齿 | 后处理转为纯像素风格（关闭抗锯齿） |
| 细节过多 | 简化Prompt，强调"简洁"、"示意" |

**后处理工作流**:
```
1. 生成1024x1024或2048x2048图像
2. 使用图像处理工具裁切/缩放到32x32像素
3. 关闭抗锯齿，保持像素锐利边缘
4. 调整颜色匹配设计规范HEX值
5. 导出PNG透明背景
```

#### 8.1.8 定价参考

| 平台 | 模型 | 价格 | 特点 |
|-----|-----|------|-----|
| 火山引擎 | Seedream 4.5 | ¥0.30/图 | 官方直连，企业级支持 |
| BytePlus | Seedream 4.5 | $0.045/图 | 海外官方，免费试用200张 |
| WaveSpeedAI | Seedream 4.5 | $0.04/图 | API聚合，多模型对比 |
| 一步API | Seedream 5.0 Lite | ¥0.12-0.20/图 | 价格优惠，国内便捷 |

**成本优化建议**:
- 开发测试阶段：使用一步API或WaveSpeedAI，价格优惠40-60%
- 生产环境：使用火山引擎官方，企业级SLA保障
- 批量生成：使用固定seed减少重复尝试成本

---

### 8.2 开源素材库详细清单

#### 8.2.1 草地/路径类素材

| 素材包 | 来源 | 尺寸 | 许可证 | 价格 | 适用性 |
|-------|-----|-----|-------|-----|-------|
| **Pixel art grass tileset** | OpenGameArt | 32x32 | CC-BY 4.0 | 免费 | ✅ 高度适用，112个草地瓦片 |
| **Basic Tileset 32x32** | itch.io (schwarnhild) | 32x32 | - | 免费 | ✅ 包含草地、路径基础瓦片 |
| **FREE RPG Tileset 32x32** | itch.io (Pipoya) | 32x32 | - | 免费 | ✅ 大量RPG基础瓦片 |
| **Decorative Road Tiles** | OpenGameArt | 多尺寸 | CC0 | 免费 | ✅ 路径瓦片变体 |
| **Grass path tileset** | GameDev Market | - | - | 免费 | ✅ 草地+路径组合 |

**推荐选择**:
- **草地瓦片**: Pixel art grass tileset (OpenGameArt) - 112个变体，免费CC-BY
- **路径瓦片**: Decorative Road Tiles (OpenGameArt) - 多种风格，免费CC0

#### 8.2.2 竹林/东方风格素材

| 素材包 | 来源 | 尺寸 | 许可证 | 价格 | 适用性 |
|-------|-----|-----|-------|-----|-------|
| **Bamboo Tiles** | OpenGameArt (Sevarihk) | 32x32 | CC-BY 4.0 | 免费 | ✅ 专门竹子瓦片，含RPG Maker自动瓦片格式 |
| **Bamboo Forest** | OpenGameArt | 多尺寸 | - | 免费 | ⚠️ 可能需要调整尺寸 |
| **Ancient Chinese Forest** | itch.io (Niao_K) | 16x16 | 付费许可 | $5 | ✅ 中国古风森林，高度适配中医主题 |
| **Chinese Garden Tileset** | itch.io (BiteMe Games) | 多尺寸 | - | $6.99 | ⚠️ 包含桥梁、莲花等元素 |

**推荐选择**:
- **竹林瓦片**: Bamboo Tiles (OpenGameArt) - 免费、32x32、CC-BY许可
- **备选**: Ancient Chinese Forest (itch.io) - 付费但风格匹配度高

#### 8.2.3 农场/药田类素材

| 素材包 | 来源 | 尺寸 | 许可证 | 价格 | 适用性 |
|-------|-----|-----|-------|-----|-------|
| **Pixel Platformer Farm Expansion** | Kenney | 像素 | CC0 | 免费 | ✅ Kenney免费农场素材 |
| **Top-Down Grasslands Sprite** | itch.io (Long Trail) | 多尺寸 | - | 付费 | ⚠️ 草原风格农场元素 |
| **PixAdvent Grasslands** | itch.io | 32x32 | - | 付费 | ⚠️ 冒险风格农场 |

**推荐选择**:
- **药田瓦片**: Kenney Pixel Platformer Farm Expansion - 免费CC0，可自由修改
- **标识牌**: 需要自行添加或AI生成

#### 8.2.4 中医特色素材（药店/诊所）

| 素材包 | 来源 | 尺寸 | 许可证 | 价格 | 适用性 |
|-------|-----|-----|-------|-----|-------|
| **Ancient Chinese Medicine Shop** | itch.io (Niao_K) | 16x16 | 付费许可 | $5 | ✅ 古风药铺，高度适配中医主题 |
| **Ancient Chinese Market** | itch.io (Niao_K) | 16x16 | 付费许可 | 付费 | ✅ 中国古风市场，可配合使用 |

**推荐选择**:
- **诊所室内**: Ancient Chinese Medicine Shop (itch.io) - 付费$5，但中医风格准确
- **注意**: 尺寸为16x16，需要放大到32x32或调整游戏设计

#### 8.2.5 开源素材许可证说明

| 许可证 | 要求 | 适用场景 |
|-------|-----|---------|
| **CC0** | 无需署名，可商用可修改 | 最佳选择，完全自由 |
| **CC-BY 4.0** | 需署名，可商用可修改 | 只需在Credits中注明作者 |
| **付费许可** | 通常可商用，不可转售 | 需购买，查看具体条款 |

---

### 8.3 测试素材来源决策矩阵

| 测试元素 | 推荐开源素材 | 开源评分预期 | AI生成方案 | AI评分预期 |
|---------|-------------|-------------|-----------|-----------|
| **草地瓦片** | OpenGameArt Pixel grass tileset | 高 (免费、变体多) | Seedream生成 | 中 (需后处理) |
| **路径瓦片** | OpenGameArt Decorative Road | 高 (免费、风格多样) | Seedream生成 | 中 (边缘过渡难控制) |
| **竹林瓦片** | OpenGameArt Bamboo Tiles | 高 (免费、32x32) | Seedream生成 | 高 (可控性强) |
| **药田瓦片** | Kenney Farm素材 + 标识牌叠加 | 中 (需修改) | Seedream生成 | 高 (可生成完整元素) |

---

### 8.4 颜色校准工具

| 工具 | 用途 |
|-----|-----|
| Photoshop/GIMP | 手动调色匹配设计规范 |
| PIL/Pillow | Python批量调色脚本 |
| Aseprite | 像素艺术专用编辑器，支持调色板管理 |
| online color tool | 快速HEX颜色调整 |

### 8.5 素材处理工作流

```
开源素材处理流程:
1. 下载原始素材 (PNG格式)
2. 检查尺寸是否符合32x32 (如不符合，使用Aseprite缩放)
3. 使用Aseprite/Photoshop调整颜色匹配设计规范
4. 导出为PNG (透明背景)
5. 放入 tests/visual/asset-test/opensource/

AI生成素材处理流程:
1. 编写结构化Prompt (参考8.1.3)
2. 调用Seedream API生成图片
3. 下载生成结果
4. 裁切/缩放到32x32像素
5. 转换为纯像素风格 (去除抗锯齿)
6. 调整颜色匹配设计规范
7. 放入 tests/visual/asset-test/ai-generated/
```

---

*本设计由 brainstorming 技能生成，待用户审批后进入实现阶段*