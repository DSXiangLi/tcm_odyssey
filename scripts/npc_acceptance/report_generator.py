# scripts/npc_acceptance/report_generator.py

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

from .config import (
    FINAL_ACCEPTANCE_THRESHOLD,
    DIALOG_EVALUATION_THRESHOLDS,
    E2E_TEST_PASS_THRESHOLD,
    TOTAL_DIALOG_PASS_THRESHOLD,
)


class ReportGenerator:
    """NPC验收报告生成器"""

    def __init__(self, output_dir: str = "reports/npc_acceptance"):
        """
        初始化报告生成器

        Args:
            output_dir: 输出目录路径
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 创建子目录
        self.evaluation_dir = self.output_dir / "evaluation_results"
        self.evaluation_dir.mkdir(parents=True, exist_ok=True)

    def generate_summary_report(
        self,
        test_result: Dict[str, Any],
        evaluation_results: Dict[str, Any],
        trigger_logs: List[Dict[str, Any]]
    ) -> str:
        """
        生成Markdown汇总报告

        Args:
            test_result: E2E测试结果
            evaluation_results: 对话评估结果
            trigger_logs: 触发事件日志列表

        Returns:
            生成的报告文件路径
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        run_id = f"npc_acceptance_{timestamp}"

        # 计算综合验收判定
        final_acceptance = self.calculate_final_acceptance(test_result, evaluation_results)

        # 构建报告内容
        report_lines = self._build_report_sections(
            run_id, test_result, evaluation_results, final_acceptance
        )

        report_content = "\n".join(report_lines)

        # 保存报告
        report_path = self.output_dir / "summary_report.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_content)

        return str(report_path)

    def _build_report_sections(
        self,
        run_id: str,
        test_result: Dict[str, Any],
        evaluation_results: Dict[str, Any],
        final_acceptance: Dict[str, Any]
    ) -> List[str]:
        """
        构建报告各部分的行内容

        Args:
            run_id: 测试运行ID
            test_result: E2E测试结果
            evaluation_results: 对话评估结果
            final_acceptance: 综合验收结果

        Returns:
            报告行列表
        """
        return [
            *self._format_header_section(run_id),
            *self._format_test_results_section(test_result),
            *self._format_evaluation_section(evaluation_results),
            *self._format_acceptance_section(final_acceptance),
            *self._format_improvements_section(evaluation_results),
            *self._format_logs_section(),
        ]

    def _format_header_section(self, run_id: str) -> List[str]:
        """格式化报告头部"""
        return [
            "# Hermes NPC 对话自动验收报告",
            "",
            f"**执行时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**测试运行 ID**: {run_id}",
            "",
            "---",
            "",
        ]

    def _format_test_results_section(self, test_result: Dict[str, Any]) -> List[str]:
        """格式化测试执行结果部分"""
        return [
            "## 1. 测试执行结果",
            "",
            "### 1.1 E2E 测试通过率",
            "",
            self._format_test_table(test_result),
            "",
            "### 1.2 失败测试详情",
            "",
            self._format_failed_tests(test_result),
            "",
            "---",
            "",
        ]

    def _format_evaluation_section(self, evaluation_results: Dict[str, Any]) -> List[str]:
        """格式化对话质量评估结果部分"""
        return [
            "## 2. 对话质量评估结果",
            "",
            "### 2.1 评估概览",
            "",
            self._format_evaluation_table(evaluation_results),
            "",
            "### 2.2 不合格项",
            "",
            self._format_failed_evaluations(evaluation_results),
            "",
            "---",
            "",
        ]

    def _format_acceptance_section(self, final_acceptance: Dict[str, Any]) -> List[str]:
        """格式化综合验收判定部分"""
        return [
            "## 3. 综合验收判定",
            "",
            self._format_acceptance_table(final_acceptance),
            "",
            "---",
            "",
        ]

    def _format_improvements_section(self, evaluation_results: Dict[str, Any]) -> List[str]:
        """格式化改进建议部分"""
        return [
            "## 4. 改进建议",
            "",
            self._format_improvement_suggestions(evaluation_results),
            "",
            "---",
            "",
        ]

    def _format_logs_section(self) -> List[str]:
        """格式化日志文件路径部分"""
        return [
            "## 5. 日志文件路径",
            "",
            f"- 对话日志: `logs/dialog/`",
            f"- 触发事件日志: `{self.output_dir / 'trigger_logs.json'}`",
            f"- 评估详情: `{self.evaluation_dir}/`",
        ]

    def save_evaluation_results(self, evaluation_results: Dict[str, Any]) -> str:
        """
        保存评估结果JSON

        Args:
            evaluation_results: 评估结果字典

        Returns:
            保存的文件路径
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"evaluation_{timestamp}.json"
        filepath = self.evaluation_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(evaluation_results, f, ensure_ascii=False, indent=2)

        return str(filepath)

    def calculate_final_acceptance(
        self,
        test_result: Dict[str, Any],
        evaluation_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        计算综合验收分数

        综合验收分数 = 测试通过率 × 0.5 + 对话质量得分/100 × 0.5

        Args:
            test_result: E2E测试结果
            evaluation_results: 对话评估结果

        Returns:
            包含score, passed, details的字典
        """
        # 获取测试通过率
        test_pass_rate = test_result.get("pass_rate", 0)

        # 获取对话质量得分（转换为百分比）
        dialog_avg_score = evaluation_results.get("avg_total_score", 0)
        dialog_quality_rate = dialog_avg_score / 100

        # 计算综合分数
        final_score = test_pass_rate * 0.5 + dialog_quality_rate * 0.5

        # 判断是否通过
        passed = final_score >= FINAL_ACCEPTANCE_THRESHOLD

        # 构建详情
        details = {
            "test_pass_rate": test_pass_rate,
            "test_pass_rate_threshold": E2E_TEST_PASS_THRESHOLD,
            "test_pass_rate_passed": test_pass_rate >= E2E_TEST_PASS_THRESHOLD,
            "dialog_quality_score": dialog_avg_score,
            "dialog_quality_threshold": TOTAL_DIALOG_PASS_THRESHOLD,
            "dialog_quality_passed": dialog_avg_score >= TOTAL_DIALOG_PASS_THRESHOLD,
            "dialog_pass_rate": evaluation_results.get("pass_rate", 0),
            "dialog_pass_rate_passed": evaluation_results.get("pass_rate", 0) >= 0.8,
        }

        return {
            "score": final_score,
            "passed": passed,
            "details": details
        }

    def _format_test_table(self, test_result: Dict[str, Any]) -> str:
        """
        格式化测试结果表格

        Args:
            test_result: 测试结果

        Returns:
            Markdown表格字符串
        """
        by_category = test_result.get("by_category", {})

        # 类别映射
        category_names = {
            "smoke": "烟雾测试",
            "trigger": "触发机制测试",
            "dialog": "对话流程测试",
            "tool": "工具调用测试"
        }

        lines = [
            "| 测试类型 | 通过数 | 总数 | 通过率 |",
            "|---------|-------|------|--------|"
        ]

        total_passed = 0
        total_count = 0

        for category, name in category_names.items():
            cat_data = by_category.get(category, {"passed": 0, "total": 0})
            passed = cat_data.get("passed", 0)
            total = cat_data.get("total", 0)
            rate = (passed / total * 100) if total > 0 else 0

            total_passed += passed
            total_count += total

            lines.append(f"| {name} | {passed} | {total} | {rate:.1f}% |")

        # 总计行
        total_rate = (total_passed / total_count * 100) if total_count > 0 else 0
        lines.append(f"| **总计** | **{total_passed}** | **{total_count}** | **{total_rate:.1f}%** |")

        return "\n".join(lines)

    def _format_failed_tests(self, test_result: Dict[str, Any]) -> str:
        """
        格式化失败测试详情

        Args:
            test_result: 测试结果

        Returns:
            Markdown表格字符串
        """
        failed_tests = test_result.get("failed_tests", [])

        if not failed_tests:
            return "无失败测试。"

        lines = [
            "| ID | 测试名称 | 失败原因 |",
            "|----|---------|---------|"
        ]

        for test in failed_tests:
            id_ = test.get("id", "N/A")
            name = test.get("name", "N/A")
            reason = test.get("reason", "N/A")
            lines.append(f"| {id_} | {name} | {reason} |")

        return "\n".join(lines)

    def _format_evaluation_table(self, evaluation_results: Dict[str, Any]) -> str:
        """
        格式化评估结果表格

        Args:
            evaluation_results: 评估结果

        Returns:
            Markdown表格字符串
        """
        results = evaluation_results.get("results", [])
        avg_scores = evaluation_results.get("avg_scores", {})

        lines = [
            "| 对话会话 | NPC | 教学风格 | 连贯性 | 工具调用 | 总分 |",
            "|---------|-----|---------|--------|---------|------|"
        ]

        for result in results:
            if "error" in result:
                continue

            session_id = result.get("session_id", "N/A")
            npc_id = result.get("npc_id", "N/A")
            teaching = result.get("teaching_style_score", 0)
            coherence = result.get("context_coherence_score", 0)
            tool = result.get("tool_call_score", 0)
            total = result.get("total_score", 0)

            lines.append(f"| {session_id} | {npc_id} | {teaching:.1f} | {coherence:.1f} | {tool:.1f} | {total:.1f} |")

        # 平均行
        avg_teaching = avg_scores.get("教学风格符合度", 0)
        avg_coherence = avg_scores.get("上下文连贯性", 0)
        avg_tool = avg_scores.get("工具调用合理性", 0)
        avg_total = evaluation_results.get("avg_total_score", 0)

        lines.append(f"| **平均** | - | **{avg_teaching:.1f}** | **{avg_coherence:.1f}** | **{avg_tool:.1f}** | **{avg_total:.1f}** |")

        return "\n".join(lines)

    def _format_failed_evaluations(self, evaluation_results: Dict[str, Any]) -> str:
        """
        格式化不合格评估项

        Args:
            evaluation_results: 评估结果

        Returns:
            Markdown表格字符串
        """
        results = evaluation_results.get("results", [])
        failed_items = self._collect_failed_evaluation_items(results)

        if not failed_items:
            return "无不合格项。"

        lines = [
            "| 会话 | 维度 | 分数 | 阈值 | 差距 | 改进建议 |",
            "|-----|------|------|------|------|---------|"
        ]

        for item in failed_items:
            lines.append(
                f"| {item['session']} | {item['dimension']} | {item['score']:.1f} | {item['threshold']} | {item['gap']:.1f} | {item['suggestion']} |"
            )

        return "\n".join(lines)

    def _collect_failed_evaluation_items(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        收集不合格评估项

        Args:
            results: 评估结果列表

        Returns:
            不合格项列表
        """
        failed_items = []
        for result in results:
            if "error" in result:
                failed_items.append({
                    "session": result.get("session_id", "N/A"),
                    "dimension": "评估失败",
                    "score": 0,
                    "threshold": TOTAL_DIALOG_PASS_THRESHOLD,
                    "gap": TOTAL_DIALOG_PASS_THRESHOLD,
                    "suggestion": result.get("error", "请检查评估流程")
                })
                continue

            if not result.get("passed", True):
                # 检查各维度是否低于阈值
                for dimension, threshold in DIALOG_EVALUATION_THRESHOLDS.items():
                    score_key = {
                        "教学风格符合度": "teaching_style_score",
                        "上下文连贯性": "context_coherence_score",
                        "工具调用合理性": "tool_call_score"
                    }.get(dimension)

                    score = result.get(score_key, 0)
                    if score < threshold:
                        failed_items.append({
                            "session": result.get("session_id", "N/A"),
                            "dimension": dimension,
                            "score": score,
                            "threshold": threshold,
                            "gap": threshold - score,
                            "suggestion": self._get_dimension_suggestion(dimension, score)
                        })

        return failed_items

    def _get_dimension_suggestion(self, dimension: str, score: float) -> str:
        """
        根据维度和分数生成改进建议

        Args:
            dimension: 维度名称
            score: 分数

        Returns:
            改进建议
        """
        suggestions = {
            "教学风格符合度": {
                "low": "增加引导式提问，使用'你可记得'等引导语",
                "medium": "减少直接陈述，更多引用经典作为引导素材",
                "high": "保持当前引导风格"
            },
            "上下文连贯性": {
                "low": "增强对用户问题的理解，避免答非所问",
                "medium": "提高回答针对性，减少机械感",
                "high": "维持当前连贯水平"
            },
            "工具调用合理性": {
                "low": "优化工具调用时机，在讲解完毕后触发",
                "medium": "增加自然过渡，避免打断对话节奏",
                "high": "保持当前调用策略"
            }
        }

        if score < 50:
            level = "low"
        elif score < 75:
            level = "medium"
        else:
            level = "high"

        return suggestions.get(dimension, {}).get(level, "请检查该维度表现")

    def _format_improvement_suggestions(self, evaluation_results: Dict[str, Any]) -> str:
        """
        合并并格式化改进建议

        Args:
            evaluation_results: 评估结果

        Returns:
            Markdown改进建议列表
        """
        results = evaluation_results.get("results", [])

        # 收集所有建议
        all_suggestions = []
        for result in results:
            suggestions = result.get("improvement_suggestions", [])
            all_suggestions.extend(suggestions)

        # 去重并排序
        unique_suggestions = list(set(all_suggestions))

        if not unique_suggestions:
            return "当前表现良好，暂无改进建议。"

        # 格式化
        lines = []
        for i, suggestion in enumerate(unique_suggestions[:10], 1):  # 最多显示10条
            lines.append(f"{i}. {suggestion}")

        return "\n".join(lines)

    def _format_acceptance_table(self, final_acceptance: Dict[str, Any]) -> str:
        """
        格式化综合验收判定表格

        Args:
            final_acceptance: 综合验收结果

        Returns:
            Markdown表格字符串
        """
        details = final_acceptance.get("details", {})
        score = final_acceptance.get("score", 0)
        passed = final_acceptance.get("passed", False)

        test_rate = details.get("test_pass_rate", 0)
        test_passed = details.get("test_pass_rate_passed", False)

        dialog_score = details.get("dialog_quality_score", 0)
        dialog_passed = details.get("dialog_quality_passed", False)

        test_icon = "PASS" if test_passed else "FAIL"
        dialog_icon = "PASS" if dialog_passed else "FAIL"
        final_icon = "PASS" if passed else "FAIL"

        lines = [
            "| 条件 | 实际值 | 阈值 | 结果 |",
            "|-----|-------|------|------|",
            f"| E2E 测试通过率 | {test_rate*100:.1f}% | {E2E_TEST_PASS_THRESHOLD*100:.0f}% | {test_icon} |",
            f"| 对话质量总分 | {dialog_score:.1f} | {TOTAL_DIALOG_PASS_THRESHOLD} | {dialog_icon} |",
            f"| 综合验收分数 | {score*100:.1f}% | {FINAL_ACCEPTANCE_THRESHOLD*100:.0f}% | {final_icon} |",
        ]

        return "\n".join(lines)


def main():
    """测试报告生成器"""
    generator = ReportGenerator()

    # 模拟测试数据
    test_result = {
        "passed": 14,
        "failed": 2,
        "total": 16,
        "pass_rate": 0.875,
        "failed_tests": [
            {"id": "NPC-D04", "name": "停止生成按钮", "reason": "响应过快无法测试"}
        ],
        "by_category": {
            "smoke": {"passed": 3, "total": 3},
            "trigger": {"passed": 4, "total": 4},
            "dialog": {"passed": 4, "total": 5},
            "tool": {"passed": 3, "total": 4}
        }
    }

    evaluation_results = {
        "results": [
            {
                "session_id": "session_001",
                "npc_id": "qingmu",
                "teaching_style_score": 85,
                "context_coherence_score": 90,
                "tool_call_score": 80,
                "total_score": 85,
                "passed": True,
                "improvement_suggestions": ["继续保持引导式教学风格"]
            },
            {
                "session_id": "session_002",
                "npc_id": "qingmu",
                "teaching_style_score": 60,
                "context_coherence_score": 75,
                "tool_call_score": 70,
                "total_score": 67,
                "passed": False,
                "improvement_suggestions": [
                    "增加引导式提问",
                    "减少直接陈述",
                    "优化工具调用时机"
                ]
            }
        ],
        "avg_scores": {
            "教学风格符合度": 72.5,
            "上下文连贯性": 82.5,
            "工具调用合理性": 75.0
        },
        "avg_total_score": 76.0,
        "passed_count": 1,
        "total_count": 2,
        "pass_rate": 0.5,
        "overall_passed": False
    }

    trigger_logs = [
        {"event": "npc_interact", "npc_id": "qingmu", "timestamp": "2026-05-01T10:00:00"},
        {"event": "dialog_start", "npc_id": "qingmu", "timestamp": "2026-05-01T10:01:00"}
    ]

    # 生成报告
    report_path = generator.generate_summary_report(test_result, evaluation_results, trigger_logs)
    print(f"报告已生成: {report_path}")

    # 保存评估结果
    eval_path = generator.save_evaluation_results(evaluation_results)
    print(f"评估结果已保存: {eval_path}")

    # 计算综合验收
    final = generator.calculate_final_acceptance(test_result, evaluation_results)
    print(f"综合验收结果: {json.dumps(final, ensure_ascii=False, indent=2)}")


if __name__ == "__main__":
    main()