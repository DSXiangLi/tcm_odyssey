#!/usr/bin/env python3
"""
真正的多模态AI视觉验证脚本
使用Qwen VL API验证NPC sprite图片

验证内容：
1. 人物完整性 - 图片中是否只有完整人物，无多余背景/其他画面
2. 方向正确性 - 四行是否代表下、左、右、上方向
3. 动画连贯性 - 每行4帧是否形成连贯的行走动画
"""

import os
import json
import base64
import requests
from pathlib import Path
from datetime import datetime
from PIL import Image
import io

# ==================== API配置 ====================

QWEN_VL_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_VL_KEY = "sk-2e4a2ff5b93148cf940fbd74b499aee9"
QWEN_VL_MODEL = "qwen-vl-max"

SCRIPT_DIR = Path(__file__).parent
NPC_DIR = SCRIPT_DIR / "ai-generated" / "npc"
REPORT_DIR = SCRIPT_DIR / "ai-generated" / "validation_reports"

# ==================== 图片编码 ====================

def encode_image_to_base64(image_path: Path) -> str:
    """将图片编码为base64"""
    img = Image.open(image_path)

    # 对于大图片，适当缩放
    max_size = 2048
    if img.width > max_size or img.height > max_size:
        ratio = min(max_size / img.width, max_size / img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

# ==================== 多模态API调用 ====================

def call_qwen_vl(image_path: Path, prompt: str) -> dict:
    """调用Qwen VL API进行视觉分析"""

    print(f"\n🔍 调用Qwen VL分析: {image_path.name}")

    image_base64 = encode_image_to_base64(image_path)

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
        "max_tokens": 2000
    }

    try:
        response = requests.post(
            f"{QWEN_VL_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120
        )

        if response.status_code == 200:
            result = response.json()
            analysis_text = result["choices"][0]["message"]["content"]
            print(f"   ✅ API响应成功")
            return {
                "success": True,
                "analysis": analysis_text,
                "image_name": image_path.name,
                "timestamp": datetime.now().isoformat()
            }
        else:
            print(f"   ❌ API错误: {response.status_code}")
            print(f"   响应: {response.text[:500]}")
            return {
                "success": False,
                "error": f"API错误: {response.status_code}",
                "response": response.text[:500]
            }

    except Exception as e:
        print(f"   ❌ 调用异常: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# ==================== 验证Prompt ====================

NPC_VALIDATION_PROMPT = """
请仔细分析这张NPC角色sprite图片，这是用于游戏的像素人物动画素材。

图片应该是4行×4列的布局，共16帧。请验证以下内容：

## 1. 人物完整性检查（最重要）
- 图片中是否只有人物本身？
- 是否存在多余的背景、装饰、或其他非人物元素？
- 人物是否完整显示（没有截断、遮挡）？
- 背景 是否干净/透明？

## 2. 方向正确性检查
请识别每一行人物面朝的方向：
- 第1行（最上面）：人物面朝哪个方向？应该是"下"（面向观众）
- 第2行：人物面朝哪个方向？应该是"左"
- 第3行：人物面朝哪个方向？应该是"右"
- 第4行（最下面）：人物面朝哪个方向？应该是"上"（背向观众）

如果方向顺序不是下、左、右、上，请明确指出实际顺序。

## 3. 动画连贯性检查
每一行的4帧是否形成连贯的行走动画？
- 第1帧到第4帧是否有合理的动作过渡？
- 像是自然的行走循环吗？

## 输出格式要求

请按以下格式输出：

```
人物完整性: [完整/不完整]
多余元素: [无/有，具体描述]
背景状态: [透明/干净/有背景]

方向识别:
- 第1行: [方向名称]
- 第2行: [方向名称]
- 第3行: [方向名称]
- 第4行: [方向名称]
方向顺序是否正确: [是/否]

动画连贯性: [连贯/不连贯]

总体评价: [通过/不通过]
发现的问题: [问题列表，如果没有则写"无"]
置信度: [0-100的数字]
```
"""

# ==================== 验证函数 ====================

def validate_npc_sprite(npc_name: str) -> dict:
    """验证单个NPC sprite"""

    print(f"\n{'='*70}")
    print(f"🎮 验证NPC: {npc_name}")
    print(f"{'='*70}")

    source_path = NPC_DIR / f"{npc_name}.png"

    if not source_path.exists():
        print(f"❌ 源文件不存在: {source_path}")
        return {
            "npc": npc_name,
            "status": "error",
            "message": "源文件不存在"
        }

    # 获取图片基本信息
    img = Image.open(source_path)
    width, height = img.size
    print(f"   图片尺寸: {width}×{height}")

    # 调用多模态API
    result = call_qwen_vl(source_path, NPC_VALIDATION_PROMPT)

    if result["success"]:
        analysis = result["analysis"]

        # 解析分析结果
        validation_result = parse_validation_result(analysis)

        return {
            "npc": npc_name,
            "source_path": str(source_path),
            "source_size": (width, height),
            "status": validation_result["status"],
            "analysis_raw": analysis,
            "validation": validation_result,
            "timestamp": result["timestamp"]
        }
    else:
        return {
            "npc": npc_name,
            "status": "error",
            "error": result.get("error", "API调用失败")
        }

def parse_validation_result(analysis_text: str) -> dict:
    """解析AI分析结果"""

    result = {
        "character_complete": "unknown",
        "extra_elements": "unknown",
        "background_status": "unknown",
        "directions": {},
        "direction_correct": "unknown",
        "animation_smooth": "unknown",
        "overall_pass": "unknown",
        "issues": [],
        "confidence": 0
    }

    lines = analysis_text.split("\n")

    for line in lines:
        line = line.strip()

        # 人物完整性
        if "人物完整性" in line:
            if "完整" in line:
                result["character_complete"] = "完整"
            elif "不完整" in line:
                result["character_complete"] = "不完整"

        # 多余元素
        if "多余元素" in line:
            if "无" in line:
                result["extra_elements"] = "无"
            else:
                result["extra_elements"] = line.split(":")[-1].strip()

        # 背景
        if "背景" in line and "状态" in line:
            result["background_status"] = line.split(":")[-1].strip()

        # 方向
        if "第1行" in line:
            result["directions"]["row1"] = line.split(":")[-1].strip()
        if "第2行" in line:
            result["directions"]["row2"] = line.split(":")[-1].strip()
        if "第3行" in line:
            result["directions"]["row3"] = line.split(":")[-1].strip()
        if "第4行" in line:
            result["directions"]["row4"] = line.split(":")[-1].strip()

        # 方向正确
        if "方向顺序是否正确" in line:
            if "是" in line:
                result["direction_correct"] = "是"
            elif "否" in line:
                result["direction_correct"] = "否"

        # 动画连贯
        if "动画连贯性" in line:
            if "连贯" in line:
                result["animation_smooth"] = "连贯"
            elif "不连贯" in line:
                result["animation_smooth"] = "不连贯"

        # 总体评价
        if "总体评价" in line:
            if "通过" in line:
                result["overall_pass"] = "通过"
            elif "不通过" in line:
                result["overall_pass"] = "不通过"

        # 问题
        if "发现的问题" in line:
            issues_text = line.split(":")[-1].strip()
            if issues_text != "无":
                result["issues"] = [issues_text]

        # 置信度
        if "置信度" in line:
            try:
                conf = int(line.split(":")[-1].strip().replace("%", ""))
                result["confidence"] = conf
            except:
                result["confidence"] = 50

    # 综合判断
    if result["overall_pass"] == "通过" and result["confidence"] >= 85:
        result["status"] = "passed"
    elif result["overall_pass"] == "不通过":
        result["status"] = "failed"
    else:
        result["status"] = "needs_review"

    return result

# ==================== 报告生成 ====================

def generate_report(results: dict) -> Path:
    """生成验证报告"""

    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    report = {
        "timestamp": datetime.now().isoformat(),
        "validation_type": "qwen_vl_multimodal",
        "npcs": results,
        "summary": {
            "total": len(results),
            "passed": sum(1 for r in results.values() if r.get("status") == "passed"),
            "failed": sum(1 for r in results.values() if r.get("status") == "failed"),
            "needs_review": sum(1 for r in results.values() if r.get("status") == "needs_review")
        }
    }

    # JSON报告
    json_path = REPORT_DIR / "qwen_vl_validation_report.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Markdown报告
    md_content = generate_markdown_report(report)
    md_path = REPORT_DIR / "qwen_vl_validation_report.md"
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    print(f"\n📊 报告已生成:")
    print(f"   JSON: {json_path}")
    print(f"   Markdown: {md_path}")

    return json_path

def generate_markdown_report(report: dict) -> str:
    """生成Markdown报告"""

    md = f"""# Qwen VL 多模态视觉验证报告

**验证时间**: {report['timestamp']}
**验证类型**: {report['validation_type']}
**API**: Qwen VL Max

---

## 验证摘要

| 状态 | 数量 |
|-----|------|
| 通过 ✅ | {report['summary']['passed']} |
| 失败 ❌ | {report['summary']['failed']} |
| 待复核 ⚠️ | {report['summary']['needs_review']} |

---

## 详细验证结果

"""

    for npc_name, result in report['npcs'].items():
        status_icon = "✅" if result.get("status") == "passed" else ("❌" if result.get("status") == "failed" else "⚠️")
        md += f"### {npc_name} {status_icon}\n\n"

        md += f"**源图片**: `{result.get('source_path', 'N/A')}`\n"
        md += f"**尺寸**: {result.get('source_size', 'N/A')}\n\n"

        if "validation" in result:
            validation = result["validation"]
            md += f"| 检查项 | 结果 |\n"
            md += f"|-------|------|\n"
            md += f"| 人物完整性 | {validation.get('character_complete', 'N/A')} |\n"
            md += f"| 多余元素 | {validation.get('extra_elements', 'N/A')} |\n"
            md += f"| 背景状态 | {validation.get('background_status', 'N/A')} |\n"
            md += f"| 方向正确 | {validation.get('direction_correct', 'N/A')} |\n"
            md += f"| 动画连贯 | {validation.get('animation_smooth', 'N/A')} |\n"
            md += f"| 置信度 | {validation.get('confidence', 0)}% |\n\n"

            if validation.get("directions"):
                md += "**方向识别**:\n"
                for row, direction in validation["directions"].items():
                    md += f"- {row}: {direction}\n"
                md += "\n"

            if validation.get("issues"):
                md += "**发现的问题**:\n"
                for issue in validation["issues"]:
                    md += f"- {issue}\n"
                md += "\n"

        md += "\n"

    md += """---

*报告由Qwen VL多模态视觉验证脚本生成*
"""

    return md

# ==================== 主函数 ====================

def main():
    print("=" * 70)
    print("🔍 Qwen VL 多模态视觉验证系统")
    print("=" * 70)
    print("\n验证内容:")
    print("   1. 人物完整性 - 无多余背景/其他画面")
    print("   2. 方向正确性 - 下、左、右、上四方向")
    print("   3. 动画连贯性 - 行走动画循环")

    results = {}

    # 验证所有NPC
    npc_files = list(NPC_DIR.glob("*.png"))
    npc_files = [f for f in npc_files if not f.name.endswith("_preview") and not f.name.endswith("_split")]

    print(f"\n📁 发现 {len(npc_files)} 个NPC源文件")

    for npc_file in npc_files:
        npc_name = npc_file.stem
        result = validate_npc_sprite(npc_name)
        results[npc_name] = result

    # 生成报告
    print("\n" + "=" * 70)
    print("📍 生成验证报告")
    print("=" * 70)

    report_path = generate_report(results)

    # 输出总结
    print("\n" + "=" * 70)
    print("📊 验证完成总结")
    print("=" * 70)

    passed = sum(1 for r in results.values() if r.get("status") == "passed")
    failed = sum(1 for r in results.values() if r.get("status") == "failed")
    review = sum(1 for r in results.values() if r.get("status") == "needs_review")

    print(f"   通过: {passed}")
    print(f"   失败: {failed}")
    print(f"   待复核: {review}")

    print("\n" + "=" * 70)
    print("✅ 多模态视觉验证完成！")
    print("=" * 70)

    return results

if __name__ == "__main__":
    main()