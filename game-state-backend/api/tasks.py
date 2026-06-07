"""Tasks API endpoints."""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import json

from database.connection import get_db
from models import (
    TasksResponse, TaskModel, TodoModel, CreateTaskRequest,
    UpdateTaskRequest, CompleteTaskWithRewardRequest,
    GameTaskConfig, PendingGameResponse
)
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
            updated_at=row['updated_at'],

            # 游戏任务扩展字段（使用安全获取）
            game_type=row['game_type'] if 'game_type' in row.keys() else None,
            game_config=row['game_config'] if 'game_config' in row.keys() else None,
            score=row['score'] if 'score' in row.keys() else 0.0,
            reward=row['reward'] if 'reward' in row.keys() else None,
            version=row['version'] if 'version' in row.keys() else 0
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
    """Create new task (supports game_task type)."""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    try:
        # 插入任务（支持游戏任务扩展字段）
        conn.execute("""
            INSERT INTO tasks
            (player_id, task_id, title, type, status, progress, blocked_by,
             created_at, updated_at, game_type, game_config, reward)
            VALUES (?, ?, ?, ?, 'pending', 0.0, ?, ?, ?, ?, ?, ?)
        """, (
            request.player_id, request.task_id, request.title,
            request.type, request.blocked_by, now, now,
            request.game_type, request.game_config, request.reward
        ))
        conn.commit()

        return {
            "success": True,
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


# ===== Phase 2.5 新增API =====

@router.get("/task/{task_id}")
async def get_task_detail(task_id: str):
    """Query single task detail (for game scenes to get reward config)."""
    conn = get_db()

    row = conn.execute(
        "SELECT * FROM tasks WHERE task_id = ?",
        (task_id,)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail={
            "code": "TASK_NOT_FOUND",
            "message": f"Task {task_id} not found"
        })

    return {
        "success": True,
        "task": {
            "task_id": row['task_id'],
            "title": row['title'],
            "type": row['type'],
            "status": row['status'],
            "game_type": row['game_type'] if 'game_type' in row.keys() else None,
            "game_config": row['game_config'] if 'game_config' in row.keys() else None,
            "reward": row['reward'] if 'reward' in row.keys() else None,
            "score": row['score'] if 'score' in row.keys() else 0.0,
            "version": row['version'] if 'version' in row.keys() else 0,
            "created_at": row['created_at'],
            "updated_at": row['updated_at']
        }
    }


@router.get("/tasks/{player_id}/pending_game", response_model=PendingGameResponse)
async def get_pending_game_tasks(player_id: str):
    """Query pending game tasks for player."""
    conn = get_db()

    rows = conn.execute("""
        SELECT * FROM tasks
        WHERE player_id = ? AND status = 'pending' AND game_type IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
    """, (player_id,)).fetchall()

    if rows:
        row = rows[0]
        return PendingGameResponse(
            pending_game=GameTaskConfig(
                task_id=row['task_id'],
                title=row['title'],
                game_type=row['game_type'],
                game_config=row['game_config'],
                reward=row['reward'] if 'reward' in row.keys() else None,
                status=row['status'],
                created_at=row['created_at']
            )
        )

    return PendingGameResponse(pending_game=None)


@router.post("/task/update")
async def update_task(request: UpdateTaskRequest):
    """Update task status (with optimistic lock)."""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    try:
        conn.execute("BEGIN TRANSACTION")

        # 查询当前版本（乐观锁检查）
        current = conn.execute(
            "SELECT status, version FROM tasks WHERE task_id = ?",
            (request.task_id,)
        ).fetchone()

        if not current:
            conn.execute("ROLLBACK")
            raise HTTPException(status_code=404, detail={
                "code": "TASK_NOT_FOUND",
                "message": f"Task {request.task_id} not found"
            })

        # 状态验证
        if current['status'] == 'completed':
            conn.execute("ROLLBACK")
            raise HTTPException(status_code=409, detail={
                "code": "TASK_ALREADY_COMPLETED",
                "message": "Task already completed"
            })

        # 更新任务（带版本检查）
        updated = conn.execute("""
            UPDATE tasks
            SET progress = COALESCE(?, progress),
                status = COALESCE(?, status),
                score = COALESCE(?, score),
                updated_at = ?,
                version = version + 1
            WHERE task_id = ? AND version = ?
        """, (request.progress, request.status, request.score, now, request.task_id, current['version']))

        # 检查是否成功（并发冲突检测）
        if updated.rowcount == 0:
            conn.execute("ROLLBACK")
            raise HTTPException(status_code=409, detail={
                "code": "CONCURRENT_UPDATE_CONFLICT",
                "message": "Concurrent update conflict - please retry"
            })

        conn.execute("COMMIT")

        return {
            "success": True,
            "status": "updated",
            "task_id": request.task_id,
            "updated_at": now
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.execute("ROLLBACK")
        raise HTTPException(status_code=500, detail={
            "code": "DATABASE_ERROR",
            "message": str(e)
        })


@router.post("/task/complete_with_reward")
async def complete_task_with_reward(request: CompleteTaskWithRewardRequest):
    """Complete task + grant reward (atomic transaction)."""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    try:
        conn.execute("BEGIN TRANSACTION")

        # 1. 查询任务详情（包含奖励配置）
        task = conn.execute(
            "SELECT * FROM tasks WHERE task_id = ?",
            (request.task_id,)
        ).fetchone()

        if not task or task['status'] == 'completed':
            conn.execute("ROLLBACK")
            raise HTTPException(status_code=409, detail={
                "code": "TASK_ALREADY_COMPLETED",
                "message": "Invalid task state"
            })

        # 2. 更新任务状态
        conn.execute("""
            UPDATE tasks
            SET status='completed', score=?, progress=1.0, version=version+1, updated_at=?
            WHERE task_id=? AND version=?
        """, (request.score, now, request.task_id, task['version']))

        # 3. 解析奖励配置
        reward = json.loads(task['reward']) if task['reward'] else None

        # 4. 发放奖励（原子性）
        reward_granted = None
        if reward and reward.get('herbs'):
            for herb in reward['herbs']:
                # 检查herb_id是否存在
                herb_exists = conn.execute(
                    "SELECT 1 FROM inventory WHERE player_id = ? AND herb_id = ?",
                    (task['player_id'], herb['herb_id'])
                ).fetchone()

                if herb_exists:
                    # 更新现有药材数量
                    conn.execute("""
                        UPDATE inventory
                        SET raw_count = raw_count + ?, updated_at = ?
                        WHERE player_id = ? AND herb_id = ?
                    """, (herb['delta'], now, task['player_id'], herb['herb_id']))
                else:
                    # 创建新药材记录（稀有度为1）
                    conn.execute("""
                        INSERT INTO inventory
                        (player_id, herb_id, name, category, raw_count, piece_count, updated_at)
                        VALUES (?, ?, ?, 'unknown', ?, 0, ?)
                    """, (task['player_id'], herb['herb_id'], herb['herb_id'], herb['delta'], now))

            reward_granted = reward

        # 5. 提交事务
        conn.execute("COMMIT")

        return {
            "success": True,
            "status": "completed",
            "task_id": request.task_id,
            "score": request.score,
            "reward_granted": reward_granted,
            "completed_at": now
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.execute("ROLLBACK")
        raise HTTPException(status_code=500, detail={
            "code": "DATABASE_ERROR",
            "message": str(e)
        })