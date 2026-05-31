#!/bin/bash
# start_npc_test.sh - 启动 Hermes WebUI 测试指定 NPC

NPC_NAME=${1:-qingmu}
HERMES_BASE="/home/lixiang/Desktop/zhongyi_game_v3/hermes/npcs"
HERMES_WEBUI_HOME="/home/lixiang/Desktop/hermes-webui"

export HERMES_HOME="$HERMES_BASE/$NPC_NAME"

echo "=========================================="
echo "🚀 Starting Hermes WebUI with NPC: $NPC_NAME"
echo "=========================================="
echo "   HERMES_HOME: $HERMES_HOME"
echo "   NPC配置:"
echo "     - SOUL.md     (NPC身份性格)"
echo "     - USER.md     (玩家观察)"
echo "     - MEMORY.md   (教学记忆)"
echo "     - Skills:     (教学能力)"
echo "     - Plugins:    (游戏工具)"
echo "=========================================="
echo ""

# 检查配置目录是否存在
if [ ! -d "$HERMES_HOME" ]; then
    echo "❌ Error: NPC directory not found: $HERMES_HOME"
    echo "   Available NPCs:"
    ls -d "$HERMES_BASE"/*/ | xargs -n1 basename
    exit 1
fi

# 检查必要文件
if [ ! -f "$HERMES_HOME/SOUL.md" ]; then
    echo "❌ Error: SOUL.md not found in $HERMES_HOME"
    exit 1
fi

# 检查 Hermes WebUI 目录
if [ ! -d "$HERMES_WEBUI_HOME" ]; then
    echo "❌ Error: Hermes WebUI not found at $HERMES_WEBUI_HOME"
    exit 1
fi

echo "✅ Configuration verified, launching Hermes WebUI..."
cd "$HERMES_WEBUI_HOME"

# 启动 Hermes WebUI（假设有 start.sh）
if [ -f "start.sh" ]; then
    ./start.sh
else
    echo "⚠️  Warning: start.sh not found in $HERMES_WEBUI_HOME"
    echo "   Trying alternative: python -m hermes_webui"
    python3 -m hermes_webui
fi