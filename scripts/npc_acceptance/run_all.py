# scripts/npc_acceptance/run_all.py
"""NPC Acceptance Full Workflow Runner.

执行完整的验收流程:
1. 启动 Hermes Backend (port 8642)
2. 启动 Vite Frontend (port 5173)
3. 等待服务就绪
4. 运行 Playwright E2E 测试
5. 收集对话日志
6. AI 评估对话质量
7. 生成验收报告
8. 清理进程
"""

import json
import subprocess
import sys
import time
import signal
from pathlib import Path
from typing import Dict, List, Any, Optional

import requests

# Handle both module and direct execution imports
try:
    from .config import (
        HERMES_BACKEND_PORT,
        VITE_FRONTEND_PORT,
        SERVICE_READY_TIMEOUT,
        FINAL_ACCEPTANCE_THRESHOLD,
        E2E_TEST_PASS_THRESHOLD,
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
        HERMES_BACKEND_PORT,
        VITE_FRONTEND_PORT,
        SERVICE_READY_TIMEOUT,
        FINAL_ACCEPTANCE_THRESHOLD,
        E2E_TEST_PASS_THRESHOLD,
        TOTAL_DIALOG_PASS_THRESHOLD,
        validate_config,
    )
    from scripts.npc_acceptance.dialog_evaluator import DialogEvaluator
    from scripts.npc_acceptance.report_generator import ReportGenerator


class NPCAcceptanceRunner:
    """NPC验收全流程执行器"""

    def __init__(self, project_root: Optional[Path] = None):
        """
        初始化验收执行器

        Args:
            project_root: 项目根目录路径，默认自动检测
        """
        self.project_root = project_root or Path(__file__).parent.parent.parent
        self.backend_proc: Optional[subprocess.Popen] = None
        self.frontend_proc: Optional[subprocess.Popen] = None

        self.dialog_evaluator = DialogEvaluator()
        self.report_generator = ReportGenerator()

        self.test_result: Dict[str, Any] = {}
        self.evaluation_results: Dict[str, Any] = {}
        self.trigger_logs: List[Dict[str, Any]] = []

    def launch_backend(self) -> subprocess.Popen:
        """
        启动 Hermes Backend

        Returns:
            后端进程对象
        """
        backend_dir = self.project_root / "hermes_backend"

        print(f"[NPCAcceptance] 启动 Hermes Backend (port {HERMES_BACKEND_PORT})...")

        proc = subprocess.Popen(
            ["python", "main.py"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        self.backend_proc = proc
        return proc

    def launch_frontend(self) -> subprocess.Popen:
        """
        启动 Vite Frontend

        Returns:
            前端进程对象
        """
        print(f"[NPCAcceptance] 启动 Vite Frontend (port {VITE_FRONTEND_PORT})...")

        proc = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=self.project_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        self.frontend_proc = proc
        return proc

    def wait_for_services_ready(self) -> bool:
        """
        等待服务就绪

        Returns:
            True 如果服务就绪

        Raises:
            TimeoutError: 如果服务启动超时
        """
        backend_url = f"http://localhost:{HERMES_BACKEND_PORT}/health"
        frontend_url = f"http://localhost:{VITE_FRONTEND_PORT}"

        print(f"[NPCAcceptance] 等待服务就绪 (timeout: {SERVICE_READY_TIMEOUT}s)...")

        for i in range(SERVICE_READY_TIMEOUT):
            try:
                # Check backend
                backend_resp = requests.get(backend_url, timeout=2)
                if backend_resp.status_code == 200:
                    backend_data = backend_resp.json()
                    print(f"[NPCAcceptance] Backend ready: {backend_data}")

                # Check frontend
                frontend_resp = requests.get(frontend_url, timeout=2)
                if frontend_resp.status_code == 200:
                    print(f"[NPCAcceptance] Frontend ready")

                return True

            except requests.exceptions.RequestException as e:
                if i % 5 == 0:
                    print(f"[NPCAcceptance] 等待中... ({i}/{SERVICE_READY_TIMEOUT}s)")
                time.sleep(1)

        raise TimeoutError(f"服务启动超时 ({SERVICE_READY_TIMEOUT}s)")

    def run_playwright_tests(self) -> Dict[str, Any]:
        """
        运行 Playwright E2E 测试

        Returns:
            测试结果字典，包含:
                - passed: 通过数
                - failed: 失败数
                - total: 总数
                - pass_rate: 通过率
                - failed_tests: 失败测试列表
                - by_category: 按类别统计
        """
        print("[NPCAcceptance] 运行 Playwright E2E 测试...")

        test_file = "tests/e2e/npc-dialog.spec.ts"

        result = subprocess.run(
            [
                "npx", "playwright", "test",
                test_file,
                "--reporter=json",
                "--workers=1"
            ],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )

        # Parse JSON output
        test_result = self._parse_playwright_json_output(result.stdout, result.stderr)

        print(f"[NPCAcceptance] 测试完成: {test_result['passed']}/{test_result['total']} passed")

        return test_result

    def _parse_playwright_json_output(
        self,
        stdout: str,
        stderr: str
    ) -> Dict[str, Any]:
        """
        解析 Playwright JSON 输出

        Args:
            stdout: 标准输出
            stderr: 标准错误

        Returns:
            解析后的测试结果
        """
        # Try to parse JSON report file first
        result = self._try_parse_json_report()
        if result:
            return result

        # Fallback: parse from stdout using regex
        return self._parse_stdout_fallback(stdout, stderr)

    def _try_parse_json_report(self) -> Optional[Dict[str, Any]]:
        """
        尝试解析 JSON 报告文件

        Returns:
            解析后的测试结果，如果失败返回 None
        """
        report_path = self.project_root / "test-results" / "report.json"

        if not report_path.exists():
            return None

        try:
            with open(report_path, 'r') as f:
                report = json.load(f)
                return self._extract_test_stats_from_report(report)
        except Exception as e:
            print(f"[NPCAcceptance] 无法解析 JSON 报告: {e}")
            return None

    def _parse_stdout_fallback(self, stdout: str, stderr: str) -> Dict[str, Any]:
        """
        从 stdout 解析测试结果（fallback 方法）

        Args:
            stdout: 标准输出
            stderr: 标准错误

        Returns:
            解析后的测试结果
        """
        import re

        passed = 0
        failed = 0
        failed_tests = []

        # Parse stdout for test counts
        for line in stdout.split('\n'):
            if 'passed' in line.lower():
                match = re.search(r'(\d+)\s*passed', line)
                if match:
                    passed = int(match.group(1))
            if 'failed' in line.lower():
                match = re.search(r'(\d+)\s*failed', line)
                if match:
                    failed = int(match.group(1))

        total = passed + failed

        # Build result
        return {
            "passed": passed,
            "failed": failed,
            "total": total,
            "pass_rate": passed / total if total > 0 else 0,
            "failed_tests": failed_tests,
            "by_category": {
                "smoke": {"passed": 0, "total": 0},
                "trigger": {"passed": 0, "total": 0},
                "dialog": {"passed": 0, "total": 0},
                "tool": {"passed": 0, "total": 0}
            },
            "stdout": stdout[:1000],  # Keep first 1000 chars
            "stderr": stderr[:1000]
        }

    def _extract_test_stats_from_report(self, report: Dict) -> Dict[str, Any]:
        """
        从 Playwright 报告提取测试统计

        Args:
            report: Playwright JSON 报告

        Returns:
            测试统计结果
        """
        passed = 0
        failed = 0
        total = 0
        failed_tests = []

        # Playwright JSON report structure
        if "suites" in report:
            for suite in report["suites"]:
                for spec in suite.get("specs", []):
                    total += 1
                    if spec.get("ok", False):
                        passed += 1
                    else:
                        failed += 1
                        failed_tests.append({
                            "id": spec.get("id", "N/A"),
                            "name": spec.get("title", "N/A"),
                            "reason": spec.get("error", {}).get("message", "N/A")
                        })

        total = passed + failed

        return {
            "passed": passed,
            "failed": failed,
            "total": total,
            "pass_rate": passed / total if total > 0 else 0,
            "failed_tests": failed_tests,
            "by_category": self._categorize_tests(report)
        }

    def _categorize_tests(self, report: Dict) -> Dict[str, Dict]:
        """
        按类别统计测试

        Args:
            report: Playwright 报告

        Returns:
            类别统计
        """
        categories = {
            "smoke": {"passed": 0, "total": 0},
            "trigger": {"passed": 0, "total": 0},
            "dialog": {"passed": 0, "total": 0},
            "tool": {"passed": 0, "total": 0}
        }

        # Categorize by test ID pattern
        # Smoke tests: NPC-001, NPC-002 (basic smoke tests)
        # Trigger tests: NPC-003, NPC-004 (trigger mechanism tests)
        # Dialog tests: NPC-005, NPC-006 (dialog flow tests)
        # Tool tests: NPC-007, NPC-008 (tool invocation tests)
        for suite in report.get("suites", []):
            for spec in suite.get("specs", []):
                test_id = spec.get("title", "")
                passed = spec.get("ok", False)

                if "NPC-001" in test_id or "NPC-002" in test_id:
                    cat = "smoke"
                elif "NPC-003" in test_id or "NPC-004" in test_id:
                    cat = "trigger"
                elif "NPC-005" in test_id or "NPC-006" in test_id:
                    cat = "dialog"
                elif "NPC-007" in test_id or "NPC-008" in test_id:
                    cat = "tool"
                else:
                    cat = "smoke"  # Default

                categories[cat]["total"] += 1
                if passed:
                    categories[cat]["passed"] += 1

        return categories

    def collect_dialog_logs(self, log_dir: str = "logs/dialog") -> List[Dict[str, Any]]:
        """
        收集对话日志

        Args:
            log_dir: 日志目录路径

        Returns:
            对话日志列表
        """
        print(f"[NPCAcceptance] 收集对话日志 from {log_dir}...")

        dialog_logs = self.dialog_evaluator.collect_dialog_logs(log_dir)

        print(f"[NPCAcceptance] 收集到 {len(dialog_logs)} 条对话日志")

        return dialog_logs

    def export_trigger_logs(self) -> List[Dict[str, Any]]:
        """
        导出触发事件日志

        Returns:
            触发事件日志列表
        """
        trigger_log_path = self.project_root / "logs" / "trigger_events.json"

        if trigger_log_path.exists():
            try:
                with open(trigger_log_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[NPCAcceptance] 无法读取触发日志: {e}")
                return []
        else:
            print(f"[NPCAcceptance] 触发日志文件不存在: {trigger_log_path}")
            return []

    def evaluate_dialogs(self, dialog_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        AI 评估对话质量

        Args:
            dialog_logs: 对话日志列表

        Returns:
            评估结果
        """
        print(f"[NPCAcceptance] AI 评估对话质量 ({len(dialog_logs)} 条)...")

        if not dialog_logs:
            print("[NPCAcceptance] 无对话日志，跳过评估")
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

        print(f"[NPCAcceptance] 评估完成: 平均得分 {results['avg_total_score']:.1f}")

        return results

    def generate_summary_report(
        self,
        test_result: Dict[str, Any],
        evaluation_results: Dict[str, Any],
        trigger_logs: List[Dict[str, Any]]
    ) -> str:
        """
        生成汇总报告

        Args:
            test_result: E2E 测试结果
            evaluation_results: 对话评估结果
            trigger_logs: 触发事件日志

        Returns:
            报告文件路径
        """
        print("[NPCAcceptance] 生成验收报告...")

        report_path = self.report_generator.generate_summary_report(
            test_result,
            evaluation_results,
            trigger_logs
        )

        print(f"[NPCAcceptance] 报告已生成: {report_path}")

        return report_path

    def cleanup_processes(self):
        """
        清理进程
        """
        print("[NPCAcceptance] 清理进程...")

        if self.backend_proc:
            self.backend_proc.terminate()
            try:
                self.backend_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.backend_proc.kill()
            print("[NPCAcceptance] Backend 进程已终止")

        if self.frontend_proc:
            self.frontend_proc.terminate()
            try:
                self.frontend_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.frontend_proc.kill()
            print("[NPCAcceptance] Frontend 进程已终止")

    def is_acceptance_passed(self) -> bool:
        """
        判断验收是否通过

        Returns:
            True 如果验收通过
        """
        final_acceptance = self.report_generator.calculate_final_acceptance(
            self.test_result,
            self.evaluation_results
        )

        passed = final_acceptance.get("passed", False)
        score = final_acceptance.get("score", 0)

        print(f"[NPCAcceptance] 综合验收分数: {score*100:.1f}%")
        print(f"[NPCAcceptance] 验收阈值: {FINAL_ACCEPTANCE_THRESHOLD*100:.0f}%")
        print(f"[NPCAcceptance] 验收结果: {'PASS' if passed else 'FAIL'}")

        return passed

    def run(self) -> bool:
        """
        执行完整验收流程

        Returns:
            True 如果验收通过
        """
        try:
            # 1. 验证配置
            print("[NPCAcceptance] 验证配置...")
            validate_config()

            # 2. 启动服务
            self.launch_backend()
            self.launch_frontend()
            self.wait_for_services_ready()

            # 3. 运行 E2E 测试
            self.test_result = self.run_playwright_tests()
            self.trigger_logs = self.export_trigger_logs()

            # 4. 收集对话日志
            dialog_logs = self.collect_dialog_logs()

            # 5. AI 评估
            self.evaluation_results = self.evaluate_dialogs(dialog_logs)

            # 6. 生成报告
            report_path = self.generate_summary_report(
                self.test_result,
                self.evaluation_results,
                self.trigger_logs
            )

            # 7. 保存评估结果
            eval_path = self.report_generator.save_evaluation_results(self.evaluation_results)

            # 8. 判断验收结果
            passed = self.is_acceptance_passed()

            return passed

        except Exception as e:
            print(f"[NPCAcceptance] 验收流程失败: {e}")
            import traceback
            traceback.print_exc()
            return False

        finally:
            # 9. 清理进程
            self.cleanup_processes()


def main():
    """执行 NPC 验收全流程"""
    runner = NPCAcceptanceRunner()

    passed = runner.run()

    if passed:
        print("\n[NPCAcceptance] 验收通过!")
        sys.exit(0)
    else:
        print("\n[NPCAcceptance] 验收未通过，请查看报告了解详情")
        sys.exit(1)


if __name__ == "__main__":
    main()