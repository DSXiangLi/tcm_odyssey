"""SQLite database connection manager."""

import sqlite3
from pathlib import Path
from typing import Optional

class DatabaseConnection:
    """Singleton database connection manager."""

    _instance: Optional['DatabaseConnection'] = None
    _connection: Optional[sqlite3.Connection] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._connection is None:
            db_path = Path(__file__).parent.parent / 'data' / 'player_progress.db'
            self._connection = sqlite3.connect(str(db_path))
            self._connection.row_factory = sqlite3.Row
            print(f"[Database] Connected to {db_path}")

    def get_connection(self) -> sqlite3.Connection:
        """Get database connection."""
        return self._connection

    def close(self):
        """Close database connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
            print("[Database] Connection closed")

def get_db() -> sqlite3.Connection:
    """Get database connection."""
    return DatabaseConnection().get_connection()