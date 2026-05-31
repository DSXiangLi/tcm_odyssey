"""Tasks API endpoints."""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime

from database.connection import get_db
from models import TasksResponse, TaskModel, TodoModel, CreateTaskRequest
from models.todo import UpdateTodoRequest

router = APIRouter(prefix="/api", tags=["tasks"])


@router.get("/tasks/{player_id}", response_model=TasksResponse)
async def get_tasks(player_id: str):
    """Query tasks for player."""
    conn = get_db()

    # Query tasks
    rows = conn.execute(
        "SELECT * FROM tasks WHERE player_id = ?",
        (player_id,)
    ).fetchall()

    tasks = []
    for row in rows:
        # Query todos for each task
        todo_rows = conn.execute(
            "SELECT * FROM todos WHERE task_id = ?",
            (row['task_id'],)
        ).fetchall()

        todos = [
            TodoModel(
                todo_id=todo['todo_id'],
                name=todo['name'],
                mastery=todo['mastery'],
                status=todo['status'],
                updated_at=todo['updated_at']
            ) for todo in todo_rows
        ]

        tasks.append(TaskModel(
            task_id=row['task_id'],
            title=row['title'],
            type=row['type'],
            status=row['status'],
            progress=row['progress'],
            blocked_by=row['blocked_by'],
            todos=todos,
            created_at=row['created_at'],
            updated_at=row['updated_at']
        ))

    # Statistics
    total = len(tasks)
    completed = len([t for t in tasks if t.status == 'completed'])
    in_progress = len([t for t in tasks if t.status == 'in_progress'])

    return TasksResponse(
        tasks=tasks,
        statistics={
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "pending": total - completed - in_progress
        }
    )


@router.post("/task/create")
async def create_task(request: CreateTaskRequest):
    """Create new task."""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    try:
        conn.execute("""
            INSERT INTO tasks
            (player_id, task_id, title, type, status, progress, blocked_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'pending', 0.0, ?, ?, ?)
        """, (
            request.player_id, request.task_id, request.title,
            request.type, request.blocked_by, now, now
        ))
        conn.commit()

        return {
            "status": "created",
            "task_id": request.task_id,
            "created_at": now
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/todo/update")
async def update_todo(request: UpdateTodoRequest):
    """Update todo mastery."""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    # Determine status from mastery
    status = request.status or (
        "completed" if request.mastery >= 1.0 else
        "in_progress" if request.mastery > 0.0 else
        "pending"
    )

    try:
        conn.execute("""
            UPDATE todos
            SET mastery = ?, status = ?, updated_at = ?
            WHERE task_id = ? AND todo_id = ?
        """, (request.mastery, status, now, request.task_id, request.todo_id))

        # Update task progress
        conn.execute("""
            UPDATE tasks
            SET progress = (
                SELECT AVG(mastery) FROM todos WHERE task_id = ?
            ),
            updated_at = ?
            WHERE task_id = ?
        """, (request.task_id, now, request.task_id))

        conn.commit()

        return {
            "status": "updated",
            "mastery": request.mastery,
            "updated_at": now
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))