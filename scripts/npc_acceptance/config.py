# scripts/npc_acceptance/config.py

import os
from dotenv import load_dotenv

load_dotenv()

# 验收阈值配置
DIALOG_EVALUATION_THRESHOLDS = {
    "教学风格符合度": 75,
    "上下文连贯性": 80,
    "工具调用合理性": 70,
}

DIALOG_EVALUATION_WEIGHTS = {
    "教学风格符合度": 0.40,
    "上下文连贯性": 0.30,
    "工具调用合理性": 0.30,
}

TOTAL_DIALOG_PASS_THRESHOLD = 75
E2E_TEST_PASS_THRESHOLD = 0.80
FINAL_ACCEPTANCE_THRESHOLD = 0.85

# LLM API 配置（复用现有环境变量）
EVALUATION_LLM_API_URL = os.getenv("DEEPSEEK_API_URL") or os.getenv("GLM_API_BASE")
EVALUATION_LLM_API_KEY = os.getenv("DEEPSEEK_API_KEY") or os.getenv("GLM_API_KEY")
EVALUATION_LLM_MODEL = os.getenv("EVALUATION_MODEL", "deepseek-chat")

# 服务启动配置
HERMES_BACKEND_PORT = 8642
VITE_FRONTEND_PORT = 3000
SERVICE_READY_TIMEOUT = 30  # 秒

# LLM 评估 Prompt
EVALUATION_PROMPT = """
你是一个中医教育专家，评估 NPC 教学对话质量。

## 评估维度

### 1. 教学风格符合度 (权重 40%)
评分标准：
- 100分: 完全使用引导式提问，不直接给出答案，每句包含引导性问题
- 80分: 主要使用引导式提问，偶尔直接陈述
- 60分: 混合使用引导和直接回答
- 40分: 多数直接给出答案，缺少引导
- 20分: 完全直接回答，无引导式教学

检查点：
- 是否使用 "你可记得"、"你可思考"、"你可明了" 等引导语
- 是否避免 "风寒表实证就是..." 等直接定义
- 是否引用经典作为引导素材

### 2. 上下文连贯性 (权重 30%)
评分标准：
- 100分: NPC 完全理解用户问题，回答针对性强，对话自然流畅
- 80分: NPC 基本理解用户意图，回答相关但略显机械
- 60分: NPC 理解部分问题，有答非所问情况
- 40分: NPC 经常误解用户意图，回答不相关
- 20分: NPC 无法理解用户问题，对话断裂

### 3. 工具调用合理性 (权重 30%)
评分标准：
- 100分: 工具调用时机完美，在讲解完毕后触发实践
- 80分: 工具调用时机合适，略有提前或延迟
- 60分: 工具调用时机一般，缺少自然过渡
- 40分: 工具调用时机不当，打断对话节奏
- 20分: 工具调用完全不合理或遗漏必要调用

检查点：
- get_learning_progress: 是否在讨论进度时调用
- trigger_minigame: 是否在讲解后、学生准备好实践时调用
- record_weakness: 是否在发现学生理解偏差时调用

## 输入数据

NPC ID: {npc_id}
用户问题: {user_message}
NPC 响应: {full_response}
工具调用: {tool_calls}

## 输出格式

请以 JSON 格式输出评估结果：
{
  "teaching_style_score": <分数>,
  "teaching_style_reason": "<简短理由>",
  "context_coherence_score": <分数>,
  "context_coherence_reason": "<简短理由>",
  "tool_call_score": <分数>,
  "tool_call_reason": "<简短理由>",
  "total_score": <加权总分>,
  "improvement_suggestions": ["<建议1>", "<建议2>"]
}
"""


def validate_config():
    """验证必要的环境变量是否配置，缺失时抛出ValueError"""
    missing_vars = []
    if not EVALUATION_LLM_API_URL:
        missing_vars.append("DEEPSEEK_API_URL 或 GLM_API_BASE")
    if not EVALUATION_LLM_API_KEY:
        missing_vars.append("DEEPSEEK_API_KEY 或 GLM_API_KEY")

    if missing_vars:
        raise ValueError(f"缺少必要的环境变量: {', '.join(missing_vars)}。请在.env文件中配置这些变量。")

    # 验证权重总和是否为1.0
    total = sum(DIALOG_EVALUATION_WEIGHTS.values())
    if abs(total - 1.0) > 0.001:
        raise ValueError(f"权重总和为 {total}，应为 1.0")

    return True