"""Game State Backend - FastAPI entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.migrations import initialize_database
from api import api_router

# Create FastAPI app
app = FastAPI(
    title="Game State Backend",
    version="1.0",
    description="Game state storage for NPC Agent"
)

# CORS for frontend and Hermes Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8642",  # Hermes Backend
        "http://localhost:8787",  # Hermes WebUI
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    initialize_database()
    print("[GameStateBackend] Ready on port 8643")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "database": "player_progress.db",
        "tables": ["tasks", "todos", "case_history", "experience", "weakness_log"]
    }

# Include API routers
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    print("[GameStateBackend] Starting on port 8643...")
    uvicorn.run(app, host="localhost", port=8643)