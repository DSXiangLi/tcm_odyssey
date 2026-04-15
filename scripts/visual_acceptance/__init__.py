# scripts/visual_acceptance/__init__.py
"""
Visual Acceptance Configuration Module

This module provides configuration and the main runner for the visual acceptance system.
"""

from .config import (
    QWEN_VL_API_URL,
    QWEN_VL_API_KEY,
    QWEN_VL_MODEL,
    GLM_API_URL,
    GLM_API_KEY,
    GLM_MODEL,
    DIMENSION_THRESHOLDS,
    DIMENSION_WEIGHTS,
    TOTAL_PASS_THRESHOLD,
    MAX_ITERATIONS,
    COLOR_SPEC,
    SCREENSHOT_DIR,
    EVALUATION_DIR,
    MODIFICATION_LOG,
    SUMMARY_REPORT,
    validate_config,
    validate_weights
)

__all__ = [
    'QWEN_VL_API_URL',
    'QWEN_VL_API_KEY',
    'QWEN_VL_MODEL',
    'GLM_API_URL',
    'GLM_API_KEY',
    'GLM_MODEL',
    'DIMENSION_THRESHOLDS',
    'DIMENSION_WEIGHTS',
    'TOTAL_PASS_THRESHOLD',
    'MAX_ITERATIONS',
    'COLOR_SPEC',
    'SCREENSHOT_DIR',
    'EVALUATION_DIR',
    'MODIFICATION_LOG',
    'SUMMARY_REPORT',
    'validate_config',
    'validate_weights'
]