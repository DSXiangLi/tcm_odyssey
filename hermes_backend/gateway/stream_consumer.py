# hermes_backend/gateway/stream_consumer.py
"""SSE stream consumer for Hermes Backend."""
import json
import os
import logging
from typing import Dict, Any, Generator, List
from pathlib import Path

logger = logging.getLogger(__name__)

# Load NPC files from hermes/npcs/{npc_id}/
HERMES_NPCS_PATH = Path(__file__).parent.parent.parent / 'hermes' / 'npcs'

def load_npc_soul(npc_id: str) -> str:
    """Load NPC SOUL.md content.

    Args:
        npc_id: NPC identifier (e.g., 'qingmu').

    Returns:
        SOUL.md content as string, or empty string if not found.
    """
    soul_path = HERMES_NPCS_PATH / npc_id / 'SOUL.md'
    if soul_path.exists():
        logger.debug(f"Loading SOUL for {npc_id}")
        return soul_path.read_text(encoding='utf-8')
    logger.warning(f"SOUL not found for {npc_id}")
    return ""

def load_npc_syllabus(npc_id: str) -> str:
    """Load NPC SYLLABUS.md content.

    Args:
        npc_id: NPC identifier.

    Returns:
        SYLLABUS.md content, or empty string if not found.
    """
    syllabus_path = HERMES_NPCS_PATH / npc_id / 'SYLLABUS.md'
    if syllabus_path.exists():
        logger.debug(f"Loading SYLLABUS for {npc_id}")
        return syllabus_path.read_text(encoding='utf-8')
    return ""

def load_skills(npc_id: str) -> str:
    """Load relevant skills based on NPC teaching style.

    Args:
        npc_id: NPC identifier.

    Returns:
        Combined skills content for this NPC.
    """
    skills_path = HERMES_NPCS_PATH.parent / 'skills'

    # For qingmu, load guided_questioning
    if npc_id == 'qingmu':
        guided_path = skills_path / 'guided_questioning.md'
        if guided_path.exists():
            logger.debug(f"Loading guided_questioning skill")
            return guided_path.read_text(encoding='utf-8')
    return ""

def build_system_prompt(npc_id: str, player_id: str) -> str:
    """Build system prompt from NPC files.

    Args:
        npc_id: NPC identifier.
        player_id: Player identifier for context.

    Returns:
        Combined system prompt string.
    """
    soul = load_npc_soul(npc_id)
    syllabus = load_npc_syllabus(npc_id)
    skills = load_skills(npc_id)

    prompt_parts = []

    if soul:
        prompt_parts.append(f"## NPC身份\n{soul}")

    if syllabus:
        prompt_parts.append(f"## 教学大纲\n{syllabus}")

    if skills:
        prompt_parts.append(f"## 教学方法\n{skills}")

    prompt_parts.append("\n## 对话规则\n- 使用引导式提问，不直接给出答案\n- 每次回复包含至少一个引导性问题\n- 语气平和，古朴典雅")

    return "\n\n".join(prompt_parts)

def stream_chat(request: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
    """Stream chat response via SSE.

    Args:
        request: Chat request with npc_id, player_id, user_message.

    Yields:
        Dict with type ('text', 'tool_call', 'tool_result') and content.
    """
    from tools.registry import registry
    from openai import OpenAI

    npc_id = request['npc_id']
    player_id = request['player_id']
    user_message = request['user_message']

    # Build system prompt
    system_prompt = build_system_prompt(npc_id, player_id)
    logger.info(f"System prompt built for {npc_id} ({len(system_prompt)} chars)")

    # Get OpenAI tools
    tools = registry.get_openai_tools()
    logger.info(f"Tools available: {len(tools)}")

    # Initialize OpenAI client
    api_key = os.getenv('OPENAI_API_KEY') or os.getenv('DEEPSEEK_API_KEY')
    base_url = os.getenv('OPENAI_BASE_URL') or 'https://api.deepseek.com/v1'

    if not api_key:
        logger.error("No API key found")
        yield {'type': 'text', 'content': '错误：未配置API密钥'}
        return

    client = OpenAI(api_key=api_key, base_url=base_url)

    # Create streaming chat completion
    try:
        response = client.chat.completions.create(
            model='deepseek-chat',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message}
            ],
            tools=tools,
            tool_choice='auto',
            stream=True
        )
    except Exception as e:
        logger.error(f"LLM API error: {e}")
        yield {'type': 'text', 'content': f'错误：{str(e)}'}
        return

    # Stream response chunks
    tool_calls_buffer: List[Dict[str, Any]] = []

    for chunk in response:
        delta = chunk.choices[0].delta

        if delta.content:
            yield {'type': 'text', 'content': delta.content}

        # Handle tool calls (accumulate deltas)
        if delta.tool_calls:
            for tc in delta.tool_calls:
                tool_calls_buffer.append({
                    'id': tc.id,
                    'name': tc.function.name if tc.function else None,
                    'arguments': tc.function.arguments if tc.function else ''
                })

    # Execute tool calls if any
    if tool_calls_buffer:
        # Group tool call deltas by ID and parse arguments
        grouped: Dict[str, Dict[str, Any]] = {}
        for tc in tool_calls_buffer:
            tc_id = tc.get('id', 'unknown')
            if tc_id not in grouped:
                grouped[tc_id] = {'name': tc['name'], 'arguments': ''}
            if tc['arguments']:
                grouped[tc_id]['arguments'] += tc['arguments']

        # Execute each tool
        for tc_id, tc_data in grouped.items():
            name = tc_data['name']
            if not name:
                continue

            try:
                args = json.loads(tc_data['arguments'])
            except json.JSONDecodeError:
                args = {}

            result = registry.execute_tool(name, args)

            yield {
                'type': 'tool_call',
                'name': name,
                'args': args
            }
            yield {
                'type': 'tool_result',
                'result': result
            }

            # Send result summary as text
            yield {
                'type': 'text',
                'content': f"\n[工具调用: {name}]\n"
            }

            logger.info(f"Tool executed: {name} -> {result}")