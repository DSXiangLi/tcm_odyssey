#!/usr/bin/env python3
"""
使用Qwen-VL分析完整的user2 sprite atlas源图
确认4方向×3帧的正确布局
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
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

load_env()

client = OpenAI(
    api_key=os.environ.get("QWEN_VL_KEY", ""),
    base_url=os.environ.get("QWEN_VL_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
)

MODEL = os.environ.get("QWEN_VL_MODEL_NAME", "qwen-vl-max")

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def analyze_sprite_atlas(image_path: str) -> dict:
    """分析完整的sprite atlas"""

    image_base64 = encode_image(image_path)

    prompt = """请仔细分析这张完整的角色行走动画sprite atlas图。

这是一张包含多个方向行走动画的像素角色图，通常布局为：
- 每一行代表一个方向（向下、向上、向左、向右）
- 每一列代表一个动画帧（通常是静止、迈步1、迈步2等）

请回答：
1. 图片总尺寸（像素宽×高）
2. 有几行几列的角色帧？每行代表什么方向？
3. 每一帧的尺寸（像素宽×高）
4. 请标注每行中人物的水平位置是否一致：
   - 如果某行中人物在帧内左右晃动，会导致动画播放时角色抖动
   - 请指出哪些行有问题，哪些帧的人物偏离了基准线

请用JSON格式回答：
{
  "total_size": {"width": X, "height": Y},
  "layout": {"rows": N, "cols": M},
  "frame_size": {"width": W, "height": H},
  "rows_direction": ["down", "up", "left", "right"],
  "position_analysis": [
    {
      "row_index": 0,
      "direction": "down",
      "frames": [
        {"frame": 0, "horizontal_position": "居中/偏左N像素/偏右N像素"},
        {"frame": 1, "horizontal_position": "..."},
        {"frame": 2, "horizontal_position": "..."}
      ],
      "is_consistent": true/false,
      "max_offset": 最大偏移像素数
    },
    ...
  ],
  "recommendations": "修复建议，如果需要重新切分请说明如何调整"
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

    # 提取JSON
    try:
        if "{" in content and "}" in content:
            json_start = content.index("{")
            json_end = content.rindex("}") + 1
            json_str = content[json_start:json_end]
            return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}")

    return {"raw_response": content}

def main():
    source_path = Path("/home/lixiang/Desktop/zhongyi_game_v3/tests/visual/asset-test/ai-generated/npc/user2.png")

    print(f"分析源图: {source_path}")
    print(f"文件大小: {source_path.stat().st_size} bytes")

    result = analyze_sprite_atlas(str(source_path))

    # 保存结果
    output_path = Path("/home/lixiang/Desktop/zhongyi_game_v3/tests/visual/asset-test/ai-generated/validation_reports/user2_atlas_analysis.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n结果已保存到: {output_path}")

    # 打印关键信息
    if "frame_size" in result:
        print("\n=== 关键信息 ===")
        print(f"帧尺寸: {result['frame_size']}")
        print(f"布局: {result.get('layout', {})}")

        if "position_analysis" in result:
            print("\n=== 各方向位置一致性 ===")
            for row in result["position_analysis"]:
                direction = row.get("direction", f"row_{row.get('row_index', '?')}")
                is_consistent = row.get("is_consistent", "?")
                max_offset = row.get("max_offset", "?")
                print(f"{direction}: 一致={is_consistent}, 最大偏移={max_offset}像素")

if __name__ == "__main__":
    main()