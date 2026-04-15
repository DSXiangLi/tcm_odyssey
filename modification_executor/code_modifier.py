# modification_executor/code_modifier.py

import os
import re
from typing import Dict, Any, List
from .suggestion_parser import SuggestionParser


class CodeModifier:
    """代码修改执行器"""

    def __init__(self):
        self.parser = SuggestionParser()
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def apply_modification(self, improvement: Dict[str, Any]) -> Dict[str, Any]:
        """应用单个修改

        Args:
            improvement: 修改建议字典

        Returns:
            修改结果字典，包含success、filepath、error等信息
        """

        target_file = improvement.get("target_file")
        if not target_file:
            return {"success": False, "error": "未找到目标文件"}

        filepath = os.path.join(self.project_root, target_file)
        if not os.path.exists(filepath):
            return {"success": False, "error": f"文件不存在: {filepath}"}

        modification_type = improvement.get("modification_type")
        code_hint = improvement.get("code_hint", "")

        result = {"success": False, "filepath": filepath, "type": modification_type}

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # 根据修改类型执行不同策略
            if modification_type == "style":
                new_content = self._apply_style_change(content, code_hint)
            elif modification_type == "layout":
                new_content = self._apply_layout_change(content, code_hint)
            elif modification_type == "add_element":
                new_content = self._apply_add_element(content, code_hint, improvement)
            else:
                return {"success": False, "error": f"未知修改类型: {modification_type}"}

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                result["success"] = True
                result["description"] = improvement.get("suggestion")
            else:
                result["success"] = False
                result["error"] = "修改未生效（可能未找到匹配代码）"

        except Exception as e:
            result["error"] = str(e)

        return result

    def apply_batch(self, improvements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """批量应用修改

        Args:
            improvements: 修改建议列表

        Returns:
            修改结果列表
        """

        results = []
        for imp in improvements:
            result = self.apply_modification(imp)
            results.append(result)
        return results

    def _apply_style_change(self, content: str, code_hint: str) -> str:
        """应用样式修改（颜色、字体等）

        Args:
            content: 文件原始内容
            code_hint: 代码提示，如 "#ffffff → #f5e6d3"

        Returns:
            修改后的内容
        """

        # 解析颜色值提示: "#ffffff → #f5e6d3"
        color_pattern = r"#([a-fA-F0-9]{3,6})\s*→\s*#([a-fA-F0-9]{3,6})"
        match = re.search(color_pattern, code_hint)

        if match:
            old_color_hex = match.group(1)  # Without hash
            new_color = "#" + match.group(2)

            # 更精确的颜色替换：只在样式属性上下文中替换
            # 匹配模式：样式属性名: '#颜色值' 或样式属性名: "#颜色值"
            style_property_pattern = rf"(backgroundColor|color|borderColor|fill|stroke|textColor|fontColor|background|tint|alpha):\s*(['\"])#({old_color_hex})(['\"])"

            # 使用回调函数进行精确替换
            def replace_color_in_context(m):
                prop = m.group(1)
                open_quote = m.group(2)
                close_quote = m.group(4)
                return f"{prop}: {open_quote}{new_color}{close_quote}"

            content = re.sub(style_property_pattern, replace_color_in_context, content)

        return content

    def _apply_layout_change(self, content: str, code_hint: str) -> str:
        """应用布局修改（位置、间距等）

        Args:
            content: 文件原始内容
            code_hint: 代码提示，如 "x: 50 → x: 80"

        Returns:
            修改后的内容
        """

        # 解析数值提示: "x: 50 → x: 80"
        value_pattern = r"(\w+):\s*(\d+)\s*→\s*(\d+)"
        match = re.search(value_pattern, code_hint)

        if match:
            prop_name = match.group(1)
            old_value = match.group(2)
            new_value = match.group(3)

            # 替换属性值
            pattern = rf"{prop_name}:\s*{old_value}"
            replacement = f"{prop_name}: {new_value}"
            content = re.sub(pattern, replacement, content)

        return content

    def _apply_add_element(self, content: str, code_hint: str, improvement: Dict[str, Any]) -> str:
        """应用新增元素修改

        Args:
            content: 文件原始内容
            code_hint: 代码提示
            improvement: 完整的修改建议

        Returns:
            修改后的内容（添加TODO注释标记）
        """

        # 这类修改较复杂，通常需要人工处理
        # 此处仅记录建议，实际修改需要更详细的代码结构分析

        # 查找合适的插入位置（如在create方法末尾）
        create_pattern = r"(create\s*\([^)]*\)\s*:\s*void\s*\{)"
        match = re.search(create_pattern, content)

        if match and code_hint:
            # 插入注释标记，提示需要人工处理
            insert_pos = match.end()
            comment = f"\n    // TODO: {improvement.get('suggestion')}\n"
            content = content[:insert_pos] + comment + content[insert_pos:]

        return content