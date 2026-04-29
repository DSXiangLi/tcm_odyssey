# hermes_backend/main.py
"""Hermes Backend FastAPI entry point."""
import json
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment from parent directory
load_dotenv(Path(__file__).parent.parent / '.env')

from gateway.stream_consumer import stream_chat
from tools.registry import registry
from tools.game_tools import register_all_tools
from models.chat import ChatRequest, ChatResponse

# Create FastAPI app
app = FastAPI(title="Hermes Backend", version="1.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Discover and register tools on startup."""
    register_all_tools()
    print(f"[Hermes] Backend ready. Tools: {len(registry.get_all_tools())}")

@app.get("/health")
async def health_check():
    """Health check endpoint.

    Returns:
        Status dict with npcs list and tools_count.
    """
    return {
        "status": "ok",
        "npcs": ["qingmu", "laozhang", "neighbor"],
        "tools_count": len(registry.get_all_tools())
    }

@app.post("/v1/chat/stream")
async def chat_stream(request: ChatRequest):
    """SSE streaming chat endpoint.

    Args:
        request: ChatRequest with npc_id, player_id, user_message.

    Returns:
        StreamingResponse with SSE chunks.
    """
    async def generate():
        for chunk in stream_chat(request.model_dump()):
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/v1/chat")
async def chat(request: ChatRequest):
    """Non-streaming chat endpoint.

    Args:
        request: ChatRequest with npc_id, player_id, user_message.

    Returns:
        ChatResponse with full response and tool_calls.
    """
    full_response = ""
    tool_calls = []

    for chunk in stream_chat(request.model_dump()):
        if chunk['type'] == 'text':
            full_response += chunk['content']
        elif chunk['type'] == 'tool_call':
            tool_calls.append({
                'name': chunk['name'],
                'args': chunk['args']
            })

    return ChatResponse(response=full_response, tool_calls=tool_calls)

@app.get("/v1/npc/{npc_id}/status")
async def get_npc_status(npc_id: str, player_id: str):
    """Get NPC status for player.

    Args:
        npc_id: NPC identifier.
        player_id: Player identifier.

    Returns:
        NPC's memory profile for this player.
    """
    from gateway.game_adapter import get_user_store
    user_store = get_user_store()
    return user_store.get_player_profile(npc_id, player_id)

if __name__ == "__main__":
    import uvicorn
    print("[Hermes] Starting backend on port 8642...")
    uvicorn.run(app, host="localhost", port=8642)