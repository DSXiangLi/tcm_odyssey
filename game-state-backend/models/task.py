"""Task data model."""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class TodoModel(BaseModel):
    todo_id: str
    name: str
    mastery: float
    status: str
    updated_at: str

class TaskModel(BaseModel):
    task_id: str
    title: str
    type: str
    status: str
    progress: float
    blocked_by: Optional[str] = None
    todos: List[TodoModel] = []
    created_at: str
    updated_at: str

    # 游戏任务扩展字段（Phase 2.5新增）
    game_type: Optional[str] = None  # 'decoction', 'diagnosis', 'processing'
    game_config: Optional[str] = None  # JSON字符串
    score: Optional[float] = 0.0
    reward: Optional[str] = None  # JSON字符串
    version: Optional[int] = 0

class TasksResponse(BaseModel):
    tasks: List[TaskModel]
    statistics: dict

class CreateTaskRequest(BaseModel):
    player_id: str
    task_id: str
    title: str
    type: str
    blocked_by: Optional[str] = None

    # 游戏任务扩展字段（Phase 2.5新增）
    game_type: Optional[str] = None
    game_config: Optional[str] = None  # JSON字符串
    reward: Optional[str] = None  # JSON字符串

class UpdateTaskRequest(BaseModel):
    """任务状态更新请求（带乐观锁）"""
    task_id: str
    progress: Optional[float] = None
    status: Optional[str] = None
    score: Optional[float] = None

class CompleteTaskWithRewardRequest(BaseModel):
    """联合事务请求：任务完成+奖励发放"""
    task_id: str
    score: float

class GameTaskConfig(BaseModel):
    """游戏任务配置（用于pending_game查询）"""
    task_id: str
    title: str
    game_type: str
    game_config: str
    reward: Optional[str] = None
    status: str
    created_at: str

class PendingGameResponse(BaseModel):
    """pending游戏任务查询响应"""
    pending_game: Optional[GameTaskConfig] = None