"""Experience API endpoints."""

from fastapi import APIRouter, HTTPException
from datetime import datetime

from database.connection import get_db
from models import ExperienceModel, UpdateExperienceRequest

router = APIRouter(prefix="/api", tags=["experience"])

@router.get("/experience/{player_id}", response_model=ExperienceModel)
async def get_experience(player_id: str):
    """Query experience for player."""
    conn = get_db()

    row = conn.execute(
        "SELECT * FROM experience WHERE player_id = ?",
        (player_id,)
    ).fetchone()

    if not row:
        # Return default
        return ExperienceModel(
            player_id=player_id,
            total_experience=0,
            level=1,
            prescription_exp=0,
            syndrome_exp=0,
            diagnosis_exp=0,
            updated_at=datetime.utcnow().isoformat() + "Z"
        )

    return ExperienceModel(
        player_id=row['player_id'],
        total_experience=row['total_experience'],
        level=row['level'],
        prescription_exp=row['prescription_exp'],
        syndrome_exp=row['syndrome_exp'],
        diagnosis_exp=row['diagnosis_exp'],
        updated_at=row['updated_at']
    )

@router.post("/experience/update")
async def update_experience(request: UpdateExperienceRequest):
    """Update experience."""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    total_gain = request.prescription_exp + request.syndrome_exp + request.diagnosis_exp

    conn.execute("""
        INSERT OR REPLACE INTO experience
        (player_id, total_experience, level, prescription_exp, syndrome_exp, diagnosis_exp, updated_at)
        VALUES (
            ?,
            COALESCE((SELECT total_experience FROM experience WHERE player_id = ?), 0) + ?,
            COALESCE((SELECT level FROM experience WHERE player_id = ?), 1),
            COALESCE((SELECT prescription_exp FROM experience WHERE player_id = ?), 0) + ?,
            COALESCE((SELECT syndrome_exp FROM experience WHERE player_id = ?), 0) + ?,
            COALESCE((SELECT diagnosis_exp FROM experience WHERE player_id = ?), 0) + ?,
            ?
        )
    """, (
        request.player_id, request.player_id, total_gain,
        request.player_id, request.player_id, request.prescription_exp,
        request.player_id, request.syndrome_exp, request.player_id, request.diagnosis_exp,
        now
    ))

    conn.commit()

    row = conn.execute(
        "SELECT total_experience FROM experience WHERE player_id = ?",
        (request.player_id,)
    ).fetchone()

    return {
        "status": "updated",
        "total_experience": row['total_experience'],
        "level": row['total_experience'] // 500 + 1  # Simple level calculation
    }