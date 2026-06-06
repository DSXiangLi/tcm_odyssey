"""Cases API endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import json

from database.connection import get_db
from models import CasesResponse, CaseModel, CompleteCaseRequest

router = APIRouter(prefix="/api", tags=["cases"])

@router.get("/cases/{player_id}", response_model=CasesResponse)
async def get_cases(player_id: str):
    """Query case history for player."""
    conn = get_db()

    rows = conn.execute(
        "SELECT * FROM case_history WHERE player_id = ?",
        (player_id,)
    ).fetchall()

    cases = [
        CaseModel(
            case_id=row['case_id'],
            title=row['title'],
            completed_at=row['completed_at'],
            score=row['score'],
            diagnosis=row['diagnosis'],
            prescription=row['prescription'],
            errors=json.loads(row['errors']) if row['errors'] else []
        ) for row in rows
    ]

    return CasesResponse(
        cases=cases,
        total=len(cases),
        completed=len(cases)
    )

@router.post("/case/complete")
async def complete_case(request: CompleteCaseRequest):
    """Record case completion."""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    # Calculate experience gained
    base_exp = 50
    bonus_exp = request.score // 10
    experience_gained = base_exp + bonus_exp

    try:
        # Insert case history
        conn.execute("""
            INSERT INTO case_history
            (player_id, case_id, title, completed_at, score, diagnosis, prescription, errors)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.player_id, request.case_id, request.title,
            now, request.score, request.diagnosis,
            request.prescription, json.dumps(request.errors or [])
        ))

        # Update experience
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
            request.player_id, request.player_id, experience_gained,
            request.player_id, request.player_id, 0,
            request.player_id, 0, request.player_id, experience_gained, now
        ))

        conn.commit()

        return {
            "status": "recorded",
            "case_id": request.case_id,
            "experience_gained": experience_gained,
            "recorded_at": now
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ===== Phase 2.5 新增API =====

class UpdateCaseRequest(BaseModel):
    """病案更新请求（简化版）"""
    player_id: str
    case_id: str
    syndrome: str  # 辨证结果
    score: float
    completed_at: str

@router.post("/cases/update")
async def update_case_history(request: UpdateCaseRequest):
    """Update case history (for diagnosis tasks)."""
    conn = get_db()

    try:
        # 检查是否已存在
        existing = conn.execute(
            "SELECT * FROM case_history WHERE player_id = ? AND case_id = ?",
            (request.player_id, request.case_id)
        ).fetchone()

        if existing:
            # 更新现有记录
            conn.execute("""
                UPDATE case_history
                SET score = ?, completed_at = ?
                WHERE player_id = ? AND case_id = ?
            """, (request.score, request.completed_at, request.player_id, request.case_id))
        else:
            # 创建新记录（使用简化结构）
            conn.execute("""
                INSERT INTO case_history
                (player_id, case_id, title, completed_at, score, diagnosis, prescription, errors)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                request.player_id, request.case_id, request.case_id,
                request.completed_at, request.score, request.syndrome,
                "", "[]"  # prescription和errors使用空值
            ))

        conn.commit()

        return {
            "success": True,
            "status": "updated",
            "case_id": request.case_id
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail={
            "code": "DATABASE_ERROR",
            "message": str(e)
        })