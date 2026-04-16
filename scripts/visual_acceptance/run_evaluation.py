#!/usr/bin/env python3
"""
评估入口脚本 - 执行截图评估（不触发自动修改）
"""

import os
import sys
import json
from pathlib import Path

# 添加项目根目录到path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from scripts.visual_acceptance.config import SCREENSHOT_DIR, EVALUATION_DIR
from visual_evaluator.evaluator import VisualEvaluator
from visual_evaluator.report_generator import ReportGenerator

def main():
    """执行截图评估"""
    print("=== Phase2 视觉验收评估 ===")

    # 确保输出目录存在
    eval_dir = project_root / EVALUATION_DIR
    eval_dir.mkdir(parents=True, exist_ok=True)

    # 初始化评估器
    try:
        evaluator = VisualEvaluator()
        print("评估器初始化成功")
    except ValueError as e:
        print(f"初始化失败: {e}")
        return

    # 读取截图采集报告
    screenshot_dir = project_root / SCREENSHOT_DIR
    report_path = screenshot_dir / "collection_report.json"

    if not report_path.exists():
        print("未找到截图采集报告，直接扫描目录")
        screenshots = []
        for png_file in screenshot_dir.glob("*.png"):
            if png_file.name.startswith("collection"):
                continue
            scene_id = png_file.name.split("-")[0]
            screenshots.append({
                "path": str(png_file),
                "scene_id": scene_id,
                "context": {}
            })
    else:
        with open(report_path, 'r', encoding='utf-8') as f:
            report = json.load(f)

        screenshots = []
        for scene in report.get("scenes", []):
            for i in range(scene.get("count", 0)):
                filename = f"{scene['id']}-{i+1}.png"
                filepath = screenshot_dir / filename
                if filepath.exists():
                    screenshots.append({
                        "path": str(filepath),
                        "scene_id": scene["id"],
                        "context": {"name": scene.get("name", scene["id"])}
                    })

    print(f"发现 {len(screenshots)} 张待评估截图")

    # 执行评估
    results = []
    for i, screenshot in enumerate(screenshots):
        print(f"\n[{i+1}/{len(screenshots)}] 评估: {screenshot['scene_id']}")
        try:
            result = evaluator.evaluate_single(
                screenshot["path"],
                screenshot["scene_id"],
                screenshot.get("context", {})
            )
            results.append(result)

            # 打印简要结果
            score = result.get("weighted_score", 0)
            passed = result.get("pass", False)
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  得分: {score} | 状态: {status}")

            # 保存单独评估报告
            scene_report_path = eval_dir / f"{screenshot['scene_id']}_evaluation.json"
            with open(scene_report_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"  评估失败: {e}")
            results.append({
                "scene_id": screenshot["scene_id"],
                "error": str(e),
                "pass": False
            })

    # 生成汇总报告
    print("\n=== 生成汇总报告 ===")
    report_generator = ReportGenerator()
    report_generator.generate_summary_report(results, [], len(results))

    # 统计结果
    passed_count = sum(1 for r in results if r.get("pass", False))
    failed_count = len(results) - passed_count
    avg_score = sum(r.get("weighted_score", 0) for r in results) / len(results) if results else 0

    print(f"\n=== 评估结果摘要 ===")
    print(f"总场景数: {len(results)}")
    print(f"通过: {passed_count} | 失败: {failed_count}")
    print(f"平均得分: {avg_score:.2f}")

    # 保存结果汇总
    summary = {
        "total": len(results),
        "passed": passed_count,
        "failed": failed_count,
        "avg_score": round(avg_score, 2),
        "results": results,
        "timestamp": str(Path(__file__).parent.parent.parent)
    }

    summary_path = eval_dir / "evaluation_summary.json"
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n评估报告已保存到: {eval_dir}")

    return summary

if __name__ == "__main__":
    main()