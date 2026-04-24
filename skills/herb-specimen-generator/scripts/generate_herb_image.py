#!/usr/bin/env python3
"""
中药植物标本图生成脚本
使用 SeedDream 4.5M 模型生成中药材的植物/动物形态图鉴

API文档参考：https://www.volcengine.com/docs/82379/1541523

关键参数说明：
- model: doubao-seedream-4-5-251128 (SeedDream 4.5M模型)
- prompt: 文本描述（建议≤300汉字或600英文单词）
- size: 图片尺寸，支持"2K"/"4K"或具体像素值如"2048x2048"/"4096x4096"
- watermark: 是否添加水印（False=无水印，True=添加"AI生成"水印）
- response_format: 响应格式（"url"=链接24小时有效，"b64_json"=Base64编码）
- sequential_image_generation: 组图生成模式（"disabled"=单图，"auto"=自动组图）
- optimize_prompt_options: 提示词优化配置（仅4.5/4.0模型支持）
  - enabled: 是否启用优化
  - style: 生成风格（photography/artistic等）
  - quality: 生成质量（low/medium/high）

最佳实践：
1. 使用"4K"尺寸标识（4096×4096），便于正方形切分
2. 设置watermark=False去除水印（商业用途）
3. 使用b64_json格式避免URL过期问题
4. 启用提示词优化提高生成质量
"""

import os
import json
import base64
import requests
import time
from pathlib import Path
from typing import List, Tuple
from PIL import Image
from io import BytesIO

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
SEED_IMAGE_URL = os.environ.get("SEED_IMAGE_URL", "")
SEED_IMAGE_KEY = os.environ.get("SEED_IMAGE_KEY", "")
SEED_MODEL_NAME = os.environ.get("SEED_MODEL_NAME", "doubao-seedream-4-5-251128")


def build_prompt(herb_names: List[str]) -> Tuple[str, str]:
    """
    构建生图prompt和布局描述

    Args:
        herb_names: 药材名称列表

    Returns:
        (prompt, layout_description)

    Raises:
        ValueError: 如果药材数量不是1、4、9
    """
    count = len(herb_names)
    names_str = "、".join(herb_names)

    # 只接受1、4、9三种数量（保证正方形切分）
    if count not in [1, 4, 9]:
        raise ValueError(
            f"药材数量必须为1、4或9种。当前{count}种无法生成正方形切分图。"
            f"请调整为4种，或增加到9种药材。"
        )

    # 根据数量确定布局
    layout_map = {
        1: "居中展示",
        4: "2×2四宫格布局",
        9: "3×3九宫格布局"
    }
    layout = layout_map[count]

    # 构建完整prompt
    prompt = (
        f"有一定透明度玻璃质感的背景、"
        f"在一个图片中生成{names_str}这{count}种中药材的植物或动物形态的图鉴，"
        f"要求1比1还原，摄影风格，完美还原植物（动物）细节，"
        f"每个植物（动物）下方写明名称，名称无边框白色黑体字体，"
        f"{layout}"
    )

    return prompt, layout


def generate_image(herb_names: List[str], output_dir: Path, batch_num: int = 1) -> Path:
    """
    生成中药材标本图

    Args:
        herb_names: 材名称列表
        output_dir: 输出目录
        batch_num: 批次编号

    Returns:
        生成的图片路径
    """
    prompt, layout = build_prompt(herb_names)

    print(f"生成配置:")
    print(f"  材数量: {len(herb_names)}")
    print(f"  药材列表: {', '.join(herb_names)}")
    print(f"  布局方式: {layout}")
    print(f"  模型: {SEED_MODEL_NAME}")
    print(f"  尺寸: 4096×4096 (4K)")
    print()

    # 构建API请求
    headers = {
        "Authorization": f"Bearer {SEED_IMAGE_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": SEED_MODEL_NAME,
        "prompt": prompt,
        "size": "4K",  # 使用官方推荐的尺寸标识（4K = 4096x4096）
        "n": 1,
        "response_format": "b64_json",  # Base64编码格式
        "watermark": False,  # 不添加水印（官方参数）
        "sequential_image_generation": "disabled",  # 关闭组图生成（单张图片）
        # 提示词优化参数（可选，doubao-seedream-4.5/4.0支持）
        "optimize_prompt_options": {
            "enabled": True,  # 启用提示词优化
            "style": "photography",  # 摄影风格
            "quality": "high"  # 高质量
        }
    }

    print(f"调用生图API...")
    print(f"  Prompt: {prompt[:100]}...")
    print(f"  参数配置:")
    print(f"    - watermark=False (无水印)")
    print(f"    - size=4K (4096×4096)")
    print(f"    - response_format=b64_json")
    print(f"    - sequential_image_generation=disabled")
    print(f"    - optimize_prompt_options: enabled=True, style=photography, quality=high")

    # 重试机制
    max_retries = 3
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            response = requests.post(
                SEED_IMAGE_URL,
                headers=headers,
                json=payload,
                timeout=120  # 生图可能需要较长时间
            )
            response.raise_for_status()

            result = response.json()

            # 获取图片数据（支持两种响应格式）
            if "data" in result and len(result["data"]) > 0:
                image_data = result["data"][0]

                # 处理Base64格式
                if "b64_json" in image_data:
                    image_b64 = image_data["b64_json"]
                    image_data_decoded = base64.b64decode(image_b64)
                    img = Image.open(BytesIO(image_data_decoded))

                # 处理URL格式（需要下载）
                elif "url" in image_data:
                    image_url = image_data["url"]
                    print(f"  下载图片URL（有效期24小时）: {image_url}")

                    # 下载图片
                    img_response = requests.get(image_url, timeout=30)
                    img_response.raise_for_status()
                    img = Image.open(BytesIO(img_response.content))

                else:
                    raise ValueError(f"API响应格式异常，缺少图片数据: {image_data}")

                if img:
                    # 保存到输出目录
                    output_file = output_dir / f"{batch_num}_raw.png"
                    output_dir.mkdir(parents=True, exist_ok=True)
                    img.save(output_file, "PNG", optimize=True)

                    print(f"✓ 图片生成成功: {output_file.name}")
                    print(f"  尺寸: {img.size[0]}×{img.size[1]}")

                    img.close()
                    return output_file

        except requests.exceptions.Timeout:
            print(f"  超时，尝试 {attempt + 1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise RuntimeError("生图API超时，请稍后重试")

        except requests.exceptions.HTTPError as e:
            print(f"  HTTP错误: {e.response.status_code}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise RuntimeError(f"生图API错误: {e.response.status_code}")

        except Exception as e:
            print(f"  错误: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise RuntimeError(f"生图失败: {e}")

    raise RuntimeError("生图失败")


def suggest_batches(herb_names: List[str]) -> List[List[str]]:
    """
    为不符合要求的药材数量建议分批方案（每批必须是1、4、9）

    Args:
        herb_names: 药材名称列表

    Returns:
        分批后的药材列表（每批为1、4、或9种）

    Example:
        13种 → [9种, 4种]
        18种 → [9种, 9种]
        17种 → [9种, 4种, 4种]（建议用户调整到18）
        6种 → 建议调整为4种或增加到9种
    """
    total = len(herb_names)

    # 如果已经是1、4、9，直接返回单批
    if total in [1, 4, 9]:
        return [herb_names]

    # 计算最佳批次组合
    batches = []

    # 优先使用9的批次（成本效率最高）
    while total >= 9:
        batches.append(herb_names[len(batches)*9 : (len(batches)+1)*9])
        total -= 9

    # 剩余部分处理
    if total > 0:
        if total == 4:
            batches.append(herb_names[len(batches)*9 : len(batches)*9 + 4])
        elif total >= 5:
            # 如果剩余5-8个，建议用户调整
            print(f"⚠ 剩余{total}种药材无法组成正方形批次")
            print(f"  建议调整为{total-4}种（当前批次），或增加{9-total}种（凑成9种批次）")
            # 强制生成一个批次（会导致错误，用户需调整）
            batches.append(herb_names[len(batches)*9 : len(batches)*9 + total])
        elif total <= 3:
            # 如果剩余1-3个，建议用户调整
            print(f"⚠ 剩余{total}种药材无法组成正方形批次")
            print(f"  建议调整到4种或增加到9种")
            batches.append(herb_names[len(batches)*9 : len(batches)*9 + total])

    return batches


def main(herb_names: List[str], output_dir: Path = None):
    """
    主生成流程

    Args:
        herb_names: 药材名称列表
        output_dir: 输出目录（默认 tests/assets/herb_raw/）
    """
    if not output_dir:
        output_dir = Path(__file__).parent.parent.parent.parent / "tests/assets/herb_raw"

    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("中药植物标本图生成器")
    print("=" * 60)
    print()

    # 检查API配置
    if not SEED_IMAGE_KEY:
        raise ValueError("未配置 SEED_IMAGE_KEY，请检查 .env 文件")

    # 处理药材数量校验
    if len(herb_names) not in [1, 4, 9]:
        # 建议分批或调整数量
        batches = suggest_batches(herb_names)

        # 检查批次是否都符合要求
        valid_batches = [b for b in batches if len(b) in [1, 4, 9]]

        if len(valid_batches) == len(batches):
            # 所有批次都有效
            print(f"⚠ 药材数量{len(herb_names)}种，建议分 {len(batches)} 批生成:")
            for i, batch in enumerate(batches, 1):
                print(f"  第{i}批: {len(batch)}种 ({', '.join(batch)})")
            print()
            print("按此方案继续生成...")
        else:
            # 有无效批次，提示用户调整
            raise ValueError(
                f"药材数量{len(herb_names)}种无法组成正方形批次组合。"
                f"请调整为1、4、9种，或组合为9+4、9+9等有效批次。"
            )

        generated_files = []
        for i, batch in enumerate(batches, 1):
            print()
            print(f"--- 第 {i} 批 ({len(batch)}种) ---")
            file_path = generate_image(batch, output_dir, i)
            generated_files.append(file_path)

        print()
        print("=" * 60)
        print(f"✓ 全部完成！共生成 {len(generated_files)} 张原始图片")
        print(f"输出目录: {output_dir}")
        for f in generated_files:
            print(f"  {f.name}")
        print("=" * 60)

        return generated_files

    else:
        # 单批生成
        file_path = generate_image(herb_names, output_dir, 1)

        print()
        print("=" * 60)
        print(f"✓ 生成完成！")
        print(f"输出文件: {file_path}")
        print("=" * 60)

        return [file_path]


if __name__ == "__main__":
    # 测试用例：生成4种中药
    test_herbs = ["葱白", "薄荷叶", "牛蒡子", "蝉蜕"]
    main(test_herbs)