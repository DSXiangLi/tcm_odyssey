 AI视觉优先素材生成方案设计

**版本**: v1.0
**日期**: 2026-04-06
**状态**: 设计阶段

---

## 1. 核心思路

### 1.1 传统方法 vs 新方法

| 方法 | 流程 | 问题 |
|-----|------|------|
| **传统方法** | 先定义坐标 → 再生成匹配素材 | 素材与坐标难匹配，AI自由发挥导致不协调 |
| **新方法** | 先生成完整场景 → AI自动识别坐标 | 视觉自然协调，逻辑自动推导 |

### 1.2 新方法优势

1. **视觉一致性**：AI生成完整场景，所有元素自然融合
2. **减少手动工作**：不需要手动指定每个建筑/元素的精确坐标
3. **可迭代**：重新生成场景后，自动更新逻辑数据
4. **更灵活**：AI可以有创意地布局，不必拘泥于预设坐标

---

## 2. 实现流程

```
┌─────────────────────────────────────────────────────────────┐
│                    AI视觉优先素材生成流程                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 生成完整场景图                                      │
│  ├── Prompt: 描述完整的小镇场景                              │
│  ├── 约束: 40x30瓦片网格 (1280x960像素)                      │
│  ├── 约束: 必须包含3个建筑入口                               │
│  └── 输出: town_scene.png                                   │
│                                                             │
│  Step 2: 覆盖网格并切分                                      │
│  ├── 将图片切分为40x30个32x32像素的瓦片                      │
│  └── 输出: 1200个瓦片图片                                    │
│                                                             │
│  Step 3: AI分类每个瓦片                                      │
│  ├── 调用QWEN VL API分析每个瓦片                            │
│  ├── 分类: walkable / blocked / door / special              │
│  └── 输出: tile_classification.json                         │
│                                                             │
│  Step 4: 识别建筑和门                                        │
│  ├── 分析连续blocked区域 → 识别建筑                          │
│  ├── 在建筑边缘找door瓦片 → 识别门                           │
│  └── 输出: buildings.json, doors.json                       │
│                                                             │
│  Step 5: 生成配置文件                                        │
│  ├── 将识别结果转换为map-config.ts格式                       │
│  └── 输出: 自动生成的map-config.ts                           │
│                                                             │
│  Step 6: 人工审核调整                                        │
│  ├── 可视化显示识别结果                                      │
│  ├── 允许手动修正分类错误                                    │
│  └── 输出: 最终版map-config.ts                               │
│                                                             │
│  Step 7: 集成到游戏                                          │
│  ├── 更新场景使用新生成的素材                                │
│  └── 验证游戏功能正常                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 详细设计

### 3.1 Step 1: 生成完整场景图

**Prompt模板:**

```
【像素艺术游戏场景 - 完整小镇】

场景描述：
- 一个温馨治愈的中医主题田园小镇
- 俯视图视角，适合2D游戏
- 包含3个可进入的建筑：中医诊所、药园入口、玩家之家
- 包含自然元素：池塘、竹林、花田
- 有清晰的路径连接各建筑

尺寸要求：
- 总尺寸：1280x960像素（40x30网格）
- 每个网格单元：32x32像素

布局要求：
- 左上区域：中医诊所建筑（约8x6网格），底部有门
- 右上区域：药园入口（约8x6网格），底部有门
- 左下区域：玩家之家（约6x6网格），底部有门
- 中央：十字形路径（2格宽）
- 其他区域：草地、自然元素点缀

风格要求：
- 像素艺术风格，32x32像素瓦片
- 色彩温馨治愈，以绿色和棕色为主
- 参考星露谷物语但更精致
- 建筑与背景自然融合

重要：场景必须是一个完整的、视觉协调的图像，
所有元素自然融合，不要有"贴上去"的感觉。
```

**生成参数:**
- 模型: Seedream (火山引擎)
- 尺寸: 1280x960像素
- 格式: PNG

### 3.2 Step 2: 覆盖网格并切分

```python
# tile_splitter.py
from PIL import Image

TILE_SIZE = 32
MAP_WIDTH = 40
MAP_HEIGHT = 30

def split_scene(image_path: str, output_dir: str):
    """将场景图切分为瓦片"""
    img = Image.open(image_path)

    tiles = []
    for y in range(MAP_HEIGHT):
        for x in range(MAP_WIDTH):
            tile = img.crop((
                x * TILE_SIZE,
                y * TILE_SIZE,
                (x + 1) * TILE_SIZE,
                (y + 1) * TILE_SIZE
            ))
            tile_path = f"{output_dir}/tile_{x}_{y}.png"
            tile.save(tile_path)
            tiles.append({
                "x": x,
                "y": y,
                "path": tile_path
            })

    return tiles
```

### 3.3 Step 3: AI分类每个瓦片

**分类类别:**

| 类别 | 代码 | 描述 | 游戏逻辑 |
|-----|------|------|---------|
| 可行走 | `walkable` | 草地、路径、平地 | 玩家可自由移动 |
| 阻挡 | `blocked` | 墙壁、建筑、树木、水 | 玩家无法通过 |
| 门 | `door` | 建筑入口 | 触发场景切换 |
| 特殊 | `special` | 花田、药田、池塘等 | 可交互区域 |

**批量分类Prompt:**

```
分析这张32x32像素的游戏瓦片图片，判断其类型：

可能类型：
- walkable: 草地、泥土路、石板路等可行走区域
- blocked: 墙壁、建筑墙壁、树木、水面、石头等障碍物
- door: 门、入口（通常是建筑底部中间的特殊瓦片）
- special: 花田、药田、池塘边缘等可交互区域

请只回答一个类型代码：walkable / blocked / door / special
```

**优化策略 - 区域采样:**

为减少API调用次数，可以：
1. 先对大区域进行采样分类
2. 只对边界区域进行精细分类
3. 使用图像相似度合并同类瓦片

```python
# tile_classifier.py
import requests
import base64
from pathlib import Path

def classify_tile(image_path: str) -> str:
    """使用QWEN VL分类单个瓦片"""
    with open(image_path, 'rb') as f:
        image_base64 = base64.b64encode(f.read()).decode('utf-8')

    # 调用QWEN VL API
    response = requests.post(
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "qwen-vl-max",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
                    {"type": "text", "text": CLASSIFICATION_PROMPT}
                ]
            }],
            "max_tokens": 10
        }
    )

    result = response.json()
    classification = result["choices"][0]["message"]["content"].strip()
    return classification
```

### 3.4 Step 4: 识别建筑和门

**算法:**

```python
# building_detector.py

def detect_buildings(tiles: list[list[str]]) -> list[dict]:
    """从分类结果中识别建筑"""
    buildings = []
    visited = set()

    for y in range(MAP_HEIGHT):
        for x in range(MAP_WIDTH):
            if tiles[y][x] == 'blocked' and (x, y) not in visited:
                # BFS找连续的blocked区域
                building_tiles = bfs_blocked(tiles, x, y, visited)

                if len(building_tiles) > 10:  # 最小建筑尺寸
                    # 找门（建筑边缘的door瓦片）
                    doors = find_doors(building_tiles, tiles)

                    buildings.append({
                        "tiles": building_tiles,
                        "doors": doors,
                        "bounds": calculate_bounds(building_tiles)
                    })

    return buildings

def find_doors(building_tiles: set, all_tiles: list) -> list:
    """找建筑边缘的门瓦片"""
    doors = []
    for (x, y) in building_tiles:
        for (dx, dy) in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < MAP_WIDTH and 0 <= ny < MAP_HEIGHT:
                if all_tiles[ny][nx] == 'door':
                    doors.append((nx, ny))
    return doors
```

### 3.5 Step 5: 生成配置文件

```python
# config_generator.py

def generate_map_config(buildings: list, doors: list) -> str:
    """生成map-config.ts"""

    building_configs = []
    door_configs = []

    for i, building in enumerate(buildings):
        bounds = building['bounds']
        building_id = f"building_{i}"

        # 确定目标场景（需要人工确认或AI推断）
        target_scene = infer_scene(building, i)

        building_configs.append({
            "id": building_id,
            "name": f"建筑{i+1}",
            "startX": bounds['min_x'],
            "startY": bounds['min_y'],
            "width": bounds['max_x'] - bounds['min_x'] + 1,
            "height": bounds['max_y'] - bounds['min_y'] + 1,
            "doorOffsetX": building['doors'][0][0] - bounds['min_x'] if building['doors'] else 0,
            "doorY": "bottom",
            "targetScene": target_scene
        })

        for door in building['doors']:
            door_configs.append({
                "tileX": door[0],
                "tileY": door[1],
                "targetScene": target_scene,
                "spawnPoint": {"x": door[0], "y": door[1] + 1}
            })

    # 生成TypeScript代码
    return generate_typescript_code(building_configs, door_configs)
```

### 3.6 Step 6: 可视化审核工具

创建一个HTML工具显示：
1. 原始场景图
2. 网格覆盖层
3. AI分类结果（不同颜色标记）
4. 识别出的建筑和门
5. 允许点击修正分类

```html
<!-- review_tool.html -->
<div class="review-container">
  <div class="scene-view">
    <img src="town_scene.png" id="scene">
    <canvas id="grid-overlay"></canvas>
  </div>
  <div class="controls">
    <button onclick="toggleGrid()">显示/隐藏网格</button>
    <button onclick="showClassification()">显示分类</button>
    <button onclick="exportConfig()">导出配置</button>
  </div>
  <div class="legend">
    <span class="walkable">可行走</span>
    <span class="blocked">阻挡</span>
    <span class="door">门</span>
    <span class="special">特殊</span>
  </div>
</div>
```

---

## 4. 技术实现清单

### 4.1 需要创建的工具

| 工具 | 功能 | 输入 | 输出 |
|-----|------|-----|------|
| `scene_generator.py` | 生成完整场景 | Prompt | town_scene.png |
| `tile_splitter.py` | 切分瓦片 | 场景图 | 瓦片图片集 |
| `tile_classifier.py` | 分类瓦片 | 瓦片图片 | 分类结果JSON |
| `building_detector.py` | 识别建筑 | 分类结果 | 建筑配置JSON |
| `config_generator.py` | 生成配置 | 建筑配置 | map-config.ts |
| `review_tool.html` | 可视化审核 | 全部数据 | 修正后数据 |

### 4.2 API调用优化

**问题**: 1200个瓦片 × 每次API调用 = 调用次数太多

**解决方案:**

1. **图像相似度预聚类**: 相似的瓦片只调用一次API
2. **批量请求**: 一次请求分析多个瓦片（QWEN VL支持多图）
3. **区域采样**: 先分类大区域，只对边界精细分析
4. **本地模型**: 对于简单分类，使用本地模型

**预估API调用:**
- 相似度聚类后：约100-200个不同瓦片
- 批量请求（每批10个）：约10-20次API调用

---

## 5. 风险与应对

| 风险 | 影响 | 应对措施 |
|-----|------|---------|
| AI分类不准确 | 门位置错误 | 人工审核修正 |
| 建筑识别偏差 | 碰撞检测不准 | 可视化工具辅助调整 |
| API调用成本高 | 预算超支 | 聚类优化、本地模型 |
| 室内场景不匹配 | 场景切换异常 | 生成后验证并调整 |

---

## 6. 执行计划

### Phase 1: 工具开发（1天）
- [ ] 创建 scene_generator.py
- [ ] 创建 tile_splitter.py
- [ ] 创建 tile_classifier.py
- [ ] 创建 building_detector.py
- [ ] 创建 config_generator.py
- [ ] 创建 review_tool.html

### Phase 2: 测试验证（0.5天）
- [ ] 生成测试场景
- [ ] 运行完整流程
- [ ] 验证识别准确性
- [ ] 调整优化

### Phase 3: 生产应用（1天）
- [ ] 生成正式场景素材
- [ ] AI分类和识别
- [ ] 人工审核修正
- [ ] 集成到游戏
- [ ] 端到端测试

---

## 7. 成功标准

1. 生成的场景图视觉自然协调
2. AI分类准确率 ≥ 90%
3. 门位置识别正确
4. 游戏运行正常，场景切换可用
5. 减少手动配置工作量 ≥ 80%

---

*本设计文档由Claude Code创建于 2026-04-06*