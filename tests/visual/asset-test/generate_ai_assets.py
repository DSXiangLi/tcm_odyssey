#!/usr/bin/env python3
"""
AI素材生成脚本 - 使用火山引擎Seedream API生成像素瓦片
"""
import json
import os
import requests
import time
from pathlib import Path

# 配置
BASE_DIR = Path(__file__).parent
PROMPTS_FILE = BASE_DIR / "prompts.json"
OUTPUT_DIR = BASE_DIR / "ai-generated"

# API配置 - 使用一步API（价格优惠）
API_URL = "https://yibuapi.com/v1/images/generations"
API_KEY = os.getenv("YIBU_API_KEY", "")  # 从环境变量获取

def load_prompts():
    """加载Prompt配置"""
    with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_image(asset_type: str, prompt_config: dict) -> str:
    """调用API生成图片"""
    if not API_KEY:
        print(f"⚠️ 未设置API_KEY，跳过 {asset_type} 生成")
        print("请设置环境变量: export YIBU_API_KEY=your_key")
        return None

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "doubao-seedream-5-0-lite",
        "prompt": prompt_config["prompt"],
        "size": prompt_config["size"],
        "seed": prompt_config["seed"]
    }

    if prompt_config.get("negative_prompt"):
        payload["negative_prompt"] = prompt_config["negative_prompt"]

    try:
        print(f"🎨 正在生成 {asset_type}...")
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()

        image_url = result["data"][0]["url"]
        print(f"✅ {asset_type} 生成成功: {image_url}")
        return image_url
    except Exception as e:
        print(f"❌ {asset_type} 生成失败: {e}")
        return None

def download_image(url: str, save_path: Path):
    """下载图片"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(response.content)
        print(f"📥 已下载: {save_path}")
    except Exception as e:
        print(f"❌ 下载失败: {e}")

def main():
    """主函数"""
    print("=" * 50)
    print("🎨 AI素材生成工具 - Seedream API")
    print("=" * 50)

    # 加载配置
    prompts = load_prompts()

    # 确保输出目录存在
    for asset_type in prompts.keys():
        (OUTPUT_DIR / asset_type).mkdir(parents=True, exist_ok=True)

    # 生成每种素材
    results = {}
    for asset_type, config in prompts.items():
        image_url = generate_image(asset_type, config)
        if image_url:
            # 下载图片
            save_path = OUTPUT_DIR / asset_type / f"{asset_type}_ai_1024.png"
            download_image(image_url, save_path)
            results[asset_type] = {
                "url": image_url,
                "local_path": str(save_path)
            }
            time.sleep(2)  # 避免请求过快

    # 保存结果
    results_file = BASE_DIR / "generation_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 50)
    print(f"✅ 完成！结果已保存到 {results_file}")
    print("=" * 50)

if __name__ == "__main__":
    main()