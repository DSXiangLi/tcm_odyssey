#!/usr/bin/env python3
"""
AI场景素材生成脚本 - 使用火山引擎Seedream API生成场景组合素材
"""
import json
import os
import requests
import time
from pathlib import Path
from dotenv import load_dotenv

# 加载.env环境变量
load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")

# 配置
BASE_DIR = Path(__file__).parent
PROMPTS_FILE = BASE_DIR / "prompts.json"
OUTPUT_DIR = BASE_DIR / "ai-generated"

# API配置 - 从.env读取
API_URL = os.getenv("SEED_IMAGE_URL", "https://ark.cn-beijing.volces.com/api/v3/images/generations")
API_KEY = os.getenv("SEED_IMAGE_KEY", "")
MODEL_NAME = os.getenv("SEED_MODEL_NAME", "doubao-seedream-4-5-251128")

def load_prompts():
    """加载Prompt配置"""
    with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_image(scene_type: str, config: dict) -> str:
    """调用火山引擎Seedream API生成图片"""
    if not API_KEY:
        print(f"❌ 未设置SEED_IMAGE_KEY，无法生成 {scene_type}")
        return None

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "prompt": config["prompt"],
        "size": config["size"]
    }

    try:
        print(f"🎨 正在生成 {config['name']} ({config['tile_size']}={config['pixel_size']}像素)...")
        print(f"   Prompt: {config['prompt'][:80]}...")

        response = requests.post(API_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()

        if "data" in result and len(result["data"]) > 0:
            image_url = result["data"][0].get("url")
            if image_url:
                print(f"✅ {config['name']} 生成成功")
                return image_url

            # 可能是base64
            b64 = result["data"][0].get("b64_json")
            if b64:
                return f"data:image/png;base64,{b64}"

        print(f"❌ {config['name']} 响应格式异常: {result}")
        return None

    except requests.exceptions.HTTPError as e:
        print(f"❌ {config['name']} HTTP错误: {e}")
        if hasattr(e.response, 'text'):
            print(f"   响应内容: {e.response.text[:500]}")
        return None
    except Exception as e:
        print(f"❌ {config['name']} 生成失败: {e}")
        return None

def download_image(url: str, save_path: Path):
    """下载图片"""
    import base64
    try:
        if url.startswith("data:image"):
            # Base64图片
            b64_data = url.split(",", 1)[1]
            img_data = base64.b64decode(b64_data)
            with open(save_path, 'wb') as f:
                f.write(img_data)
        else:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            with open(save_path, 'wb') as f:
                f.write(response.content)
        print(f"📥 已保存: {save_path.name}")
    except Exception as e:
        print(f"❌ 下载失败: {e}")

def main():
    """主函数"""
    print("=" * 60)
    print("🎨 AI场景素材生成工具 - 火山引擎Seedream API")
    print("=" * 60)

    print(f"\n📋 配置信息:")
    print(f"   API URL: {API_URL}")
    print(f"   Model: {MODEL_NAME}")
    print(f"   API Key: {API_KEY[:10]}...{API_KEY[-4:] if len(API_KEY) > 14 else '***'}")

    if not API_KEY:
        print("\n❌ 错误: 未检测到SEED_IMAGE_KEY")
        print("请在.env文件中配置: SEED_IMAGE_KEY=your_key")
        return

    # 加载配置
    prompts = load_prompts()
    print(f"\n📁 待生成场景: {list(prompts.keys())}")

    # 确保输出目录存在
    for scene_type in prompts.keys():
        (OUTPUT_DIR / scene_type).mkdir(parents=True, exist_ok=True)

    # 生成每个场景
    results = {}
    for scene_type, config in prompts.items():
        image_url = generate_image(scene_type, config)
        if image_url:
            save_path = OUTPUT_DIR / scene_type / f"{scene_type}_ai.png"
            download_image(image_url, save_path)
            results[scene_type] = {
                "name": config["name"],
                "tile_size": config["tile_size"],
                "pixel_size": config["pixel_size"],
                "local_path": str(save_path)
            }
            time.sleep(3)  # 避免请求过快

    # 保存结果
    results_file = BASE_DIR / "generation_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print(f"✅ 完成！生成 {len(results)} 个场景")
    print(f"📄 结果已保存到 {results_file}")
    print("=" * 60)

if __name__ == "__main__":
    main()