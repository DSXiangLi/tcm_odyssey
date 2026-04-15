# modification_executor/compile_verifier.py

import subprocess
import os
from typing import Dict, Any, List


class CompileVerifier:
    """编译验证器"""

    def __init__(self):
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def verify_typescript(self) -> Dict[str, Any]:
        """验证TypeScript编译

        Returns:
            验证结果字典，包含success、output、errors等信息
        """

        try:
            result = subprocess.run(
                ["npx", "tsc", "--noEmit"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )

            return {
                "success": result.returncode == 0,
                "output": result.stdout + result.stderr,
                "errors": self._parse_errors(result.stderr) if result.returncode != 0 else []
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "编译超时"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def verify_tests(self, test_pattern: str = "tests/unit") -> Dict[str, Any]:
        """验证单元测试

        Args:
            test_pattern: 测试模式，默认为单元测试

        Returns:
            验证结果字典，包含success、output、failed_tests等信息
        """

        try:
            result = subprocess.run(
                ["npm", "run", "test:unit"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=120
            )

            return {
                "success": result.returncode == 0,
                "output": result.stdout + result.stderr,
                "failed_tests": self._parse_failed_tests(result.stdout) if result.returncode != 0 else []
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "测试超时"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def full_verify(self) -> Dict[str, Any]:
        """完整验证（编译+测试）

        Returns:
            验证结果字典
        """

        ts_result = self.verify_typescript()
        if not ts_result["success"]:
            return ts_result

        test_result = self.verify_tests()
        return test_result

    def _parse_errors(self, stderr: str) -> List[str]:
        """解析编译错误

        Args:
            stderr: 标准错误输出

        Returns:
            错误列表
        """
        errors = []
        for line in stderr.split('\n'):
            if 'error TS' in line:
                errors.append(line.strip())
        return errors

    def _parse_failed_tests(self, stdout: str) -> List[str]:
        """解析失败测试

        Args:
            stdout: 标准输出

        Returns:
            失败测试列表
        """
        failed = []
        for line in stdout.split('\n'):
            if 'FAIL' in line or 'Error:' in line:
                failed.append(line.strip())
        return failed