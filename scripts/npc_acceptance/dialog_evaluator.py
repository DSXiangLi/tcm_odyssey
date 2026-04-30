# scripts/npc_acceptance/dialog_evaluator.py

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

import requests

from .config import (
    EVALUATION_PROMPT,
    EVALUATION_LLM_API_URL,
    EVALUATION_LLM_API_KEY,
    EVALUATION_LLM_MODEL,
    DIALOG_EVALUATION_THRESHOLDS,
    DIALOG_EVALUATION_WEIGHTS,
    TOTAL_DIALOG_PASS_THRESHOLD,
    validate_config,
)


class DialogEvaluator:
    """LLM 对话质量评估器"""

    def __init__(self, api_url: Optional[str] = None, api_key: Optional[str] = None, model: Optional[str] = None):
        """初始化评估器"""
        validate_config()
        self.api_url = api_url or EVALUATION_LLM_API_URL
        self.api_key = api_key or EVALUATION_LLM_API_KEY
        self.model = model or EVALUATION_LLM_MODEL

    def evaluate_single(self, dialog_log: Dict[str, Any]) -> Dict[str, Any]:
        """
        评估单个对话

        Args:
            dialog_log: 对话日志字典，包含:
                - npc_id: NPC ID
                - user_message: 用户消息
                - full_response: NPC完整响应
                - tool_calls: 工具调用列表

        Returns:
            评估结果字典，包含:
                - teaching_style_score: 教学风格分数
                - teaching_style_reason: 教学风格理由
                - context_coherence_score: 连贯性分数
                - context_coherence_reason: 连贯性理由
                - tool_call_score: 工具调用分数
                - tool_call_reason: 工具调用理由
                - total_score: 加权总分
                - improvement_suggestions: 改进建议列表
                - passed: 是否通过
        """
        # 构建评估prompt
        prompt = EVALUATION_PROMPT.format(
            npc_id=dialog_log.get("npc_id", "unknown"),
            user_message=dialog_log.get("user_message", ""),
            full_response=dialog_log.get("full_response", ""),
            tool_calls=json.dumps(dialog_log.get("tool_calls", []), ensure_ascii=False, indent=2)
        )

        # 调用LLM API
        try:
            response = self._call_llm_api(prompt)
            result = self._parse_evaluation_result(response)

            # 判断是否通过
            result["passed"] = result["total_score"] >= TOTAL_DIALOG_PASS_THRESHOLD
            result["session_id"] = dialog_log.get("session_id", "unknown")

            return result
        except Exception as e:
            return {
                "error": str(e),
                "session_id": dialog_log.get("session_id", "unknown"),
                "passed": False,
                "total_score": 0
            }

    def evaluate_batch(self, dialog_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        批量评估对话

        Args:
            dialog_logs: 对话日志列表

        Returns:
            批量评估结果，包含:
                - results: 各对话评估结果列表
                - avg_scores: 各维度平均分数
                - avg_total_score: 平均总分
                - passed_count: 通过数量
                - total_count: 总数量
                - pass_rate: 通过率
                - overall_passed: 整体是否通过
        """
        results = []
        for log in dialog_logs:
            result = self.evaluate_single(log)
            results.append(result)

        # 计算平均分数
        valid_results = [r for r in results if "error" not in r]

        if not valid_results:
            return {
                "results": results,
                "avg_scores": {},
                "avg_total_score": 0,
                "passed_count": 0,
                "total_count": len(dialog_logs),
                "pass_rate": 0,
                "overall_passed": False,
                "error": "所有评估失败"
            }

        avg_scores = {
            "教学风格符合度": sum(r["teaching_style_score"] for r in valid_results) / len(valid_results),
            "上下文连贯性": sum(r["context_coherence_score"] for r in valid_results) / len(valid_results),
            "工具调用合理性": sum(r["tool_call_score"] for r in valid_results) / len(valid_results),
        }

        avg_total_score = sum(r["total_score"] for r in valid_results) / len(valid_results)

        passed_count = sum(1 for r in valid_results if r["passed"])
        pass_rate = passed_count / len(valid_results) if valid_results else 0

        return {
            "results": results,
            "avg_scores": avg_scores,
            "avg_total_score": avg_total_score,
            "passed_count": passed_count,
            "total_count": len(dialog_logs),
            "pass_rate": pass_rate,
            "overall_passed": avg_total_score >= TOTAL_DIALOG_PASS_THRESHOLD and pass_rate >= 0.8
        }

    def collect_dialog_logs(self, log_dir: str) -> List[Dict[str, Any]]:
        """
        收集对话日志文件

        Args:
            log_dir: 日志目录路径，如 "logs/dialog"

        Returns:
            对话日志列表
        """
        dialog_logs = []
        log_path = Path(log_dir)

        if not log_path.exists():
            return dialog_logs

        # 遍历所有NPC目录
        for npc_dir in log_path.iterdir():
            if not npc_dir.is_dir():
                continue

            # 遍历所有日期目录
            for date_dir in npc_dir.iterdir():
                if not date_dir.is_dir():
                    continue

                # 遍历所有session文件
                for session_file in date_dir.glob("*.json"):
                    try:
                        with open(session_file, 'r', encoding='utf-8') as f:
                            log_data = json.load(f)
                            dialog_logs.append(log_data)
                    except Exception as e:
                        print(f"警告: 无法读取日志文件 {session_file}: {e}")

        return dialog_logs

    def _call_llm_api(self, prompt: str) -> str:
        """
        调用LLM API

        Args:
            prompt: 评估prompt

        Returns:
            LLM响应文本
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,  # 低温度以获得稳定评分
            "max_tokens": 500
        }

        response = requests.post(
            self.api_url,
            headers=headers,
            json=payload,
            timeout=60
        )

        if response.status_code != 200:
            raise Exception(f"API调用失败: {response.status_code} - {response.text}")

        result = response.json()

        # 解析响应内容
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        elif "output" in result:  # GLM格式
            return result["output"]
        else:
            raise Exception(f"无法解析API响应: {result}")

    def _parse_evaluation_result(self, response: str) -> Dict[str, Any]:
        """
        解析评估结果

        Args:
            response: LLM响应文本

        Returns:
            结构化评估结果
        """
        # 尝试从响应中提取JSON
        json_match = re.search(r'\{[\s\S]*\}', response)

        if json_match:
            try:
                result = json.loads(json_match.group())
            except json.JSONDecodeError:
                # 如果JSON解析失败，尝试修复
                result = self._repair_json(json_match.group())
        else:
            # 如果没有找到JSON，使用默认值
            result = {
                "teaching_style_score": 60,
                "teaching_style_reason": "无法解析评估结果",
                "context_coherence_score": 60,
                "context_coherence_reason": "无法解析评估结果",
                "tool_call_score": 60,
                "tool_call_reason": "无法解析评估结果",
                "total_score": 60,
                "improvement_suggestions": ["请检查LLM响应格式"]
            }

        # 计算加权总分（如果响应中没有计算）
        if "total_score" not in result or result["total_score"] <= 0:
            result["total_score"] = (
                result.get("teaching_style_score", 60) * DIALOG_EVALUATION_WEIGHTS["教学风格符合度"] +
                result.get("context_coherence_score", 60) * DIALOG_EVALUATION_WEIGHTS["上下文连贯性"] +
                result.get("tool_call_score", 60) * DIALOG_EVALUATION_WEIGHTS["工具调用合理性"]
            )

        return result

    def _repair_json(self, json_str: str) -> Dict[str, Any]:
        """
        修复常见JSON格式问题

        Args:
            json_str: 可能有问题的JSON字符串

        Returns:
            解析后的字典
        """
        # 移除可能的注释
        json_str = re.sub(r'//.*', '', json_str)

        # 修复未闭合的引号
        json_str = re.sub(r':\s*"([^"]*?)\n', r': "\1"', json_str)

        # 尝试再次解析
        try:
            return json.loads(json_str)
        except:
            # 最后返回默认值
            return {
                "teaching_style_score": 60,
                "teaching_style_reason": "JSON解析失败",
                "context_coherence_score": 60,
                "context_coherence_reason": "JSON解析失败",
                "tool_call_score": 60,
                "tool_call_reason": "JSON解析失败",
                "total_score": 60,
                "improvement_suggestions": ["请检查LLM响应格式"]
            }


def main():
    """测试评估器"""
    evaluator = DialogEvaluator()

    # 测试单条对话评估
    test_log = {
        "session_id": "test_session_001",
        "npc_id": "qingmu",
        "user_message": "老师，什么是风寒表实证？",
        "full_response": "你可还记得太阳病的主症？那'脉浮，头项强痛而恶寒'的描述，说的是什么道理？",
        "tool_calls": []
    }

    result = evaluator.evaluate_single(test_log)
    print("单条评估结果:")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()