#!/usr/bin/env python3
"""
检查门周围可行走状态
"""
import json
from pathlib import Path

# 加载可行走数据
town_data_path = Path("/home/lixiang/Desktop/zhongyi_game_v3/src/data/town-walkable-data.ts")

# 读取文件内容
with open(town_data_path) as f:
    content = f.read()

# 提取walkableTiles列表
import re
match = re.search(r'walkableTiles:\s*\[([\s\S]*?)\n\s*\]', content)
if match:
    tiles_str = match.group(1)
    # 解析坐标
    tiles = re.findall(r'"x":\s*(\d+),\s*"y":\s*(\d+)', tiles_str)
    walkable_set = set((int(x), int(y)) for x, y in tiles)

    # 门坐标
    doors = {
        'garden': (15, 8),
        'clinic': (60, 8),
        'home': (61, 35)
    }

    # spawnPoint
    spawns = {
        'garden_return': (15, 10),
        'clinic_return': (60, 10),
        'home_return': (61, 37)
    }

    print("=== 原始可行走数据检查 ===")
    for name, coord in doors.items():
        print(f"\n{name}门 ({coord[0]}, {coord[1]}):")
        # 检查门本身
        if coord in walkable_set:
            print(f"  门本身: ✓ 可行走")
        else:
            print(f"  门本身: ✗ 不可行走")

        # 检查门周围5x5
        print(f"  门周围5x5区域:")
        for dx in range(-2, 3):
            row = ""
            for dy in range(-2, 3):
                check_coord = (coord[0] + dx, coord[1] + dy)
                if check_coord in walkable_set:
                    row += "✓ "
                else:
                    row += "✗ "
            print(f"    dx={dx}: {row}")

    print("\n=== spawnPoint检查 ===")
    for name, coord in spawns.items():
        print(f"\n{name} ({coord[0]}, {coord[1]}):")
        if coord in walkable_set:
            print(f"  ✓ 可行走")
        else:
            print(f"  ✗ 不可行走")

        # 检查周围3x3
        print(f"  周围3x3:")
        for dx in range(-1, 2):
            row = ""
            for dy in range(-1, 2):
                check_coord = (coord[0] + dx, coord[1] + dy)
                if check_coord in walkable_set:
                    row += "✓ "
                else:
                    row += "✗ "
            print(f"    dx={dx}: {row}")

    # 检查路径连通性（从spawn到门）
    print("\n=== 路径连通性检查 ===")

    # 玩家默认出生点
    default_spawn = (47, 24)
    print(f"\n默认出生点 ({default_spawn[0]}, {default_spawn[1]}): {default_spawn in walkable_set}")

    # 检查从出生点到诊所门是否有可行走路径
    # 简单检查：沿直线是否有可行走瓦片
    print(f"\n从出生点到诊所门(60,8)的路径检查:")

    # 检查y=24这条线从x=47到x=60
    path_ok = True
    for x in range(47, 61):
        if (x, 24) not in walkable_set:
            print(f"  (x, 24) = ({x}, 24): ✗ 不在可行走集合")
            path_ok = False
    if path_ok:
        print(f"  y=24线: ✓ 全部可行走")

    # 检查x=60这条线从y=24到y=8
    path_ok = True
    for y in range(8, 25):
        if (60, y) not in walkable_set:
            print(f"  (60, y) = (60, {y}): ✗ 不在可行走集合")
            path_ok = False
    if path_ok:
        print(f"  x=60线: ✓ 全部可行走")

else:
    print("无法解析walkableTiles")