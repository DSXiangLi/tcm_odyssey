"""Case history data model."""

from pydantic import BaseModel
from typing import List, Optional

class CaseModel(BaseModel):
    case_id: str
    title: str
    completed_at: str
    score: int
    diagnosis: str
    prescription: str
    errors: Optional[List[str]] = None

class CasesResponse(BaseModel):
    cases: List[CaseModel]
    total: int
    completed: int

class CompleteCaseRequest(BaseModel):
    player_id: str
    case_id: str
    title: str
    score: int
    diagnosis: str
    prescription: str
    errors: Optional[List[str]] = None