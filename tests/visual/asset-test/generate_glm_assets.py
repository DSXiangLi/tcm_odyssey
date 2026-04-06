#!/usr/bin/env python3
"""
使用GLM-4V API生成像素瓦片素材
"""
import json
import os
import requests
import base64
import time
from pathlib import Path

# 配置
BASE_DIR = Path(__file__).parent
PROMPTS_FILE = BASE_DIR / "prompts.json"
OUTPUT_DIR = BASE_DIR / "ai-generated"

# GLM API配置
GLM_API_URL = "https://open.bigmodel.cn/api/paas/v4/images/generations"
GLM_API_KEY = os.getenv("GLM_API_KEY", os.getenv("ZHIPUAI_API_KEY", ""))

def load_prompts():
    """加载Prompt配置"""
    with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_with_glm(prompt: str, asset_type: str) -> str:
    """使用GLM API生成图片"""
    if not GLM_API_KEY:
        print(f"⚠️ 未设置GLM_API_KEY，跳过 {asset_type}")
        return None

    headers = {
        "Authorization": f"Bearer {GLM_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "cogview-3",
        "prompt": prompt,
        "size": "1024x1024"
    }

    try:
        print(f"🎨 正在使用GLM生成 {asset_type}...")
        response = requests.post(GLM_API_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()

        if "data" in result and len(result["data"]) > 0:
            image_url = result["data"][0].get("url")
            if image_url:
                print(f"✅ {asset_type} 生成成功")
                return image_url
            # 可能是base64
            b64 = result["data"][0].get("b64_json")
            if b64:
                return f"data:image/png;base64,{b64}"

        print(f"❌ {asset_type} 响应格式异常: {result}")
        return None
    except Exception as e:
        print(f"❌ {asset_type} 生成失败: {e}")
        return None

def download_image(url: str, save_path: Path):
    """下载图片"""
    try:
        if url.startswith("data:image"):
            # Base64图片
            b64_data = url.split(",", 1)[1]
            img_data = base64.b64decode(b64_data)
            with open(save_path, 'wb') as f:
                f.write(img_data)
        else:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            with open(save_path, 'wb') as f:
                f.write(response.content)
        print(f"📥 已保存: {save_path}")
    except Exception as e:
        print(f"❌ 下载失败: {e}")

def main():
    print("=" * 50)
    print("🎨 AI素材生成工具 - GLM CogView")
    print("=" * 50)

    if not GLM_API_KEY:
        print("\n⚠️ 未检测到API密钥")
        print("请设置环境变量:")
        print("  export GLM_API_KEY=your_key")
        print("或")
        print("  export ZHIPUAI_API_KEY=your_key")
        print("\n获取密钥: https://open.bigmodel.cn/")
        print("\n当前使用演示占位图")
        return

    prompts = load_prompts()

    for asset_type in prompts.keys():
        (OUTPUT_DIR / asset_type).mkdir(parents=True, exist_ok=True)

    results = {}
    for asset_type, config in prompts.items():
        image_url = generate_with_glm(config["prompt"], asset_type)
        if image_url:
            save_path = OUTPUT_DIR / asset_type / f"{asset_type}_ai_glm.png"
            download_image(image_url, save_path)
            results[asset_type] = str(save_path)
            time.sleep(3)

    results_file = BASE_DIR / "glm_generation_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 50)
    print(f"✅ 完成！结果: {results_file}")

if __name__ == "__main__":
    main()