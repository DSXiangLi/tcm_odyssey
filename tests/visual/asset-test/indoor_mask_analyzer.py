#!/usr/bin/env python3
"""
室内场景遮罩分析脚本 - 红黑格式
将AI生成的红黑遮罩层转换为游戏瓦片配置

颜色含义:
- 红色区域 = 可行走区域 (R>200, G<100, B<100)
- 黑色区域 = 不可行走区域 (墙壁、家具等)

输入:
- 原图: clinic.png
- 遮罩层: clinic_shadow.png

输出:
- clinic-walkable-config.ts 配置文件
- 可视化验证图
- 分析报告
"""

import os
import json
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from collections import deque
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Set, Tuple, Optional

# ==================== 配置 ====================

TILE_SIZE = 32

# 红黑格式阈值 (红色=可行走，黑色=不可行走)
RED_THRESHOLD = (200, 100, 100)  # R>200, G<100, B<100 = 红色(可行走)
BLACK_THRESHOLD = 50  # RGB值小于此值视为黑色(不可行走)

# 红色占比阈值 - 瓦片中红色像素占比超过此值才可行走
WALKABLE_THRESHOLD = 0.50  # 降低阈值，因为红色区域可能不规整

# 文件路径
SCRIPT_DIR = Path(__file__).parent
INDOOR_DIR = SCRIPT_DIR / "ai-generated" / "clinic"
OUTPUT_DIR = INDOOR_DIR / "mask_analysis"

# ==================== 数据结构 ====================

@dataclass
class Tile:
    """瓦片数据"""
    x: int
    y: int
    is_walkable: bool = False
    red_ratio: float = 0.0
    black_ratio: float = 0.0

@dataclass
class IndoorConfig:
    """室内场景配置"""
    scene_name: str
    width: int
    height: int
    walkable_tiles: List[Dict[str, int]] = field(default_factory=list)
    player_spawn_point: Dict[str, int] = field(default_factory=dict)
    validation: Dict = field(default_factory=dict)

# ==================== 核心函数 ====================

def load_images(scene_name: str = "clinic"):
    """加载原图和遮罩层"""
    # 根据场景名加载对应文件
    original_path = INDOOR_DIR / f"{scene_name}_nanobanana.png"
    mask_path = INDOOR_DIR / f"{scene_name}_shadow.png"

    if not original_path.exists():
        raise FileNotFoundError(f"原图不存在: {original_path}")
    if not mask_path.exists():
        raise FileNotFoundError(f"遮罩层不存在: {mask_path}")

    original = Image.open(original_path).convert("RGB")
    mask = Image.open(mask_path).convert("RGB")

    print(f"📦 加载图片:")
    print(f"   原图: {original.size} ({original.mode})")
    print(f"   遮罩层: {mask.size} ({mask.mode})")

    return original, mask, original_path, mask_path

def analyze_alignment(original: Image.Image, mask: Image.Image) -> dict:
    """分析原图和遮罩层的对齐情况"""
    orig_w, orig_h = original.size
    mask_w, mask_h = mask.size

    width_diff = mask_w - orig_w
    height_diff = mask_h - orig_h

    print(f"\n📐 尺寸对比:")
    print(f"   原图: {orig_w}×{orig_h}")
    print(f"   遮罩层: {mask_w}×{mask_h}")
    print(f"   宽度差异: {width_diff} 像素")
    print(f"   高度差异: {height_diff} 像素")

    return {
        "original_size": original.size,
        "mask_size": mask.size,
        "width_diff": width_diff,
        "height_diff": height_diff,
        "needs_adjustment": width_diff != 0 or height_diff != 0
    }

def adjust_mask_size(mask: Image.Image, target_size: Tuple[int, int]) -> Image.Image:
    """调整遮罩层尺寸以匹配原图"""
    target_w, target_h = target_size
    mask_w, mask_h = mask.size

    if mask_w == target_w and mask_h == target_h:
        return mask

    print(f"\n🔧 调整遮罩层尺寸:")
    print(f"   从 {mask.size} 到 {target_size}")

    # 裁剪右侧/底部多余部分
    adjusted = mask.crop((0, 0, target_w, target_h))

    print(f"   结果: {adjusted.size}")
    return adjusted

def analyze_walkable_tiles(mask: Image.Image) -> List[List[Tile]]:
    """分析每个瓦片的可行走性（红黑格式）"""
    width, height = mask.size
    tiles_x = width // TILE_SIZE
    tiles_y = height // TILE_SIZE

    print(f"\n🗺️ 分析可行走瓦片 (红黑格式):")
    print(f"   瓦片网格: {tiles_x}×{tiles_y} = {tiles_x * tiles_y} 个瓦片")
    print(f"   红色=可行走，黑色=不可行走")

    mask_array = np.array(mask)
    tiles = []

    for ty in range(tiles_y):
        row = []
        for tx in range(tiles_x):
            # 计算瓦片区域
            x1, y1 = tx * TILE_SIZE, ty * TILE_SIZE
            x2, y2 = x1 + TILE_SIZE, y1 + TILE_SIZE

            # 统计红色和黑色像素
            red_count = 0
            black_count = 0
            total_count = TILE_SIZE * TILE_SIZE

            for y in range(y1, min(y2, height)):
                for x in range(x1, min(x2, width)):
                    r, g, b = mask_array[y, x]

                    # 红色检测 (可行走)
                    if r > RED_THRESHOLD[0] and g < RED_THRESHOLD[1] and b < RED_THRESHOLD[2]:
                        red_count += 1

                    # 黑色检测 (不可行走)
                    if r < BLACK_THRESHOLD and g < BLACK_THRESHOLD and b < BLACK_THRESHOLD:
                        black_count += 1

            red_ratio = red_count / total_count
            black_ratio = black_count / total_count

            # 红色占比超过阈值则可行走
            is_walkable = red_ratio > WALKABLE_THRESHOLD

            row.append(Tile(
                x=tx, y=ty,
                is_walkable=is_walkable,
                red_ratio=red_ratio,
                black_ratio=black_ratio
            ))

        tiles.append(row)

    # 统计
    walkable_count = sum(1 for row in tiles for tile in row if tile.is_walkable)
    print(f"   可行走瓦片: {walkable_count} ({walkable_count / (tiles_x * tiles_y) * 100:.1f}%)")

    return tiles

def find_connected_region(tiles: List[List[Tile]]) -> Set[Tuple[int, int]]:
    """BFS找出主连通区域"""
    tiles_y = len(tiles)
    tiles_x = len(tiles[0]) if tiles_y > 0 else 0

    # 找所有可行走瓦片
    walkable = set()
    for row in tiles:
        for tile in row:
            if tile.is_walkable:
                walkable.add((tile.x, tile.y))

    if not walkable:
        return set()

    # BFS找最大连通区域
    visited = set()
    largest_region = set()

    for start in walkable:
        if start in visited:
            continue

        region = set()
        queue = deque([start])

        while queue:
            current = queue.popleft()
            if current in visited:
                continue

            visited.add(current)
            region.add(current)

            cx, cy = current
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nx, ny = cx + dx, cy + dy
                if (nx, ny) in walkable and (nx, ny) not in visited:
                    queue.append((nx, ny))

        if len(region) > len(largest_region):
            largest_region = region

    print(f"\n🔗 连通性分析:")
    print(f"   主连通区域大小: {len(largest_region)} 瓦片")

    return largest_region

def find_door_spawn_area(connected_region: Set[Tuple[int, int]], tiles_x: int, tiles_y: int) -> Dict[str, int]:
    """找到门附近合适的出生点（通常在底部中间区域）"""
    # 诊所的门通常在底部中间
    # 找到底部中间附近的可行走瓦片

    center_x = tiles_x // 2
    bottom_y = tiles_y - 1

    # 在底部区域寻找可行走瓦片
    best_spawn = None
    min_dist = float('inf')

    for (tx, ty) in connected_region:
        # 优先选择底部中间区域
        dist = abs(tx - center_x) + abs(ty - bottom_y)
        if dist < min_dist:
            min_dist = dist
            best_spawn = (tx, ty)

    if best_spawn:
        print(f"\n🚪 出生点建议:")
        print(f"   瓦片坐标: ({best_spawn[0]}, {best_spawn[1]})")
        print(f"   像素坐标: ({best_spawn[0] * TILE_SIZE + TILE_SIZE // 2}, {best_spawn[1] * TILE_SIZE + TILE_SIZE // 2})")
        return {"x": best_spawn[0], "y": best_spawn[1]}

    # 如果没找到，返回任意一个可行走瓦片
    if connected_region:
        first = list(connected_region)[0]
        return {"x": first[0], "y": first[1]}

    return {"x": tiles_x // 2, "y": tiles_y - 2}  # 默认位置

def create_visualization(original: Image.Image, tiles: List[List[Tile]],
                         connected_region: Set[Tuple[int, int]],
                         spawn_point: Dict[str, int],
                         output_dir: Path):
    """创建可视化验证图"""

    print(f"\n🎨 生成可视化验证图...")

    overlay = original.copy().convert("RGBA")
    draw = ImageDraw.Draw(overlay)

    # 绘制可行走瓦片（绿色半透明）
    for (tx, ty) in connected_region:
        x1, y1 = tx * TILE_SIZE, ty * TILE_SIZE
        x2, y2 = x1 + TILE_SIZE, y1 + TILE_SIZE
        draw.rectangle([x1, y1, x2, y2], fill=(0, 255, 0, 80), outline=(0, 200, 0, 150))

    # 绘制出生点（蓝色圆点）
    cx = spawn_point["x"] * TILE_SIZE + TILE_SIZE // 2
    cy = spawn_point["y"] * TILE_SIZE + TILE_SIZE // 2
    r = 15
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 100, 255, 200), outline=(100, 150, 255, 255))

    # 添加标注
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
    except:
        font = ImageFont.load_default()
        font_small = font

    draw.text((cx + r + 5, cy - 8), "Spawn", fill=(255, 255, 255), font=font)

    # 保存叠加图
    overlay_path = output_dir / "walkable_overlay.png"
    overlay.save(overlay_path)
    print(f"   ✅ 可行走区域叠加图: {overlay_path}")

    # 创建网格图
    grid_img = original.copy().convert("RGBA")
    draw = ImageDraw.Draw(grid_img)

    tiles_x = len(tiles[0]) if tiles else 0
    tiles_y = len(tiles)

    for tx in range(tiles_x):
        for ty in range(tiles_y):
            x1, y1 = tx * TILE_SIZE, ty * TILE_SIZE
            x2, y2 = x1 + TILE_SIZE, y1 + TILE_SIZE

            # 网格线
            draw.rectangle([x1, y1, x2, y2], outline=(100, 100, 100, 100), width=1)

            # 连通区域标记
            if (tx, ty) in connected_region:
                draw.rectangle([x1 + 2, y1 + 2, x2 - 2, y2 - 2], outline=(0, 255, 0, 200), width=2)

    # 每隔3个瓦片标注坐标
    for tx in range(0, tiles_x, 3):
        for ty in range(0, tiles_y, 3):
            x, y = tx * TILE_SIZE + 2, ty * TILE_SIZE + 2
            draw.text((x, y), f"({tx},{ty})", fill=(255, 255, 255, 200), font=font_small)

    grid_path = output_dir / "grid_overlay.png"
    grid_img.save(grid_path)
    print(f"   ✅ 网格叠加图: {grid_path}")

    return {
        "walkable_overlay": str(overlay_path),
        "grid_overlay": str(grid_path)
    }

def generate_typescript_config(config: IndoorConfig, output_path: Path):
    """生成TypeScript配置文件"""

    ts_content = f'''// 室内场景配置 - {config.scene_name}
// 自动生成 by indoor_mask_analyzer.py
// 红黑格式遮罩层分析 (红色=可行走，黑色=不可行走)

export const {config.scene_name.upper()}_CONFIG = {{
  // 场景尺寸（瓦片）
  width: {config.width},
  height: {config.height},

  // 玩家出生点（从室外进入时的位置）
  playerSpawnPoint: {{
    x: {config.player_spawn_point['x']},
    y: {config.player_spawn_point['y']}
  }},

  // 可行走瓦片坐标列表
  walkableTiles: {json.dumps(config.walkable_tiles, indent=4)},

  // 验证信息
  validation: {json.dumps(config.validation, indent=4)}
}};
'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    print(f"✅ TypeScript配置已保存: {output_path}")

# ==================== 主函数 ====================

def main(scene_name: str = "clinic"):
    print("=" * 70)
    print(f"🎮 室内场景遮罩分析系统 - 红黑格式")
    print(f"   场景: {scene_name}")
    print("=" * 70)

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: 加载图片
    print("\n" + "=" * 70)
    print("📍 Step 1: 加载图片")
    print("=" * 70)
    original, mask, orig_path, mask_path = load_images(scene_name)

    # Step 2: 分析对齐情况
    print("\n" + "=" * 70)
    print("📍 Step 2: 分析尺寸对齐")
    print("=" * 70)
    alignment = analyze_alignment(original, mask)

    # 调整遮罩层尺寸
    if alignment["needs_adjustment"]:
        mask = adjust_mask_size(mask, original.size)

    # Step 3: 分析可行走瓦片
    print("\n" + "=" * 70)
    print("📍 Step 3: 分析可行走瓦片（红黑格式）")
    print("=" * 70)
    tiles = analyze_walkable_tiles(mask)

    # Step 4: 连通性验证
    print("\n" + "=" * 70)
    print("📍 Step 4: 连通性验证")
    print("=" * 70)
    connected_region = find_connected_region(tiles)

    # Step 5: 确定出生点
    print("\n" + "=" * 70)
    print("📍 Step 5: 确定玩家出生点")
    print("=" * 70)
    tiles_x = len(tiles[0]) if tiles else 0
    tiles_y = len(tiles)
    spawn_point = find_door_spawn_area(connected_region, tiles_x, tiles_y)

    # Step 6: 生成配置
    print("\n" + "=" * 70)
    print("📍 Step 6: 生成配置和可视化")
    print("=" * 70)

    config = IndoorConfig(
        scene_name=scene_name,
        width=tiles_x,
        height=tiles_y,
        walkable_tiles=[{"x": tx, "y": ty} for (tx, ty) in connected_region],
        player_spawn_point=spawn_point,
        validation={
            "total_tiles": tiles_x * tiles_y,
            "walkable_tiles": len(connected_region),
            "walkable_ratio": len(connected_region) / (tiles_x * tiles_y),
            "color_format": "red_black",
            "red_means_walkable": True,
            "black_means_unwalkable": True
        }
    )

    # 保存JSON配置
    json_path = OUTPUT_DIR / f"{scene_name}_walkable_config.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(asdict(config), f, indent=2, ensure_ascii=False)
    print(f"✅ JSON配置已保存: {json_path}")

    # 保存TypeScript配置
    ts_path = OUTPUT_DIR / f"{scene_name}-walkable-config.ts"
    generate_typescript_config(config, ts_path)

    # 生成可视化
    viz_paths = create_visualization(original, tiles, connected_region, spawn_point, OUTPUT_DIR)

    # Step 7: 输出总结
    print("\n" + "=" * 70)
    print("📊 分析完成总结")
    print("=" * 70)
    print(f"   场景: {scene_name}")
    print(f"   地图尺寸: {config.width}×{config.height} 瓦片")
    print(f"   可行走瓦片: {len(config.walkable_tiles)} ({len(config.walkable_tiles)/(config.width*config.height)*100:.1f}%)")
    print(f"   出生点: ({spawn_point['x']}, {spawn_point['y']})")
    print(f"\n📁 输出文件:")
    print(f"   JSON配置: {json_path}")
    print(f"   TypeScript配置: {ts_path}")
    print(f"   可视化: {viz_paths['walkable_overlay']}")

    print("\n" + "=" * 70)
    print("✅ 全部完成！请检查可视化图片确认识别结果")
    print("=" * 70)

    return config

if __name__ == "__main__":
    import sys
    scene_name = sys.argv[1] if len(sys.argv) > 1 else "clinic"
    main(scene_name)