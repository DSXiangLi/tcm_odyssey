# hermes_backend/tools/__init__.py
"""Tools module for Hermes Backend."""
from .registry import registry, ToolRegistry
from .game_tools import register_all_tools

__all__ = ['registry', 'ToolRegistry', 'register_all_tools']