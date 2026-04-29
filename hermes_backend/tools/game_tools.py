# hermes_backend/tools/game_tools.py
"""Game state tools for Hermes Backend."""
import json
import os
from typing import Dict, Any, List

from tools.registry import registry
from gateway.game_adapter import get_game_store, get_user_store

# ========================================
# Tool 1: get_learning_progress
# ========================================

GET_LEARNING_PROGRESS_SCHEMA = {
    "name": "get_learning_progress",
    "description": (
        "查询玩家的学习进度。"
        "【调用时机】当师傅需要了解弟子当前学习状态时调用，例如："
        "1. 学生询问'我学到哪了'时"
        "2. 师傅准备安排新任务时"
        "3. 师傅需要针对性讲解弱点时"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "task_type": {
                "type": "string",
                "enum": ["prescription", "syndrome", "all"],
                "description": "任务类型筛选：'prescription'方剂学习，'syndrome'证型学习，'all'全部"
            }
        },
        "required": ["player_id"]
    }
}

def get_learning_progress_handler(args: dict, **kw) -> dict:
    """Handle get_learning_progress tool call."""
    player_id = args["player_id"]
    task_type = args.get("task_type", "all")
    store = get_game_store()
    return store.get_player_tasks(player_id, task_type)

registry.register(
    name="get_learning_progress",
    toolset="tcm_game",
    schema=GET_LEARNING_PROGRESS_SCHEMA,
    handler=get_learning_progress_handler,
    emoji="📊"
)

# ========================================
# Tool 2: get_case_progress
# ========================================

GET_CASE_PROGRESS_SCHEMA = {
    "name": "get_case_progress",
    "description": (
        "查询玩家的病案诊治进度。"
        "【调用时机】当师傅需要了解弟子实践情况时调用。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "case_id": {
                "type": "string",
                "description": "'all'查询所有病案，'case_001'查询特定病案"
            }
        },
        "required": ["player_id"]
    }
}

def get_case_progress_handler(args: dict, **kw) -> dict:
    """Handle get_case_progress tool call."""
    player_id = args["player_id"]
    case_id = args.get("case_id", "all")
    store = get_game_store()
    return store.get_case_progress(player_id, case_id)

registry.register(
    name="get_case_progress",
    toolset="tcm_game",
    schema=GET_CASE_PROGRESS_SCHEMA,
    handler=get_case_progress_handler,
    emoji="📋"
)

# ========================================
# Tool 3: get_inventory
# ========================================

GET_INVENTORY_SCHEMA = {
    "name": "get_inventory",
    "description": (
        "查询玩家背包内容。"
        "【调用时机】当师傅需要了解弟子拥有的药材或知识储备时调用。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "category": {
                "type": "string",
                "enum": ["herbs", "seeds", "tools", "knowledge", "all"],
                "description": "'herbs'药材，'seeds'种子，'tools'工具，'knowledge'知识卡片"
            }
        },
        "required": ["player_id"]
    }
}

def get_inventory_handler(args: dict, **kw) -> dict:
    """Handle get_inventory tool call."""
    player_id = args["player_id"]
    category = args.get("category", "herbs")
    store = get_game_store()
    return store.get_inventory(player_id, category)

registry.register(
    name="get_inventory",
    toolset="tcm_game",
    schema=GET_INVENTORY_SCHEMA,
    handler=get_inventory_handler,
    emoji="🎒"
)

# ========================================
# Tool 4: trigger_minigame
# ========================================

TRIGGER_MINIGAME_SCHEMA = {
    "name": "trigger_minigame",
    "description": (
        "启动指定类型的小游戏。"
        "【调用时机】当师傅讲解完毕准备让弟子实践时调用，例如："
        "1. 讲完麻黄汤组成后，启动煎药游戏实践"
        "2. 讲完风寒表实证后，启动问诊+辨证游戏"
        "3. 学生主动请求'我想试试'时"
        "4. 根据教学大纲任务需要启动特定游戏"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "game_type": {
                "type": "string",
                "enum": ["inquiry", "diagnosis", "decoction", "processing", "planting"],
                "description": "'inquiry'问诊，'diagnosis'辨证选方，'decoction'煎药，'processing'炮制，'planting'种植"
            },
            "case_id": {
                "type": "string",
                "description": "关联的病案/方剂/药材ID"
            },
            "difficulty": {
                "type": "integer",
                "enum": [1, 2, 3],
                "description": "难度等级：1初学，2进阶，3精通"
            },
            "related_task": {
                "type": "string",
                "description": "关联的学习任务ID（可选）"
            }
        },
        "required": ["game_type", "case_id"]
    }
}

def trigger_minigame_handler(args: dict, **kw) -> dict:
    """Handle trigger_minigame tool call."""
    return {
        "status": "launched",
        "session_id": f"game_{args['game_type']}_{args['case_id']}",
        "game_type": args["game_type"],
        "case_id": args["case_id"],
        "difficulty": args.get("difficulty", 1)
    }

registry.register(
    name="trigger_minigame",
    toolset="tcm_game",
    schema=TRIGGER_MINIGAME_SCHEMA,
    handler=trigger_minigame_handler,
    emoji="🎮"
)

# ========================================
# Tool 5: record_weakness
# ========================================

RECORD_WEAKNESS_SCHEMA = {
    "name": "record_weakness",
    "description": (
        "记录学生的学习弱点，用于后续针对性教学。"
        "【调用时机】当师傅发现学生理解有偏差时调用，例如："
        "1. 学生混淆麻黄汤与桂枝汤时"
        "2. 学生辨证遗漏关键症状时"
        "3. 学生方剂组成记忆有误时"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "task_id": {"type": "string", "description": "关联的学习任务ID"},
            "weakness_type": {
                "type": "string",
                "enum": ["组成记忆", "配伍理解", "功效理解", "主治判断", "煎服法", "禁忌认知", "辨证思路", "脉诊判断", "舌诊判断"],
                "description": "弱点类型分类"
            },
            "details": {"type": "string", "description": "具体描述"}
        },
        "required": ["player_id", "task_id", "weakness_type", "details"]
    }
}

def record_weakness_handler(args: dict, **kw) -> dict:
    """Handle record_weakness tool call."""
    store = get_game_store()
    return store.add_weakness(
        args["player_id"],
        args["task_id"],
        args["weakness_type"],
        args["details"]
    )

registry.register(
    name="record_weakness",
    toolset="tcm_game",
    schema=RECORD_WEAKNESS_SCHEMA,
    handler=record_weakness_handler,
    emoji="📝"
)

# ========================================
# Tool 6: get_npc_memory
# ========================================

GET_NPC_MEMORY_SCHEMA = {
    "name": "get_npc_memory",
    "description": (
        "获取NPC对玩家的观察记录。"
        "【调用时机】当NPC需要个性化对话时调用，例如："
        "1. NPC想了解之前讨论过什么"
        "2. NPC想根据玩家学习风格调整教学"
        "3. NPC想回顾上次未解决的问题"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "npc_id": {"type": "string", "description": "NPC唯一标识"},
            "player_id": {"type": "string", "description": "玩家唯一标识"}
        },
        "required": ["npc_id", "player_id"]
    }
}

def get_npc_memory_handler(args: dict, **kw) -> dict:
    """Handle get_npc_memory tool call."""
    user_store = get_user_store()
    return user_store.get_player_profile(args["npc_id"], args["player_id"])

registry.register(
    name="get_npc_memory",
    toolset="tcm_game",
    schema=GET_NPC_MEMORY_SCHEMA,
    handler=get_npc_memory_handler,
    emoji="🧠"
)

def register_all_tools():
    """Called by main.py to ensure all tools are registered."""
    # Tools auto-register on import, but this function verifies registration
    tools = registry.get_all_tools()
    print(f"[game_tools] {len(tools)} tools registered: {list(tools.keys())}")