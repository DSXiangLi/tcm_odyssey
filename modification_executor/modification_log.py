# modification_executor/modification_log.py

import os
from datetime import datetime
from typing import Dict, Any, List


class ModificationLog:
    """修改日志记录器"""

    def __init__(self, log_file: str = None):
        """
        Args:
            log_file: 日志文件路径，默认从config读取
        """
        # 使用默认路径或指定路径
        if log_file is None:
            try:
                from scripts.visual_acceptance.config import MODIFICATION_LOG
                self.log_file = MODIFICATION_LOG
            except ImportError:
                self.log_file = "reports/visual_acceptance/modification_log.md"
        else:
            self.log_file = log_file

        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
        self.entries = []

    def log_modification(self, result: Dict[str, Any], improvement: Dict[str, Any]):
        """记录单个修改

        Args:
            result: 修改执行结果
            improvement: 修改建议
        """

        entry = {
            "timestamp": datetime.now().isoformat(),
            "target_file": improvement.get("target_file"),
            "modification_type": improvement.get("modification_type"),
            "suggestion": improvement.get("suggestion"),
            "priority": improvement.get("priority"),
            "success": result.get("success"),
            "error": result.get("error", ""),
            "compile_status": result.get("compile_status", "unknown"),
            "test_status": result.get("test_status", "unknown")
        }
        self.entries.append(entry)

    def save_log(self) -> str:
        """保存日志文件

        Returns:
            日志文件路径
        """

        content = f"""# 修改记录 - {datetime.now().strftime('%Y-%m-%d')}

## 修改总览
- 总修改数: {len(self.entries)}
- 成功数: {sum(1 for e in self.entries if e['success'])}
- 失败数: {sum(1 for e in self.entries if not e['success'])}

## 详细记录

"""

        for i, entry in enumerate(self.entries, 1):
            status = "成功" if entry['success'] else f"失败({entry['error']})"
            content += f"""### 修改#{i}: {entry['suggestion']}
- 文件: {entry['target_file']}
- 类型: {entry['modification_type']}
- 优先级: {entry['priority']}
- 状态: {status}
- 时间: {entry['timestamp']}

"""

        with open(self.log_file, 'w', encoding='utf-8') as f:
            f.write(content)

        return self.log_file

    def get_successful_modifications(self) -> List[Dict[str, Any]]:
        """获取成功修改列表

        Returns:
            成功修改的条目列表
        """
        return [e for e in self.entries if e['success']]