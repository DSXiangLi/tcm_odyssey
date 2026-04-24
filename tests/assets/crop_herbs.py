#!/usr/bin/env python3
"""
图片切割脚本：切掉边缘水印，2x2等分，然后用多模态AI识别药材并命名
"""

import os
import json
import base64
import requests
from PIL import Image
from pathlib import Path
from io import BytesIO

# 配置参数
INPUT_DIR = Path(__file__).parent / "herb_raw"
OUTPUT_DIR = Path(__file__).parent / "herb_processed"

# Qwen VL API配置（从.env读取）
QWEN_VL_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_VL_KEY = os.environ.get("QWEN_VL_KEY", "sk-2e4a2ff5b93148cf940fbd74b499aee9")
QWEN_VL_MODEL = "qwen-vl-max"


def identify_herb(image_path: Path) -> str:
    """使用多模态模型识别药材"""

    # 读取图片并转为base64
    with open(image_path, "rb") as f:
        image_data = f.read()

    # 转为base64
    image_base64 = base64.b64encode(image_data).decode("utf-8")

    # 构建请求
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
                    {
                        "type": "text",
                        "text": "这是什么中药材？请只回答药材的中文名称，不要有任何其他解释。如果看起来像中药材，给出最可能的名称；如果不确定，回答'未知药材'。回答格式：只用2-4个汉字的药材名称，如'人参'、'黄芪'、'当归'等。"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 50
    }

    try:
        response = requests.post(
            f"{QWEN_VL_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()

        result = response.json()
        herb_name = result["choices"][0]["message"]["content"].strip()

        # 清理可能的额外文字
        # 只保留纯药材名（去掉可能的解释文字）
        herb_name = herb_name.split("\n")[0].strip()

        # 如果回答太长，可能是解释而非名称
        if len(herb_name) > 10:
            # 尝试提取第一个药材名
            common_herbs = ["人参", "黄芪", "白术", "茯苓", "当归", "川芎",
                          "白芍", "熟地", "陈皮", "半夏", "甘草", "金银花",
                          "连翘", "薄荷", "牛蒡子", "大黄", "芒硝", "番泻叶",
                          "火麻仁", "丹参", "红花", "桃仁", "益母草", "山药",
                          "枸杞", "麦冬", "五味子", "山茱萸", "杜仲", "续断"]
            for herb in common_herbs:
                if herb in herb_name:
                    herb_name = herb
                    break

        print(f"    AI识别: {herb_name}")
        return herb_name

    except Exception as e:
        print(f"    识别失败: {e}")
        return f"herb_{image_path.stem}"


def process_image(input_path: Path, output_dir: Path, image_num: str):
    """处理单张图片：2x2分割 + AI识别命名（不切边）"""

    # 打开图片
    img = Image.open(input_path)
    original_width, original_height = img.size

    print(f"处理: {input_path.name} ({original_width}x{original_height})")

    # 直接2x2等分（不切边）
    half_width = original_width // 2
    half_height = original_height // 2

    # 四个区块的位置
    regions = [
        (0, 0, half_width, half_height),                        # 左上 (0)
        (half_width, 0, original_width, half_height),           # 右上 (1)
        (0, half_height, half_width, original_height),          # 左下 (2)
        (half_width, half_height, original_width, original_height) # 右下 (3)
    ]

    position_names = ["左上", "右上", "左下", "右下"]

    # 分割并保存临时文件，然后识别命名
    temp_files = []
    for i, region in enumerate(regions):
        herb_img = img.crop(region)

        # 先保存为临时文件用于识别
        temp_filename = f"temp_{image_num}_{i}.png"
        temp_path = output_dir / temp_filename
        herb_img.save(temp_path, "PNG", optimize=True)
        temp_files.append((temp_path, herb_img, position_names[i]))

        print(f"  分割[{position_names[i]}]: {herb_img.size[0]}x{herb_img.size[1]}")

    # 识别并重命名
    print(f"  开始AI识别...")
    for temp_path, herb_img, pos_name in temp_files:
        herb_name = identify_herb(temp_path)

        # 最终文件名
        final_filename = f"{image_num}_{herb_name}.png"
        final_path = output_dir / final_filename

        # 如果同名文件已存在，添加位置标记
        if final_path.exists():
            final_filename = f"{image_num}_{herb_name}_{pos_name}.png"
            final_path = output_dir / final_filename

        # 重命名（直接移动临时文件）
        temp_path.rename(final_path)
        print(f"  → 最终保存: {final_filename}")

    img.close()


def main():
    """批量处理所有图片"""

    # 加载环境变量
    env_file = Path(__file__).parent.parent.parent / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    # 移除可能的引号
                    value = value.strip('"').strip("'")
                    if key == "QWEN_VL_KEY":
                        global QWEN_VL_KEY
                        QWEN_VL_KEY = value

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 处理所有PNG图片
    png_files = sorted(INPUT_DIR.glob("*.png"))

    if not png_files:
        print(f"未找到图片文件: {INPUT_DIR}")
        return

    print(f"找到 {len(png_files)} 张图片")
    print(f"输出目录: {OUTPUT_DIR}")
    print(f"多模态模型: {QWEN_VL_MODEL}")
    print("-" * 50)

    for png_file in png_files:
        image_num = png_file.stem
        process_image(png_file, OUTPUT_DIR, image_num)
        print()

    print("-" * 50)

    # 统计结果
    final_files = list(OUTPUT_DIR.glob("*.png"))
    final_files = [f for f in final_files if not f.name.startswith("temp_")]
    print(f"完成! 共处理 {len(png_files)} 张图片，生成 {len(final_files)} 个药材图片")

    # 显示最终文件列表
    print("\n生成的药材图片:")
    for f in sorted(final_files):
        print(f"  {f.name}")


if __name__ == "__main__":
    main()