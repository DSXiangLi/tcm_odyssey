"""API module."""

from fastapi import APIRouter
from .tasks import router as tasks_router
from .cases import router as cases_router
from .experience import router as experience_router
from .weaknesses import router as weaknesses_router
from .inventory import router as inventory_router

# Main router
api_router = APIRouter()
api_router.include_router(tasks_router)
api_router.include_router(cases_router)
api_router.include_router(experience_router)
api_router.include_router(weaknesses_router)
api_router.include_router(inventory_router)