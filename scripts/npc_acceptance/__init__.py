"""NPC Acceptance Testing Package."""

from .config import (
    HERMES_BACKEND_PORT,
    VITE_FRONTEND_PORT,
    SERVICE_READY_TIMEOUT,
    FINAL_ACCEPTANCE_THRESHOLD,
    E2E_TEST_PASS_THRESHOLD,
    TOTAL_DIALOG_PASS_THRESHOLD,
    DIALOG_EVALUATION_THRESHOLDS,
    DIALOG_EVALUATION_WEIGHTS,
    validate_config,
)

from .dialog_evaluator import DialogEvaluator
from .report_generator import ReportGenerator
from .run_all import NPCAcceptanceRunner
from .evaluate_only import EvaluateOnlyRunner

__all__ = [
    # Config
    "HERMES_BACKEND_PORT",
    "VITE_FRONTEND_PORT",
    "SERVICE_READY_TIMEOUT",
    "FINAL_ACCEPTANCE_THRESHOLD",
    "E2E_TEST_PASS_THRESHOLD",
    "TOTAL_DIALOG_PASS_THRESHOLD",
    "DIALOG_EVALUATION_THRESHOLDS",
    "DIALOG_EVALUATION_WEIGHTS",
    "validate_config",
    # Classes
    "DialogEvaluator",
    "ReportGenerator",
    "NPCAcceptanceRunner",
    "EvaluateOnlyRunner",
]