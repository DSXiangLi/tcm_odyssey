#!/usr/bin/env python3
"""
AI视觉+LLM联合瓦片自动映射系统
天才方案：用最少的AI调用完成完整的瓦片映射

流程：
1. 缩放图片到1280×960（40×30瓦片网格）
2. AI视觉识别：识别各元素的瓦片坐标范围
3. 程序算法：自动计算每个瓦片归属
4. 边界细化：颜色采样判断不确定瓦片
5. LLM推理：生成最终瓦片配置JSON
"""

import os
import base64
import requests
import json
from pathlib import Path
from PIL import Image
import numpy as np

ENV_PATH = Path(__file__).parent.parent.parent.parent / ".env"

# 瓦片类型定义（与游戏代码一致）
TILE_TYPES = {
    "grass": 0,       # 草地，可行走
    "path": 1,        # 道路，可行走
    "wall": 2,        # 墙壁/建筑，不可行走
    "water": 3,       # 水域，不可行走
    "door": 4,        # 门，可交互
    "herb_field": 5,  # 药田
    "tree": 6,        # 树木/障碍
    "bridge": 7,      # 桥梁，可行走
    "fence": 8,       # 篱笆
}

def load_env():
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

def create_grid_overlay(img_path, output_path, grid_size=(40, 30), tile_size=32):
    """创建带网格线的图片，便于AI识别坐标"""
    img = Image.open(img_path).convert("RGBA")

    # 绘制网格线
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)

    # 绘制垂直线
    for x in range(0, img.width + 1, tile_size):
        draw.line([(x, 0), (x, img.height)], fill=(255, 0, 0, 128), width=1)

    # 绘制水平线
    for y in range(0, img.height + 1, tile_size):
        draw.line([(0, y), (img.width, y)], fill=(255, 0, 0, 128), width=1)

    # 标记瓦片坐标（每隔5个瓦片标记一次）
    for gx in range(0, grid_size[0], 5):
        for gy in range(0, grid_size[1], 5):
            x = gx * tile_size + tile_size // 2
            y = gy * tile_size + tile_size // 2
            draw.text((x, y), f"({gx},{gy})", fill=(255, 255, 0, 200))

    img.save(output_path)
    print(f"✅ 网格叠加图已创建: {output_path}")

def ai_visual_mapping(img_path, env):
    """阶段1：AI视觉识别，输出各元素的瓦片坐标范围"""

    with open(img_path, 'rb') as f:
        image_b64 = base64.b64encode(f.read()).decode('utf-8')

    url = env.get("QWEN_VL_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    api_key = env.get("QWEN_VL_KEY", "")
    model = env.get("QWEN_VL_MODEL_NAME", "qwen-vl-max")

    # 关键Prompt：让AI输出瓦片坐标范围
    prompt = """这张图已经叠加了40×30的瓦片网格（每瓦片32×32像素）。
网格坐标已用红色线标注，黄色数字显示坐标位置。

请仔细观察图片，然后**精确输出**以下元素的瓦片坐标范围：

## 输出格式（JSON风格）

请按以下格式输出每个元素的坐标范围：

```
街道区域:
- 横街1: x从X1到X2, y=Y (宽度约W瓦片)
- 横街2: x从X1到X2, y=Y
- 纵街1: x=X, y从Y1到Y2
- 纵街2: x=X, y从Y1到Y2

建筑区域:
- 医馆: x从X1到X2, y从Y1到Y2, 门在(x=X, y=Y)
- 药园: x从X1到X2, y从Y1到Y2, 门在(x=X, y=Y)
- 饭店: x从X1到X2, y从Y1到Y2, 门在(x=X, y=Y)
- 玩家家: x从X1到X2, y从Y1到Y2, 门在(x=X, y=Y)
- 民居1: x从X1到X2, y从Y1到Y2
- ...

水域区域:
- 河流: x从X1到X2, y从Y1到Y2
- 池塘: x从X1到X2, y从Y1到Y2

桥梁:
- 桥1: x从X1到X2, y从Y1到Y2

其他:
- 稻草人/树木等障碍: (x=X, y=Y)
- 药田: x从X1到X2, y从Y1到Y2
```

**重要**: 坐标必须是瓦片网格坐标（0-39 for x, 0-29 for y），不是像素坐标！
请仔细观察网格线，估算每个元素跨越的瓦片范围。"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
                {"type": "text", "text": prompt}
            ]
        }],
        "max_tokens": 4000
    }

    print("🔍 AI视觉识别中...")
    try:
        response = requests.post(
            f"{url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=180
        )

        if response.status_code != 200:
            print(f"❌ API请求失败: {response.status_code}")
            return None

        result = response.json()
        return result["choices"][0]["message"]["content"]

    except Exception as e:
        print(f"❌ AI识别失败: {e}")
        return None

def parse_ai_coordinates(ai_response):
    """阶段2：解析AI输出的坐标，生成瓦片映射"""

    # 初始化40×30瓦片矩阵（默认全为草地）
    tilemap = [[TILE_TYPES["grass"] for _ in range(40)] for _ in range(30)]

    # 解析AI响应中的坐标范围
    # 这里需要智能解析AI的自然语言输出

    lines = ai_response.split('\n')

    for line in lines:
        # 尝试提取坐标信息
        # 例如："- 横街1: x从10到30, y=5"

        # 简化处理：寻找数字模式
        import re

        # 提取x和y的范围
        x_range = re.findall(r'x从(\d+)到(\d+)', line)
        y_range = re.findall(r'y从(\d+)到(\d+)', line)
        x_single = re.findall(r'x=(\d+)', line)
        y_single = re.findall(r'y=(\d+)', line)

        # 判断元素类型
        if '街道' in line or '街' in line or '路' in line:
            tile_type = TILE_TYPES["path"]
        elif '建筑' in line or '医馆' in line or '饭店' in line or '民居' in line or '家' in line:
            tile_type = TILE_TYPES["wall"]
            if '门' in line:
                # 门需要特殊处理
                pass
        elif '水域' in line or '河' in line or '水' in line or '池塘' in line:
            tile_type = TILE_TYPES["water"]
        elif '桥' in line:
            tile_type = TILE_TYPES["bridge"]
        elif '药田' in line or '药园' in line:
            tile_type = TILE_TYPES["herb_field"]
        elif '树' in line or '稻草人' in line:
            tile_type = TILE_TYPES["tree"]
        elif '门' in line:
            tile_type = TILE_TYPES["door"]
        else:
            continue

        # 填充瓦片
        for x_match in x_range:
            x_start, x_end = int(x_match[0]), int(x_match[1])
            for y_match in y_range:
                y_start, y_end = int(y_match[0]), int(y_match[1])
                for x in range(x_start, min(x_end + 1, 40)):
                    for y in range(y_start, min(y_end + 1, 30)):
                        tilemap[y][x] = tile_type

        # 处理单一坐标（如门）
        for x_s in x_single:
            for y_s in y_single:
                x, y = int(x_s), int(y_s)
                if 0 <= x < 40 and 0 <= y < 30:
                    tilemap[y][x] = tile_type

    return tilemap

def color_based_refinement(img_path, tilemap, env):
    """阶段3：颜色采样细化边界瓦片"""

    img = Image.open(img_path)
    img_array = np.array(img)

    # 定义颜色阈值
    PATH_COLOR = (100, 150, 100)  # 青绿色道路（版本3）
    WATER_COLOR = (100, 180, 220)  # 蓝色水域
    GRASS_COLOR = (80, 160, 80)   # 绿色草地

    # 遍历每个瓦片
    for y in range(30):
        for x in range(40):
            # 如果是边界瓦片（可能不确定），用颜色判断
            if tilemap[y][x] == TILE_TYPES["grass"]:  # 待确认的瓦片

                # 采样瓦片中心区域的颜色
                center_x = x * 32 + 16
                center_y = y * 32 + 16

                # 取瓦片中心10×10像素的平均颜色
                sample = img_array[center_y-5:center_y+5, center_x-5:center_x+5]
                avg_color = np.mean(sample, axis=(0, 1))

                # 根据颜色判断类型
                if avg_color[2] > 200:  # 蓝色分量高，可能是水
                    tilemap[y][x] = TILE_TYPES["water"]
                elif avg_color[0] < 80 and avg_color[1] > 150:  # 青绿色，道路
                    tilemap[y][x] = TILE_TYPES["path"]

    return tilemap

def llm_final_reasoning(tilemap, ai_response, env):
    """阶段4：LLM综合推理，生成最终配置"""

    # 将瓦片矩阵转换为可视化字符串
    tilemap_str = ""
    for y in range(30):
        row = ""
        for x in range(40):
            tile_type = tilemap[y][x]
            symbols = {0: 'G', 1: 'P', 2: 'W', 3: 'A', 4: 'D', 5: 'H', 6: 'T', 7: 'B', 8: 'F'}
            row += symbols.get(tile_type, '?')
        tilemap_str += row + '\n'

    # GLM推理
    url = env.get("GLM_URL", "https://open.bigmodel.cn/api/paas/v4")
    api_key = env.get("GLM_API_KEY", "")
    model = env.get("GLM_MODEL_NAME", "glm-4")

    prompt = f"""你是一个游戏瓦片地图设计师。

AI视觉识别结果：
{ai_response}

程序生成的初步瓦片映射（40×30网格）：
G=草地 P=道路 W=建筑 A=水域 D=门 H=药田 T=树 B=桥 F=篱笆

{tilemap_str}

请检查并优化这个瓦片映射：
1. 检查是否有明显错误（如建筑内部有道路）
2. 确保所有门都正确标记
3. 确保水域边界完整
4. 输出优化后的JSON格式瓦片配置

输出格式：
```json
{{
  "tilemap": [[...], [...], ...],
  "doors": [{{"x": X, "y": Y, "building": "name"}}, ...],
  "walkable_types": [0, 1, 4, 7],
  "building_areas": [{{"name": "医馆", "x1": X1, "y1": Y1, "x2": X2, "y2": Y2}}, ...]
}}
```"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 8000
    }

    print("🧠 LLM推理优化中...")
    try:
        response = requests.post(
            f"{url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120
        )

        if response.status_code != 200:
            print(f"❌ LLM请求失败: {response.status_code}")
            return None

        result = response.json()
        return result["choices"][0]["message"]["content"]

    except Exception as e:
        print(f"❌ LLM推理失败: {e}")
        return None

def generate_tile_config(img_path, env):
    """完整流程：从图片到瓦片配置"""

    print("=" * 70)
    print("🎮 AI视觉+LLM联合瓦片自动映射系统")
    print("=" * 70)

    # Step 1: 缩放图片
    output_dir = Path(__file__).parent / "ai-generated" / "town_new" / "processed"
    output_dir.mkdir(parents=True, exist_ok=True)

    resized_path = output_dir / "town_resized_1280x960.png"
    grid_path = output_dir / "town_with_grid.png"

    resize_image(img_path, resized_path)
    create_grid_overlay(resized_path, grid_path)

    # Step 2: AI视觉识别
    ai_response = ai_visual_mapping(grid_path, env)
    if not ai_response:
        print("❌ AI视觉识别失败，终止流程")
        return None

    print("\n📊 AI识别结果:")
    print(ai_response)

    # 保存AI识别结果
    with open(output_dir / "ai_visual_result.txt", 'w') as f:
        f.write(ai_response)

    # Step 3: 解析坐标生成初步瓦片映射
    tilemap = parse_ai_coordinates(ai_response)

    # Step 4: 颜色细化
    tilemap = color_based_refinement(resized_path, tilemap, env)

    # Step 5: LLM推理优化（可选）
    llm_response = llm_final_reasoning(tilemap, ai_response, env)

    # 提取JSON配置
    if llm_response:
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', llm_response, re.DOTALL)
        if json_match:
            try:
                final_config = json.loads(json_match.group(1))
            except:
                final_config = None
        else:
            final_config = None
    else:
        final_config = None

    # 如果LLM失败，使用初步映射
    if not final_config:
        # 从AI识别结果中提取门的信息
        doors = []
        import re
        door_matches = re.findall(r'门在\(x=(\d+), y=(\d+)\)', ai_response)
        for match in door_matches:
            doors.append({"x": int(match[0]), "y": int(match[1])})

        final_config = {
            "tilemap": tilemap,
            "doors": doors,
            "walkable_types": [TILE_TYPES["grass"], TILE_TYPES["path"], TILE_TYPES["door"], TILE_TYPES["bridge"]],
            "source": "version3",
            "ai_visual_result": ai_response
        }

    # 保存最终配置
    config_path = output_dir / "tile_config.json"
    with open(config_path, 'w') as f:
        json.dump(final_config, f, indent=2)

    print(f"\n✅ 瓦片配置已生成: {config_path}")

    # 生成可视化报告
    report_path = output_dir / "mapping_report.md"
    with open(report_path, 'w') as f:
        f.write("# 瓦片自动映射报告\n\n")
        f.write("## AI视觉识别结果\n\n")
        f.write(ai_response + "\n\n")
        f.write("## LLM推理结果\n\n")
        f.write(llm_response + "\n\n")
        f.write("## 最终配置\n\n")
        f.write(f"- 瓦片数量: 40×30 = 1200\n")
        f.write(f"- 配置文件: {config_path}\n")

    print(f"✅ 映射报告已生成: {report_path}")

    return final_config

def main():
    env = load_env()
    img_path = Path(__file__).parent / "ai-generated" / "town_new" / "new_town_nanobanana3.jpeg"

    if not img_path.exists():
        print(f"❌ 图片不存在: {img_path}")
        return

    print(f"📍 使用图片: {img_path}")

    config = generate_tile_config(img_path, env)

    if config:
        print("\n" + "=" * 70)
        print("🎉 瓦片自动映射完成！")
        print("=" * 70)

if __name__ == "__main__":
    main()