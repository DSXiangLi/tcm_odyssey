# gateway/platforms/game_adapter.py
"""
游戏平台Adapter，将Hermes接入Phaser游戏前端。

参考: hermes-agent/gateway/platforms/base.py
"""

import asyncio
import json
from typing import Optional, Callable, Dict, Any, List
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

# 导入Hermes核心组件
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # Add hermes-agent to path

# 动态导入 - 可能失败，需要处理
try:
    from run_agent import AIAgent
    from hermes_state import SessionDB
    HERMES_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Hermes modules not available: {e}")
    HERMES_AVAILABLE = False
    AIAgent = None
    SessionDB = None


@dataclass
class GameSession:
    """游戏会话数据结构"""
    player_id: str
    npc_id: str
    session_id: str


class GameAdapter:
    """游戏平台Adapter - 将Hermes对话引擎接入游戏前端"""

    def __init__(self, data_dir: str, port: int = 8642):
        """
        初始化GameAdapter

        Args:
            data_dir: 游戏数据目录
            port: API端口
        """
        self.data_dir = data_dir
        self.port = port
        self._stream_callbacks: Dict[str, Callable] = {}

        # 初始化SessionDB（如果Hermes可用）
        if HERMES_AVAILABLE and SessionDB:
            db_path = f"{data_dir}/game_sessions.db"
            self.session_db = SessionDB(db_path=db_path)
            logger.info(f"SessionDB initialized at {db_path}")
        else:
            self.session_db = None
            logger.warning("SessionDB not available - using in-memory storage")
            self._memory_sessions: Dict[str, List[Dict]] = {}

    async def handle_player_message(
        self,
        player_id: str,
        npc_id: str,
        message: str,
        on_chunk: Optional[Callable[[str], None]] = None
    ) -> Dict[str, Any]:
        """
        处理玩家发送给NPC的消息

        Args:
            player_id: 玩家ID
            npc_id: NPC ID（如 "qingmu"）
            message: 玩家消息
            on_chunk: 流式输出回调

        Returns:
            {"response": str, "tool_calls": list, "session_id": str}
        """
        session_id = f"{npc_id}_{player_id}"

        # 注册流式回调
        if on_chunk:
            self._stream_callbacks[session_id] = on_chunk

        if HERMES_AVAILABLE and self.session_db:
            # 使用Hermes SessionDB
            session = self.session_db.get_session(session_id)

            if session is None:
                # 创建新会话
                session = self.session_db.create_session(
                    source="game",
                    user_id=player_id,
                    model="anthropic/claude-opus-4.6",
                    system_prompt=f"NPC: {npc_id}"
                )

            # 创建AIAgent
            agent = AIAgent(
                model="anthropic/claude-opus-4.6",
                platform="game",
                session_id=session.id,
                skip_context_files=False,
                skip_memory=False
            )

            # 获取对话历史
            history = self.session_db.get_messages(session.id)

            # 运行对话
            result = await agent.run_conversation(
                user_message=message,
                conversation_history=history
            )

            # 保存对话历史
            self.session_db.save_messages(session.id, result["messages"])

            return {
                "response": result["response"],
                "tool_calls": result.get("tool_calls", []),
                "session_id": session.id
            }
        else:
            # 降级模式：使用简单的内存存储
            logger.info(f"Using fallback mode for session {session_id}")

            # 简单的模拟响应
            response = f"[{npc_id}]: 收到你的消息 '{message}'，Hermes暂时不可用。"

            return {
                "response": response,
                "tool_calls": [],
                "session_id": session_id
            }

    def get_session_history(self, session_id: str) -> List[Dict]:
        """获取会话历史"""
        if self.session_db:
            return self.session_db.get_messages(session_id)
        else:
            return self._memory_sessions.get(session_id, [])

    def search_history(self, query: str, npc_id: str, player_id: str) -> List[Dict]:
        """搜索对话历史（FTS5）"""
        session_id = f"{npc_id}_{player_id}"
        if self.session_db:
            return self.session_db.search_messages(session_id, query)
        else:
            # 简单的关键词搜索
            history = self._memory_sessions.get(session_id, [])
            return [msg for msg in history if query.lower() in str(msg).lower()]

    def clear_session(self, session_id: str) -> bool:
        """清除会话"""
        if self.session_db:
            self.session_db.delete_session(session_id)
            return True
        else:
            if session_id in self._memory_sessions:
                del self._memory_sessions[session_id]
            return True

    def get_all_sessions(self, player_id: str) -> List[str]:
        """获取玩家所有会话"""
        if self.session_db:
            return self.session_db.get_sessions_for_user(player_id)
        else:
            return [k for k in self._memory_sessions.keys() if player_id in k]


# 创建全局实例的工厂函数
def create_game_adapter(data_dir: str = None, port: int = 8642) -> GameAdapter:
    """
    创建GameAdapter实例

    Args:
        data_dir: 数据目录，默认使用当前目录下的src/data
        port: API端口
    """
    if data_dir is None:
        import os
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')

    return GameAdapter(data_dir=data_dir, port=port)