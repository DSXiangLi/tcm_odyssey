"""Mock handlers for TCM Game Plugin - 测试环境使用"""

from typing import Dict, Any

class MockGameState:
    """测试用的游戏状态 Mock"""

    def get_learning_progress(self, player_id: str, task_type: str = "all") -> Dict[str, Any]:
        return {
            "total_tasks": 10,
            "completed_tasks": 3,
            "in_progress": ["task_004", "task_005"],
            "accuracy": 0.75,
            "weak_areas": ["辨证", "方剂配伍"],
            "player_id": player_id,
            "task_type": task_type
        }

    def get_case_progress(self, player_id: str, case_id: str = "all") -> Dict[str, Any]:
        if case_id == "all":
            return {
                "total_cases": 10,
                "completed_cases": [
                    {"case_id": "case_001", "score": 85, "status": "completed"},
                    {"case_id": "case_002", "score": 78, "status": "completed"},
                    {"case_id": "case_003", "score": 92, "status": "completed"}
                ],
                "player_id": player_id
            }
        else:
            return {
                "case_id": case_id,
                "diagnosis_stage": 3,
                "herbs_selected": ["当归", "白芍"],
                "score": 80,
                "status": "in_progress",
                "player_id": player_id
            }

    def get_inventory(self, player_id: str, category: str = "herbs") -> Dict[str, Any]:
        mock_items = {
            "herbs": [
                {"name": "当归", "quantity": 5, "quality": "优质"},
                {"name": "黄芪", "quantity": 3, "quality": "普通"},
                {"name": "白芍", "quantity": 2, "quality": "优质"}
            ],
            "seeds": [
                {"name": "当归种子", "quantity": 10},
                {"name": "黄芪种子", "quantity": 5}
            ],
            "tools": [
                {"name": "药锄", "durability": 100},
                {"name": "煎药壶", "durability": 80}
            ],
            "knowledge": [
                {"name": "麻黄汤组成", " mastered": True},
                {"name": "桂枝汤组成", " mastered": False}
            ]
        }
        return {
            "category": category,
            "items": mock_items.get(category, mock_items["herbs"]),
            "capacity": 20,
            "player_id": player_id
        }

    def trigger_minigame(self, game_type: str, case_id: str, difficulty: int = 1) -> Dict[str, Any]:
        return {
            "status": "launched",
            "session_id": f"game_{game_type}_{case_id}",
            "game_type": game_type,
            "case_id": case_id,
            "difficulty": difficulty,
            "message": f"小游戏 {game_type} 已启动，难度 {difficulty}"
        }

    def record_weakness(self, player_id: str, task_id: str, weakness_type: str, details: str) -> Dict[str, Any]:
        return {
            "status": "recorded",
            "player_id": player_id,
            "task_id": task_id,
            "weakness_type": weakness_type,
            "details": details,
            "timestamp": "2026-05-30T10:00:00Z"
        }

    def get_npc_memory(self, npc_id: str, player_id: str) -> Dict[str, Any]:
        return {
            "npc_id": npc_id,
            "player_id": player_id,
            "observations": [
                {"date": "2026-05-28", "observation": "学生对麻黄汤理解较好"},
                {"date": "2026-05-29", "observation": "学生辨证思路有偏差"}
            ],
            "teaching_style_preference": "循序渐进",
            "last_interaction": "2026-05-29"
        }

# Global mock instance
_mock_state = MockGameState()

# Handler functions
def get_learning_progress_handler(args: dict, **kw) -> dict:
    player_id = args.get("player_id", "player_001")
    task_type = args.get("task_type", "all")
    return _mock_state.get_learning_progress(player_id, task_type)

def get_case_progress_handler(args: dict, **kw) -> dict:
    player_id = args.get("player_id", "player_001")
    case_id = args.get("case_id", "all")
    return _mock_state.get_case_progress(player_id, case_id)

def get_inventory_handler(args: dict, **kw) -> dict:
    player_id = args.get("player_id", "player_001")
    category = args.get("category", "herbs")
    return _mock_state.get_inventory(player_id, category)

def trigger_minigame_handler(args: dict, **kw) -> dict:
    game_type = args.get("game_type", "decoction")
    case_id = args.get("case_id", "default_case")
    difficulty = args.get("difficulty", 1)
    return _mock_state.trigger_minigame(game_type, case_id, difficulty)

def record_weakness_handler(args: dict, **kw) -> dict:
    player_id = args.get("player_id", "player_001")
    task_id = args.get("task_id", "task_001")
    weakness_type = args.get("weakness_type", "辨证思路")
    details = args.get("details", "学生混淆风寒表实与表虚")
    return _mock_state.record_weakness(player_id, task_id, weakness_type, details)

def get_npc_memory_handler(args: dict, **kw) -> dict:
    npc_id = args.get("npc_id", "qingmu")
    player_id = args.get("player_id", "player_001")
    return _mock_state.get_npc_memory(npc_id, player_id)

# Export all handlers
ALL_HANDLERS = [
    get_learning_progress_handler,
    get_case_progress_handler,
    get_inventory_handler,
    trigger_minigame_handler,
    record_weakness_handler,
    get_npc_memory_handler,
]