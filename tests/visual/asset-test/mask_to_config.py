#!/usr/bin/env python3
"""
黑白遮罩层自动映射系统
将AI生成的黑白遮罩层转换为游戏瓦片配置

输入:
- 原图: new_town_nanobanana3.jpeg
- 遮罩层: new_town_shadow2.jpeg

输出:
- map-config.ts 配置文件
- 可视化验证图
- 连通性测试报告
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
BLACK_THRESHOLD = 50  # RGB值小于此值视为黑色
WHITE_THRESHOLD = 200  # RGB值大于此值视为白色
WALKABLE_THRESHOLD = 0.70  # 瓦片中黑色像素占比>70%才可行走
MIN_CONNECTED_AREA = 32 * 32  # 最小连通区域面积（1个瓦片）

# 红色/黄色检测阈值
RED_THRESHOLD = (200, 100, 100)  # R>200, G<100, B<100
YELLOW_THRESHOLD = (200, 200, 100)  # R>200, G>200, B<100

# 文件路径
SCRIPT_DIR = Path(__file__).parent
AI_GENERATED_DIR = SCRIPT_DIR / "ai-generated" / "town_new"
OUTPUT_DIR = AI_GENERATED_DIR / "mask_analysis"

# ==================== 数据结构 ====================

@dataclass
class Tile:
    """瓦片数据"""
    x: int
    y: int
    is_walkable: bool = False
    black_ratio: float = 0.0

@dataclass
class Door:
    """门配置"""
    id: str
    tile_x: int
    tile_y: int
    pixel_x: int
    pixel_y: int
    target_scene: str
    spawn_point: Dict[str, int]

@dataclass
class Interactable:
    """交互元素"""
    id: str
    tile_x: int
    tile_y: int
    pixel_x: int
    pixel_y: int
    type: str
    name: str

@dataclass
class MapConfig:
    """地图配置"""
    width: int
    height: int
    walkable_tiles: List[Dict[str, int]] = field(default_factory=list)
    doors: List[Dict] = field(default_factory=list)
    interactables: List[Dict] = field(default_factory=list)
    pixel_coords: Dict = field(default_factory=dict)
    validation: Dict = field(default_factory=dict)

# ==================== 核心函数 ====================

def load_images():
    """加载原图和遮罩层"""
    original_path = AI_GENERATED_DIR / "new_town_nanobanana3.jpeg"
    mask_path = AI_GENERATED_DIR / "new_town_shadow2.jpeg"

    if not original_path.exists():
        raise FileNotFoundError(f"原图不存在: {original_path}")
    if not mask_path.exists():
        raise FileNotFoundError(f"遮罩层不存在: {mask_path}")

    original = Image.open(original_path).convert("RGB")
    mask = Image.open(mask_path).convert("RGB")

    print(f"📦 加载图片:")
    print(f"   原图: {original.size} ({original.mode})")
    print(f"   遮罩层: {mask.size} ({mask.mode})")

    return original, mask

def analyze_alignment(original: Image.Image, mask: Image.Image) -> dict:
    """分析原图和遮罩层的对齐情况"""
    orig_w, orig_h = original.size
    mask_w, mask_h = mask.size

    width_diff = mask_w - orig_w
    height_diff = mask_h - orig_h

    print(f"\n📐 尺寸对比:")
    print(f"   宽度差异: {width_diff} 像素")
    print(f"   高度差异: {height_diff} 像素")

    return {
        "original_size": original.size,
        "mask_size": mask.size,
        "width_diff": width_diff,
        "height_diff": height_diff,
        "needs_adjustment": width_diff != 0 or height_diff != 0
    }

def create_alignment_check(original: Image.Image, mask: Image.Image, output_path: Path):
    """创建对齐检查图"""
    # 创建叠加图
    overlay = original.copy().convert("RGBA")
    draw = ImageDraw.Draw(overlay)

    # 将遮罩层黑色区域画红色轮廓
    mask_array = np.array(mask)
    width, height = mask.size

    # 采样检测黑色区域边界
    for y in range(0, height - 1, 4):
        for x in range(0, width - 1, 4):
            r, g, b = mask_array[y, x]
            if r < BLACK_THRESHOLD and g < BLACK_THRESHOLD and b < BLACK_THRESHOLD:
                # 检查是否是边界像素
                is_edge = False
                for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                    nx, ny = x + dx * 4, y + dy * 4
                    if 0 <= nx < width and 0 <= ny < height:
                        nr, ng, nb = mask_array[ny, nx]
                        if nr >= BLACK_THRESHOLD or ng >= BLACK_THRESHOLD or nb >= BLACK_THRESHOLD:
                            is_edge = True
                            break

                if is_edge:
                    draw.point((x, y), fill=(255, 0, 0, 150))

    # 合并图层
    result = Image.alpha_composite(overlay, Image.new("RGBA", overlay.size, (0, 0, 0, 0)))

    # 添加尺寸标注
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
    except:
        font = ImageFont.load_default()

    draw = ImageDraw.Draw(result)
    draw.text((10, 10), f"原图: {original.size[0]}×{original.size[1]}", fill=(255, 255, 0), font=font)
    draw.text((10, 40), f"遮罩层: {mask.size[0]}×{mask.size[1]}", fill=(255, 0, 0), font=font)
    draw.text((10, 70), f"差异: {mask.size[0] - original.size[0]}×{mask.size[1] - original.size[1]}", fill=(255, 255, 255), font=font)

    result.save(output_path)
    print(f"✅ 对齐检查图已保存: {output_path}")

    return result

def adjust_mask_size(mask: Image.Image, target_size: Tuple[int, int], method: str = "crop_right") -> Image.Image:
    """调整遮罩层尺寸以匹配原图"""
    target_w, target_h = target_size
    mask_w, mask_h = mask.size

    if mask_w == target_w and mask_h == target_h:
        return mask

    print(f"\n🔧 调整遮罩层尺寸:")
    print(f"   方法: {method}")
    print(f"   从 {mask.size} 到 {target_size}")

    if method == "crop_right":
        # 裁剪右侧多余部分
        adjusted = mask.crop((0, 0, target_w, target_h))
    elif method == "center_crop":
        # 居中裁剪
        left = (mask_w - target_w) // 2
        top = (mask_h - target_h) // 2
        adjusted = mask.crop((left, top, left + target_w, top + target_h))
    else:
        raise ValueError(f"未知的调整方法: {method}")

    print(f"   结果: {adjusted.size}")
    return adjusted

def detect_special_colors(mask: Image.Image) -> dict:
    """检测遮罩层中的特殊颜色（红色大门、黄色水井）"""
    mask_array = np.array(mask)
    width, height = mask.size

    red_pixels = []
    yellow_pixels = []

    print(f"\n🔍 检测特殊颜色...")

    for y in range(height):
        for x in range(width):
            r, g, b = mask_array[y, x]

            # 红色检测
            if r > RED_THRESHOLD[0] and g < RED_THRESHOLD[1] and b < RED_THRESHOLD[2]:
                red_pixels.append((x, y))

            # 黄色检测
            if r > YELLOW_THRESHOLD[0] and g > YELLOW_THRESHOLD[1] and b < YELLOW_THRESHOLD[2]:
                yellow_pixels.append((x, y))

    print(f"   红色像素: {len(red_pixels)}")
    print(f"   黄色像素: {len(yellow_pixels)}")

    return {
        "red_pixels": red_pixels,
        "yellow_pixels": yellow_pixels
    }

def cluster_pixels(pixels: List[Tuple[int, int]], min_cluster_size: int = 100) -> List[Dict]:
    """聚类像素点，找出中心位置"""
    if not pixels:
        return []

    # 使用简单的网格聚类
    cluster_size = 50  # 聚类半径
    visited = set()
    clusters = []

    for px in pixels:
        if px in visited:
            continue

        # BFS找连通的点
        cluster = []
        queue = deque([px])

        while queue:
            current = queue.popleft()
            if current in visited:
                continue

            visited.add(current)
            cluster.append(current)

            # 找邻近的点
            cx, cy = current
            for np in pixels:
                if np not in visited:
                    nx, ny = np
                    if abs(nx - cx) <= cluster_size and abs(ny - cy) <= cluster_size:
                        queue.append(np)

        if len(cluster) >= min_cluster_size:
            # 计算中心
            center_x = sum(p[0] for p in cluster) // len(cluster)
            center_y = sum(p[1] for p in cluster) // len(cluster)
            clusters.append({
                "pixel_count": len(cluster),
                "center": (center_x, center_y),
                "tile": (center_x // TILE_SIZE, center_y // TILE_SIZE)
            })

    return clusters

def analyze_walkable_tiles(mask: Image.Image) -> List[List[Tile]]:
    """分析每个瓦片的可行走性"""
    width, height = mask.size
    tiles_x = width // TILE_SIZE
    tiles_y = height // TILE_SIZE

    print(f"\n🗺️ 分析可行走瓦片:")
    print(f"   瓦片网格: {tiles_x}×{tiles_y} = {tiles_x * tiles_y} 个瓦片")

    mask_array = np.array(mask)
    tiles = []

    for ty in range(tiles_y):
        row = []
        for tx in range(tiles_x):
            # 计算瓦片区域
            x1, y1 = tx * TILE_SIZE, ty * TILE_SIZE
            x2, y2 = x1 + TILE_SIZE, y1 + TILE_SIZE

            # 统计黑色像素
            black_count = 0
            total_count = TILE_SIZE * TILE_SIZE

            for y in range(y1, min(y2, height)):
                for x in range(x1, min(x2, width)):
                    r, g, b = mask_array[y, x]
                    if r < BLACK_THRESHOLD and g < BLACK_THRESHOLD and b < BLACK_THRESHOLD:
                        black_count += 1

            black_ratio = black_count / total_count
            is_walkable = black_ratio > WALKABLE_THRESHOLD

            row.append(Tile(x=tx, y=ty, is_walkable=is_walkable, black_ratio=black_ratio))

        tiles.append(row)

    # 统计
    walkable_count = sum(1 for row in tiles for tile in row if tile.is_walkable)
    print(f"   候选可行走瓦片: {walkable_count} ({walkable_count / (tiles_x * tiles_y) * 100:.1f}%)")

    return tiles

def find_connected_region(tiles: List[List[Tile]]) -> Set[Tuple[int, int]]:
    """BFS找出主连通区域"""
    tiles_y = len(tiles)
    tiles_x = len(tiles[0]) if tiles_y > 0 else 0

    # 找所有候选可行走瓦片
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

        # BFS
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

def add_path_to_door(tiles: List[List[Tile]], connected_region: Set[Tuple[int, int]],
                      door_tile: Tuple[int, int], path_width: int = 2) -> Set[Tuple[int, int]]:
    """
    在门和主连通区域之间添加路径
    path_width: 路径宽度（瓦片数）
    """
    door_x, door_y = door_tile

    # 找到最近的连通区域瓦片
    min_dist = float('inf')
    nearest_tile = None

    for (tx, ty) in connected_region:
        dist = abs(tx - door_x) + abs(ty - door_y)
        if dist < min_dist:
            min_dist = dist
            nearest_tile = (tx, ty)

    if not nearest_tile:
        print("   ⚠️ 无法找到最近的连通区域")
        return connected_region

    print(f"   最近连通瓦片: {nearest_tile}, 距离: {min_dist}")

    # 创建路径（简单直线连接）
    new_path_tiles = set()

    # 水平方向连接
    start_x = min(door_x, nearest_tile[0])
    end_x = max(door_x, nearest_tile[0])

    for x in range(start_x, end_x + 1):
        for w in range(path_width):
            new_y = door_y + w
            if 0 <= new_y < len(tiles):
                new_path_tiles.add((x, new_y))

    # 垂直方向连接
    start_y = min(door_y, nearest_tile[1])
    end_y = max(door_y, nearest_tile[1])

    for y in range(start_y, end_y + 1):
        for w in range(path_width):
            new_x = door_x + w
            if 0 <= new_x < len(tiles[0]) if tiles else 0:
                new_path_tiles.add((new_x, y))

    # 门前的路径向左扩宽一倍（在门的x坐标左侧扩展）
    # 门周围创建更宽的可行走区域
    expand_left = door_x - 1  # 向左扩展
    for y in range(door_y, end_y + 1):
        if expand_left >= 0:
            new_path_tiles.add((expand_left, y))
            # 再扩展一层
            if expand_left - 1 >= 0:
                new_path_tiles.add((expand_left - 1, y))

    # 合并到连通区域
    updated_region = connected_region | new_path_tiles

    print(f"   新增路径瓦片: {len(new_path_tiles)}")
    print(f"   门前行走区域向左扩展")

    return updated_region

def validate_doors_reachable(tiles: List[List[Tile]], doors: List[Door], connected_region: Set[Tuple[int, int]]) -> Dict:
    """验证所有门是否可达"""
    results = {}

    for door in doors:
        tile_pos = (door.tile_x, door.tile_y)
        is_reachable = tile_pos in connected_region

        # 检查相邻瓦片是否可行走
        adjacent_walkable = False
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nx, ny = door.tile_x + dx, door.tile_y + dy
            if (nx, ny) in connected_region:
                adjacent_walkable = True
                break

        results[door.id] = {
            "tile_position": tile_pos,
            "in_connected_region": is_reachable,
            "adjacent_walkable": adjacent_walkable,
            "reachable": is_reachable or adjacent_walkable
        }

    return results

def create_visualization(original: Image.Image, tiles: List[List[Tile]],
                         connected_region: Set[Tuple[int, int]],
                         doors: List[Door], interactables: List[Interactable],
                         output_dir: Path):
    """创建可视化验证图"""

    # 1. 可行走区域叠加图
    print(f"\n🎨 生成可视化验证图...")

    overlay = original.copy().convert("RGBA")
    draw = ImageDraw.Draw(overlay)

    # 绘制可行走瓦片（绿色半透明）
    for (tx, ty) in connected_region:
        x1, y1 = tx * TILE_SIZE, ty * TILE_SIZE
        x2, y2 = x1 + TILE_SIZE, y1 + TILE_SIZE
        draw.rectangle([x1, y1, x2, y2], fill=(0, 255, 0, 80), outline=(0, 200, 0, 150))

    # 绘制门（红色圆点）
    for door in doors:
        cx = door.pixel_x
        cy = door.pixel_y
        r = 20
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 0, 0, 200), outline=(255, 100, 100, 255))
        # 标注门ID
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        except:
            font = ImageFont.load_default()
        draw.text((cx + r + 5, cy - 8), door.id, fill=(255, 255, 255), font=font)

    # 绘制交互点（黄色方块）
    for inter in interactables:
        x1 = inter.tile_x * TILE_SIZE
        y1 = inter.tile_y * TILE_SIZE
        x2 = x1 + TILE_SIZE
        y2 = y1 + TILE_SIZE
        draw.rectangle([x1, y1, x2, y2], fill=(255, 255, 0, 150), outline=(255, 200, 0, 255))
        draw.text((x1 + 5, y1 + 5), inter.name, fill=(0, 0, 0), font=font)

    # 保存
    walkable_overlay_path = output_dir / "walkable_overlay.png"
    overlay.save(walkable_overlay_path)
    print(f"   ✅ 可行走区域叠加图: {walkable_overlay_path}")

    # 2. 连通域网格图
    grid_img = original.copy().convert("RGBA")
    draw = ImageDraw.Draw(grid_img)

    # 绘制瓦片网格
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

    # 标注坐标
    try:
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
    except:
        font_small = ImageFont.load_default()

    # 每隔5个瓦片标注坐标
    for tx in range(0, tiles_x, 5):
        for ty in range(0, tiles_y, 5):
            x, y = tx * TILE_SIZE + 2, ty * TILE_SIZE + 2
            draw.text((x, y), f"({tx},{ty})", fill=(255, 255, 255, 200), font=font_small)

    connectivity_grid_path = output_dir / "connectivity_grid.png"
    grid_img.save(connectivity_grid_path)
    print(f"   ✅ 连通域网格图: {connectivity_grid_path}")

    # 3. 最终结果图
    final_path = output_dir / "final_result.png"
    overlay.save(final_path)
    print(f"   ✅ 最终结果图: {final_path}")

    return {
        "walkable_overlay": str(walkable_overlay_path),
        "connectivity_grid": str(connectivity_grid_path),
        "final_result": str(final_path)
    }

def generate_map_config(tiles: List[List[Tile]], connected_region: Set[Tuple[int, int]],
                        doors: List[Door], interactables: List[Interactable],
                        original_size: Tuple[int, int]) -> MapConfig:
    """生成地图配置"""

    tiles_y = len(tiles)
    tiles_x = len(tiles[0]) if tiles_y > 0 else 0

    config = MapConfig(
        width=tiles_x,
        height=tiles_y,
        walkable_tiles=[{"x": tx, "y": ty} for (tx, ty) in connected_region],
        doors=[asdict(d) for d in doors],
        interactables=[asdict(i) for i in interactables],
        pixel_coords={
            door.id: {"x": door.pixel_x, "y": door.pixel_y}
            for door in doors
        },
        validation={
            "main_region_size": len(connected_region),
            "total_tiles": tiles_x * tiles_y,
            "walkable_ratio": len(connected_region) / (tiles_x * tiles_y)
        }
    )

    return config

def save_typescript_config(config: MapConfig, output_path: Path):
    """保存为TypeScript配置文件"""

    ts_content = f'''// 自动生成的地图配置 - 由 mask_to_config.py 生成
// 生成时间: {__import__('datetime').datetime.now().isoformat()}
// 基于黑白遮罩层分析

import {{ SCENES }} from '../constants';

export const TOWN_WALKABLE_CONFIG = {{
  // 地图尺寸（瓦片）
  width: {config.width},
  height: {config.height},

  // 可行走瓦片坐标列表
  walkableTiles: {json.dumps(config.walkable_tiles, indent=4)},

  // 门配置（场景转换区）
  doors: [
'''

    for door in config.doors:
        ts_content += f'''    {{
      id: '{door["id"]}',
      tileX: {door["tile_x"]},
      tileY: {door["tile_y"]},
      targetScene: SCENES.{door["target_scene"].upper().replace('SCENE', '')},
      spawnPoint: {{ x: {door["spawn_point"]["x"]}, y: {door["spawn_point"]["y"]} }}
    }},
'''

    ts_content += '''  ],

  // 交互元素
  interactables: [
'''

    for inter in config.interactables:
        ts_content += f'''    {{
      id: '{inter["id"]}',
      tileX: {inter["tile_x"]},
      tileY: {inter["tile_y"]},
      type: '{inter["type"]}',
      name: '{inter["name"]}'
    }},
'''

    ts_content += f'''  ],

  // 原始像素坐标（用于调试）
  pixelCoords: {json.dumps(config.pixel_coords, indent=4)},

  // 验证信息
  validation: {json.dumps(config.validation, indent=4)}
}};

// 导出门位置便捷访问
export const DOOR_POSITIONS = {{
  garden: {{ tileX: {config.doors[0]["tile_x"]}, tileY: {config.doors[0]["tile_y"]} }},
  clinic: {{ tileX: {config.doors[1]["tile_x"]}, tileY: {config.doors[1]["tile_y"]} }},
  home: {{ tileX: {config.doors[2]["tile_x"]}, tileY: {config.doors[2]["tile_y"]} }}
}};
'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    print(f"✅ TypeScript配置已保存: {output_path}")

# ==================== 主函数 ====================

def main():
    print("=" * 70)
    print("🎮 黑白遮罩层自动映射系统")
    print("=" * 70)

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: 加载图片
    print("\n" + "=" * 70)
    print("📍 Step 1: 加载图片")
    print("=" * 70)
    original, mask = load_images()

    # Step 1.5: 分析对齐情况
    alignment = analyze_alignment(original, mask)

    # 生成对齐检查图
    alignment_check_path = OUTPUT_DIR / "alignment_check.png"
    create_alignment_check(original, mask, alignment_check_path)

    # 调整遮罩层尺寸
    if alignment["needs_adjustment"]:
        mask = adjust_mask_size(mask, original.size, method="crop_right")

    # Step 2: 检测特殊颜色
    print("\n" + "=" * 70)
    print("📍 Step 2: 检测特殊颜色（门、水井）")
    print("=" * 70)
    special_colors = detect_special_colors(mask)

    # 聚类红色像素找门
    red_clusters = cluster_pixels(special_colors["red_pixels"], min_cluster_size=500)
    print(f"\n🚪 检测到 {len(red_clusters)} 个红色聚类（门）:")
    for i, cluster in enumerate(red_clusters):
        print(f"   门{i+1}: 中心({cluster['center'][0]}, {cluster['center'][1]}), 瓦片({cluster['tile'][0]}, {cluster['tile'][1]})")

    # 聚类黄色像素找水井
    yellow_clusters = cluster_pixels(special_colors["yellow_pixels"], min_cluster_size=1000)
    print(f"\n🪣 检测到 {len(yellow_clusters)} 个黄色聚类（水井）:")
    for i, cluster in enumerate(yellow_clusters):
        print(f"   水井{i+1}: 中心({cluster['center'][0]}, {cluster['center'][1]}), 瓦片({cluster['tile'][0]}, {cluster['tile'][1]})")

    # Step 3: 分析可行走瓦片
    print("\n" + "=" * 70)
    print("📍 Step 3: 分析可行走瓦片")
    print("=" * 70)
    tiles = analyze_walkable_tiles(mask)

    # Step 4: 连通性验证
    print("\n" + "=" * 70)
    print("📍 Step 4: 连通性验证")
    print("=" * 70)
    connected_region = find_connected_region(tiles)

    # 创建门配置（根据位置排序确定场景）
    # 排序: 按x坐标从小到大
    sorted_clusters = sorted(red_clusters, key=lambda c: c['center'][0])

    doors = []
    scene_mapping = [
        ("garden", "GardenScene", {"x": 10, "y": 5}),  # 左上
        ("clinic", "ClinicScene", {"x": 7, "y": 6}),   # 右上
        ("home", "HomeScene", {"x": 5, "y": 5})        # 右下
    ]

    for i, cluster in enumerate(sorted_clusters[:3]):
        if i < len(scene_mapping):
            door_id, scene, spawn = scene_mapping[i]
            doors.append(Door(
                id=door_id,
                tile_x=cluster['tile'][0],
                tile_y=cluster['tile'][1],
                pixel_x=cluster['center'][0],
                pixel_y=cluster['center'][1],
                target_scene=scene,
                spawn_point=spawn
            ))

    # 创建交互元素配置
    interactables = []
    for cluster in yellow_clusters:
        interactables.append(Interactable(
            id="well",
            tile_x=cluster['tile'][0],
            tile_y=cluster['tile'][1],
            pixel_x=cluster['center'][0],
            pixel_y=cluster['center'][1],
            type="well",
            name="水井"
        ))

    # Step 5: 验证门可达性
    print("\n" + "=" * 70)
    print("📍 Step 5: 验证门可达性")
    print("=" * 70)
    door_validation = validate_doors_reachable(tiles, doors, connected_region)

    all_reachable = True
    for door_id, result in door_validation.items():
        status = "✅" if result["reachable"] else "❌"
        print(f"   {status} {door_id}: {result}")
        if not result["reachable"]:
            all_reachable = False

    # Step 5.5: 为不可达的门添加路径
    if not all_reachable:
        print("\n" + "=" * 70)
        print("📍 Step 5.5: 为不可达的门添加路径")
        print("=" * 70)

        for door in doors:
            if not door_validation.get(door.id, {}).get("reachable", False):
                print(f"\n🔧 为 {door.id} 添加路径...")
                print(f"   门位置: ({door.tile_x}, {door.tile_y})")

                # 添加路径
                connected_region = add_path_to_door(
                    tiles, connected_region,
                    (door.tile_x, door.tile_y),
                    path_width=2  # 2个瓦片宽度
                )

                # 重新验证
                door_validation = validate_doors_reachable(tiles, doors, connected_region)
                status = "✅" if door_validation[door.id]["reachable"] else "❌"
                print(f"   修正后状态: {status} {door_validation[door.id]}")

        # 更新可达状态
        all_reachable = all(v["reachable"] for v in door_validation.values())
        print(f"\n   最终所有门可达: {'✅' if all_reachable else '❌'}")

    # Step 6: 生成配置和可视化
    print("\n" + "=" * 70)
    print("📍 Step 6: 生成配置和可视化")
    print("=" * 70)

    # 生成地图配置
    config = generate_map_config(tiles, connected_region, doors, interactables, original.size)
    config.validation["all_doors_reachable"] = all_reachable
    config.validation["door_validation"] = door_validation

    # 保存JSON配置
    json_path = OUTPUT_DIR / "map_config.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(asdict(config), f, indent=2, ensure_ascii=False)
    print(f"✅ JSON配置已保存: {json_path}")

    # 保存TypeScript配置
    ts_path = OUTPUT_DIR / "town-walkable-config.ts"
    save_typescript_config(config, ts_path)

    # 生成可视化
    viz_paths = create_visualization(original, tiles, connected_region, doors, interactables, OUTPUT_DIR)

    # Step 7: 输出总结
    print("\n" + "=" * 70)
    print("📊 分析完成总结")
    print("=" * 70)
    print(f"   地图尺寸: {config.width}×{config.height} 瓦片")
    print(f"   可行走瓦片: {len(config.walkable_tiles)} ({len(config.walkable_tiles)/(config.width*config.height)*100:.1f}%)")
    print(f"   门数量: {len(doors)}")
    print(f"   所有门可达: {'✅' if all_reachable else '❌'}")
    print(f"\n📁 输出文件:")
    print(f"   对齐检查: {alignment_check_path}")
    print(f"   JSON配置: {json_path}")
    print(f"   TypeScript配置: {ts_path}")
    print(f"   可视化: {viz_paths['walkable_overlay']}")
    print(f"   网格图: {viz_paths['connectivity_grid']}")

    # 保存分析报告
    report = {
        "timestamp": __import__('datetime').datetime.now().isoformat(),
        "alignment": alignment,
        "special_colors": {
            "red_clusters": red_clusters,
            "yellow_clusters": yellow_clusters
        },
        "tiles": {
            "total": config.width * config.height,
            "walkable": len(config.walkable_tiles),
            "connected_region_size": len(connected_region)
        },
        "validation": config.validation,
        "output_files": {
            "alignment_check": str(alignment_check_path),
            "json_config": str(json_path),
            "ts_config": str(ts_path),
            **viz_paths
        }
    }

    report_path = OUTPUT_DIR / "analysis_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"   分析报告: {report_path}")

    print("\n" + "=" * 70)
    print("✅ 全部完成！请检查可视化图片确认识别结果")
    print("=" * 70)

    return config

if __name__ == "__main__":
    main()