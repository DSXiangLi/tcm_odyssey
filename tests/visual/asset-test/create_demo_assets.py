#!/usr/bin/env python3
"""
生成占位像素素材用于演示对比
"""
from PIL import Image, ImageDraw
import os
from pathlib import Path

def create_grass_tile():
    """创建草地瓦片"""
    img = Image.new('RGB', (64, 64), color='#4a9')
    draw = ImageDraw.Draw(img)
    # 添加简单的草纹理
    for i in range(0, 64, 8):
        for j in range(0, 64, 8):
            if (i + j) % 16 == 0:
                draw.rectangle([i, j, i+4, j+4], fill='#6c7')
            else:
                draw.rectangle([i, j, i+4, j+4], fill='#4a9')
    # 添加一些细节
    for i in range(10, 60, 15):
        draw.line([(i, 10), (i, 25)], fill='#2d5', width=2)
    return img

def create_path_tile():
    """创建路径瓦片"""
    img = Image.new('RGB', (64, 64), color='#e8d')
    draw = ImageDraw.Draw(img)
    # 添加泥土纹理
    for i in range(0, 64, 6):
        for j in range(0, 64, 6):
            if (i + j) % 12 == 0:
                draw.rectangle([i, j, i+3, j+3], fill='#c9b')
    # 添加边缘
    draw.rectangle([0, 0, 5, 64], fill='#4a9')
    draw.rectangle([59, 0, 64, 64], fill='#4a9')
    return img

def create_bamboo_tile():
    """创建竹林瓦片"""
    img = Image.new('RGB', (64, 64), color='#3a5')
    draw = ImageDraw.Draw(img)
    # 竹竿
    draw.rectangle([15, 0, 20, 64], fill='#2d5')
    draw.rectangle([35, 0, 40, 64], fill='#2d5')
    draw.rectangle([50, 0, 55, 64], fill='#2d5')
    # 竹节
    for y in [15, 35, 55]:
        draw.rectangle([14, y, 21, y+3], fill='#1a4')
        draw.rectangle([34, y+5, 41, y+8], fill='#1a4')
        draw.rectangle([49, y-3, 56, y], fill='#1a4')
    # 叶子
    draw.ellipse([5, 5, 25, 15], fill='#4c8')
    draw.ellipse([30, 10, 50, 20], fill='#4c8')
    return img

def create_herb_field_tile():
    """创建药田瓦片"""
    img = Image.new('RGB', (64, 64), color='#5a5')
    draw = ImageDraw.Draw(img)
    # 土地
    draw.rectangle([5, 5, 59, 59], fill='#6b4')
    # 植物行
    for row in range(3):
        y = 15 + row * 18
        for col in range(4):
            x = 10 + col * 14
            draw.ellipse([x, y, x+8, y+12], fill='#2d5')
            draw.line([(x+4, y), (x+4, y-5)], fill='#1a4', width=2)
    # 标识牌
    draw.rectangle([50, 2, 62, 12], fill='#865')
    draw.rectangle([51, 3, 61, 11], fill='#a87')
    return img

def main():
    base_dir = Path(__file__).parent

    # 创建开源风格占位图
    print("Creating opensource-style placeholders...")
    grass = create_grass_tile()
    grass.save(base_dir / 'opensource' / 'grass' / 'grass_opensource_demo.png')

    path = create_path_tile()
    path.save(base_dir / 'opensource' / 'path' / 'path_opensource_demo.png')

    bamboo = create_bamboo_tile()
    bamboo.save(base_dir / 'opensource' / 'bamboo' / 'bamboo_opensource_demo.png')

    herb = create_herb_field_tile()
    herb.save(base_dir / 'opensource' / 'herb-field' / 'herb-field_opensource_demo.png')

    # 创建AI风格占位图（稍微不同的风格）
    print("Creating AI-style placeholders...")

    # AI风格的草地 - 更丰富的渐变
    ai_grass = Image.new('RGB', (64, 64), color='#3a8')
    draw = ImageDraw.Draw(ai_grass)
    for i in range(64):
        for j in range(64):
            # 渐变效果
            r = 70 + (i % 20)
            g = 170 + (j % 30)
            b = 140 + ((i+j) % 20)
            ai_grass.putpixel((i, j), (r, g, b))
    ai_grass.save(base_dir / 'ai-generated' / 'grass' / 'grass_ai_demo.png')

    # AI风格的路径
    ai_path = Image.new('RGB', (64, 64), color='#d8c')
    draw = ImageDraw.Draw(ai_path)
    for i in range(64):
        for j in range(64):
            r = 200 + (i % 30)
            g = 180 + (j % 25)
            b = 160 + ((i+j) % 20)
            ai_path.putpixel((i, j), (r, g, b))
    ai_path.save(base_dir / 'ai-generated' / 'path' / 'path_ai_demo.png')

    # AI风格的竹林
    ai_bamboo = Image.new('RGB', (64, 64), color='#2a4')
    draw = ImageDraw.Draw(ai_bamboo)
    for i in range(64):
        for j in range(64):
            g = 80 + (i % 40) + (j % 30)
            ai_bamboo.putpixel((i, j), (30, g, 60))
    ai_bamboo.save(base_dir / 'ai-generated' / 'bamboo' / 'bamboo_ai_demo.png')

    # AI风格的药田
    ai_herb = Image.new('RGB', (64, 64), color='#3a5')
    draw = ImageDraw.Draw(ai_herb)
    for i in range(64):
        for j in range(64):
            g = 100 + (i % 50)
            ai_herb.putpixel((i, j), (50, g, 70))
    ai_herb.save(base_dir / 'ai-generated' / 'herb-field' / 'herb-field_ai_demo.png')

    print("✅ Demo placeholders created!")
    print(f"   Opensource: {base_dir / 'opensource'}")
    print(f"   AI-generated: {base_dir / 'ai-generated'}")

if __name__ == "__main__":
    main()