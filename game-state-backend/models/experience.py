"""Experience data model."""

from pydantic import BaseModel

class ExperienceModel(BaseModel):
    player_id: str
    total_experience: int
    level: int
    prescription_exp: int
    syndrome_exp: int
    diagnosis_exp: int
    updated_at: str

class UpdateExperienceRequest(BaseModel):
    player_id: str
    prescription_exp: int = 0
    syndrome_exp: int = 0
    diagnosis_exp: int = 0