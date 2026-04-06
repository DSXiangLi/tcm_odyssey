# 素材制作方案对比测试实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成草地、路径、竹林、药田四种瓦片素材，对比开源素材vs AI生成(Seedream)的效果，输出对比截图供用户评审。

**Architecture:** 创建测试目录结构，下载开源素材，使用Seedream API生成AI素材，创建简单的HTML对比展示页面。

**Tech Stack:** Python, Seedream API, HTML/CSS, PNG图像处理

---

## 文件结构

```
tests/visual/asset-test/
├── opensource/                    # 开源素材存放
│   ├── grass/                     # 草地瓦片
│   ├── path/                      # 路径瓦片
│   ├── bamboo/                    # 竹林瓦片
│   └── herb-field/                # 药田瓦片
├── ai-generated/                  # AI生成素材存放
│   ├── grass/
│   ├── path/
│   ├── bamboo/
│   └── herb-field/
├── comparison/                    # 对比截图
│   └── *.png
├── prompts.json                   # AI生成Prompt配置
└── comparison.html                # 对比展示页面
```

---

## Task 1: 创建测试目录结构

**Files:**
- Create: `tests/visual/asset-test/` (目录)

- [ ] **Step 1: 创建所有测试目录**

```bash
mkdir -p tests/visual/asset-test/{opensource,ai-generated}/{grass,path,bamboo,herb-field}
mkdir -p tests/visual/asset-test/comparison
```

- [ ] **Step 2: 验证目录创建**

```bash
ls -la tests/visual/asset-test/
```

Expected: 显示opensource, ai-generated, comparison目录

---

## Task 2: 创建AI生成Prompt配置

**Files:**
- Create: `tests/visual/asset-test/prompts.json`

- [ ] **Step 1: 创建Prompt配置文件**

```json
{
  "grass": {
    "prompt": "32x32像素瓦片，一片茂盛的草地，柔和的绿色从#4a9渐变到#6c7，温馨的田园氛围，有细微的高度变化，草叶细节清晰，像素艺术风格，游戏素材",
    "negative_prompt": "模糊,低质量,扭曲,水印,签名",
    "seed": 42,
    "size": "1024x1024"
  },
  "path": {
    "prompt": "32x32像素瓦片，泥土小径，米黄色#e8d到暖棕色的过渡，蜿蜒小路纹理，边缘自然融入草地，鹅卵石纹理细节，像素艺术风格，游戏素材",
    "negative_prompt": "模糊,低质量,扭曲,水印,签名",
    "seed": 42,
    "size": "1024x1024"
  },
  "bamboo": {
    "prompt": "32x32像素瓦片，竹林丛，深绿色#2d5色系，可见竹节细节，中医园林氛围，叶片纹理清晰，像素艺术风格，游戏素材，东方风格",
    "negative_prompt": "模糊,低质量,扭曲,水印,签名",
    "seed": 42,
    "size": "1024x1024"
  },
  "herb-field": {
    "prompt": "32x32像素瓦片，药田种植区，深绿色#2d5区域，有品种标识牌，规整的种植布局，工具痕迹细节，植物形态清晰，像素艺术风格，游戏素材",
    "negative_prompt": "模糊,低质量,扭曲,水印,签名",
    "seed": 42,
    "size": "1024x1024"
  }
}
```

---

## Task 3: 下载开源草地素材

**Files:**
- Download to: `tests/visual/asset-test/opensource/grass/`

- [ ] **Step 1: 下载OpenGameArt草地瓦片**

来源: https://opengameart.org/content/pixel-art-grass-tileset (CC-BY 4.0)

使用curl或wget下载，或手动下载后放入目录。

- [ ] **Step 2: 记录素材信息**

创建 `tests/visual/asset-test/opensource/grass/SOURCE.md`:
```markdown
# 草地瓦片素材来源

- 来源: OpenGameArt - Pixel art grass tileset
- 作者: PixelShack
- 许可证: CC-BY 4.0
- 网址: https://opengameart.org/content/pixel-art-grass-tileset
- 尺寸: 32x32像素
- 备注: 包含112个草地瓦片变体
```

---

## Task 4: 下载开源竹林素材

**Files:**
- Download to: `tests/visual/asset-test/opensource/bamboo/`

- [ ] **Step 1: 下载OpenGameArt竹林瓦片**

来源: https://opengameart.org/content/bamboo-tiles (CC-BY 4.0)

- [ ] **Step 2: 记录素材信息**

创建 `tests/visual/asset-test/opensource/bamboo/SOURCE.md`:
```markdown
# 竹林瓦片素材来源

- 来源: OpenGameArt - Bamboo Tiles
- 作者: Sevarihk
- 许可证: CC-BY 4.0
- 网址: https://opengameart.org/content/bamboo-tiles
- 尺寸: 32x32像素
- 备注: 包含竹林瓦片和叶子自动瓦片格式
```

---

## Task 5: 创建占位素材文件

**Files:**
- Create: `tests/visual/asset-test/opensource/path/SOURCE.md`
- Create: `tests/visual/asset-test/opensource/herb-field/SOURCE.md`

由于开源素材需要手动下载，先创建占位说明文件。

- [ ] **Step 1: 创建路径素材说明**

```markdown
# 路径瓦片素材来源

- 推荐来源: OpenGameArt - Decorative Road Tiles Pack
- 许可证: CC0
- 网址: https://opengameart.org/content/decorative-road-tiles-pack
- 备注: 多种路径风格，需调整为米黄色#e8d色系
```

- [ ] **Step 2: 创建药田素材说明**

```markdown
# 药田瓦片素材来源

- 推荐来源: Kenney - Pixel Platformer Farm Expansion
- 许可证: CC0
- 网址: https://kenney.nl/assets/pixel-platformer-farm-expansion
- 备注: 农场风格，需添加标识牌元素
```

---

## Task 6: 创建AI生成脚本

**Files:**
- Create: `tests/visual/asset-test/generate_ai_assets.py`

- [ ] **Step 1: 创建AI素材生成脚本**

```python
#!/usr/bin/env python3
"""
AI素材生成脚本 - 使用火山引擎Seedream API生成像素瓦片
"""
import json
import os
import requests
import time
from pathlib import Path

# 配置
BASE_DIR = Path(__file__).parent
PROMPTS_FILE = BASE_DIR / "prompts.json"
OUTPUT_DIR = BASE_DIR / "ai-generated"

# API配置 - 使用一步API（价格优惠）
API_URL = "https://yibuapi.com/v1/images/generations"
API_KEY = os.getenv("YIBU_API_KEY", "")  # 从环境变量获取

def load_prompts():
    """加载Prompt配置"""
    with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_image(asset_type: str, prompt_config: dict) -> str:
    """调用API生成图片"""
    if not API_KEY:
        print(f"⚠️ 未设置API_KEY，跳过 {asset_type} 生成")
        print("请设置环境变量: export YIBU_API_KEY=your_key")
        return None

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "doubao-seedream-5-0-lite",
        "prompt": prompt_config["prompt"],
        "size": prompt_config["size"],
        "seed": prompt_config["seed"]
    }

    if prompt_config.get("negative_prompt"):
        payload["negative_prompt"] = prompt_config["negative_prompt"]

    try:
        print(f"🎨 正在生成 {asset_type}...")
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()

        image_url = result["data"][0]["url"]
        print(f"✅ {asset_type} 生成成功: {image_url}")
        return image_url
    except Exception as e:
        print(f"❌ {asset_type} 生成失败: {e}")
        return None

def download_image(url: str, save_path: Path):
    """下载图片"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(response.content)
        print(f"📥 已下载: {save_path}")
    except Exception as e:
        print(f"❌ 下载失败: {e}")

def main():
    """主函数"""
    print("=" * 50)
    print("🎨 AI素材生成工具 - Seedream API")
    print("=" * 50)

    # 加载配置
    prompts = load_prompts()

    # 确保输出目录存在
    for asset_type in prompts.keys():
        (OUTPUT_DIR / asset_type).mkdir(parents=True, exist_ok=True)

    # 生成每种素材
    results = {}
    for asset_type, config in prompts.items():
        image_url = generate_image(asset_type, config)
        if image_url:
            # 下载图片
            save_path = OUTPUT_DIR / asset_type / f"{asset_type}_ai_1024.png"
            download_image(image_url, save_path)
            results[asset_type] = {
                "url": image_url,
                "local_path": str(save_path)
            }
            time.sleep(2)  # 避免请求过快

    # 保存结果
    results_file = BASE_DIR / "generation_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 50)
    print(f"✅ 完成！结果已保存到 {results_file}")
    print("=" * 50)

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 添加执行权限**

```bash
chmod +x tests/visual/asset-test/generate_ai_assets.py
```

---

## Task 7: 创建HTML对比展示页面

**Files:**
- Create: `tests/visual/asset-test/comparison.html`

- [ ] **Step 1: 创建对比展示页面**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>素材对比测试 - 药灵山谷</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #1a1a2e;
            color: #eee;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            color: #4a9;
        }
        .comparison-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .asset-card {
            background: #16213e;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #0f3460;
        }
        .asset-card h2 {
            color: #4a9;
            margin-bottom: 15px;
            font-size: 1.2em;
        }
        .comparison-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        .tile-preview {
            background: #0f3460;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .tile-preview h3 {
            font-size: 0.9em;
            margin-bottom: 10px;
            color: #8ca;
        }
        .tile-preview img {
            max-width: 100%;
            border-radius: 4px;
            image-rendering: pixelated;
        }
        .placeholder {
            background: #2a2a4a;
            border: 2px dashed #4a9;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            color: #666;
        }
        .scoring {
            background: #0f3460;
            border-radius: 8px;
            padding: 15px;
            margin-top: 10px;
        }
        .scoring h4 {
            margin-bottom: 10px;
            color: #fd8;
        }
        .score-item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 0.9em;
        }
        .score-input {
            width: 50px;
            background: #1a1a2e;
            border: 1px solid #4a9;
            color: #fff;
            padding: 2px 5px;
            border-radius: 4px;
            text-align: center;
        }
        .decision {
            margin-top: 15px;
            padding: 10px;
            background: #1a1a2e;
            border-radius: 8px;
        }
        .decision select {
            padding: 5px 10px;
            background: #16213e;
            color: #fff;
            border: 1px solid #4a9;
            border-radius: 4px;
        }
        .notes {
            width: 100%;
            background: #1a1a2e;
            border: 1px solid #4a9;
            color: #fff;
            padding: 8px;
            border-radius: 4px;
            margin-top: 10px;
            resize: vertical;
        }
    </style>
</head>
<body>
    <h1>🎮 素材制作方案对比测试</h1>

    <div class="comparison-grid">
        <!-- 草地瓦片对比 -->
        <div class="asset-card">
            <h2>🌿 草地瓦片 (Grass Tile)</h2>
            <div class="comparison-row">
                <div class="tile-preview">
                    <h3>开源素材</h3>
                    <div class="placeholder">
                        <p>OpenGameArt</p>
                        <p>Pixel art grass tileset</p>
                        <p>CC-BY 4.0</p>
                    </div>
                </div>
                <div class="tile-preview">
                    <h3>AI生成 (Seedream)</h3>
                    <div class="placeholder" id="ai-grass">
                        <p>待生成</p>
                    </div>
                </div>
            </div>
            <div class="scoring">
                <h4>评分 (1-5分)</h4>
                <div class="score-item">
                    <span>视觉效果:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
                <div class="score-item">
                    <span>拼接无缝隙:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
                <div class="score-item">
                    <span>风格一致性:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
            </div>
            <div class="decision">
                <label>决策: </label>
                <select>
                    <option value="">请选择</option>
                    <option value="opensource">使用开源素材</option>
                    <option value="ai">使用AI生成</option>
                    <option value="mixed">混合方案</option>
                </select>
                <textarea class="notes" placeholder="备注..."></textarea>
            </div>
        </div>

        <!-- 路径瓦片对比 -->
        <div class="asset-card">
            <h2>🛤️ 路径瓦片 (Path Tile)</h2>
            <div class="comparison-row">
                <div class="tile-preview">
                    <h3>开源素材</h3>
                    <div class="placeholder">
                        <p>OpenGameArt</p>
                        <p>Decorative Road Tiles</p>
                        <p>CC0</p>
                    </div>
                </div>
                <div class="tile-preview">
                    <h3>AI生成 (Seedream)</h3>
                    <div class="placeholder" id="ai-path">
                        <p>待生成</p>
                    </div>
                </div>
            </div>
            <div class="scoring">
                <h4>评分 (1-5分)</h4>
                <div class="score-item">
                    <span>视觉效果:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
                <div class="score-item">
                    <span>边缘过渡:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
                <div class="score-item">
                    <span>风格一致性:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
            </div>
            <div class="decision">
                <label>决策: </label>
                <select>
                    <option value="">请选择</option>
                    <option value="opensource">使用开源素材</option>
                    <option value="ai">使用AI生成</option>
                    <option value="mixed">混合方案</option>
                </select>
                <textarea class="notes" placeholder="备注..."></textarea>
            </div>
        </div>

        <!-- 竹林瓦片对比 -->
        <div class="asset-card">
            <h2>🎋 竹林瓦片 (Bamboo Tile)</h2>
            <div class="comparison-row">
                <div class="tile-preview">
                    <h3>开源素材</h3>
                    <div class="placeholder">
                        <p>OpenGameArt</p>
                        <p>Bamboo Tiles</p>
                        <p>CC-BY 4.0</p>
                    </div>
                </div>
                <div class="tile-preview">
                    <h3>AI生成 (Seedream)</h3>
                    <div class="placeholder" id="ai-bamboo">
                        <p>待生成</p>
                    </div>
                </div>
            </div>
            <div class="scoring">
                <h4>评分 (1-5分)</h4>
                <div class="score-item">
                    <span>视觉效果:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
                <div class="score-item">
                    <span>竹节细节:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
                <div class="score-item">
                    <span>中医风格:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
            </div>
            <div class="decision">
                <label>决策: </label>
                <select>
                    <option value="">请选择</option>
                    <option value="opensource">使用开源素材</option>
                    <option value="ai">使用AI生成</option>
                    <option value="mixed">混合方案</option>
                </select>
                <textarea class="notes" placeholder="备注..."></textarea>
            </div>
        </div>

        <!-- 药田瓦片对比 -->
        <div class="asset-card">
            <h2>🌱 药田瓦片 (Herb Field Tile)</h2>
            <div class="comparison-row">
                <div class="tile-preview">
                    <h3>开源素材</h3>
                    <div class="placeholder">
                        <p>Kenney</p>
                        <p>Farm Expansion</p>
                        <p>CC0</p>
                    </div>
                </div>
                <div class="tile-preview">
                    <h3>AI生成 (Seedream)</h3>
                    <div class="placeholder" id="ai-herb-field">
                        <p>待生成</p>
                    </div>
                </div>
            </div>
            <div class="scoring">
                <h4>评分 (1-5分)</h4>
                <div class="score-item">
                    <span>视觉效果:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
                <div class="score-item">
                    <span>标识牌融合:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
                <div class="score-item">
                    <span>功能清晰:</span>
                    <span>开源<input class="score-input" type="number"> vs AI<input class="score-input" type="number"></span>
                </div>
            </div>
            <div class="decision">
                <label>决策: </label>
                <select>
                    <option value="">请选择</option>
                    <option value="opensource">使用开源素材</option>
                    <option value="ai">使用AI生成</option>
                    <option value="mixed">混合方案</option>
                </select>
                <textarea class="notes" placeholder="备注..."></textarea>
            </div>
        </div>
    </div>

    <script>
        // 页面加载完成后检查AI生成的图片
        document.addEventListener('DOMContentLoaded', function() {
            const assetTypes = ['grass', 'path', 'bamboo', 'herb-field'];
            assetTypes.forEach(type => {
                const imgPath = `ai-generated/${type}/${type}_ai_1024.png`;
                const placeholder = document.getElementById(`ai-${type}`);
                if (placeholder) {
                    const img = new Image();
                    img.onload = function() {
                        placeholder.innerHTML = '';
                        img.style.maxWidth = '100%';
                        img.style.imageRendering = 'pixelated';
                        placeholder.appendChild(img);
                    };
                    img.onerror = function() {
                        placeholder.innerHTML = '<p>图片待生成</p>';
                    };
                    img.src = imgPath;
                }
            });
        });
    </script>
</body>
</html>
```

---

## Task 8: 执行素材生成

**Files:**
- Generate: `tests/visual/asset-test/ai-generated/*/*.png`

- [ ] **Step 1: 检查API密钥环境变量**

```bash
echo "YIBU_API_KEY: ${YIBU_API_KEY:0:10}..."
```

- [ ] **Step 2: 运行AI素材生成脚本**

```bash
cd tests/visual/asset-test && python3 generate_ai_assets.py
```

Expected: 生成4种素材的AI图片

- [ ] **Step 3: 验证生成结果**

```bash
ls -la tests/visual/asset-test/ai-generated/*/
```

Expected: 每个目录下有对应的PNG文件

---

## Task 9: 提交测试素材

- [ ] **Step 1: 添加素材到git**

```bash
git add tests/visual/asset-test/
git commit -m "chore: add asset comparison test materials

- Add directory structure for opensource and AI-generated assets
- Add prompts.json with Seedream API prompt configs
- Add generate_ai_assets.py script for AI asset generation
- Add comparison.html for visual comparison page
- Add source documentation for opensource assets

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 执行说明

1. **开源素材**: 需要手动从OpenGameArt和Kenney下载
2. **AI素材**: 运行 `python3 tests/visual/asset-test/generate_ai_assets.py`，需要设置 `YIBU_API_KEY` 环境变量
3. **对比展示**: 打开 `tests/visual/asset-test/comparison.html` 查看对比效果

---

*本计划由 writing-plans 技能生成*