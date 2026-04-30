# hermes_backend/gateway/dialog_logger.py
"""Dialog Logger for Hermes Backend."""
import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime


class DialogLogger:
    """对话日志记录器

    负责记录 NPC 对话的完整信息：
    - 会话元数据（session_id, npc_id, player_id, 时间戳）
    - 用户输入消息
    - NPC 完整响应文本
    - 工具调用序列（名称、参数、结果）
    - 响应统计（token数、持续时间）
    """

    def __init__(self, log_dir: str = "logs/dialog"):
        self.log_dir = Path(log_dir)
        self.current_session: Dict[str, Any] = {}
        self.text_buffer: str = ""

    def start_session(self, npc_id: str, player_id: str, user_message: str) -> str:
        """开始对话会话

        Args:
            npc_id: NPC标识符（如 'qingmu'）
            player_id: 玩家标识符
            user_message: 用户输入消息

        Returns:
            session_id: 会话唯一标识符
        """
        session_id = f"{npc_id}_{player_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.current_session = {
            "session_id": session_id,
            "npc_id": npc_id,
            "player_id": player_id,
            "timestamp_start": datetime.now().isoformat(),
            "user_message": user_message,
            "tool_calls": [],
            "full_response": ""
        }
        self.text_buffer = ""
        return session_id

    def log_tool_call(self, name: str, args: dict, result: dict):
        """记录工具调用

        Args:
            name: 工具名称
            args: 工具参数
            result: 工具执行结果
        """
        self.current_session["tool_calls"].append({
            "seq": len(self.current_session["tool_calls"]) + 1,
            "name": name,
            "args": args,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })

    def accumulate_text(self, text: str):
        """累积响应文本

        Args:
            text: SSE流中的文本片段
        """
        self.text_buffer += text

    def end_session(self, token_count: int = None) -> str:
        """结束对话会话并保存日志

        Args:
            token_count: 响应token数量（可选）

        Returns:
            保存的日志文件路径
        """
        if not self.current_session:
            return ""

        self.current_session["timestamp_end"] = datetime.now().isoformat()
        self.current_session["full_response"] = self.text_buffer

        # 计算持续时间
        start_time = datetime.fromisoformat(self.current_session["timestamp_start"])
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        self.current_session["response_duration_ms"] = duration_ms

        # token计数（如果未提供，使用文本长度估算）
        if token_count is None:
            token_count = len(self.text_buffer)
        self.current_session["response_token_count"] = token_count

        # 保存文件
        npc_id = self.current_session["npc_id"]
        date_str = datetime.now().strftime('%Y-%m-%d')
        session_id = self.current_session["session_id"]

        file_path = self.log_dir / npc_id / date_str / f"{session_id}.json"
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.current_session, f, ensure_ascii=False, indent=2)

        # 清空缓冲
        self.text_buffer = ""
        self.current_session = {}

        return str(file_path)

    def get_current_session_id(self) -> str:
        """获取当前会话ID"""
        return self.current_session.get("session_id", "")