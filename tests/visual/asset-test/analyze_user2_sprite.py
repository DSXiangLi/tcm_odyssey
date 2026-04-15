#!/usr/bin/env python3
"""
使用Qwen-VL视觉模型分析user2 sprite的帧布局
解决问题：
1. 确认每行实际有多少帧（用户说只有3帧）
2. 计算正确的帧尺寸
3. 分析人物在每帧中的位置偏移
"""

import os
import json
import base64
from pathlib import Path
from openai import OpenAI

# 加载.env文件
def load_env():
    env_path = Path("/home/lixiang/Desktop/zhongyi_game_v3/.env")
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    # 移除可能的引号
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

load_env()

# 配置Qwen-VL模型
client = OpenAI(
    api_key=os.environ.get("QWEN_VL_KEY", ""),
    base_url=os.environ.get("QWEN_VL_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
)

MODEL = os.environ.get("QWEN_VL_MODEL_NAME", "qwen-vl-max")

def encode_image(image_path: str) -> str:
    """将图片编码为base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def analyze_sprite_layout(image_path: str) -> dict:
    """使用Qwen-VL分析sprite布局"""

    image_base64 = encode_image(image_path)

    prompt = """请仔细分析这张像素风格的角色行走动画sprite图，回答以下问题：

1. 这张图片总共有多大（像素宽x高）？
2. 图片中有几行动画帧？每行代表一个方向（如向下、向上、向左、向右）
3. 每行有几帧动画？（请数一下每行中角色的数量）
4. 每一帧的大致尺寸是多少像素宽x高？
5. 请分析每帧中角色的位置：
   - 角色在帧内的水平位置是否居中？偏左还是偏右？
   - 角色在帧内的垂直位置是否一致？
   - 不同帧之间角色位置是否一致，还是有明显的左右晃动？

请用JSON格式回答：
{
  "image_size": {"width": 数字, "height": 数字},
  "rows": 数字,
  "frames_per_row": 数字,
  "frame_size": {"width": 数字, "height": 数字},
  "character_position_analysis": [
    {"row": 0, "frame": 0, "horizontal_offset": "描述居中/偏左/偏右", "vertical_offset": "描述"},
    ...
  ],
  "consistency_issue": "描述帧之间位置是否一致，如果不一致会造成什么动画问题",
  "recommendations": "修复建议"
}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
                ]
            }
        ],
        temperature=0.1
    )

    content = response.choices[0].message.content
    print(f"\n=== Qwen-VL分析结果 ===\n{content}\n")

    # 尝试提取JSON
    try:
        # 找到JSON部分
        if "{" in content and "}" in content:
            json_start = content.index("{")
            json_end = content.rindex("}") + 1
            json_str = content[json_start:json_end]
            return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}")

    return {"raw_response": content}

def main():
    sprite_dir = Path("/home/lixiang/Desktop/zhongyi_game_v3/public/assets/sprites/player")

    results = {}

    # 分析每个方向的sprite
    for direction in ["down", "up", "left", "right"]:
        sprite_path = sprite_dir / f"user2_{direction}.png"

        if not sprite_path.exists():
            print(f"⚠️ {sprite_path} 不存在")
            continue

        file_size = sprite_path.stat().st_size
        print(f"\n分析 {direction}: {sprite_path} ({file_size} bytes)")

        if file_size == 0:
            print(f"⚠️ 文件为空，跳过")
            results[direction] = {"error": "empty file"}
            continue

        results[direction] = analyze_sprite_layout(str(sprite_path))

    # 保存结果
    output_path = Path("/home/lixiang/Desktop/zhongyi_game_v3/tests/visual/asset-test/ai-generated/validation_reports/user2_sprite_analysis.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n结果已保存到: {output_path}")

    # 生成修复建议
    print("\n=== 修复建议 ===")

    # 检查是否有数据可用于计算正确的帧尺寸
    for direction, data in results.items():
        if "frame_size" in data and "frames_per_row" in data:
            actual_frames = data.get("frames_per_row", 3)
            frame_width = data.get("frame_size", {}).get("width", 0)
            image_width = data.get("image_size", {}).get("width", 0)

            print(f"\n{direction}方向:")
            print(f"  实际帧数: {actual_frames}")
            print(f"  帧宽度: {frame_width}")
            print(f"  图片宽度: {image_width}")
            print(f"  计算帧宽: {image_width / actual_frames if actual_frames else 'N/A'}")

if __name__ == "__main__":
    main()