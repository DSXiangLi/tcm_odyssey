#!/usr/bin/env python3
"""
瓦片自动映射系统 v2
完整流程：网格叠加 → AI识别 → 颜色蒙版 → AI验证 → 配置输出

工作流程：
1. 缩放图片到1280×960
2. 叠加网格和坐标标注
3. AI识别元素坐标
4. 生成颜色蒙版可视化
5. AI验证并修正
6. 输出tile-config.json
"""

import os
import base64
import requests
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

ENV_PATH = Path(__file__).parent.parent.parent.parent / ".env"

# 瓦片类型定义（与游戏代码一致）
TILE_TYPES = {
    "grass": 0,      # 草地，可行走
    "path": 1,       # 道路，可行走
    "wall": 2,       # 墙壁/建筑，不可行走
    "water": 3,      # 水域，不可行走
    "door": 4,       # 门，可交互
    "herb_field": 5, # 药田
    "tree": 6,       # 树木/障碍
    "bridge": 7,     # 桥梁，可行走
    "fence": 8,      # 篱笆
}

# 颜色蒙版定义
MASK_COLORS = {
    "walkable": (0, 200, 0, 150),      # 绿色：可行走区域
    "obstacle": (200, 0, 0, 150),       # 红色：障碍区域
    "door": (255, 200, 0, 200),         # 黄色：门
    "bridge": (0, 100, 200, 150),       # 蓝色：桥梁
    "unknown": (128, 128, 128, 100),    # 灰色：未确定
}

GRID_SIZE = (40, 30)  # 瓦片网格
TILE_SIZE = 32        # 瓦片像素大小

def load_env():
    """加载环境变量"""
    env_vars = {}
    with open(ENV_PATH, 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                value = value.strip('"').strip("'")
                env_vars[key] = value
    return env_vars

def resize_image(input_path, output_path, target_size=(1280, 960)):
    """缩放图片到目标尺寸"""
    img = Image.open(input_path)
    img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
    img_resized.save(output_path)
    print(f"✅ 图片已缩放: {img.size} → {target_size}")
    return img_resized

def create_grid_overlay(img_path, output_path):
    """创建带网格和坐标标注的图片"""
    img = Image.open(img_path).convert("RGBA")
    draw = ImageDraw.Draw(img)

    width, height = img.size

    # 绘制网格线
    for x in range(0, width + 1, TILE_SIZE):
        draw.line([(x, 0), (x, height)], fill=(255, 0, 0, 100), width=1)
    for y in range(0, height + 1, TILE_SIZE):
        draw.line([(0, y), (width, y)], fill=(255, 0, 0, 100), width=1)

    # 标注坐标（每隔5个瓦片标注一次）
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
    except:
        font = ImageFont.load_default()

    for gx in range(0, GRID_SIZE[0], 5):
        for gy in range(0, GRID_SIZE[1], 5):
            x = gx * TILE_SIZE + 2
            y = gy * TILE_SIZE + 2
            draw.text((x, y), f"({gx},{gy})", fill=(255, 0, 0, 200), font=font)

    img.save(output_path)
    print(f"✅ 网格叠加图已创建: {output_path}")

def ai_identify_elements(img_path, env):
    """Step 2: AI识别图片中的元素坐标"""

    with open(img_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode('utf-8')

    url = env.get("QWEN_VL_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    api_key = env.get("QWEN_VL_KEY", "")
    model = env.get("QWEN_VL_MODEL_NAME", "qwen-vl-max")

    prompt = """这张图已经叠加了40×30的瓦片网格（每瓦片32×32像素）。
红色网格线标注了坐标位置，左上角是(0,0)，右下角是(39,29)。

请仔细观察图片，识别并输出各元素的**瓦片坐标范围**：

## 输出格式（必须严格遵守）

请用JSON格式输出：

```json
{
  "streets": [
    {"name": "横街1", "x_start": 0, "x_end": 39, "y_start": 10, "y_end": 11, "width": 2}
  ],
  "buildings": [
    {"name": "医馆", "x_start": 5, "x_end": 12, "y_start": 3, "y_end": 8, "door_x": 8, "door_y": 8}
  ],
  "water": [
    {"name": "河流", "x_start": 0, "x_end": 15, "y_start": 10, "y_end": 20}
  ],
  "bridges": [
    {"name": "桥1", "x_start": 15, "x_end": 20, "y_start": 10, "y_end": 11}
  ],
  "other_elements": [
    {"name": "池塘", "type": "water", "x_start": 0, "x_end": 10, "y_start": 25, "y_end": 29}
  ]
}
```

**重要规则**：
1. 所有坐标必须在0-39（x）和0-29（y）范围内
2. x_start ≤ x_end, y_start ≤ y_end
3. 门坐标必须在建筑边缘
4. 仔细观察红色网格线来确定精确坐标"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
                {"type": "text", "text": prompt}
            ]
        }],
        "max_tokens": 4000
    }

    print("🔍 AI识别元素坐标中...")

    try:
        response = requests.post(
            f"{url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120
        )

        if response.status_code != 200:
            print(f"❌ API请求失败: {response.status_code}")
            return None

        result = response.json()
        return result["choices"][0]["message"]["content"]

    except Exception as e:
        print(f"❌ AI识别失败: {e}")
        return None

def parse_ai_result(ai_response):
    """解析AI返回的JSON结果"""

    # 尝试提取JSON
    json_match = re.search(r'```json\s*(.*?)\s*```', ai_response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # 尝试直接解析
    try:
        return json.loads(ai_response)
    except json.JSONDecodeError:
        print("⚠️ 无法解析AI返回的JSON，使用默认配置")
        return None

def create_color_mask(img_path, ai_result, output_path):
    """Step 3: 根据AI识别结果创建颜色蒙版"""

    # 创建透明蒙版图层
    img = Image.open(img_path).convert("RGBA")
    mask = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(mask)

    def draw_rect(x_start, x_end, y_start, y_end, color):
        """绘制矩形区域"""
        x1, y1 = x_start * TILE_SIZE, y_start * TILE_SIZE
        x2, y2 = (x_end + 1) * TILE_SIZE, (y_end + 1) * TILE_SIZE
        draw.rectangle([x1, y1, x2, y2], fill=color, outline=(255, 255, 255, 200), width=1)

    def draw_door(x, y, color):
        """绘制门标记"""
        cx, cy = x * TILE_SIZE + TILE_SIZE // 2, y * TILE_SIZE + TILE_SIZE // 2
        r = TILE_SIZE // 3
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color, outline=(0, 0, 0, 255), width=2)

    if ai_result:
        # 绘制街道（可行走）
        for street in ai_result.get("streets", []):
            draw_rect(
                street.get("x_start", 0),
                street.get("x_end", 39),
                street.get("y_start", 0),
                street.get("y_end", 29),
                MASK_COLORS["walkable"]
            )

        # 绘制建筑（障碍）
        for building in ai_result.get("buildings", []):
            draw_rect(
                building.get("x_start", 0),
                building.get("x_end", 39),
                building.get("y_start", 0),
                building.get("y_end", 29),
                MASK_COLORS["obstacle"]
            )
            # 绘制门
            if "door_x" in building and "door_y" in building:
                draw_door(building["door_x"], building["door_y"], MASK_COLORS["door"])

        # 绘制水域（障碍）
        for water in ai_result.get("water", []):
            draw_rect(
                water.get("x_start", 0),
                water.get("x_end", 39),
                water.get("y_start", 0),
                water.get("y_end", 29),
                MASK_COLORS["obstacle"]
            )

        # 绘制桥梁（可行走）
        for bridge in ai_result.get("bridges", []):
            draw_rect(
                bridge.get("x_start", 0),
                bridge.get("x_end", 39),
                bridge.get("y_start", 0),
                bridge.get("y_end", 29),
                MASK_COLORS["bridge"]
            )

        # 其他元素
        for elem in ai_result.get("other_elements", []):
            elem_type = elem.get("type", "unknown")
            color = MASK_COLORS.get(elem_type, MASK_COLORS["unknown"])
            draw_rect(
                elem.get("x_start", 0),
                elem.get("x_end", 39),
                elem.get("y_start", 0),
                elem.get("y_end", 29),
                color
            )

    # 合并图层
    result = Image.alpha_composite(img, mask)
    result.save(output_path)
    print(f"✅ 颜色蒙版已创建: {output_path}")

    return output_path

def ai_validate_and_fix(img_path, ai_result, env):
    """Step 4: AI验证并修正识别结果"""

    with open(img_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode('utf-8')

    url = env.get("QWEN_VL_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    api_key = env.get("QWEN_VL_KEY", "")
    model = env.get("QWEN_VL_MODEL_NAME", "qwen-vl-max")

    current_json = json.dumps(ai_result, ensure_ascii=False, indent=2) if ai_result else "{}"

    prompt = f"""请验证这个瓦片映射结果是否正确：

当前识别结果：
```json
{current_json}
```

验证检查项：
1. **坐标范围检查**：所有坐标是否在0-39(x)和0-29(y)范围内？
2. **行走连通性**：可行走区域（街道、桥梁）是否连通？
3. **门位置检查**：门是否在建筑边缘？门旁边是否有可行走区域？
4. **建筑完整性**：建筑区域是否完整包围？
5. **无遗漏障碍**：是否有明显的障碍物未标记？

请输出修正后的完整JSON：
```json
{{
  "streets": [...],
  "buildings": [...],
  "water": [...],
  "bridges": [...],
  "other_elements": [...],
  "validation_passed": true/false,
  "issues_fixed": ["问题1", "问题2"]
}}
```"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
                {"type": "text", "text": prompt}
            ]
        }],
        "max_tokens": 4000
    }

    print("🧠 AI验证修正中...")

    try:
        response = requests.post(
            f"{url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120
        )

        if response.status_code != 200:
            print(f"❌ 验证请求失败: {response.status_code}")
            return ai_result

        result = response.json()
        validated = result["choices"][0]["message"]["content"]

        # 解析验证结果
        json_match = re.search(r'```json\s*(.*?)\s*```', validated, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except:
                return ai_result
        return ai_result

    except Exception as e:
        print(f"❌ AI验证失败: {e}")
        return ai_result

def generate_tile_config(ai_result):
    """Step 5: 生成最终瓦片配置"""

    # 初始化瓦片地图（默认为草地）
    tilemap = [[TILE_TYPES["grass"] for _ in range(40)] for _ in range(30)]

    doors = []

    if not ai_result:
        print("⚠️ 无AI识别结果，生成默认配置")
        return {
            "tilemap": tilemap,
            "doors": doors,
            "walkable_types": [0, 1, 4, 7],
            "source": "default"
        }

    # 填充街道
    for street in ai_result.get("streets", []):
        x_start = max(0, min(39, street.get("x_start", 0)))
        x_end = max(0, min(39, street.get("x_end", 39)))
        y_start = max(0, min(29, street.get("y_start", 0)))
        y_end = max(0, min(29, street.get("y_end", 29)))

        for y in range(y_start, y_end + 1):
            for x in range(x_start, x_end + 1):
                tilemap[y][x] = TILE_TYPES["path"]

    # 填充建筑
    for building in ai_result.get("buildings", []):
        x_start = max(0, min(39, building.get("x_start", 0)))
        x_end = max(0, min(39, building.get("x_end", 39)))
        y_start = max(0, min(29, building.get("y_start", 0)))
        y_end = max(0, min(29, building.get("y_end", 29)))

        for y in range(y_start, y_end + 1):
            for x in range(x_start, x_end + 1):
                tilemap[y][x] = TILE_TYPES["wall"]

        # 设置门
        if "door_x" in building and "door_y" in building:
            door_x = max(0, min(39, building["door_x"]))
            door_y = max(0, min(29, building["door_y"]))
            tilemap[door_y][door_x] = TILE_TYPES["door"]
            doors.append({
                "x": door_x,
                "y": door_y,
                "building": building.get("name", "unknown")
            })

    # 填充水域
    for water in ai_result.get("water", []):
        x_start = max(0, min(39, water.get("x_start", 0)))
        x_end = max(0, min(39, water.get("x_end", 39)))
        y_start = max(0, min(29, water.get("y_start", 0)))
        y_end = max(0, min(29, water.get("y_end", 29)))

        for y in range(y_start, y_end + 1):
            for x in range(x_start, x_end + 1):
                tilemap[y][x] = TILE_TYPES["water"]

    # 填充桥梁
    for bridge in ai_result.get("bridges", []):
        x_start = max(0, min(39, bridge.get("x_start", 0)))
        x_end = max(0, min(39, bridge.get("x_end", 39)))
        y_start = max(0, min(29, bridge.get("y_start", 0)))
        y_end = max(0, min(29, bridge.get("y_end", 29)))

        for y in range(y_start, y_end + 1):
            for x in range(x_start, x_end + 1):
                tilemap[y][x] = TILE_TYPES["bridge"]

    # 其他元素
    for elem in ai_result.get("other_elements", []):
        elem_type = elem.get("type", "tree")
        tile_type = TILE_TYPES.get(elem_type, TILE_TYPES["tree"])

        x_start = max(0, min(39, elem.get("x_start", 0)))
        x_end = max(0, min(39, elem.get("x_end", 39)))
        y_start = max(0, min(29, elem.get("y_start", 0)))
        y_end = max(0, min(29, elem.get("y_end", 29)))

        for y in range(y_start, y_end + 1):
            for x in range(x_start, x_end + 1):
                tilemap[y][x] = tile_type

    return {
        "tilemap": tilemap,
        "doors": doors,
        "walkable_types": [TILE_TYPES["grass"], TILE_TYPES["path"], TILE_TYPES["door"], TILE_TYPES["bridge"]],
        "source": "ai_generated",
        "ai_result": ai_result
    }

def main():
    env = load_env()

    # 输入图片路径
    input_path = Path(__file__).parent / "ai-generated" / "town_new" / "new_town_nanobanana3.jpeg"

    if not input_path.exists():
        print(f"❌ 图片不存在: {input_path}")
        return

    # 输出目录
    output_dir = Path(__file__).parent / "ai-generated" / "town_new" / "processed_v2"
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("🎮 瓦片自动映射系统 v2")
    print("=" * 70)
    print(f"📍 输入图片: {input_path}")
    print(f"📁 输出目录: {output_dir}")

    # Step 1: 缩放图片
    resized_path = output_dir / "town_resized.png"
    resize_image(input_path, resized_path)

    # Step 2: 创建网格叠加
    grid_path = output_dir / "town_with_grid.png"
    create_grid_overlay(resized_path, grid_path)

    # Step 3: AI识别元素
    ai_response = ai_identify_elements(grid_path, env)

    if ai_response:
        # 保存AI原始响应
        with open(output_dir / "ai_raw_response.txt", 'w') as f:
            f.write(ai_response)

        # 解析AI结果
        ai_result = parse_ai_result(ai_response)

        if ai_result:
            # 保存解析后的JSON
            with open(output_dir / "ai_parsed_result.json", 'w') as f:
                json.dump(ai_result, f, ensure_ascii=False, indent=2)

            # Step 4: 创建颜色蒙版
            mask_path = output_dir / "town_color_mask.png"
            create_color_mask(resized_path, ai_result, mask_path)

            # Step 5: AI验证修正
            validated_result = ai_validate_and_fix(mask_path, ai_result, env)

            if validated_result:
                with open(output_dir / "ai_validated_result.json", 'w') as f:
                    json.dump(validated_result, f, ensure_ascii=False, indent=2)

            # Step 6: 生成瓦片配置
            tile_config = generate_tile_config(validated_result or ai_result)

            config_path = output_dir / "tile_config.json"
            with open(config_path, 'w') as f:
                json.dump(tile_config, f, indent=2)

            print(f"\n✅ 瓦片配置已生成: {config_path}")

            # 生成可视化报告
            report_path = output_dir / "mapping_report.md"
            with open(report_path, 'w') as f:
                f.write("# 瓦片映射报告\n\n")
                f.write("## 输入信息\n")
                f.write(f"- 源图片: {input_path.name}\n")
                f.write(f"- 地图尺寸: 40×30 瓦片\n")
                f.write(f"- 瓦片大小: 32×32 像素\n\n")
                f.write("## 识别结果\n")
                f.write(f"- 街道数量: {len(ai_result.get('streets', []))}\n")
                f.write(f"- 建筑数量: {len(ai_result.get('buildings', []))}\n")
                f.write(f"- 门数量: {len(tile_config.get('doors', []))}\n")
                f.write(f"- 水域数量: {len(ai_result.get('water', []))}\n")
                f.write(f"- 桥梁数量: {len(ai_result.get('bridges', []))}\n\n")
                f.write("## 输出文件\n")
                f.write(f"- 网格图: town_with_grid.png\n")
                f.write(f"- 颜色蒙版: town_color_mask.png\n")
                f.write(f"- 瓦片配置: tile_config.json\n")

            print(f"✅ 映射报告已生成: {report_path}")
    else:
        print("❌ AI识别失败，无法继续")

    print("\n" + "=" * 70)
    print("🎉 瓦片映射完成！")
    print("=" * 70)

if __name__ == "__main__":
    main()