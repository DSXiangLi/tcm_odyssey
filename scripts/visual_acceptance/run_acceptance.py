# scripts/visual_acceptance/run_acceptance.py
"""
Visual Acceptance Flow Coordinator

Main orchestrator that coordinates:
- Git baseline saving
- Screenshot collection
- AI evaluation
- Code modification
- Compile verification
- Iteration loop
- User report generation
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, Any, List

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from scripts.visual_acceptance.config import (
    SCREENSHOT_DIR,
    EVALUATION_DIR,
    SUMMARY_REPORT,
    MAX_ITERATIONS,
    TOTAL_PASS_THRESHOLD,
    validate_config
)
from visual_evaluator.evaluator import VisualEvaluator
from visual_evaluator.report_generator import ReportGenerator
from modification_executor.code_modifier import CodeModifier
from modification_executor.compile_verifier import CompileVerifier
from modification_executor.modification_log import ModificationLog
from modification_executor.suggestion_parser import SuggestionParser


class VisualAcceptanceRunner:
    """Visual Acceptance Flow Coordinator"""

    def __init__(self):
        """Initialize all components."""
        self.evaluator = VisualEvaluator()
        self.report_generator = ReportGenerator()
        self.code_modifier = CodeModifier()
        self.compile_verifier = CompileVerifier()
        self.modification_log = ModificationLog()
        self.parser = SuggestionParser()
        self.project_root = project_root

    def run(self, max_iterations: int = MAX_ITERATIONS) -> Dict[str, Any]:
        """
        Execute the visual acceptance workflow.

        Args:
            max_iterations: Maximum number of iterations (default from config)

        Returns:
            Result dict with success, iterations, screenshot_count, etc.
        """

        print("=== Visual Acceptance Automation System Started ===")
        print(f"Project root: {self.project_root}")
        print(f"Max iterations: {max_iterations}")

        # 0. Validate configuration
        try:
            validate_config()
            print("\n[0] Configuration validated successfully")
        except ValueError as e:
            print(f"\nConfiguration error: {e}")
            return {"success": False, "error": str(e)}

        # 1. Save baseline
        print("\n[1] Saving baseline...")
        baseline_result = self._git_commit_current()
        if baseline_result["success"]:
            print("Baseline saved successfully")
        else:
            print(f"Warning: Could not save baseline - {baseline_result.get('error')}")

        branch_result = self._create_dev_branch()
        if branch_result["success"]:
            print(f"Dev branch created: {branch_result.get('branch')}")
        else:
            print(f"Warning: Could not create dev branch - {branch_result.get('error')}")

        # 2. Collect screenshots
        print("\n[2] Collecting screenshots...")
        screenshots = self._collect_screenshots()
        if not screenshots:
            print("Screenshot collection failed or returned empty")
            return {"success": False, "error": "Screenshot collection failed"}

        print(f"Collected {len(screenshots)} screenshots")

        # 3. Evaluation loop
        iterations = 0
        all_passed = False
        all_evaluations = []
        all_modifications = []

        while iterations < max_iterations and not all_passed:
            print(f"\n[3] Evaluation round {iterations + 1}/{max_iterations}")

            # Evaluate all screenshots
            evaluations = self._evaluate_batch(screenshots)
            all_evaluations.extend(evaluations)

            # Check if all passed
            all_passed = all(e.get("pass", False) for e in evaluations)
            if all_passed:
                print("All scenes passed evaluation!")
                break

            # Aggregate improvements by priority
            improvements = self._aggregate_improvements(evaluations)

            if not improvements.get("high") and not improvements.get("medium"):
                print("No actionable improvements found")
                break

            # Apply modifications
            modifications = self._apply_modifications(improvements)
            all_modifications.extend(modifications)

            # Compile verification
            print("\nVerifying compilation...")
            verify_result = self.compile_verifier.full_verify()
            if not verify_result["success"]:
                print(f"Verification failed: {verify_result.get('error', 'Unknown error')}")
                self._rollback_modifications()
                break

            print("Verification passed!")

            # Re-collect screenshots for next iteration
            print("\nRe-collecting screenshots...")
            screenshots = self._collect_screenshots()
            if not screenshots:
                print("Re-collection failed")
                break

            iterations += 1

        # 4. Generate reports
        print("\n[4] Generating acceptance reports...")
        self.report_generator.generate_summary_report(
            all_evaluations, all_modifications, iterations + 1
        )
        self.modification_log.save_log()

        # 5. Output result summary
        print("\n=== Acceptance Result Summary ===")
        print(f"Iterations: {iterations + 1}")
        print(f"Screenshot count: {len(screenshots)}")
        print(f"Modification count: {len(all_modifications)}")
        print(f"Final status: {'PASSED' if all_passed else 'NOT PASSED'}")

        if not all_passed:
            print("\nPlease check detailed report: reports/visual_acceptance/summary_report.md")
            print("Acceptance not passed, please handle remaining issues manually")

        return {
            "success": all_passed,
            "iterations": iterations + 1,
            "screenshot_count": len(screenshots),
            "modification_count": len(all_modifications),
            "report_path": SUMMARY_REPORT
        }

    def _git_commit_current(self) -> Dict[str, Any]:
        """Commit current changes as baseline."""
        try:
            # Check if there are changes to commit
            status_result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )

            if status_result.stdout.strip():
                # Has changes, commit them
                subprocess.run(["git", "add", "-A"], cwd=self.project_root, check=True)
                subprocess.run(
                    ["git", "commit", "-m", "chore: visual acceptance baseline save"],
                    cwd=self.project_root,
                    check=True
                )
                return {"success": True, "message": "Changes committed"}
            else:
                return {"success": True, "message": "No changes to commit"}

        except subprocess.CalledProcessError as e:
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _create_dev_branch(self) -> Dict[str, Any]:
        """Create visual acceptance dev branch."""
        branch_name = "visual-acceptance-dev"
        try:
            # Check if branch already exists
            result = subprocess.run(
                ["git", "branch", "--list", branch_name],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )

            if branch_name in result.stdout:
                # Branch exists, checkout
                subprocess.run(
                    ["git", "checkout", branch_name],
                    cwd=self.project_root,
                    check=True
                )
                return {"success": True, "branch": branch_name, "existing": True}
            else:
                # Create new branch
                subprocess.run(
                    ["git", "checkout", "-b", branch_name],
                    cwd=self.project_root,
                    check=True
                )
                return {"success": True, "branch": branch_name, "existing": False}

        except subprocess.CalledProcessError as e:
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _collect_screenshots(self) -> List[Dict[str, str]]:
        """Collect screenshots using Playwright tests."""

        # Run Playwright test to collect screenshots
        result = subprocess.run(
            [
                "npx", "playwright", "test",
                "tests/visual_acceptance/screenshot_collector.spec.ts",
                "--workers=1"
            ],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"Screenshot collection test failed: {result.stderr}")
            return []

        # Read collection report
        report_path = os.path.join(self.project_root, SCREENSHOT_DIR, "collection_report.json")
        if os.path.exists(report_path):
            with open(report_path, 'r', encoding='utf-8') as f:
                report = json.load(f)

            screenshots = []
            for scene in report.get("scenes", []):
                for i in range(scene.get("count", 0)):
                    filename = f"{scene['id']}-{i+1}.png"
                    screenshots.append({
                        "path": os.path.join(self.project_root, SCREENSHOT_DIR, filename),
                        "scene_id": scene["id"],
                        "scene_context": scene.get("name", scene["id"]),
                        "context": scene.get("context", {})
                    })
            return screenshots

        # Fallback: scan directory for PNG files
        screenshot_dir = os.path.join(self.project_root, SCREENSHOT_DIR)
        if os.path.exists(screenshot_dir):
            screenshots = []
            for filename in os.listdir(screenshot_dir):
                if filename.endswith('.png') and not filename.startswith('collection'):
                    scene_id = filename.split('-')[0]
                    screenshots.append({
                        "path": os.path.join(screenshot_dir, filename),
                        "scene_id": scene_id,
                        "scene_context": scene_id,
                        "context": {}
                    })
            return screenshots

        return []

    def _evaluate_batch(self, screenshots: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Evaluate batch of screenshots."""
        evaluations = []
        for screenshot in screenshots:
            print(f"Evaluating: {screenshot['scene_id']}")
            try:
                evaluation = self.evaluator.evaluate_single(
                    screenshot['path'],
                    screenshot['scene_id'],
                    screenshot.get('context', {})
                )
                self.report_generator.save_evaluation_report(
                    evaluation, screenshot['scene_id']
                )
                evaluations.append(evaluation)
            except Exception as e:
                print(f"Evaluation error for {screenshot['scene_id']}: {e}")
                evaluations.append({
                    "scene_id": screenshot['scene_id'],
                    "error": str(e),
                    "pass": False,
                    "weighted_score": 0
                })
        return evaluations

    def _aggregate_improvements(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Aggregate improvements by priority."""
        all_improvements = []
        for evaluation in evaluations:
            if not evaluation.get("pass", False):
                improvements = self.parser.parse_improvements(evaluation)
                all_improvements.extend(improvements)
        return self.parser.aggregate_by_priority(all_improvements)

    def _apply_modifications(
        self,
        improvements: Dict[str, List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """Apply modifications by priority."""

        modifications = []

        # Process by priority: high -> medium -> low
        for priority in ["high", "medium", "low"]:
            for imp in improvements.get(priority, []):
                print(f"Modifying [{priority}]: {imp.get('suggestion', '')[:50]}...")
                result = self.code_modifier.apply_modification(imp)
                self.modification_log.log_modification(result, imp)
                modifications.append(result)

                if result.get("success"):
                    print(f"  Success: {imp.get('target_file')}")
                else:
                    print(f"  Failed: {result.get('error')}")

        return modifications

    def _rollback_modifications(self):
        """Rollback all modifications."""
        try:
            subprocess.run(["git", "checkout", "."], cwd=self.project_root, check=True)
            print("All modifications rolled back")
        except subprocess.CalledProcessError as e:
            print(f"Rollback failed: {e}")


def main():
    """Main entry point."""
    runner = VisualAcceptanceRunner()
    result = runner.run()

    if result["success"]:
        print("\nAcceptance PASSED! Please confirm and merge dev branch")
        print("Confirm command: git checkout master && git merge visual-acceptance-dev")
    else:
        print("\nAcceptance NOT PASSED, please check report and handle manually")
        print(f"Report path: {result['report_path']}")

    return result


if __name__ == "__main__":
    main()