"""Inventory API endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database.connection import get_db

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


class InventoryUpdateRequest(BaseModel):
    player_id: str
    herb_id: str
    raw_count_delta: Optional[int] = 0
    piece_count_delta: Optional[int] = 0


@router.get("/{player_id}")
async def get_inventory(player_id: str):
    """Get all herbs in player's inventory."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT herb_id, name, category, xing, wei, gui, rarity, raw_count, piece_count
        FROM inventory WHERE player_id = ?
        ORDER BY category, name
    """, (player_id,))

    rows = cursor.fetchall()
    herbs = []
    total_raw = 0
    total_piece = 0

    for row in rows:
        herbs.append({
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "xing": row[3],
            "wei": row[4],
            "gui": row[5],
            "rarity": row[6],
            "raw_count": row[7],
            "piece_count": row[8]
        })
        total_raw += row[7]
        total_piece += row[8]

    return {
        "player_id": player_id,
        "herbs": herbs,
        "statistics": {
            "total_herbs": len(herbs),
            "total_raw": total_raw,
            "total_piece": total_piece
        }
    }


@router.get("/{player_id}/{herb_id}")
async def get_herb(player_id: str, herb_id: str):
    """Get single herb details."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT herb_id, name, category, xing, wei, gui, rarity, raw_count, piece_count
        FROM inventory WHERE player_id = ? AND herb_id = ?
    """, (player_id, herb_id))

    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Herb {herb_id} not found")

    return {
        "id": row[0],
        "name": row[1],
        "category": row[2],
        "xing": row[3],
        "wei": row[4],
        "gui": row[5],
        "rarity": row[6],
        "raw_count": row[7],
        "piece_count": row[8]
    }


@router.post("/update")
async def update_inventory(req: InventoryUpdateRequest):
    """Update herb counts (add/subtract deltas)."""
    conn = get_db()
    cursor = conn.cursor()

    # Check herb exists
    cursor.execute("""
        SELECT raw_count, piece_count FROM inventory
        WHERE player_id = ? AND herb_id = ?
    """, (req.player_id, req.herb_id))

    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Herb {req.herb_id} not found")

    # Calculate new counts
    new_raw = row[0] + req.raw_count_delta
    new_piece = row[1] + req.piece_count_delta

    # Validate non-negative
    if new_raw < 0 or new_piece < 0:
        raise HTTPException(status_code=400, detail="Counts cannot be negative")

    # Update
    now = datetime.utcnow().isoformat() + 'Z'
    cursor.execute("""
        UPDATE inventory
        SET raw_count = ?, piece_count = ?, updated_at = ?
        WHERE player_id = ? AND herb_id = ?
    """, (new_raw, new_piece, now, req.player_id, req.herb_id))

    conn.commit()

    return {
        "status": "updated",
        "herb_id": req.herb_id,
        "raw_count": new_raw,
        "piece_count": new_piece
    }
