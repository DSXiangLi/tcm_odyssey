# hermes_backend/gateway/game_adapter.py
"""Game state adapter for tool handlers."""
import json
from pathlib import Path
from typing import Dict, Any, Optional, List

class MockGameStore:
    """Mock game store for development/testing."""

    def __init__(self):
        self._player_tasks: Dict[str, Dict[str, Any]] = {}
        self._case_progress: Dict[str, Dict[str, Any]] = {}
        self._inventory: Dict[str, Dict[str, Any]] = {}
        self._weaknesses: Dict[str, List[Dict[str, Any]]] = {}

        # Initialize with mock data
        self._init_mock_data()

    def _init_mock_data(self):
        """Initialize mock data for testing."""
        self._player_tasks['player_001'] = {
            'tasks': [
                {'id': 'mahuang-tang-learning', 'title': '麻黄汤', 'progress': 0.65,
                 'weaknesses': ['配伍意义', '方歌'], 'status': 'in_progress'},
                {'id': 'guizhi-tang-learning', 'title': '桂枝汤', 'progress': 0.0,
                 'weaknesses': [], 'status': 'pending', 'blocked_by': 'mahuang-tang-learning'}
            ],
            'statistics': {'total': 2, 'completed': 0, 'avg_progress': 0.32}
        }

        self._case_progress['player_001'] = {
            'cases': [
                {'id': 'case_001', 'title': '感冒风寒表实证', 'status': 'completed',
                 'score': 88, 'diagnosis': '风寒表实', 'prescription': '麻黄汤'}
            ],
            'unlock_conditions': {
                'case_002': {'blocked_by': 'case_001', 'reason': '需先完成风寒表实证'}
            }
        }

        self._inventory['player_001'] = {
            'herbs': [
                {'id': 'mahuang', 'name': '麻黄', 'quantity': 5},
                {'id': 'guizhi', 'name': '桂枝', 'quantity': 3}
            ],
            'knowledge': ['麻黄性味', '桂枝功效']
        }

    def get_player_tasks(self, player_id: str, task_type: str = 'all') -> Dict[str, Any]:
        """Get player learning tasks."""
        return self._player_tasks.get(player_id, {'tasks': [], 'statistics': {}})

    def get_case_progress(self, player_id: str, case_id: str = 'all') -> Dict[str, Any]:
        """Get player case progress."""
        return self._case_progress.get(player_id, {'cases': [], 'unlock_conditions': {}})

    def get_inventory(self, player_id: str, category: str = 'herbs') -> Dict[str, Any]:
        """Get player inventory."""
        inv = self._inventory.get(player_id, {})
        if category == 'all':
            return inv
        return {category: inv.get(category, [])}

    def add_weakness(self, player_id: str, task_id: str,
                     weakness_type: str, details: str) -> Dict[str, Any]:
        """Record learning weakness."""
        if player_id not in self._weaknesses:
            self._weaknesses[player_id] = []

        self._weaknesses[player_id].append({
            'task_id': task_id,
            'type': weakness_type,
            'details': details,
            'timestamp': '2026-04-28'
        })

        return {
            'status': 'recorded',
            'task_id': task_id,
            'weakness': {'type': weakness_type, 'details': details}
        }

class MockUserStore:
    """Mock user store for NPC memory."""

    def __init__(self):
        self._profiles: Dict[str, Dict[str, Any]] = {}
        self._init_mock_data()

    def _init_mock_data(self):
        """Initialize mock user profiles."""
        self._profiles['qingmu:player_001'] = {
            'player_profile': {
                'learning_style': '循序渐进型',
                'preferred_topics': ['方剂配伍', '经典引用'],
                'difficulty_level': 'beginner'
            },
            'interaction_history': [
                {'date': '2026-04-27', 'topic': '麻黄汤', 'outcome': '理解良好'}
            ],
            'last_session': {'topic': '桂枝汤', 'pending_question': None}
        }

    def get_player_profile(self, npc_id: str, player_id: str) -> Dict[str, Any]:
        """Get NPC's memory of player."""
        key = f'{npc_id}:{player_id}'
        return self._profiles.get(key, {
            'player_profile': {'difficulty_level': 'beginner'},
            'interaction_history': [],
            'last_session': None
        })

# Global store instances
_game_store: Optional[MockGameStore] = None
_user_store: Optional[MockUserStore] = None

def get_game_store() -> MockGameStore:
    """Get global game store."""
    if _game_store is None:
        _game_store = MockGameStore()
    return _game_store

def get_user_store() -> MockUserStore:
    """Get global user store."""
    if _user_store is None:
        _user_store = MockUserStore()
    return _user_store