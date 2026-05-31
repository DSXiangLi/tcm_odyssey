"""Todo update model."""

from pydantic import BaseModel
from typing import Optional

class UpdateTodoRequest(BaseModel):
    task_id: str
    todo_id: str
    mastery: float
    status: Optional[str] = None