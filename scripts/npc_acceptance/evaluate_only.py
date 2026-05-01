# scripts/npc_acceptance/evaluate_only.py
"""NPC Dialog Evaluate-Only Runner.

仅执行 AI 评估（不启动服务、不运行测试）。

用途:
- 快速评估已有的对话日志
- 不依赖 E2E 测试环境
- 单独验证 NPC 对话质量
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

# Handle both module and direct execution imports
try:
    from .config import (
        TOTAL_DIALOG_PASS_THRESHOLD,
        validate_config,
    )
    from .dialog_evaluator import DialogEvaluator
    from .report_generator import ReportGenerator
except ImportError:
    # Direct execution: add project root to path
    project_root = Path(__file__).parent.parent.parent
    sys.path.insert(0, str(project_root))
    from scripts.npc_acceptance.config import (
        TOTAL_DIALOG_PASS_THRESHOLD,
        validate_config,
    )
    from scripts.npc_acceptance.dialog_evaluator import DialogEvaluator
    from scripts.npc_acceptance.report_generator import ReportGenerator


class EvaluateOnlyRunner:
    """仅执行 AI 评估的运行器"""

    def __init__(self, project_root: Optional[Path] = None):
        """
        初始化评估运行器

        Args:
            project_root: 项目根目录路径，默认自动检测
        """
        self.project_root = project_root or Path(__file__).parent.parent.parent

        self.dialog_evaluator = DialogEvaluator()
        self.report_generator = ReportGenerator()

    def collect_dialog_logs(self, log_dir: str = "logs/dialog") -> List[Dict[str, Any]]:
        """
        收集对话日志

        Args:
            log_dir: 日志目录路径

        Returns:
            对话日志列表
        """
        print(f"[EvaluateOnly] 收集对话日志 from {log_dir}...")

        dialog_logs = self.dialog_evaluator.collect_dialog_logs(log_dir)

        print(f"[EvaluateOnly] 收集到 {len(dialog_logs)} 条对话日志")

        return dialog_logs

    def evaluate_dialogs(self, dialog_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        AI 评估对话质量

        Args:
            dialog_logs: 对话日志列表

        Returns:
            评估结果
        """
        print(f"[EvaluateOnly] AI 评估对话质量 ({len(dialog_logs)} 条)...")

        if not dialog_logs:
            print("[EvaluateOnly] 无对话日志，跳过评估")
            return {
                "results": [],
                "avg_scores": {},
                "avg_total_score": 0,
                "passed_count": 0,
                "total_count": 0,
                "pass_rate": 0,
                "overall_passed": False,
                "error": "无对话日志"
            }

        results = self.dialog_evaluator.evaluate_batch(dialog_logs)

        print(f"[EvaluateOnly] 评估完成:")
        print(f"  - 平均教学风格得分: {results['avg_scores'].get('教学风格符合度', 0):.1f}")
        print(f"  - 平均连贯性得分: {results['avg_scores'].get('上下文连贯性', 0):.1f}")
        print(f"  - 平均工具调用得分: {results['avg_scores'].get('工具调用合理性', 0):.1f}")
        print(f"  - 平均总分: {results['avg_total_score']:.1f}")
        print(f"  - 通过率: {results['pass_rate']*100:.1f}%")

        return results

    def save_evaluation_results(self, evaluation_results: Dict[str, Any]) -> str:
        """
        保存评估结果

        Args:
            evaluation_results: 评估结果

        Returns:
            保存的文件路径
        """
        print("[EvaluateOnly] 保存评估结果...")

        filepath = self.report_generator.save_evaluation_results(evaluation_results)

        print(f"[EvaluateOnly] 评估结果已保存: {filepath}")

        return filepath

    def print_summary(self, evaluation_results: Dict[str, Any]):
        """
        打印评估摘要

        Args:
            evaluation_results: 评估结果
        """
        print("\n" + "=" * 50)
        print("NPC Dialog Evaluation Summary")
        print("=" * 50)

        avg_total = evaluation_results.get("avg_total_score", 0)
        pass_rate = evaluation_results.get("pass_rate", 0)
        passed_count = evaluation_results.get("passed_count", 0)
        total_count = evaluation_results.get("total_count", 0)

        print(f"\nOverall Results:")
        print(f"  Average Total Score: {avg_total:.1f}")
        print(f"  Pass Threshold: {TOTAL_DIALOG_PASS_THRESHOLD}")
        print(f"  Sessions Passed: {passed_count}/{total_count}")
        print(f"  Pass Rate: {pass_rate*100:.1f}%")

        avg_scores = evaluation_results.get("avg_scores", {})
        print(f"\nDimension Scores:")
        print(f"  教学风格符合度: {avg_scores.get('教学风格符合度', 0):.1f}")
        print(f"  上下文连贯性: {avg_scores.get('上下文连贯性', 0):.1f}")
        print(f"  工具调用合理性: {avg_scores.get('工具调用合理性', 0):.1f}")

        # Print failed sessions
        self._print_failed_sessions(evaluation_results)

        # Print improvement suggestions
        self._print_improvement_suggestions(evaluation_results)

        print("\n" + "=" * 50)

        # Final verdict
        passed = avg_total >= TOTAL_DIALOG_PASS_THRESHOLD
        print(f"\nFinal Verdict: {'PASS' if passed else 'FAIL'}")
        print("=" * 50 + "\n")

    def _extract_failed_sessions(
        self,
        evaluation_results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        提取失败的会话列表

        Args:
            evaluation_results: 评估结果

        Returns:
            失败会话列表
        """
        return [
            r for r in evaluation_results.get("results", [])
            if not r.get("passed", True)
        ]

    def _print_failed_sessions(self, evaluation_results: Dict[str, Any]):
        """
        打印失败会话信息

        Args:
            evaluation_results: 评估结果
        """
        failed_sessions = self._extract_failed_sessions(evaluation_results)

        if failed_sessions:
            print(f"\nFailed Sessions ({len(failed_sessions)}):")
            for session in failed_sessions[:5]:  # Show top 5
                session_id = session.get("session_id", "N/A")
                score = session.get("total_score", 0)
                print(f"  - {session_id}: score={score:.1f}")

    def _extract_improvement_suggestions(
        self,
        evaluation_results: Dict[str, Any]
    ) -> List[str]:
        """
        提取唯一的改进建议列表

        Args:
            evaluation_results: 评估结果

        Returns:
            唯一改进建议列表（最多5条）
        """
        all_suggestions = []
        for result in evaluation_results.get("results", []):
            suggestions = result.get("improvement_suggestions", [])
            all_suggestions.extend(suggestions)

        # Return unique suggestions (deduplicated)
        return list(set(all_suggestions))[:5]

    def _print_improvement_suggestions(self, evaluation_results: Dict[str, Any]):
        """
        打印改进建议

        Args:
            evaluation_results: 评估结果
        """
        unique_suggestions = self._extract_improvement_suggestions(evaluation_results)

        if unique_suggestions:
            print(f"\nTop Improvement Suggestions:")
            for i, suggestion in enumerate(unique_suggestions, 1):
                print(f"  {i}. {suggestion}")

    def run(self, log_dir: str = "logs/dialog") -> bool:
        """
        执行评估流程

        Args:
            log_dir: 日志目录路径

        Returns:
            True 如果评估通过
        """
        try:
            # 1. 验证配置
            print("[EvaluateOnly] 验证配置...")
            validate_config()

            # 2. 收集对话日志
            dialog_logs = self.collect_dialog_logs(log_dir)

            # 3. AI 评估
            evaluation_results = self.evaluate_dialogs(dialog_logs)

            # 4. 保存评估结果
            self.save_evaluation_results(evaluation_results)

            # 5. 打印摘要
            self.print_summary(evaluation_results)

            # 6. 返回评估结果
            return evaluation_results.get("overall_passed", False)

        except Exception as e:
            print(f"[EvaluateOnly] 评估流程失败: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """执行仅评估流程"""
    import argparse

    parser = argparse.ArgumentParser(description="NPC Dialog Evaluate-Only Runner")
    parser.add_argument(
        "--log-dir",
        default="logs/dialog",
        help="对话日志目录路径"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="显示详细输出"
    )

    args = parser.parse_args()

    runner = EvaluateOnlyRunner()

    passed = runner.run(log_dir=args.log_dir)

    if passed:
        print("\n[EvaluateOnly] 对话质量评估通过!")
        sys.exit(0)
    else:
        print("\n[EvaluateOnly] 对话质量评估未通过，请查看报告了解详情")
        sys.exit(1)


if __name__ == "__main__":
    main()