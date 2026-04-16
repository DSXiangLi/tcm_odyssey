#!/usr/bin/env python3
"""
提取场景图片的主色调 - 使用颜色聚类
"""

from PIL import Image
import numpy as np
import os

def extract_main_colors(image_path, n_colors=8):
    """使用简单的颜色聚类提取主色调"""
    if not os.path.exists(image_path):
        print(f"文件不存在: {image_path}")
        return []

    img = Image.open(image_path)
    img = img.convert('RGB')
    img = img.resize((200, 200))  # 缩小加快处理

    pixels = np.array(img)
    pixels = pixels.reshape(-1, 3)

    # 简单的颜色分组（每16级一个组）
    quantized = (pixels // 32) * 32  # 量化到32级
    quantized = np.clip(quantized, 0, 255)

    # 统计量化后的颜色
    from collections import Counter
    color_counts = Counter(tuple(p) for p in quantized)

    # 获取主要颜色
    top_colors = color_counts.most_common(n_colors)

    return top_colors

def rgb_to_hex(rgb):
    """RGB转十六进制"""
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def get_color_name(rgb):
    """获取颜色名称"""
    r, g, b = rgb
    r, g, b = int(r), int(g), int(b)  # 转换为Python int

    # 亮度
    brightness = (r + g + b) / 3.0

    # 颜色倾向判断
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    diff = max_val - min_val

    if diff < 30:  # 接近灰度
        if brightness > 200:
            return "白色系"
        elif brightness > 150:
            return "浅灰系"
        elif brightness > 100:
            return "中灰系"
        elif brightness > 50:
            return "深灰系"
        else:
            return "黑色系"

    # 有明显颜色倾向
    if g > r and g > b and g > r + 20:
        if brightness > 180:
            return "亮绿系"
        elif brightness > 120:
            return "中绿系"
        else:
            return "暗绿系"

    if r > g and b < r * 0.7:
        if r > g + 30 and g > b + 30:
            if brightness > 150:
                return "暖棕系"
            else:
                return "暗棕系"
        elif brightness > 180:
            return "暖黄系"
        else:
            return "土黄系"

    if b > r and b > g:
        if brightness > 180:
            return "亮蓝系"
        elif brightness > 120:
            return "中蓝系"
        else:
            return "暗蓝系"

    if r > b and g > b and abs(r - g) < 40:
        if brightness > 180:
            return "暖黄系"
        else:
            return "土黄系"

    return "混合色"

def main():
    images = [
        ("外景-百草镇", "/home/lixiang/Desktop/zhongyi_game_v3/public/assets/town_outdoor/town_background.jpeg"),
        ("内景-诊所", "/home/lixiang/Desktop/zhongyi_game_v3/public/assets/indoor/clinic_scaled/clinic_scaled.png"),
        ("内景-药园", "/home/lixiang/Desktop/zhongyi_game_v3/public/assets/indoor/garden/herb_field_area.png"),
    ]

    print("=" * 70)
    print("场景图片配色提取（用于UI统一配色）")
    print("=" * 70)

    all_categories = {}

    for name, path in images:
        print(f"\n【{name}】主色调:")
        colors = extract_main_colors(path, 12)

        if not colors:
            continue

        total = sum(count for _, count in colors)

        for i, (rgb, count) in enumerate(colors):
            hex_color = rgb_to_hex(rgb)
            color_name = get_color_name(rgb)
            percentage = count / total * 100

            # 过滤掉太黑的颜色
            brightness = (rgb[0] + rgb[1] + rgb[2]) / 3.0
            if brightness < 20:
                continue

            print(f"  {i+1}. {hex_color} RGB({rgb[0]}, {rgb[1]}, {rgb[2]}) [{color_name}] {percentage:.1f}%")

            # 收集分类
            if percentage > 3:
                if color_name not in all_categories:
                    all_categories[color_name] = []
                all_categories[color_name].append({
                    'hex': hex_color,
                    'rgb': rgb,
                    'scene': name,
                    'percentage': percentage
                })

    print("\n" + "=" * 70)
    print("推荐的UI配色方案（基于场景主要颜色）")
    print("=" * 70)

    # 按类别输出
    for cat in sorted(all_categories.keys()):
        colors = all_categories[cat]
        # 按百分比排序
        colors.sort(key=lambda x: x['percentage'], reverse=True)

        print(f"\n{cat}:")
        for c in colors[:3]:  # 每类最多3个
            print(f"  {c['hex']} - 来自 {c['scene']} ({c['percentage']:.1f}%)")

    # 输出推荐的UI配色常量
    print("\n" + "=" * 70)
    print("推荐UI配色常量（可直接使用）")
    print("=" * 70)
    print("""
// UI配色常量（基于场景图片提取）
export const UI_COLORS = {
  // 面板背景 - 使用深灰/暗蓝系
  PANEL_BG: 0x1a1a2e,      // 深蓝灰（与内景暗部协调）
  PANEL_LIGHT: 0x2a2a3e,   // 浅灰蓝（弹窗背景）

  // 按钮 - 使用绿系和棕系
  BUTTON_PRIMARY: 0x7eb154,   // 中绿（药园主色）
  BUTTON_SECONDARY: 0x5d3b31, // 暗棕（木质感）

  // 文字
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#bdad94',  // 米黄（与诊所木色调协调）

  // 边框/装饰
  BORDER_COLOR: 0x5d3b31,     // 暗棕边框
  ACCENT_COLOR: 0x55b9d6,     // 蓝绿（外景天色调）
};
""")

if __name__ == "__main__":
    main()