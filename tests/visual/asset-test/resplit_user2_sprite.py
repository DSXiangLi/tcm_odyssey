#!/usr/bin/env python3
"""
重新切分user2 sprite源图，修复问题：
1. 正确切分4方向×3帧
2. 对齐人物位置消除抖动
3. 生成right方向缺失文件
"""

from PIL import Image
import os
from pathlib import Path
import json

def analyze_and_split_sprite():
    """分析源图并正确切分"""

    source_path = Path("/home/lixiang/Desktop/zhongyi_game_v3/tests/visual/asset-test/ai-generated/npc/user2.png")
    output_dir = Path("/home/lixiang/Desktop/zhongyi_game_v3/public/assets/sprites/player")

    # 加载源图
    source_img = Image.open(source_path)
    width, height = source_img.size

    print(f"源图尺寸: {width} x {height}")
    print(f"源图模式: {source_img.mode}")

    # 分析布局：4行×3列
    # 计算每帧尺寸
    frame_width = width // 3
    frame_height = height // 4

    print(f"计算帧尺寸: {frame_width} x {frame_height}")

    # 源图方向顺序（Qwen-VL确认）：row0=down, row1=left, row2=right, row3=up
    directions = ["down", "left", "right", "up"]

    # 切分每个方向
    for row_idx, direction in enumerate(directions):
        frames = []

        for col_idx in range(3):
            # 计算切分区域
            x_start = col_idx * frame_width
            y_start = row_idx * frame_height

            # 切分帧
            frame = source_img.crop((
                x_start, y_start,
                x_start + frame_width, y_start + frame_height
            ))

            frames.append(frame)

            print(f"切分 {direction} 帧{col_idx}: ({x_start}, {y_start}) -> ({x_start + frame_width}, {y_start + frame_height})")

        # 合并3帧为单行sprite sheet
        combined = Image.new('RGBA', (frame_width * 3, frame_height))

        for i, frame in enumerate(frames):
            # 分析帧内人物位置（计算非透明像素的边界）
            bbox = frame.getbbox()
            if bbox:
                # 人物中心位置
                char_center_x = (bbox[0] + bbox[2]) / 2
                frame_center_x = frame_width / 2
                offset = char_center_x - frame_center_x

                print(f"  帧{i} 人物偏移: {offset:.1f}像素 (bbox: {bbox})")

                # 如果偏移超过阈值，调整位置
                if abs(offset) > 1:
                    # 创建调整后的帧
                    adjusted = Image.new('RGBA', (frame_width, frame_height))
                    shift_x = -int(offset)
                    adjusted.paste(frame, (shift_x, 0))
                    frames[i] = adjusted
                    print(f"    -> 已调整偏移: {shift_x}像素")

            # 合并到sprite sheet
            combined.paste(frames[i], (i * frame_width, 0))

        # 保存
        output_path = output_dir / f"user2_{direction}.png"
        combined.save(output_path)
        print(f"保存: {output_path} ({combined.size})")

    # 生成配置文件
    config = {
        "name": "user2",
        "source": str(source_path),
        "frame_size": [frame_width, frame_height],
        "directions": directions,
        "frames_per_direction": 3,
        "total_size": [width, height],
        "layout": {"rows": 4, "cols": 3}
    }

    config_path = output_dir / "user2_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"\n配置已更新: {config_path}")
    print(f"帧尺寸: {frame_width} x {frame_height}")
    print(f"每方向帧数: 3")

    return frame_width, frame_height

if __name__ == "__main__":
    analyze_and_split_sprite()