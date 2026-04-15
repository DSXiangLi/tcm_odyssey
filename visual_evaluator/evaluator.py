# visual_evaluator/evaluator.py
"""
Visual Evaluator for Qwen VL API Integration

Handles API calls, response parsing, and weighted score calculation.
"""

import json
import base64
import re
import requests
from typing import Dict, Any, List, Optional
from pathlib import Path

# Import config from scripts.visual_acceptance
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.visual_acceptance.config import (
    QWEN_VL_API_URL,
    QWEN_VL_API_KEY,
    QWEN_VL_MODEL,
    DIMENSION_THRESHOLDS,
    DIMENSION_WEIGHTS,
    TOTAL_PASS_THRESHOLD
)

from .prompt_template import PromptTemplate


class VisualEvaluator:
    """Evaluates game screenshots using Qwen VL multimodal model."""

    def __init__(self):
        """Initialize evaluator with API configuration."""
        self.api_url = QWEN_VL_API_URL
        self.api_key = QWEN_VL_API_KEY
        self.model = QWEN_VL_MODEL
        self.prompt_template = PromptTemplate()

        if not self.api_url or not self.api_key:
            raise ValueError("Qwen VL API配置缺失，请检查.env文件中的QWEN_VL_URL和QWEN_VL_KEY")

    def evaluate_single(
        self,
        screenshot_path: str,
        scene_id: str,
        scene_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate a single screenshot.

        Args:
            screenshot_path: Path to screenshot image file
            scene_id: Scene identifier
            scene_context: Scene-specific context for evaluation

        Returns:
            Evaluation result dict with dimensions, scores, and pass status.
        """
        # Load and encode image
        image_base64 = self._load_image_base64(screenshot_path)

        # Generate prompt
        prompt = self.prompt_template.generate_evaluation_prompt(
            scene_id,
            scene_context
        )

        # Call Qwen VL API
        response = self._call_qwen_vl(image_base64, prompt)

        # Parse response
        evaluation = self._parse_response(response)

        # Calculate weighted score
        evaluation["weighted_score"] = self._calculate_weighted_score(
            evaluation.get("dimensions", {})
        )

        # Check pass status
        evaluation["pass"] = self._check_pass(evaluation)

        # Add metadata
        evaluation["scene_id"] = scene_id
        evaluation["screenshot_path"] = screenshot_path

        return evaluation

    def evaluate_batch(
        self,
        screenshots: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Evaluate multiple screenshots.

        Args:
            screenshots: List of dicts with 'path', 'scene_id', 'context' keys

        Returns:
            List of evaluation results.
        """
        results = []
        for screenshot in screenshots:
            try:
                result = self.evaluate_single(
                    screenshot["path"],
                    screenshot["scene_id"],
                    screenshot.get("context", {})
                )
                results.append(result)
            except Exception as e:
                results.append({
                    "scene_id": screenshot["scene_id"],
                    "error": str(e),
                    "pass": False
                })
        return results

    def _load_image_base64(self, image_path: str) -> str:
        """
        Load image and convert to base64.

        Args:
            image_path: Path to image file

        Returns:
            Base64 encoded image string.
        """
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"截图文件不存在: {image_path}")

        with open(path, "rb") as f:
            image_data = f.read()

        return base64.b64encode(image_data).decode("utf-8")

    def _call_qwen_vl(
        self,
        image_base64: str,
        prompt: str
    ) -> Dict[str, Any]:
        """
        Call Qwen VL API using OpenAI-compatible format.

        Args:
            image_base64: Base64 encoded image
            prompt: Evaluation prompt

        Returns:
            API response dict.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "max_tokens": 4096
        }

        try:
            response = requests.post(
                self.api_url + "/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Qwen VL API调用失败: {e}")

    def _parse_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Qwen VL API response and extract evaluation JSON.

        Args:
            response: Raw API response

        Returns:
            Parsed evaluation dict.
        """
        try:
            # Extract content from response
            content = response.get("choices", [{}])[0].get("message", {}).get("content", "")

            if not content:
                raise ValueError("API响应内容为空")

            # Find JSON in response (might be wrapped in markdown code blocks)
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find raw JSON
                json_match = re.search(r'\{.*"dimensions".*\}', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    # Use entire content as JSON
                    json_str = content

            # Parse JSON
            evaluation = json.loads(json_str)

            # Validate structure
            if "dimensions" not in evaluation:
                evaluation["dimensions"] = {}

            return evaluation

        except json.JSONDecodeError as e:
            raise ValueError(f"无法解析API响应JSON: {e}\n原始响应: {content[:500]}")

    def _calculate_weighted_score(self, dimensions: Dict[str, Any]) -> float:
        """
        Calculate weighted total score from dimension scores.

        Args:
            dimensions: Dict of dimension evaluations

        Returns:
            Weighted total score (0-100).
        """
        total_score = 0.0
        total_weight = 0.0

        for dim_name, weight in DIMENSION_WEIGHTS.items():
            dim_data = dimensions.get(dim_name, {})
            score = dim_data.get("score")

            if score is not None and isinstance(score, (int, float)):
                total_score += score * weight
                total_weight += weight

        # Normalize if not all dimensions present
        if total_weight > 0 and total_weight < 1.0:
            total_score = total_score / total_weight

        return round(total_score, 2)

    def _check_pass(self, evaluation: Dict[str, Any]) -> bool:
        """
        Check if evaluation passes thresholds.

        Args:
            evaluation: Evaluation dict with dimensions and weighted_score

        Returns:
            True if passes, False otherwise.
        """
        weighted_score = evaluation.get("weighted_score", 0)

        # Check total score threshold
        if weighted_score < TOTAL_PASS_THRESHOLD:
            return False

        # Check individual dimension thresholds
        dimensions = evaluation.get("dimensions", {})
        for dim_name, threshold in DIMENSION_THRESHOLDS.items():
            dim_data = dimensions.get(dim_name, {})
            score = dim_data.get("score")

            if score is not None and score < threshold:
                # Allow one dimension to fail slightly
                if score < threshold - 10:
                    return False

        return True