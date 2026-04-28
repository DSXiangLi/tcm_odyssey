# hermes_backend/gateway/__init__.py
"""Gateway module for Hermes Backend."""
from .stream_consumer import stream_chat
from .game_adapter import get_game_store, get_user_store

__all__ = ['stream_chat', 'get_game_store', 'get_user_store']