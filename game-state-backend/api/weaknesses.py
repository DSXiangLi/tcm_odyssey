"""Weakness API endpoints."""

from fastapi import APIRouter, HTTPException
from datetime import datetime

from database.connection import get_db
from models import WeaknessesResponse, WeaknessModel, RecordWeaknessRequest

router = APIRouter(prefix="/api", tags=["weaknesses"])

@router.get("/weaknesses/{player_id}", response_model=WeaknessesResponse)
async def get_weaknesses(player_id: str):
    """Query weaknesses for player (aggregated)."""
    conn = get_db()

    rows = conn.execute("""
        SELECT
            weakness_type,
            details,
            COUNT(*) as count,
            MAX(recorded_at) as last_recorded
        FROM weakness_log
        WHERE player_id = ?
        GROUP BY weakness_type, details
        ORDER BY count DESC
    """, (player_id,)).fetchall()

    weaknesses = [
        WeaknessModel(
            type=row['weakness_type'],
            details=row['details'],
            count=row['count'],
            last_recorded=row['last_recorded']
        ) for row in rows
    ]

    return WeaknessesResponse(weaknesses=weaknesses)

@router.post("/weakness/record")
async def record_weakness(request: RecordWeaknessRequest):
    """Record weakness."""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    conn.execute("""
        INSERT INTO weakness_log
        (player_id, weakness_type, details, task_id, recorded_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        request.player_id, request.weakness_type,
        request.details, request.task_id, now
    ))

    conn.commit()

    return {
        "status": "recorded",
        "recorded_at": now
    }