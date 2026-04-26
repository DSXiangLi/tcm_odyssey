#!/usr/bin/env python3
"""
真实 Hermes NPC 对话测试脚本

直接调用 GLM API，使用 SOUL.md 作为 NPC 身份定义，
测试 NPC 对话的真实输出。

使用方式:
    python3 scripts/real_hermes_test.py
"""

import os
import json
import requests
from pathlib import Path
from typing import Dict, List

# 项目路径
GAME_PATH = Path(__file__).resolve().parent.parent
HERMES_PATH = GAME_PATH / "hermes" / "npcs"

# 加载 .env 配置
def load_env():
    env_path = GAME_PATH / ".env"
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    # 移除引号
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

load_env()

# API 配置
GLM_API_BASE = os.environ.get("GLM_API_BASE", "https://ark.cn-beijing.volces.com/api/v3")
GLM_API_KEY = os.environ.get("GLM_API_KEY", "")
GLM_MODEL_NAME = os.environ.get("GLM_MODEL_NAME", "glm-4")

def load_soul_md(npc_id: str) -> str:
    """加载 NPC 的 SOUL.md"""
    soul_path = HERMES_PATH / npc_id / "SOUL.md"
    if soul_path.exists():
        return soul_path.read_text(encoding="utf-8")
    return f"[{npc_id} SOUL.md 未找到]"

def call_glm_api(system_prompt: str, user_input: str) -> Dict:
    """调用 GLM API 进行对话"""

    headers = {
        "Authorization": f"Bearer {GLM_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": GLM_MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }

    try:
        response = requests.post(
            f"{GLM_API_BASE}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )

        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": f"API 错误: {response.status_code}",
                "details": response.text
            }
    except requests.exceptions.Timeout:
        return {"error": "API 超时"}
    except Exception as e:
        return {"error": f"请求失败: {str(e)}"}

def get_npc_response(npc_id: str, player_input: str) -> Dict:
    """获取 NPC 真实响应"""

    # 加载 SOUL.md 作为系统提示
    soul_content = load_soul_md(npc_id)

    # 构建系统提示
    system_prompt = f"""你是游戏中的 NPC 角色，请严格按照以下身份定义进行对话：

{soul_content}

重要规则：
1. 不要直接给出答案，而是通过提问引导学生思考（苏格拉底式引导）
2. 讲解知识时要引用中医经典原文
3. 使用"你可思考""你可记得"等引导语
4. 语气古朴典雅，循循善诱
5. 以 NPC 的身份回应，不要提及你是 AI 或模型

玩家输入: {player_input}

请以 NPC 角色身份回应："""

    # 调用 API
    result = call_glm_api(system_prompt, player_input)

    if "error" in result:
        return {
            "npc_response": f"[API 错误: {result['error']}]",
            "raw_response": result
        }

    # 解析响应
    choices = result.get("choices", [])
    if choices:
        npc_response = choices[0].get("message", {}).get("content", "")
        return {
            "npc_response": npc_response,
            "raw_response": result,
            "usage": result.get("usage", {})
        }

    return {
        "npc_response": "[响应解析失败]",
        "raw_response": result
    }

def get_test_scenarios() -> List[Dict]:
    """获取测试场景"""
    return [
        {
            "id": "S1-basic-question",
            "description": "玩家主动询问风寒表实证定义",
            "player_input": "老师，什么是风寒表实证？"
        },
        {
            "id": "S2-skill-question",
            "description": "玩家询问评分标准",
            "player_input": "老师，诊断评分的标准是什么？"
        },
        {
            "id": "S3-task-question",
            "description": "玩家询问今天学什么",
            "player_input": "老师，今天学什么？"
        },
        {
            "id": "S7-teaching-syllabus",
            "description": "玩家询问教学大纲",
            "player_input": "老师，教学大纲是什么？"
        },
        {
            "id": "S8-weakness-intervention",
            "description": "玩家询问如何改进薄弱点",
            "player_input": "老师，我脉诊总是判断不准确，怎么办？"
        }
    ]

def run_real_test():
    """运行真实对话测试"""

    npc_id = "qingmu"
    scenarios = get_test_scenarios()

    print("=" * 80)
    print("真实 Hermes NPC 对话测试")
    print("=" * 80)
    print(f"\nNPC ID: {npc_id}")
    print(f"API: {GLM_API_BASE}")
    print(f"模型: {GLM_MODEL_NAME}")
    print(f"测试场景数: {len(scenarios)}\n")

    # 显示 SOUL.md 内容摘要
    soul_content = load_soul_md(npc_id)
    print("=" * 80)
    print("SOUL.md 身份定义摘要:")
    print("=" * 80)
    print(soul_content[:500] + "...\n" if len(soul_content) > 500 else soul_content + "\n")

    results = []

    for scenario in scenarios:
        print("=" * 80)
        print(f"场景: {scenario['id']}")
        print("=" * 80)
        print(f"描述: {scenario['description']}")
        print(f"玩家输入: {scenario['player_input']}")
        print("\n调用 API...")

        result = get_npc_response(npc_id, scenario['player_input'])

        print(f"\nNPC 响应:")
        print("-" * 40)
        print(result['npc_response'])
        print("-" * 40)

        if 'usage' in result:
            print(f"\nToken 使用: {result['usage']}")

        results.append({
            "scenario": scenario,
            "result": result
        })

        print("\n")

    # 保存结果
    output_file = GAME_PATH / "real_hermes_test_results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"测试结果已保存: {output_file}")

    return results

if __name__ == "__main__":
    if not GLM_API_KEY:
        print("错误: GLM_API_KEY 未配置，请检查 .env 文件")
        exit(1)

    run_real_test()