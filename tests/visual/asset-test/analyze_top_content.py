#!/usr/bin/env python3
"""
分析新teacher图片每行的精确像素分布
找出头顶悬浮内容的问题
"""

import numpy as np
from pathlib import Path
from PIL import Image
import base64
import requests
import io

QWEN_VL_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_VL_KEY = "sk-2e4a2ff5b93148cf940fbd74b499aee9"
QWEN_VL_MODEL = "qwen-vl-max"

SCRIPT_DIR = Path(__file__).parent
NPC_DIR = SCRIPT_DIR / "ai-generated" / "npc"

def encode_image_to_base64(image_path: Path) -> str:
    img = Image.open(image_path)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

def analyze_row_content(source_img: Image.Image, row_idx: int, direction: str):
    """深度分析一行内容"""

    width, height = source_img.size
    frame_width = width // 4
    frame_height = height // 4

    y_start = row_idx * frame_height
    y_end = y_start + frame_height

    print(f"\n{'='*50}")
    print(f"🔍 分析第{row_idx+1}行 ({direction}方向)")
    print(f"   Grid范围: Y{y_start} 到 Y{y_end}")
    print(f"{'='*50}")

    # 分析每个帧
    for frame_idx in range(4):
        x_start = frame_idx * frame_width
        x_end = x_start + frame_width

        frame = source_img.crop((x_start, y_start, x_end, y_end))
        frame_array = np.array(frame)

        # 找有效像素范围
        if len(frame_array.shape) == 3 and frame_array.shape[2] == 4:
            alpha = frame_array[:, :, 3]
            has_content = alpha > 10
        else:
            has_content = frame_array > 10

        rows_with_content = np.any(has_content, axis=1)

        if np.any(rows_with_content):
            first_row = np.argmax(rows_with_content)
            last_row = len(rows_with_content) - np.argmax(rows_with_content[::-1]) - 1
            char_height = last_row - first_row + 1
        else:
            first_row = 0
            last_row = frame_height - 1
            char_height = frame_height

        print(f"\n   frame_{frame_idx}:")
        print(f"      有效像素Y范围: {first_row} 到 {last_row} (相对帧顶部)")
        print(f"      人物高度: {char_height}px")

        # 检查顶部5行
        print(f"      顶部5行像素情况:")
        for i in range(5):
            row_y = i
            row_has_content = np.any(has_content[row_y])
            # 如果有内容，看看内容分布
            if row_has_content:
                cols_with_content = np.sum(has_content[row_y])
                print(f"         Y={row_y}: 有内容 ({cols_with_content}个有效像素)")
            else:
                print(f"         Y={row_y}: 空白")

        # 检查是否有悬浮元素（顶部几行只有少量像素，且分布不连续）
        if first_row < 10 and first_row > 0:
            print(f"      ⚠️ 检测到顶部有悬浮内容，起始位置Y={first_row}")

    # 用Qwen VL检查第一帧的顶部情况
    frame0 = source_img.crop((0, y_start, frame_width, y_end))
    temp_path = NPC_DIR / f"temp_top_check_{direction}.png"
    frame0.save(temp_path)

    image_base64 = encode_image_to_base64(temp_path)

    prompt = f"""
这是{direction}方向的NPC sprite帧。

请检查：
1. 人物头顶上方是否有悬浮的、不属于这个人物的内容？（比如帽子碎片、其他元素）
2. 人物主体从哪一行开始？（人物本身，不包括悬浮元素）
3. 人物头顶（帽子/头发）是否完整显示？

回答：
头顶有悬浮内容: [是/否，如有请描述]
人物主体起始行: [数字，从图片顶部开始计数]
人物头顶完整: [是/否]
建议向上调整多少像素: [数字，如果悬浮内容需要切除]
"""

    headers = {
        "Authorization": f"Bearer {QWEN_VL_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": QWEN_VL_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
                    {"type": "text", "text": prompt}
                ]
            }
        ],
        "max_tokens": 200
    }

    response = requests.post(f"{QWEN_VL_URL}/chat/completions", headers=headers, json=payload, timeout=60)

    if response.status_code == 200:
        result = response.json()
        analysis = result["choices"][0]["message"]["content"]
        print(f"\n   Qwen VL顶部分析:")
        for line in analysis.split("\n"):
            if line.strip():
                print(f"      {line.strip()}")

    temp_path.unlink()

def main():
    print("=" * 60)
    print("🔍 分析新teacher图片顶部悬浮问题")
    print("=" * 60)

    source_path = NPC_DIR / "teacher1_new.png"
    source_img = Image.open(source_path)

    print(f"图片尺寸: {source_img.size}")

    directions = ["down", "up", "left", "right"]

    for row_idx, direction in enumerate(directions):
        analyze_row_content(source_img, row_idx, direction)

if __name__ == "__main__":
    main()