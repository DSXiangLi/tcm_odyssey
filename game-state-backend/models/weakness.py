"""Weakness log data model."""

from pydantic import BaseModel
from typing import List, Optional

class WeaknessModel(BaseModel):
    type: str
    details: str
    count: int
    last_recorded: str

class WeaknessesResponse(BaseModel):
    weaknesses: List[WeaknessModel]

class RecordWeaknessRequest(BaseModel):
    player_id: str
    weakness_type: str
    details: str
    task_id: Optional[str] = None