"""TCM Game Plugin - 游戏工具集成"""

from .schemas import (
    GET_LEARNING_PROGRESS_SCHEMA,
    GET_CASE_PROGRESS_SCHEMA,
    GET_INVENTORY_SCHEMA,
    TRIGGER_MINIGAME_SCHEMA,
    RECORD_WEAKNESS_SCHEMA,
    GET_NPC_MEMORY_SCHEMA,
)

from .handlers import (
    get_learning_progress_handler,
    get_case_progress_handler,
    get_inventory_handler,
    trigger_minigame_handler,
    record_weakness_handler,
    get_npc_memory_handler,
)

# Tool definitions: (name, schema, handler, emoji)
_TOOLS = [
    ("get_learning_progress", GET_LEARNING_PROGRESS_SCHEMA, get_learning_progress_handler, "📊"),
    ("get_case_progress", GET_CASE_PROGRESS_SCHEMA, get_case_progress_handler, "📋"),
    ("get_inventory", GET_INVENTORY_SCHEMA, get_inventory_handler, "🎒"),
    ("trigger_minigame", TRIGGER_MINIGAME_SCHEMA, trigger_minigame_handler, "🎮"),
    ("record_weakness", RECORD_WEAKNESS_SCHEMA, record_weakness_handler, "📝"),
    ("get_npc_memory", GET_NPC_MEMORY_SCHEMA, get_npc_memory_handler, "🧠"),
]

def register(ctx) -> None:
    """Register all game tools. Called once by the plugin loader.

    Args:
        ctx: PluginContext provided by Hermes Agent
            - register_tool(name, toolset, schema, handler, check_fn, emoji)
    """
    for name, schema, handler, emoji in _TOOLS:
        ctx.register_tool(
            name=name,
            toolset="tcm_game",
            schema=schema,
            handler=handler,
            check_fn=None,  # 测试环境，无需检查函数
            emoji=emoji,
        )

    print(f"[tcm-game-plugin] Registered {len(_TOOLS)} tools for TCM game")