#!/usr/bin/env python3
"""
Phase 1.5 融合画面验收工具
验收完整融合后的全景图，而非分离素材
"""

import os
import base64
import json
import requests
from pathlib import Path
from datetime import datetime

# 从.env读取配置
ENV_PATH = Path(__file__).parent.parent.parent.parent / ".env"

def load_env():
    """加载.env配置"""
    env_vars = {}
    with open(ENV_PATH, 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                value = value.strip('"').strip("'")
                env_vars[key] = value
    return env_vars

def encode_image_to_base64(image_path: str) -> str:
    """将图片编码为base64"""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def analyze_with_qwen_vl(image_path: str, prompt: str) -> dict:
    """使用QWEN VL API分析图片"""
    env = load_env()

    url = env.get("QWEN_VL_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    api_key = env.get("QWEN_VL_KEY", "")
    model = env.get("QWEN_VL_MODEL_NAME", "qwen-vl-max")

    # 读取图片并编码
    image_base64 = encode_image_to_base64(image_path)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ],
        "max_tokens": 1500
    }

    response = requests.post(
        f"{url}/chat/completions",
        headers=headers,
        json=payload,
        timeout=90
    )

    if response.status_code != 200:
        raise Exception(f"API请求失败: {response.status_code} - {response.text}")

    result = response.json()
    return result

def analyze_fused_panorama(scene_name: str, image_path: str, prompt: str) -> dict:
    """分析融合后的全景图"""
    print(f"\n{'='*60}")
    print(f"🖼️ 分析 {scene_name} 融合全景")
    print(f"{'='*60}")
    print(f"   文件: {image_path}")

    if not Path(image_path).exists():
        print(f"   ❌ 文件不存在")
        return None

    try:
        result = analyze_with_qwen_vl(image_path, prompt)
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        print(f"\n   分析结果:\n{content}")
        return {"scene": scene_name, "analysis": content}
    except Exception as e:
        print(f"   ❌ 分析失败: {e}")
        return None

def main():
    """执行融合画面验收"""
    print("="*60)
    print("🎯 Phase 1.5 融合画面验收分析")
    print("="*60)
    print("\n验收目标: 分析完整融合后的全景画面效果")
    print("验收重点: 建筑/元素与背景的融合程度，而非单独素材质量")

    results = []

    # 1. 室外完整融合全景
    town_panorama_path = Path(__file__).parent / "ai-generated" / "town_outdoor" / "complete_panorama" / "town_complete_panorama.png"

    town_prompt = """
这是一张完整的像素风格游戏场景全景图（已融合所有元素）。
请从以下维度评分（1-5分），重点评估融合效果：

## 融合效果评估维度

1. **元素融合度（最重要）**：
   - 建筑与背景草地是否自然融合？边界是否突兀？
   - 花田、池塘、竹林、古井、大树等元素与背景过渡是否流畅？
   - 是否有"贴上去"的感觉，还是整体浑然一体？

2. **布局合理性**：
   - 建筑位置是否合理？是否有足够活动空间？
   - 路径设计是否清晰，能否引导玩家探索？
   - 元素分布是否平衡，有无过于拥挤或空旷区域？

3. **氛围一致性**：
   - 整体色彩基调是否统一和谐？
   - 各元素风格是否一致（像素大小、光影风格）？
   - 是否传达出"温馨治愈田园+中医文化"的综合氛围？

4. **碰撞可辨识性**：
   - 建筑边界是否清晰，玩家能否识别哪里可以通行？
   - 路径与草地区分是否明显？
   - 门的位置是否易于识别？

5. **整体视觉流畅度**：
   - 视线移动是否流畅自然？
   - 有无视觉干扰或突兀元素？
   - 作为游戏主场景是否令人愉悦？

请给出每个维度的分数和详细评语，特别关注融合效果问题。
"""

    result = analyze_fused_panorama("百草镇室外全景", str(town_panorama_path), town_prompt)
    if result:
        results.append(result)

    # 2. 诊所室内融合全景
    clinic_path = Path(__file__).parent / "ai-generated" / "indoor_scenes_complete" / "clinic_interior_complete.png"

    clinic_prompt = """
这是一张完整的像素风格中医诊所室内全景图（已融合所有元素）。
请从以下维度评分（1-5分），重点评估融合效果：

## 融合效果评估维度

1. **元素融合度（最重要）**：
   - 诊台、药柜、经络图等元素与地板/墙壁是否自然融合？
   - 元素边界是否突兀？是否有"贴上去"的感觉？
   - 光影是否统一，元素之间过渡是否流畅？

2. **中医氛围呈现**：
   - 是否能清晰识别为中医诊所？
   - 中医元素（药柜、经络图、祖师画像等）是否恰当？
   - 整体氛围是否"专业+温馨+传承"？

3. **布局功能性**：
   - 空间布局是否合理？玩家能否自由移动？
   - 功能区域划分是否清晰？
   - 门的位置是否明显？

4. **像素风格一致性**：
   - 所有元素像素大小是否一致？
   - 色彩风格是否统一？

5. **整体视觉效果**：
   - 作为室内场景是否温馨舒适？
   - 视觉上是否令人愉悦？

请给出每个维度的分数和详细评语。
"""

    result = analyze_fused_panorama("青木诊所室内全景", str(clinic_path), clinic_prompt)
    if result:
        results.append(result)

    # 3. 药园室内融合全景
    garden_path = Path(__file__).parent / "ai-generated" / "indoor_scenes_complete" / "garden_interior_complete.png"

    garden_prompt = """
这是一张完整的像素风格药园室内全景图（已融合所有元素）。
请从以下维度评分（1-5分），重点评估融合效果：

## 融合效果评估维度

1. **元素融合度（最重要）**：
   - 药田、凉亭、工具架等元素与地面是否自然融合？
   - 水渠与药田边界是否流畅？
   - 元素之间过渡是否自然，无突兀感？

2. **药园氛围呈现**：
   - 是否能清晰识别为中药材种植园？
   - 药田布局是否规整又有自然野趣？
   - 整体是否体现"老张风格"（规整+野趣）？

3. **布局功能性**：
   - 药田位置是否合理，玩家能否操作？
   - 凉亭休憩区是否明显？
   - 门的位置是否清晰？

4. **像素风格一致性**：
   - 所有元素像素大小是否一致？
   - 色彩风格是否统一？

5. **整体视觉效果**：
   - 作为药园场景是否自然治愈？
   - 视觉上是否令人愉悦？

请给出每个维度的分数和详细评语。
"""

    result = analyze_fused_panorama("老张药园室内全景", str(garden_path), garden_prompt)
    if result:
        results.append(result)

    # 4. 家室内融合全景
    home_path = Path(__file__).parent / "ai-generated" / "indoor_scenes_complete" / "home_interior_complete.png"

    home_prompt = """
这是一张完整的像素风格玩家之家室内全景图（已融合所有元素）。
请从以下维度评分（1-5分），重点评估融合效果：

## 融合效果评估维度

1. **元素融合度（最重要）**：
   - 厨房、书房、卧室家具与地板/墙壁是否自然融合？
   - 家具边界是否突兀？是否有"贴上去"的感觉？
   - 整体光影是否统一？

2. **温馨氛围呈现**：
   - 是否能清晰识别为温馨的家？
   - 功能区域（厨房/书房/卧室）划分是否清晰？
   - 整体是否温馨舒适？

3. **布局功能性**：
   - 空间布局是否合理？玩家能否自由移动？
   - 各功能区是否易于识别？
   - 门的位置是否明显？

4. **像素风格一致性**：
   - 所有元素像素大小是否一致？
   - 色彩风格是否统一？

5. **整体视觉效果**：
   - 作为玩家之家是否温馨治愈？
   - 视觉上是否令人愉悦？

请给出每个维度的分数和详细评语。
"""

    result = analyze_fused_panorama("玩家之家室内全景", str(home_path), home_prompt)
    if result:
        results.append(result)

    # 生成报告
    print("\n" + "="*60)
    print("📊 生成融合验收报告")
    print("="*60)

    report_path = Path(__file__).parent / "ai-generated" / f"fused_panorama_acceptance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"

    report_content = f"""# Phase 1.5 融合画面验收报告

**执行时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**验收方式**: QWEN VL AI视觉分析
**验收重点**: 建筑/元素与背景的融合程度

---

## 验收目标

本次验收针对**完整融合后的全景画面**，而非分离的单独素材。
核心评估指标：元素融合度（建筑/元素是否自然融入背景，无"贴上去"的突兀感）

---

## 验收结果汇总

"""

    for result in results:
        if result:
            report_content += f"### {result['scene']}\n\n"
            report_content += f"```\n{result['analysis']}\n```\n\n"

    report_content += """
---

## 总体融合评价

*待根据分析结果填写*

---

## 融合效果判定标准

| 分数 | 融合效果描述 |
|-----|-------------|
| 5分 | 完美融合，浑然一体，无任何突兀感 |
| 4分 | 融合良好，边界过渡自然，仅有轻微可改进处 |
| 3分 | 基本融合，有轻微"贴上去"感但不影响整体 |
| 2分 | 融合较差，边界明显，元素与背景风格不统一 |
| 1分 | 融合失败，元素明显"漂浮"在背景上 |

---

*本报告由融合画面验收工具自动生成*
"""

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)

    print(f"\n📄 报告已保存: {report_path}")
    print("\n✅ 融合画面验收完成！")
    print(f"   共分析 {len(results)} 个融合全景场景")

    return 0

if __name__ == "__main__":
    exit(main())