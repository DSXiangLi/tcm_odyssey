# hermes_backend/models/chat.py
"""Chat request/response models."""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    """SSE chat request."""
    npc_id: str
    player_id: str
    user_message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    """Non-streaming chat response."""
    response: str
    tool_calls: List[Dict[str, Any]] = []