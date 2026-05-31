"""Database schema definitions."""

SCHEMA_SQL = """
-- Tasks表（Task定义和状态）
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    task_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    progress REAL DEFAULT 0.0,
    blocked_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Todos表（Todo mastery）
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    todo_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mastery REAL DEFAULT 0.0,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- Case_history表（病案记录）
CREATE TABLE IF NOT EXISTS case_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    score INTEGER NOT NULL,
    diagnosis TEXT NOT NULL,
    prescription TEXT NOT NULL,
    errors TEXT
);

-- Experience表（经验值）
CREATE TABLE IF NOT EXISTS experience (
    player_id TEXT PRIMARY KEY,
    total_experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    prescription_exp INTEGER DEFAULT 0,
    syndrome_exp INTEGER DEFAULT 0,
    diagnosis_exp INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
);

-- Weakness_log表（薄弱点）
CREATE TABLE IF NOT EXISTS weakness_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    weakness_type TEXT NOT NULL,
    details TEXT NOT NULL,
    task_id TEXT,
    recorded_at TEXT NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_player ON tasks(player_id);
CREATE INDEX IF NOT EXISTS idx_todos_task ON todos(task_id);
CREATE INDEX IF NOT EXISTS idx_cases_player ON case_history(player_id);
CREATE INDEX IF NOT EXISTS idx_weakness_player ON weakness_log(player_id);
"""

def init_database(conn):
    """Initialize database schema."""
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    print("[Database] Schema initialized")