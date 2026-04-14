# hermes_cli/config.py
"""游戏模式Hermes配置"""

import os

# 游戏数据目录
GAME_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')

# Hermes运行模式
HERMES_GAME_MODE = os.environ.get('HERMES_GAME_MODE', 'true')

# API端口
GAME_API_PORT = int(os.environ.get('GAME_API_PORT', 8642))

# NPC目录
NPC_DIR = os.path.join(os.path.dirname(__file__), '..', 'hermes', 'npcs')

# 默认NPC模型（从环境变量读取，优先使用GLM）
DEFAULT_NPC_MODEL = os.environ.get('GLM_LLM_MODEL', 'anthropic/claude-opus-4.6')