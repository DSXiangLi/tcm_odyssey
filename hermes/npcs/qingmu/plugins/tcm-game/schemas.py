"""Tool schemas for TCM Game Plugin."""

# Tool 1: get_learning_progress
GET_LEARNING_PROGRESS_SCHEMA = {
    "name": "get_learning_progress",
    "description": (
        "查询玩家的学习进度。"
        "【调用时机】当师傅需要了解弟子当前学习状态时调用。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "task_type": {
                "type": "string",
                "enum": ["prescription", "syndrome", "all"],
                "description": "任务类型筛选"
            }
        },
        "required": ["player_id"]
    }
}

# Tool 2: get_case_progress
GET_CASE_PROGRESS_SCHEMA = {
    "name": "get_case_progress",
    "description": "查询玩家的病案诊治进度。",
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "case_id": {"type": "string", "description": "'all'查询所有病案"}
        },
        "required": ["player_id"]
    }
}

# Tool 3: get_inventory
GET_INVENTORY_SCHEMA = {
    "name": "get_inventory",
    "description": "查询玩家背包内容。",
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "category": {
                "type": "string",
                "enum": ["herbs", "seeds", "tools", "knowledge", "all"],
                "description": "物品类别"
            }
        },
        "required": ["player_id"]
    }
}

# Tool 4: trigger_minigame
TRIGGER_MINIGAME_SCHEMA = {
    "name": "trigger_minigame",
    "description": "启动指定类型的小游戏。",
    "parameters": {
        "type": "object",
        "properties": {
            "game_type": {
                "type": "string",
                "enum": ["inquiry", "diagnosis", "decoction", "processing", "planting"],
                "description": "游戏类型"
            },
            "case_id": {"type": "string", "description": "关联病案ID"},
            "difficulty": {"type": "integer", "enum": [1, 2, 3], "description": "难度等级"}
        },
        "required": ["game_type", "case_id"]
    }
}

# Tool 5: record_weakness
RECORD_WEAKNESS_SCHEMA = {
    "name": "record_weakness",
    "description": "记录学生的学习弱点。",
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "task_id": {"type": "string", "description": "学习任务ID"},
            "weakness_type": {
                "type": "string",
                "enum": ["组成记忆", "配伍理解", "功效理解", "主治判断", "煎服法", "禁忌认知", "辨证思路", "脉诊判断", "舌诊判断"],
                "description": "弱点类型"
            },
            "details": {"type": "string", "description": "具体描述"}
        },
        "required": ["player_id", "task_id", "weakness_type", "details"]
    }
}

# Tool 6: get_npc_memory
GET_NPC_MEMORY_SCHEMA = {
    "name": "get_npc_memory",
    "description": "获取NPC对玩家的观察记录。",
    "parameters": {
        "type": "object",
        "properties": {
            "npc_id": {"type": "string", "description": "NPC唯一标识"},
            "player_id": {"type": "string", "description": "玩家唯一标识"}
        },
        "required": ["npc_id", "player_id"]
    }
}

# Export all schemas
ALL_SCHEMAS = [
    GET_LEARNING_PROGRESS_SCHEMA,
    GET_CASE_PROGRESS_SCHEMA,
    GET_INVENTORY_SCHEMA,
    TRIGGER_MINIGAME_SCHEMA,
    RECORD_WEAKNESS_SCHEMA,
    GET_NPC_MEMORY_SCHEMA,
]