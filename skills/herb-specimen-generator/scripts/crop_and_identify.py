#!/usr/bin/env python3
"""
中药图片切分和AI识别命名脚本
根据布局切分复合图片，使用Qwen VL多模态模型识别并命名
只支持1、4、9三种布局（保证正方形切分）
"""

import os
import base64
import requests
from pathlib import Path
from typing import List
from PIL import Image

# 从 .env 加载配置
def load_env_config():
    """加载环境变量配置"""
    env_path = Path(__file__).parent.parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    value = value.strip('"').strip("'")
                    os.environ.setdefault(key, value)

load_env_config()

# API 配置
QWEN_VL_URL = os.environ.get("QWEN_VL_URL", "")
QWEN_VL_KEY = os.environ.get("QWEN_VL_KEY", "")
QWEN_VL_MODEL_NAME = os.environ.get("QWEN_VL_MODEL_NAME", "qwen-vl-max")


def identify_herb(image_path: Path) -> str:
    """
    使用Qwen VL多模态模型识别药材

    Args:
        image_path: 图片路径

    Returns:
        识别出的药材名称

    Note:
        Qwen VL API对图片大小有限制，建议压缩到≤1024×1024或512×512
    """
    # 读取图片并压缩（避免API限制）
    img = Image.open(image_path)
    original_size = img.size

    # 如果图片太大，压缩到合适尺寸
    max_size = 1024  # 最大边长
    if original_size[0] > max_size or original_size[1] > max_size:
        # 计算压缩比例
        ratio = max_size / max(original_size[0], original_size[1])
        new_size = (int(original_size[0] * ratio), int(original_size[1] * ratio))
        img_resized = img.resize(new_size, Image.Resampling.LANCZOS)

        print(f"    图片压缩: {original_size[0]}×{original_size[1]} → {new_size[0]}×{new_size[1]}")

        # 保存为临时压缩文件
        temp_compressed = image_path.parent / f"compressed_{image_path.name}"
        img_resized.save(temp_compressed, "PNG", optimize=True)
        img_resized.close()

        # 使用压缩后的图片
        with open(temp_compressed, "rb") as f:
            image_data = f.read()

        # 清理临时文件
        temp_compressed.unlink()
    else:
        # 图片尺寸合适，直接使用
        with open(image_path, "rb") as f:
            image_data = f.read()

    img.close()

    # 转为base64
    image_base64 = base64.b64encode(image_data).decode("utf-8")

    # 构建请求
    headers = {
        "Authorization": f"Bearer {QWEN_VL_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": QWEN_VL_MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "这是什么中药材？请只回答药材的中文名称，不要有任何其他解释。"
                            "如果看起来像中药材，给出最可能的名称；如果不确定，回答'未知药材'。"
                            "回答格式：只用2-4个汉字的药材名称，如'人参'、'黄芪'、'当归'等。"
                        )
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
        herb_name = herb_name.split("\n")[0].strip()

        # 如果回答太长，尝试提取药材名
        if len(herb_name) > 10:
            common_herbs = [
                "人参", "黄芪", "白术", "茯苓", "当归", "川芎",
                "白芍", "熟地", "陈皮", "半夏", "甘草", "金银花",
                "连翘", "薄荷", "牛蒡子", "大黄", "芒硝", "番泻叶",
                "火麻仁", "丹参", "红花", "桃仁", "益母草", "山药",
                "枸杞", "麦冬", "五味子", "山茱萸", "杜仲", "续断",
                "葱白", "蝉蜕", "麻黄", "桂枝", "紫苏叶", "生姜",
                "荆芥", "防风", "白芷", "细辛", "苍耳子", "辛夷",
                "桑叶", "菊花", "蔓荆子", "柴胡", "升麻", "葛根",
                "淡豆豉", "姜黄", "香薷"
            ]
            for herb in common_herbs:
                if herb in herb_name:
                    herb_name = herb
                    break

        print(f"    AI识别: {herb_name}")
        return herb_name

    except Exception as e:
        print(f"    识别失败: {e}")
        return f"herb_{image_path.stem}"


def crop_single(img: Image.Image, output_dir: Path, batch_num: int) -> List[Path]:
    """
    单药材：不切分，直接识别

    Args:
        img: 图片对象
        output_dir: 输出目录
        batch_num: 批次编号

    Returns:
        输出文件路径列表
    """
    temp_path = output_dir / f"temp_{batch_num}_0.png"
    img.save(temp_path, "PNG", optimize=True)

    print("  单药材，无需切分")

    # 识别并命名（直接覆盖同名文件）
    herb_name = identify_herb(temp_path)
    final_path = output_dir / f"{herb_name}.png"

    # 直接覆盖（不添加位置后缀）
    if final_path.exists():
        print(f"  ⚠ 覆盖现有文件: {herb_name}.png")
        final_path.unlink()  # 删除旧文件

    temp_path.rename(final_path)

    return [final_path]


def crop_2x2(img: Image.Image, output_dir: Path, batch_num: int) -> List[Path]:
    """
    4药材：标准四宫格切分

    Args:
        img: 图片对象
        output_dir: 输出目录
        batch_num: 批次编号

    Returns:
        输出文件路径列表
    """
    width, height = img.size
    half_width = width // 2
    half_height = height // 2

    regions = [
        (0, 0, half_width, half_height),                        # 左上 (0)
        (half_width, 0, width, half_height),                   # 右上 (1)
        (0, half_height, half_width, height),                  # 左下 (2)
        (half_width, half_height, width, height),              # 右下 (3)
    ]

    position_names = ["左上", "右上", "左下", "右下"]
    output_files = []

    print(f"  2×2四宫格切分")

    for i, region in enumerate(regions):
        herb_img = img.crop(region)
        temp_path = output_dir / f"temp_{batch_num}_{i}.png"
        herb_img.save(temp_path, "PNG", optimize=True)

        print(f"    [{position_names[i]}]: {herb_img.size[0]}×{herb_img.size[1]}")

        # 识别并命名（直接覆盖同名文件）
        herb_name = identify_herb(temp_path)
        final_path = output_dir / f"{herb_name}.png"

        # 直接覆盖（不添加位置后缀）
        if final_path.exists():
            print(f"    ⚠ 覆盖现有文件: {herb_name}.png")
            final_path.unlink()  # 删除旧文件

        temp_path.rename(final_path)
        output_files.append(final_path)

    return output_files


def crop_3x3(img: Image.Image, output_dir: Path, batch_num: int) -> List[Path]:
    """
    9药材：3×3九宫格切分

    Args:
        img: 图片对象
        output_dir: 输出目录
        batch_num: 批次编号

    Returns:
        输出文件路径列表
    """
    width, height = img.size
    third_width = width // 3
    third_height = height // 3

    regions = [
        # 第一行 (左上、中上、右上)
        (0, 0, third_width, third_height),
        (third_width, 0, 2*third_width, third_height),
        (2*third_width, 0, width, third_height),
        # 第二行 (左中、中中、右中)
        (0, third_height, third_width, 2*third_height),
        (third_width, third_height, 2*third_width, 2*third_height),
        (2*third_width, third_height, width, 2*third_height),
        # 第三行 (左下、中下、右下)
        (0, 2*third_height, third_width, height),
        (third_width, 2*third_height, 2*third_width, height),
        (2*third_width, 2*third_height, width, height),
    ]

    position_names = [
        "左上", "中上", "右上",
        "左中", "中中", "右中",
        "左下", "中下", "右下"
    ]

    output_files = []

    print(f"  3×3九宫格切分")

    for i, region in enumerate(regions):
        herb_img = img.crop(region)
        temp_path = output_dir / f"temp_{batch_num}_{i}.png"
        herb_img.save(temp_path, "PNG", optimize=True)

        print(f"    [{position_names[i]}]: {herb_img.size[0]}×{herb_img.size[1]}")

        # 识别并命名（直接覆盖同名文件）
        herb_name = identify_herb(temp_path)
        final_path = output_dir / f"{herb_name}.png"

        # 直接覆盖（不添加位置后缀）
        if final_path.exists():
            print(f"    ⚠ 覆盖现有文件: {herb_name}.png")
            final_path.unlink()  # 删除旧文件

        temp_path.rename(final_path)
        output_files.append(final_path)

    return output_files


def process_image(input_path: Path, output_dir: Path, herb_count: int = 4) -> List[Path]:
    """
    处理单张图片：根据布局切分+识别命名

    Args:
        input_path: 输入图片路径
        output_dir: 输出目录
        herb_count: 药材数量（必须是1、4、9）

    Returns:
        输出文件列表

    Raises:
        ValueError: 如果herb_count不是1、4、9
    """
    img = Image.open(input_path)
    width, height = img.size

    # 从文件名提取批次编号
    batch_num = input_path.stem.split("_")[0]

    print(f"处理: {input_path.name} ({width}×{height})")
    print(f"  药材数量: {herb_count}")

    # 校验药材数量
    if herb_count not in [1, 4, 9]:
        raise ValueError(
            f"药材数量必须是1、4或9。当前{herb_count}无法进行正方形切分。"
        )

    # 根据药材数量选择切分方式
    if herb_count == 1:
        output_files = crop_single(img, output_dir, batch_num)
    elif herb_count == 4:
        output_files = crop_2x2(img, output_dir, batch_num)
    elif herb_count == 9:
        output_files = crop_3x3(img, output_dir, batch_num)

    img.close()
    return output_files


def main(input_dir: Path = None, output_dir: Path = None, herb_counts: List[int] = None):
    """
    批量处理图片

    Args:
        input_dir: 输入目录（默认 tests/assets/herb_raw/）
        output_dir: 输出目录（默认 tests/assets/herb_processed/）
        herb_counts: 每张图片对应的药材数量列表（必须为1、4、9）
    """
    if not input_dir:
        input_dir = Path(__file__).parent.parent.parent.parent / "tests/assets/herb_raw"

    if not output_dir:
        output_dir = Path(__file__).parent.parent.parent.parent / "tests/assets/herb_processed"

    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("中药图片切分和识别命名")
    print("=" * 60)
    print()

    # 检查API配置
    if not QWEN_VL_KEY:
        raise ValueError("未配置 QWEN_VL_KEY，请检查 .env 文件")

    # 查找所有原始图片（支持两种命名格式）
    raw_files = sorted(input_dir.glob("*_raw.png"))

    # 如果没有找到_raw格式，尝试查找数字命名的文件
    if not raw_files:
        raw_files = sorted(input_dir.glob("[0-9].png"))

    if not raw_files:
        print(f"⚠ 未找到原始图片: {input_dir}")
        print(f"  请先使用 generate_herb_image.py 生成图片")
        return

    print(f"找到 {len(raw_files)} 张原始图片")
    print(f"输入目录: {input_dir}")
    print(f"输出目录: {output_dir}")
    print(f"识别模型: {QWEN_VL_MODEL_NAME}")
    print("-" * 60)

    all_output_files = []

    for i, raw_file in enumerate(raw_files):
        # 获取对应的药材数量
        if herb_counts and i < len(herb_counts):
            count = herb_counts[i]
        else:
            count = 4  # 默认四宫格

        print()
        output_files = process_image(raw_file, output_dir, count)
        all_output_files.extend(output_files)

    print()
    print("-" * 60)
    print(f"✓ 完成！共处理 {len(raw_files)} 张原始图片")
    print(f"生成 {len(all_output_files)} 个药材图片")
    print()
    print("输出的药材图片:")
    for f in sorted(all_output_files):
        print(f"  {f.name}")

    print("=" * 60)


if __name__ == "__main__":
    # 测试：处理默认目录中的图片
    main()