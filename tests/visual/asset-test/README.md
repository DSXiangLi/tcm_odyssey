# 素材对比测试

本目录用于对比开源素材 vs AI生成素材的效果。

## 目录结构

```
├── opensource/          # 开源素材
│   ├── grass/           # 草地瓦片
│   ├── path/            # 路径瓦片
│   ├── bamboo/          # 竹林瓦片
│   └── herb-field/      # 药田瓦片
├── ai-generated/        # AI生成素材
│   ├── grass/
│   ├── path/
│   ├── bamboo/
│   └── herb-field/
├── comparison/          # 对比截图输出
├── prompts.json         # AI生成Prompt配置
├── generate_ai_assets.py    # Seedream API生成脚本
├── generate_glm_assets.py   # GLM CogView生成脚本
├── create_demo_assets.py    # 创建演示占位图
└── comparison.html      # 对比展示页面
```

## 使用方法

### 1. 查看演示对比

```bash
# 在浏览器中打开对比页面
open tests/visual/asset-test/comparison.html
# 或
firefox tests/visual/asset-test/comparison.html
```

### 2. 生成AI素材

**使用火山引擎Seedream API（推荐）:**

```bash
# 设置API密钥
export YIBU_API_KEY=your_yibu_api_key

# 运行生成脚本
python3 tests/visual/asset-test/generate_ai_assets.py
```

获取密钥: https://yibuapi.com/ 或 https://www.volcengine.com/

**使用GLM CogView API:**

```bash
# 设置API密钥
export GLM_API_KEY=your_glm_api_key

# 运行生成脚本
python3 tests/visual/asset-test/generate_glm_assets.py
```

获取密钥: https://open.bigmodel.cn/

### 3. 下载开源素材

**草地瓦片:**
- 来源: https://opengameart.org/content/pixel-art-grass-tileset
- 许可证: CC-BY 4.0

**竹林瓦片:**
- 来源: https://opengameart.org/content/bamboo-tiles
- 许可证: CC-BY 4.0

**路径瓦片:**
- 来源: https://opengameart.org/content/decorative-road-tiles-pack
- 许可证: CC0

**药田瓦片:**
- 来源: https://kenney.nl/assets/pixel-platformer-farm-expansion
- 许可证: CC0

### 4. 评审对比

打开 `comparison.html` 进行评分和决策。

## 当前状态

- ✅ 目录结构已创建
- ✅ Prompt配置已准备
- ✅ 生成脚本已就绪
- ✅ 演示占位图已生成
- ⏳ 真实AI素材待生成（需API密钥）
- ⏳ 开源素材待下载

## 设计规范参考

详见: `docs/superpowers/specs/2026-04-06-asset-production-strategy-design.md`