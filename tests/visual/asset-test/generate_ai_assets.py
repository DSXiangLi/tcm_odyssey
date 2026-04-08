#!/usr/bin/env python3
"""
使用火山引擎Seedream API生成药灵山谷游戏素材

需求分析：
- 室外建筑外观：整体交互，AI生成整体图片作为背景层
- 室内场景：元素级交互，需要切割成32x32瓦片

生成素材：
1. clinic_building_exterior.png - 诊所外观（室外整体）
2. clinic_interior.png - 诊所室内场景（需切割瓦片）
3. herb_field_area.png - 药田区域（需切割瓦片）
"""

import os
import requests
import json
import base64
from pathlib import Path

# 从.env读取配置
ENV_PATH = Path(__file__).parent.parent.parent.parent / ".env"

def load_env():
    """加载.env配置"""
    env_vars = {}
    with open(ENV_PATH, 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                # 去除引号
                value = value.strip('"').strip("'")
                env_vars[key] = value
    return env_vars

def generate_image(prompt: str, size: str = "2048x2048", output_path: str = None) -> bytes:
    """
    使用Seedream API生成图片

    Args:
        prompt: 图片描述prompt
        size: 图片尺寸，最小3686400像素（如2048x2048）
        output_path: 输出文件路径

    Returns:
        图片二进制数据
    """
    env = load_env()

    url = env.get("SEED_IMAGE_URL", "https://ark.cn-beijing.volces.com/api/v3/images/generations")
    api_key = env.get("SEED_IMAGE_KEY", "")
    model = env.get("SEED_MODEL_NAME", "doubao-seedream-4-5-251128")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "prompt": prompt,
        "size": "2k",  # 使用2k表示2048x2048
        "response_format": "b64_json"  # 返回base64编码
    }

    print(f"正在生成图片...")
    print(f"  Prompt: {prompt[:100]}...")
    print(f"  尺寸: 2048x2048 (2k)")

    response = requests.post(url, headers=headers, json=payload, timeout=120)

    if response.status_code != 200:
        raise Exception(f"API请求失败: {response.status_code} - {response.text}")

    result = response.json()

    if "data" not in result or len(result["data"]) == 0:
        raise Exception(f"API返回异常: {result}")

    # 获取base64图片数据
    image_b64 = result["data"][0].get("b64_json")
    if not image_b64:
        # 可能返回URL格式
        image_url = result["data"][0].get("url")
        if image_url:
            img_response = requests.get(image_url, timeout=60)
            image_data = img_response.content
        else:
            raise Exception(f"无法获取图片数据: {result['data'][0]}")
    else:
        image_data = base64.b64decode(image_b64)

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(image_data)
        print(f"  已保存: {output_path} ({len(image_data)} bytes)")

    return image_data


def main():
    """生成所有素材"""
    base_dir = Path(__file__).parent / "ai-generated"

    # 素材定义
    assets = [
        # 室外建筑外观（整体交互）
        {
            "name": "诊所外观",
            "prompt": (
                "像素艺术游戏素材，中医诊所建筑外观，俯视图视角，"
                "古朴棕色木质建筑，传统中式屋顶，门窗有中医元素装饰，"
                "建筑旁边有草药晾晒架，周围是绿色草地，"
                "温馨治愈风格，参考星露谷物语建筑风格但更精致，"
                "32x32像素瓦片风格放大版，2048x2048整体场景图，"
                "建筑位于画面中央，周围留有草地空间"
            ),
            "output": base_dir / "clinic_building" / "clinic_building_exterior.png"
        },
        # 室内场景（需切割瓦片）
        {
            "name": "诊所室内",
            "prompt": (
                "像素艺术游戏素材，中医诊所室内俯视图，"
                "米色地板，棕色墙壁，室内摆放：深色木质诊台、多抽屉药柜、"
                "墙上挂经络穴位图、熬药炉具、窗户透进阳光，"
                "温馨光线，中医专业氛围，祖师爷画像有金色光晕，"
                "32x32像素瓦片风格放大版，2048x2048整体场景图，"
                "元素有明确边界便于切割成瓦片，各元素间有间距"
            ),
            "output": base_dir / "indoor_scenes" / "clinic_interior.png"
        },
        # 药田区域（需切割瓦片）
        {
            "name": "药田区域",
            "prompt": (
                "像素艺术游戏素材，药田种植区域俯视图，"
                "4块规整药田，每块有不同的药材植物形态（人参、黄芪、当归、甘草），"
                "每块药田有品种标识牌，药田之间有小路径分隔，"
                "周围有蜜蜂飞舞、蝴蝶点缀，自然蓝小溪流过，"
                "有老张的工具墙和简易休息棚，"
                "田园生机感，规整但有自然野趣点缀，"
                "32x32像素瓦片风格放大版，2048x2048整体场景图，"
                "元素有明确边界便于切割成瓦片"
            ),
            "output": base_dir / "herb_field_area" / "herb_field_area.png"
        }
    ]

    print("=" * 60)
    print("开始使用Seedream API生成游戏素材")
    print("=" * 60)

    for asset in assets:
        print(f"\n[{asset['name']}]")
        try:
            generate_image(
                prompt=asset["prompt"],
                size="2048x2048",
                output_path=str(asset["output"])
            )
        except Exception as e:
            print(f"  生成失败: {e}")
            continue

    print("\n" + "=" * 60)
    print("素材生成完成！")
    print("=" * 60)

    # 列出生成的文件
    print("\n生成的素材文件：")
    for path in base_dir.rglob("*.png"):
        size_kb = path.stat().st_size / 1024
        print(f"  {path.relative_to(base_dir)}: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()