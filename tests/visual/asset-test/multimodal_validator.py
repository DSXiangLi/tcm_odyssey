#!/usr/bin/env python3
"""
多模态AI自动验证脚本
使用AI视觉模型验证NPC分割和室内遮罩分析结果

验证内容:
1. NPC分割正确性 - 每方向4帧，动画连贯
2. 室内遮罩分析正确性 - 红色=可行走区域
3. 视觉风格统一性 - 与室外场景风格一致

输出:
- 验证报告 (JSON)
- 问题列表和建议修复方案
"""

import os
import json
import base64
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

# ==================== 配置 ====================

SCRIPT_DIR = Path(__file__).parent
NPC_DIR = SCRIPT_DIR / "ai-generated" / "npc" / "split"
INDOOR_DIR = SCRIPT_DIR / "ai-generated" / "clinic"
OUTPUT_DIR = SCRIPT_DIR / "ai-generated" / "validation_reports"

# ==================== 多模态AI接口 ====================

def call_multimodal_ai(image_path: Path, prompt: str) -> Dict[str, Any]:
    """
    调用多模态AI进行图像分析

    注意: 需要配置相应的API密钥
    当前使用模拟接口，实际部署时替换为真实API调用
    """
    # 模拟响应 - 实际部署时替换为OpenAI/Gemini/Qwen等API
    print(f"\n🔍 分析图片: {image_path.name}")
    print(f"   Prompt: {prompt[:100]}...")

    # 这里应该调用真实的API
    # 示例: OpenAI GPT-4V, Google Gemini, Qwen-VL等

    # 模拟返回结果
    return {
        "image_name": image_path.name,
        "prompt": prompt,
        "analysis": "待AI模型分析",
        "issues": [],
        "passed": True,
        "confidence": 0.0,
        "timestamp": datetime.now().isoformat()
    }

def encode_image_to_base64(image_path: Path) -> str:
    """将图片编码为base64"""
    import io
    from PIL import Image

    img = Image.open(image_path)
    # 调整尺寸以适应API限制
    max_size = 1024
    if img.width > max_size or img.height > max_size:
        ratio = min(max_size / img.width, max_size / img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size)

    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

# ==================== 验证任务 ====================

def validate_npc_sprite_split(npc_name: str) -> Dict[str, Any]:
    """验证NPC sprite分割结果"""

    preview_path = NPC_DIR / npc_name / f"{npc_name}_preview.png"

    if not preview_path.exists():
        return {
            "npc": npc_name,
            "status": "error",
            "message": f"预览图不存在: {preview_path}"
        }

    prompt = f"""
请分析这个NPC角色sprite预览图，验证以下内容：

1. **布局验证**:
   - 图片是否包含4个方向的动画帧？（下、左、右、上）
   - 每个方向是否有4帧？（形成行走动画循环）
   - 总共是否是16帧？

2. **动画连贯性验证**:
   - 每个方向的4帧是否形成连贯的行走动画？
   - 帧之间是否有合理的动作过渡？
   - 是否有明显的断裂或跳跃？

3. **视觉风格验证**:
   - 角色风格是否符合像素游戏风格？
   - 是否有清晰的轮廓和辨识度？
   - 风格是否适合中医主题游戏？

请给出：
- 验证结果（通过/不通过）
- 发现的问题列表
- 修复建议
- 置信度评分（0-100）

NPC名称: {npc_name}
"""

    result = call_multimodal_ai(preview_path, prompt)

    # 添加具体的验证项
    result["validation_items"] = {
        "layout_4x4": "验证4×4布局",
        "directions_complete": "验证4方向完整",
        "animation_smooth": "验证动画连贯",
        "pixel_style": "验证像素风格"
    }

    return result

def validate_npc_single_direction(npc_name: str, direction: str) -> Dict[str, Any]:
    """验证单个方向的sprite sheet"""

    sheet_path = NPC_DIR / npc_name / f"{npc_name}_{direction}.png"

    if not sheet_path.exists():
        return {
            "npc": npc_name,
            "direction": direction,
            "status": "error",
            "message": f"Sprite sheet不存在: {sheet_path}"
        }

    prompt = f"""
请分析这个{direction}方向的NPC sprite sheet，验证：

1. **帧数验证**:
   - 图片是否包含4帧横向排列？
   - 每帧的尺寸是否一致？

2. **动画质量**:
   - 4帧是否形成合理的行走动作循环？
   - 帧顺序是否正确？（通常：静止→迈步→过渡→回步）

3. **像素质量**:
   - 边缘是否清晰？
   - 是否有透明背景？
   - 是否有噪点或锯齿？

NPC名称: {npc_name}
方向: {direction}
"""

    return call_multimodal_ai(sheet_path, prompt)

def validate_indoor_mask_analysis(scene_name: str) -> Dict[str, Any]:
    """验证室内遮罩分析结果"""

    # 加载原图和遮罩层
    original_path = INDOOR_DIR / f"{scene_name}_nanobanana.png"
    mask_path = INDOOR_DIR / f"{scene_name}_shadow.png"
    overlay_path = INDOOR_DIR / "mask_analysis" / "walkable_overlay.png"

    results = {}

    # 验证遮罩层颜色含义
    if mask_path.exists():
        prompt = f"""
请分析这个室内场景遮罩层，验证颜色含义：

1. **颜色识别**:
   - 图片中是否有红色区域？（应该代表可行走区域）
   - 图片中是否有黑色区域？（应该代表不可行走区域）
   - 红色和黑色区域的分布是否合理？

2. **区域合理性**:
   - 红色区域（可行走）是否在室内空旷区域？
   - 黑色区域（不可行走）是否对应墙壁、家具等障碍物？
   - 是否有明显错误标记的区域？

3. **与室内场景匹配**:
   - 遮罩层是否与室内场景布局匹配？
   - 门的位置是否有可行走路径？

场景名称: {scene_name}
颜色约定: 红色=可行走，黑色=不可行走
"""
        results["mask_analysis"] = call_multimodal_ai(mask_path, prompt)

    # 验证可行走叠加图
    if overlay_path.exists():
        prompt = f"""
请分析这个可行走区域叠加图，验证分析结果：

1. **可行走区域标记**:
   - 绿色半透明区域是否正确标记可行走区域？
   - 覆盖范围是否合理？
   - 是否有遗漏或错误覆盖的区域？

2. **出生点位置**:
   - 蓝色圆点标记的出生点是否在可行走区域内？
   - 出生点位置是否合理？（通常在门附近）

3. **连通性**:
   - 可行走区域是否连通？
   - 是否有孤立的可行走区域？

场景名称: {scene_name}
"""
        results["overlay_analysis"] = call_multimodal_ai(overlay_path, prompt)

    # 验证室内原图风格
    if original_path.exists():
        prompt = f"""
请分析这个室内场景原图，验证视觉风格：

1. **氛围验证**:
   - 是否是温馨的诊所氛围？
   - 是否有中医元素？（药柜、诊台等）
   - 是否有阳光透窗效果？

2. **风格统一性**:
   - 是否与像素风格一致？
   - 色调是否和谐？（古朴棕系为主）
   - 是否适合中医主题游戏？

3. **元素完整性**:
   - 是否有诊台？
   - 是否有药柜？
   - 是否有窗户？
   - 是否有其他必要元素？

场景名称: {scene_name}
"""
        results["style_analysis"] = call_multimodal_ai(original_path, prompt)

    return results

def validate_npc_indoor_style_consistency(npc_name: str, scene_name: str) -> Dict[str, Any]:
    """验证NPC与室内场景风格一致性"""

    npc_preview = NPC_DIR / npc_name / f"{npc_name}_preview.png"
    indoor_original = INDOOR_DIR / f"{scene_name}_nanobanana.png"

    if not npc_preview.exists() or not indoor_original.exists():
        return {"status": "error", "message": "缺少对比图片"}

    # 这里需要将两张图片一起发送给AI进行对比
    # 当前使用分开验证的方式

    prompt = f"""
请对比验证NPC角色和室内场景的风格一致性：

1. **色调一致性**:
   - NPC服饰色调是否与室内环境协调？
   - 是否使用相似的色系？

2. **像素风格一致性**:
   - 两者的像素风格是否一致？
   - 分辨率和细节程度是否匹配？

3. **视觉融合度**:
   - NPC放在室内场景中是否自然？
   - 是否有明显的风格冲突？

NPC名称: {npc_name}
场景名称: {scene_name}
"""

    # 实际实现需要发送两张图片
    return {
        "npc": npc_name,
        "scene": scene_name,
        "prompt": prompt,
        "note": "需要多图对比API支持"
    }

# ==================== 生成报告 ====================

def generate_validation_report(results: Dict[str, Any]) -> Path:
    """生成验证报告"""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    report = {
        "timestamp": datetime.now().isoformat(),
        "validation_type": "multimodal_ai",
        "results": results,
        "summary": {
            "total_checks": 0,
            "passed": 0,
            "failed": 0,
            "warnings": 0
        },
        "issues": [],
        "recommendations": []
    }

    # 计算统计数据
    for category, data in results.items():
        if isinstance(data, dict):
            if "passed" in data:
                report["summary"]["total_checks"] += 1
                if data["passed"]:
                    report["summary"]["passed"] += 1
                else:
                    report["summary"]["failed"] += 1
                    if "issues" in data:
                        report["issues"].extend(data["issues"])

    # 保存JSON报告
    json_path = OUTPUT_DIR / "validation_report.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # 生成Markdown报告
    md_content = generate_markdown_report(report)
    md_path = OUTPUT_DIR / "validation_report.md"
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    print(f"\n📊 验证报告已生成:")
    print(f"   JSON: {json_path}")
    print(f"   Markdown: {md_path}")

    return json_path

def generate_markdown_report(report: Dict) -> str:
    """生成Markdown格式报告"""

    md = f"""# 多模态AI验证报告

**生成时间**: {report['timestamp']}
**验证类型**: {report['validation_type']}

---

## 验证结果摘要

| 指标 | 数量 |
|-----|------|
| 总检查数 | {report['summary']['total_checks']} |
| 通过 | {report['summary']['passed']} |
| 失败 | {report['summary']['failed']} |
| 警告 | {report['summary']['warnings']} |

---

## 详细验证结果

"""

    for category, data in report['results'].items():
        md += f"### {category}\n\n"

        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, dict) and 'analysis' in value:
                    md += f"**{key}**:\n"
                    md += f"- 结果: {value.get('passed', '待验证')}\n"
                    md += f"- 分析: {value.get('analysis', '待AI分析')}\n"
                    if value.get('issues'):
                        md += f"- 问题: {', '.join(value['issues'])}\n"
                    md += "\n"
                else:
                    md += f"- **{key}**: {value}\n"
        md += "\n"

    if report['issues']:
        md += """## 发现的问题

"""
        for issue in report['issues']:
            md += f"- {issue}\n"

    if report['recommendations']:
        md += """## 修复建议

"""
        for rec in report['recommendations']:
            md += f"- {rec}\n"

    md += """---

*报告由多模态AI验证脚本自动生成*
"""

    return md

# ==================== 主函数 ====================

def main():
    print("=" * 70)
    print("🔍 多模态AI自动验证系统")
    print("=" * 70)

    results = {}

    # 验证NPC分割
    print("\n" + "=" * 70)
    print("📍 验证1: NPC Sprite分割")
    print("=" * 70)

    npc_list = ["teacher1", "user1"]
    results["npc_validation"] = {}

    for npc_name in npc_list:
        print(f"\n🎮 验证NPC: {npc_name}")

        # 验证预览图
        preview_result = validate_npc_sprite_split(npc_name)
        results["npc_validation"][npc_name] = preview_result

        # 验证每个方向
        directions = ["down", "left", "right", "up"]
        results["npc_validation"][npc_name]["directions"] = {}

        for direction in directions:
            dir_result = validate_npc_single_direction(npc_name, direction)
            results["npc_validation"][npc_name]["directions"][direction] = dir_result

    # 验证室内遮罩分析
    print("\n" + "=" * 70)
    print("📍 验证2: 室内遮罩分析")
    print("=" * 70)

    results["indoor_validation"] = validate_indoor_mask_analysis("clinic")

    # 验证风格一致性
    print("\n" + "=" * 70)
    print("📍 验证3: 风格一致性")
    print("=" * 70)

    results["style_consistency"] = {}
    for npc_name in npc_list:
        consistency_result = validate_npc_indoor_style_consistency(npc_name, "clinic")
        results["style_consistency"][f"{npc_name}_clinic"] = consistency_result

    # 生成报告
    print("\n" + "=" * 70)
    print("📍 生成验证报告")
    print("=" * 70)

    report_path = generate_validation_report(results)

    print("\n" + "=" * 70)
    print("✅ 验证完成！请查看报告确认结果")
    print("=" * 70)

    # 提示实际部署
    print("\n⚠️ 注意:")
    print("   当前脚本使用模拟API响应")
    print("   实际部署需要配置真实的多模态AI API:")
    print("   - OpenAI GPT-4 Vision")
    print("   - Google Gemini Pro Vision")
    print("   - Alibaba Qwen-VL")
    print("   - Anthropic Claude 3 (支持图片)")

    return results

if __name__ == "__main__":
    main()