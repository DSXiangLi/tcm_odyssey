#!/usr/bin/env python3
"""
User1 NPC切分脚本
简洁版本：直接按Grid切分，不做复杂处理
"""

from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
NPC_DIR = SCRIPT_DIR / "ai-generated" / "npc"
OUTPUT_DIR = NPC_DIR / "user1_final"

# 方向布局（根据Qwen VL验证）
DIRECTION_MAP = {0: "down", 1: "up", 2: "left", 3: "right"}

def split_user1():
    """切分user1"""

    print("=" * 50)
    print("🔧 切分 user1")
    print("=" * 50)

    source_path = NPC_DIR / "user1.png"
    source_img = Image.open(source_path)
    width, height = source_img.size

    frame_width = width // 4
    frame_height = height // 4

    print(f"   源图尺寸: {width}×{height}")
    print(f"   Grid尺寸: {frame_width}×{frame_height}")

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    results = {}

    for row_idx in range(4):
        direction = DIRECTION_MAP[row_idx]
        print(f"\n   {direction}方向:")

        direction_dir = OUTPUT_DIR / direction
        direction_dir.mkdir(exist_ok=True)

        # 创建sprite sheet
        sheet = Image.new("RGBA", (frame_width * 4, frame_height), (0, 0, 0, 0))

        for frame_idx in range(4):
            x1 = frame_idx * frame_width
            y1 = row_idx * frame_height
            x2 = x1 + frame_width
            y2 = y1 + frame_height

            frame = source_img.crop((x1, y1, x2, y2))

            # 保存单帧
            frame_path = direction_dir / f"frame_{frame_idx}.png"
            frame.save(frame_path)

            # 添加到sheet
            sheet.paste(frame, (frame_idx * frame_width, 0))

            # 分析像素
            frame_array = np.array(frame)
            if len(frame_array.shape) == 3 and frame_array.shape[2] == 4:
                alpha = frame_array[:, :, 3]
                has_content = alpha > 10
            else:
                has_content = frame_array > 10

            rows_with_content = np.any(has_content, axis=1)
            if np.any(rows_with_content):
                top = np.argmax(rows_with_content)
                bottom = len(rows_with_content) - np.argmax(rows_with_content[::-1]) - 1
                char_h = bottom - top + 1
            else:
                top, bottom, char_h = 0, frame_height - 1, frame_height

            print(f"      frame_{frame_idx}: 人物高度{char_h}px")

        # 保存sprite sheet
        sheet_path = OUTPUT_DIR / f"user1_{direction}.png"
        sheet.save(sheet_path)

        results[direction] = {
            "frame_size": (frame_width, frame_height),
            "sheet_path": str(sheet_path)
        }

    # 创建预览图
    preview = Image.new("RGBA", (frame_width * 4 * 4, frame_height + 20), (0, 0, 0, 0))
    draw = ImageDraw.Draw(preview)

    for idx, direction in enumerate(["down", "up", "left", "right"]):
        sheet_path = OUTPUT_DIR / f"user1_{direction}.png"
        if sheet_path.exists():
            sheet = Image.open(sheet_path)
            x_offset = idx * frame_width * 4
            preview.paste(sheet, (x_offset, 10))
            draw.text((x_offset + 5, 2), direction, fill=(255, 255, 255))

    preview_path = OUTPUT_DIR / "user1_preview.png"
    preview.save(preview_path)

    # 保存配置
    config = {
        "name": "user1",
        "source": str(source_path),
        "frame_size": (frame_width, frame_height),
        "directions": list(DIRECTION_MAP.values()),
        "frames_per_direction": 4,
        "timestamp": datetime.now().isoformat()
    }
    config_path = OUTPUT_DIR / "user1_config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"\n   ✅ 预览图: {preview_path}")
    print(f"   ✅ 配置: {config_path}")

    print("\n" + "=" * 50)
    print("✅ user1 切分完成")
    print("=" * 50)
    print(f"\n输出目录: {OUTPUT_DIR}")

    return results

if __name__ == "__main__":
    split_user1()