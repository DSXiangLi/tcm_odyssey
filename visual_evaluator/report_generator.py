# visual_evaluator/report_generator.py
"""
Report Generator for Visual Evaluation Results

Saves individual evaluations and generates summary reports.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.visual_acceptance.config import (
    EVALUATION_DIR,
    SUMMARY_REPORT,
    MODIFICATION_LOG,
    DIMENSION_THRESHOLDS,
    DIMENSION_WEIGHTS,
    TOTAL_PASS_THRESHOLD
)

from .dimension_checker import DimensionChecker


class ReportGenerator:
    """Generates and saves visual evaluation reports."""

    def __init__(self, output_dir: str = None):
        """
        Initialize report generator.

        Args:
            output_dir: Output directory (uses config default if None)
        """
        self.output_dir = Path(output_dir or EVALUATION_DIR)
        self.summary_path = Path(SUMMARY_REPORT)
        self.modification_log_path = Path(MODIFICATION_LOG)
        self.dimension_checker = DimensionChecker()

        # Ensure directories exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.summary_path.parent.mkdir(parents=True, exist_ok=True)

    def save_evaluation_report(
        self,
        evaluation: Dict[str, Any],
        scene_id: str
    ) -> str:
        """
        Save individual evaluation report as JSON.

        Args:
            evaluation: Evaluation result dict
            scene_id: Scene identifier

        Returns:
            Path to saved report file.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{scene_id}_{timestamp}.json"
        filepath = self.output_dir / filename

        # Add timestamp to evaluation
        evaluation["timestamp"] = timestamp
        evaluation["saved_at"] = datetime.now().isoformat()

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(evaluation, f, ensure_ascii=False, indent=2)

        return str(filepath)

    def generate_summary_report(
        self,
        evaluations: List[Dict[str, Any]],
        modifications: List[Dict[str, Any]] = None,
        iterations: int = 0
    ) -> str:
        """
        Generate comprehensive summary report in Markdown.

        Args:
            evaluations: List of all evaluation results
            modifications: List of modifications made (optional)
            iterations: Number of iterations performed

        Returns:
            Path to generated summary report.
        """
        report_lines = []

        # Header
        report_lines.append("# 视觉验收总结报告")
        report_lines.append(f"\n**生成时间**: {datetime.now().isoformat()}")
        report_lines.append(f"\n**迭代次数**: {iterations}")
        report_lines.append(f"\n**评估场景数**: {len(evaluations)}")

        # Overall status
        passed_count = sum(1 for e in evaluations if e.get("pass", False))
        failed_count = len(evaluations) - passed_count
        pass_rate = round(passed_count / len(evaluations) * 100, 1) if evaluations else 0

        report_lines.append(f"\n**通过率**: {pass_rate}% ({passed_count}/{len(evaluations)})")

        # Overall assessment
        avg_weighted_score = 0
        if evaluations:
            scores = [e.get("weighted_score", 0) for e in evaluations if "weighted_score" in e]
            avg_weighted_score = round(sum(scores) / len(scores), 2) if scores else 0

        report_lines.append(f"\n**平均加权得分**: {avg_weighted_score}")
        report_lines.append(f"\n**通过阈值**: {TOTAL_PASS_THRESHOLD}")

        overall_pass = avg_weighted_score >= TOTAL_PASS_THRESHOLD and failed_count == 0
        status = "✅ 通过" if overall_pass else "❌ 未通过"
        report_lines.append(f"\n\n## 整体状态\n\n{status}")

        # Scene evaluations summary
        report_lines.append("\n\n## 场景评估详情\n")

        for i, evaluation in enumerate(evaluations, 1):
            scene_id = evaluation.get("scene_id", f"scene_{i}")
            scene_pass = evaluation.get("pass", False)
            weighted_score = evaluation.get("weighted_score", "N/A")
            confidence = evaluation.get("confidence", "N/A")

            scene_status = "✅" if scene_pass else "❌"
            report_lines.append(f"\n### {i}. {scene_id} {scene_status}")
            report_lines.append(f"\n- **加权得分**: {weighted_score}")
            report_lines.append(f"- **置信度**: {confidence}")

            # Dimension scores
            dimensions = evaluation.get("dimensions", {})
            if dimensions:
                report_lines.append("\n- **维度得分**:")
                for dim_name, dim_data in dimensions.items():
                    score = dim_data.get("score", "N/A")
                    threshold = DIMENSION_THRESHOLDS.get(dim_name, 0)
                    dim_status = "✅" if isinstance(score, (int, float)) and score >= threshold else "⚠️"
                    report_lines.append(f"  - {dim_status} {dim_name}: {score} (阈值: {threshold})")

            # Issues if failed
            if not scene_pass:
                low_scoring = self.dimension_checker.get_low_scoring_dimensions(evaluation)
                if low_scoring:
                    report_lines.append("\n- **需改进维度**:")
                    for dim in low_scoring[:3]:  # Top 3
                        report_lines.append(f"  - {dim['dimension']}: 差距 {dim['gap']}分")

        # Modifications summary
        if modifications:
            report_lines.append("\n\n## 修改记录\n")
            for i, mod in enumerate(modifications, 1):
                report_lines.append(f"\n{i}. **迭代 {mod.get('iteration', i)}**")
                report_lines.append(f"   - 文件: {mod.get('file', '未知')}")
                report_lines.append(f"   - 修改: {mod.get('description', '未知')}")
                report_lines.append(f"   - 结果: {mod.get('result', '未知')}")

        # Recommendations
        report_lines.append("\n\n## 下一步建议\n")

        if overall_pass:
            report_lines.append("\n1. 所有场景已通过验收阈值")
            report_lines.append("\n2. 可以合并dev分支到主分支")
            report_lines.append("\n3. 建议用户进行最终确认")
        else:
            report_lines.append("\n1. 以下场景未通过验收:")
            for e in evaluations:
                if not e.get("pass", False):
                    report_lines.append(f"   - {e.get('scene_id', '未知')}")

            report_lines.append("\n2. 建议修复以下高权重维度问题:")
            all_low_scoring = []
            for e in evaluations:
                all_low_scoring.extend(
                    self.dimension_checker.get_low_scoring_dimensions(e)
                )

            # Sort by weight * gap
            all_low_scoring.sort(
                key=lambda x: x["weight"] * x["gap"],
                reverse=True
            )

            for dim in all_low_scoring[:5]:
                report_lines.append(
                    f"   - {dim['dimension']} (权重{dim['weight']*100}%): "
                    f"差距{dim['gap']}分"
                )

            report_lines.append(f"\n3. 建议继续迭代（剩余{3 - iterations}次）")

        # Footer
        report_lines.append("\n\n---")
        report_lines.append(f"\n*报告由视觉验收自动化系统生成 - {datetime.now().strftime('%Y-%m-%d')}*")

        # Write report
        report_content = "\n".join(report_lines)
        with open(self.summary_path, "w", encoding="utf-8") as f:
            f.write(report_content)

        return str(self.summary_path)

    def append_modification_log(
        self,
        iteration: int,
        modifications: List[Dict[str, Any]]
    ) -> str:
        """
        Append modifications to the modification log.

        Args:
            iteration: Current iteration number
            modifications: List of modifications made

        Returns:
            Path to modification log file.
        """
        log_lines = []

        log_lines.append(f"\n## 迭代 {iteration} - {datetime.now().isoformat()}\n")

        for mod in modifications:
            log_lines.append(f"\n### 修改: {mod.get('file', '未知文件')}\n")
            log_lines.append(f"- **描述**: {mod.get('description', '未知')}")
            log_lines.append(f"- **原因**: {mod.get('reason', '未知')}")
            log_lines.append(f"- **结果**: {mod.get('result', '未知')}")

            if "diff" in mod:
                log_lines.append(f"\n**代码变更**:\n```diff\n{mod['diff']}\n```")

        # Append to existing log or create new
        mode = "a" if self.modification_log_path.exists() else "w"

        with open(self.modification_log_path, mode, encoding="utf-8") as f:
            f.write("\n".join(log_lines))

        return str(self.modification_log_path)

    def generate_dimension_summary(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, float]]:
        """
        Generate summary statistics for each dimension.

        Args:
            evaluations: List of evaluation results

        Returns:
            Dict with dimension stats (avg, min, max, pass_rate).
        """
        summary = {}

        for dim_name in DIMENSION_THRESHOLDS.keys():
            scores = []
            passes = 0

            for evaluation in evaluations:
                dim_data = evaluation.get("dimensions", {}).get(dim_name, {})
                score = dim_data.get("score")

                if score is not None:
                    scores.append(score)
                    if score >= DIMENSION_THRESHOLDS[dim_name]:
                        passes += 1

            if scores:
                summary[dim_name] = {
                    "avg": round(sum(scores) / len(scores), 2),
                    "min": min(scores),
                    "max": max(scores),
                    "pass_rate": round(passes / len(scores) * 100, 1),
                    "threshold": DIMENSION_THRESHOLDS[dim_name],
                    "weight": DIMENSION_WEIGHTS[dim_name]
                }
            else:
                summary[dim_name] = {
                    "avg": None,
                    "min": None,
                    "max": None,
                    "pass_rate": 0,
                    "threshold": DIMENSION_THRESHOLDS[dim_name],
                    "weight": DIMENSION_WEIGHTS[dim_name]
                }

        return summary