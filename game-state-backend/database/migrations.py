"""Database migrations and initialization."""

import json
from pathlib import Path
from datetime import datetime
from .connection import get_db
from .schema import init_database

def migrate_from_tasks_json():
    """Migrate data from Hermes TASKS.json."""
    tasks_json_path = Path(__file__).parent.parent.parent / 'hermes' / 'npcs' / 'qingmu' / 'TASKS.json'

    if not tasks_json_path.exists():
        print("[Migration] TASKS.json not found, skipping")
        return

    try:
        with open(tasks_json_path) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"[Migration] TASKS.json malformed: {e}")
        return
    except Exception as e:
        print(f"[Migration] Error reading TASKS.json: {e}")
        return

    conn = get_db()

    player_id = data['player_id']
    updated_at = data['last_updated']

    for task in data['tasks']:
        # Insert task
        conn.execute("""
            INSERT OR IGNORE INTO tasks
            (player_id, task_id, title, type, status, progress, blocked_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            player_id, task['task_id'], task['title'], task['type'],
            task['status'], task['progress'], task.get('blocked_by'),
            updated_at, updated_at
        ))

        # Insert todos
        for todo in task.get('todos', []):
            conn.execute("""
                INSERT OR IGNORE INTO todos
                (task_id, todo_id, name, mastery, status, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                task['task_id'], todo['id'], todo['name'],
                todo['mastery'], todo['status'], updated_at
            ))

    conn.commit()
    print(f"[Migration] Migrated {len(data['tasks'])} tasks from TASKS.json")

def initialize_database():
    """Initialize database with schema and migrate data."""
    conn = get_db()
    init_database(conn)
    migrate_from_tasks_json()
    print("[Database] Initialization complete")