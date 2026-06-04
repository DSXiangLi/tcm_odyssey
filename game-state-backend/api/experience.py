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

    # Get current experience (if exists)
    current = conn.execute(
        "SELECT * FROM experience WHERE player_id = ?",
        (request.player_id,)
    ).fetchone()

    # Calculate new totals
    total_gain = request.prescription_exp + request.syndrome_exp + request.diagnosis_exp
    new_total = (current['total_experience'] if current else 0) + total_gain
    new_level = new_total // 500 + 1

    new_prescription = (current['prescription_exp'] if current else 0) + request.prescription_exp
    new_syndrome = (current['syndrome_exp'] if current else 0) + request.syndrome_exp
    new_diagnosis = (current['diagnosis_exp'] if current else 0) + request.diagnosis_exp

    # Insert with explicit values (no subqueries)
    conn.execute("""
        INSERT OR REPLACE INTO experience
        (player_id, total_experience, level, prescription_exp, syndrome_exp, diagnosis_exp, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        request.player_id, new_total, new_level,
        new_prescription, new_syndrome, new_diagnosis, now
    ))

    conn.commit()

    return {
        "status": "updated",
        "total_experience": new_total,
        "level": new_level
    }