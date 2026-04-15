# modification_executor/suggestion_parser.py

import re
from typing import Dict, Any, List


class SuggestionParser:
    """修改建议解析器"""

    def parse_improvements(self, evaluation: Dict[str, Any]) -> List[Dict[str, Any]]:
        """解析评估结果中的修改建议

        Args:
            evaluation: 评估结果字典，包含improvements列表

        Returns:
            解析后的修改建议列表
        """

        improvements = evaluation.get("improvements", [])
        parsed = []

        for imp in improvements:
            parsed.append({
                "target_file": self._extract_target_file(imp.get("target", "")),
                "target_location": self._extract_location(imp.get("target", "")),
                "suggestion": imp.get("suggestion", ""),
                "priority": imp.get("priority", "medium"),
                "modification_type": imp.get("modification_type", "style"),
                "code_hint": imp.get("code_hint", ""),
                "scene_id": evaluation.get("scene_id", "")
            })

        return parsed

    def aggregate_by_priority(self, all_improvements: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """按优先级聚合修改建议

        Args:
            all_improvements: 所有修改建议列表

        Returns:
            按优先级分组的字典 {"high": [], "medium": [], "low": []}
        """

        grouped = {"high": [], "medium": [], "low": []}
        for imp in all_improvements:
            priority = imp.get("priority", "medium")
            if priority in grouped:
                grouped[priority].append(imp)
        return grouped

    def _extract_target_file(self, target: str) -> str:
        """从target字符串提取目标文件

        Args:
            target: 格式如 "DialogUI.ts - 对话框背景颜色"

        Returns:
            文件路径，如 "src/ui/DialogUI.ts"
        """

        # 格式: "DialogUI.ts - 对话框背景颜色"
        match = re.match(r"([a-zA-Z_]+\.ts)", target)
        if match:
            return f"src/ui/{match.group(1)}"
        return ""

    def _extract_location(self, target: str) -> str:
        """从target字符串提取修改位置描述

        Args:
            target: 格式如 "DialogUI.ts - 对话框背景颜色"

        Returns:
            位置描述，如 "对话框背景颜色"
        """

        # 格式: "DialogUI.ts - 对话框背景颜色"
        if "-" in target:
            return target.split("-", 1)[1].strip()
        return target