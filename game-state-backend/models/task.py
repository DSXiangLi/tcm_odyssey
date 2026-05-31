"""Task data model."""

from pydantic import BaseModel
from typing import List, Optional
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

class TasksResponse(BaseModel):
    tasks: List[TaskModel]
    statistics: dict

class CreateTaskRequest(BaseModel):
    player_id: str
    task_id: str
    title: str
    type: str
    blocked_by: Optional[str] = None