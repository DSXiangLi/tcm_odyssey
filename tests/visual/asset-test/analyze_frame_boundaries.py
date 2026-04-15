#!/usr/bin/env python3
"""
精确分析user2源图的帧边界坐标
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
                    os.environ[key] = value.strip('"').strip("'")

load_env()

client = OpenAI(
    api_key=os.environ.get("QWEN_VL_KEY", ""),
    base_url=os.environ.get("QWEN_VL_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
)

MODEL = os.environ.get("QWEN_VL_MODEL_NAME", "qwen-vl-max")

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def analyze_frame_boundaries():
    """精确分析每一帧的像素坐标"""

    source_path = "/home/lixiang/Desktop/zhongyi_game_v3/tests/visual/asset-test/ai-generated/npc/user2.png"

    # 获取图片实际尺寸
    from PIL import Image
    img = Image.open(source_path)
    actual_width, actual_height = img.size

    print(f"源图实际尺寸: {actual_width} x {actual_height}")

    image_base64 = encode_image(source_path)

    prompt = f"""这张图片是游戏角色的行走动画sprite atlas，图片尺寸为 {actual_width} x {actual_height} 像素。

请精确分析：

1. **布局结构**：有几行几列？每一行代表什么方向（向下、向上、向左、向右）？

2. **每一帧的精确坐标**：
   - 标注每一帧的起始X坐标（像素值）
   - 每一帧的宽度是否相等？如果不相等，请给出每帧的精确宽度

请按照以下格式输出JSON：

```json
 {{
  "image_size": {{ "width": 实际宽度数值, "height": 实际高度数值 }},
  "layout": {{ "rows": 行数, "cols": 列数 }},
  "row_directions": ["第0行方向", "第1行方向", "第2行方向", "第3行方向"],
  "frame_boundaries": [
    {{
      "row_index": 0,
      "direction": "down/up/left/right",
      "frames": [
        {{ "frame_index": 0, "start_x": X坐标数值, "width": 帧宽度数值 }},
        {{ "frame_index": 1, "start_x": X坐标数值, "width": 帧宽度数值 }},
        {{ "frame_index": 2, "start_x": X坐标数值, "width": 帧宽度数值 }}
      ]
    }},
    ...
  ]
}}
```

**重要**：
- start_x必须是精确的像素坐标（整数）
- 如果帧宽度不均匀，请给出每帧的实际宽度
- 方向顺序必须准确（第0行是什么方向，第1行是什么方向...）"""

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
        temperature=0.0
    )

    content = response.choices[0].message.content
    print(f"\n=== Qwen-VL分析结果 ===\n{content}\n")

    # 提取JSON
    try:
        if "{" in content and "}" in content:
            json_start = content.index("{")
            json_end = content.rindex("}") + 1
            json_str = content[json_start:json_end]
            result = json.loads(json_str)

            # 保存结果
            output_path = Path("/home/lixiang/Desktop/zhongyi_game_v3/tests/visual/asset-test/ai-generated/validation_reports/user2_frame_boundaries.json")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)

            print(f"结果已保存到: {output_path}")

            # 输出关键信息
            print("\n=== 关键信息 ===")
            print(f"布局: {result['layout']}")
            print(f"方向顺序: {result['row_directions']}")

            for row in result['frame_boundaries']:
                print(f"\n{row['direction']}方向:")
                for frame in row['frames']:
                    print(f"  帧{frame['frame_index']}: start_x={frame['start_x']}, width={frame.get('width', 'unknown')}")

            return result
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}")
        return None

if __name__ == "__main__":
    analyze_frame_boundaries()