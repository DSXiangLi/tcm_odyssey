# visual_evaluator/dimension_checker.py
"""
Dimension Checker for Evaluation Validation

Validates and adjusts dimension scores to ensure consistency.
"""

from typing import Dict, Any, List, Optional
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.visual_acceptance.config import (
    DIMENSION_THRESHOLDS,
    DIMENSION_WEIGHTS
)


class DimensionChecker:
    """Validates and adjusts evaluation dimension scores."""

    EXPECTED_DIMENSIONS = list(DIMENSION_THRESHOLDS.keys())

    def __init__(self):
        """Initialize dimension checker with expected dimensions."""
        self.thresholds = DIMENSION_THRESHOLDS
        self.weights = DIMENSION_WEIGHTS

    def verify_and_adjust(self, evaluation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify evaluation structure and adjust scores.

        Args:
            evaluation: Raw evaluation dict from Qwen VL

        Returns:
            Adjusted evaluation dict with validated dimensions.
        """
        if "dimensions" not in evaluation:
            evaluation["dimensions"] = {}

        dimensions = evaluation["dimensions"]

        # Ensure all expected dimensions exist
        for dim_name in self.EXPECTED_DIMENSIONS:
            if dim_name not in dimensions:
                dimensions[dim_name] = {
                    "score": None,
                    "analysis": "维度缺失，需补充评估",
                    "issues": ["该维度未被评估"],
                    "suggestions": ["请补充该维度的评估"]
                }
            else:
                # Validate and clamp score
                dim_data = dimensions[dim_name]
                score = dim_data.get("score")

                if score is not None:
                    # Clamp score to 0-100 range
                    if isinstance(score, (int, float)):
                        clamped_score = max(0, min(100, score))
                        dim_data["score"] = clamped_score
                    else:
                        # Invalid score type
                        dim_data["score"] = None
                        dim_data["issues"] = dim_data.get("issues", []) + ["评分类型无效"]

                # Ensure required fields exist
                if "analysis" not in dim_data:
                    dim_data["analysis"] = ""
                if "issues" not in dim_data:
                    dim_data["issues"] = []
                if "suggestions" not in dim_data:
                    dim_data["suggestions"] = []

        evaluation["dimensions"] = dimensions
        return evaluation

    def get_low_scoring_dimensions(
        self,
        evaluation: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Get dimensions that scored below threshold.

        Args:
            evaluation: Evaluation dict with dimensions

        Returns:
            List of low-scoring dimension details.
        """
        low_scoring = []
        dimensions = evaluation.get("dimensions", {})

        for dim_name, threshold in self.thresholds.items():
            dim_data = dimensions.get(dim_name, {})
            score = dim_data.get("score")

            if score is not None and score < threshold:
                low_scoring.append({
                    "dimension": dim_name,
                    "score": score,
                    "threshold": threshold,
                    "gap": threshold - score,
                    "weight": self.weights.get(dim_name, 0),
                    "issues": dim_data.get("issues", []),
                    "suggestions": dim_data.get("suggestions", [])
                })

        # Sort by gap (largest gap first)
        low_scoring.sort(key=lambda x: x["gap"], reverse=True)

        return low_scoring

    def get_critical_issues(
        self,
        evaluation: Dict[str, Any]
    ) -> List[str]:
        """
        Get critical issues that must be fixed for pass.

        Args:
            evaluation: Evaluation dict

        Returns:
            List of critical issue descriptions.
        """
        critical = []
        low_scoring = self.get_low_scoring_dimensions(evaluation)

        for dim in low_scoring:
            # Critical if gap > 15 or weight > 0.15
            if dim["gap"] > 15 or dim["weight"] >= 0.15:
                for issue in dim["issues"]:
                    critical.append(f"[{dim['dimension']}] {issue}")

        return critical

    def generate_fix_priorities(
        self,
        evaluation: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate prioritized fix suggestions.

        Args:
            evaluation: Evaluation dict

        Returns:
            List of fix suggestions sorted by priority.
        """
        priorities = []
        low_scoring = self.get_low_scoring_dimensions(evaluation)

        for dim in low_scoring:
            priority_score = dim["gap"] * dim["weight"]
            priorities.append({
                "dimension": dim["dimension"],
                "priority": priority_score,
                "suggestions": dim["suggestions"],
                "current_score": dim["score"],
                "target_score": dim["threshold"]
            })

        # Sort by priority (highest first)
        priorities.sort(key=lambda x: x["priority"], reverse=True)

        return priorities

    def validate_structure(self, evaluation: Dict[str, Any]) -> bool:
        """
        Validate evaluation structure completeness.

        Args:
            evaluation: Evaluation dict

        Returns:
            True if structure is valid.
        """
        required_keys = ["dimensions", "overall_assessment", "pass", "confidence"]

        for key in required_keys:
            if key not in evaluation:
                return False

        dimensions = evaluation.get("dimensions", {})

        # Check at least 6 dimensions present
        if len(dimensions) < 6:
            return False

        # Check each dimension has required fields
        for dim_name, dim_data in dimensions.items():
            if "score" not in dim_data:
                return False

        return True