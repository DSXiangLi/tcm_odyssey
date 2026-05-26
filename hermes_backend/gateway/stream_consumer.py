# hermes_backend/gateway/stream_consumer.py
"""SSE stream consumer for Hermes Backend - REFACTORED with Agent Loop Pattern."""
import json
import os
import logging
from typing import Dict, Any, Generator, List
from pathlib import Path

from gateway.dialog_logger import DialogLogger

logger = logging.getLogger(__name__)

HERMES_NPCS_PATH = Path(__file__).parent.parent.parent / 'hermes' / 'npcs'

def load_npc_soul(npc_id: str) -> str:
    """Load NPC SOUL.md content."""
    soul_path = HERMES_NPCS_PATH / npc_id / 'SOUL.md'
    if soul_path.exists():
        return soul_path.read_text(encoding='utf-8')
    return ""

def load_npc_syllabus(npc_id: str) -> str:
    """Load NPC SYLLABUS.md content."""
    syllabus_path = HERMES_NPCS_PATH / npc_id / 'SYLLABUS.md'
    if syllabus_path.exists():
        return syllabus_path.read_text(encoding='utf-8')
    return ""

def load_skills(npc_id: str) -> str:
    """Load relevant skills."""
    skills_path = HERMES_NPCS_PATH.parent / 'skills'
    if npc_id == 'qingmu':
        guided_path = skills_path / 'guided_questioning.md'
        if guided_path.exists():
            return guided_path.read_text(encoding='utf-8')
    return ""

def build_system_prompt(npc_id: str, player_id: str) -> str:
    """Build system prompt from NPC files."""
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
    prompt_parts.append("\n## 对话规则\n- 使用引导式提问\n- 每次回复包含至少一个引导性问题\n- 语气平和，古朴典雅")

    return "\n\n".join(prompt_parts)

def stream_chat(request: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
    """
    Stream chat with Agent Loop Pattern:
    1. Stream LLM response (thinking + text + tool_calls)
    2. If tool_calls found → execute immediately
    3. Send tool results back to LLM
    4. Continue generation until final response
    """
    from tools.registry import registry
    from openai import OpenAI

    dialog_logger = DialogLogger()
    npc_id = request['npc_id']
    player_id = request['player_id']
    user_message = request['user_message']

    session_id = dialog_logger.start_session(npc_id, player_id, user_message)
    logger.info(f"[AgentLoop] Session started: {session_id}")

    system_prompt = build_system_prompt(npc_id, player_id)
    tools = registry.get_openai_tools()

    api_key = os.getenv('OPENAI_API_KEY') or os.getenv('DEEPSEEK_API_KEY') or os.getenv('GLM_API_KEY')
    base_url = os.getenv('OPENAI_BASE_URL') or os.getenv('DEEPSEEK_API_URL') or os.getenv('GLM_API_BASE') or 'https://api.deepseek.com/v1'

    if not api_key:
        yield {'type': 'error', 'content': '错误：未配置API密钥'}
        return

    client = OpenAI(api_key=api_key, base_url=base_url)
    model = os.getenv('DEEPSEEK_MODEL') or os.getenv('GLM_MODEL_NAME') or 'deepseek-chat'

    # Agent Loop: messages accumulate tool results
    messages = [
        {'role': 'system', 'content': system_prompt},
        {'role': 'user', 'content': user_message}
    ]

    max_iterations = 5  # Prevent infinite loops
    iteration = 0

    while iteration < max_iterations:
        iteration += 1
        logger.info(f"[AgentLoop] Iteration {iteration}/{max_iterations}")

        # Stream LLM response
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=tools,
                tool_choice='auto',
                stream=True
            )
            logger.info(f"[AgentLoop] LLM streaming started, iteration {iteration}")
        except Exception as e:
            logger.error(f"[AgentLoop] LLM API error: {e}")
            yield {'type': 'error', 'content': f'LLM错误: {str(e)}'}
            break

        # Stream thinking + text + accumulate tool_calls
        tool_calls_buffer: List[Dict[str, Any]] = []
        assistant_message_content = ""
        assistant_message_tool_calls = []

        for chunk in response:
            delta = chunk.choices[0].delta

            # Stream thinking (reasoning_content)
            if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                dialog_logger.accumulate_text(delta.reasoning_content, is_reasoning=True)
                logger.debug(f"[AgentLoop] Thinking chunk: {delta.reasoning_content[:30]}...")
                yield {'type': 'thinking', 'content': delta.reasoning_content}

            # Stream text content
            if delta.content:
                assistant_message_content += delta.content
                dialog_logger.accumulate_text(delta.content)
                logger.debug(f"[AgentLoop] Text chunk: {delta.content[:30]}...")
                yield {'type': 'text', 'content': delta.content}

            # Accumulate tool_calls deltas
            if delta.tool_calls:
                for tc in delta.tool_calls:
                    tool_calls_buffer.append({
                        'id': tc.id,
                        'index': tc.index,
                        'name': tc.function.name if tc.function else None,
                        'arguments': tc.function.arguments if tc.function else ''
                    })

        # Check if LLM wants to call tools
        if tool_calls_buffer:
            logger.info(f"[AgentLoop] Tool calls detected: {len(tool_calls_buffer)} chunks")

            # Group and parse tool calls
            grouped: Dict[str, Dict[str, Any]] = {}
            for tc in tool_calls_buffer:
                tc_id = tc.get('id') or f"call_{len(grouped)}"
                if tc_id not in grouped:
                    grouped[tc_id] = {'id': tc_id, 'name': tc['name'], 'arguments': ''}
                if tc['arguments']:
                    grouped[tc_id]['arguments'] += tc['arguments']

            # Execute each tool immediately (within the loop)
            tool_results_for_next_iteration = []
            for tc_id, tc_data in grouped.items():
                name = tc_data['name']
                if not name:
                    continue

                try:
                    args = json.loads(tc_data['arguments'])
                except json.JSONDecodeError:
                    args = {}

                # Add context from request
                if 'player_id' not in args:
                    args['player_id'] = player_id
                if 'npc_id' not in args:
                    args['npc_id'] = npc_id

                # Execute tool
                result = registry.execute_tool(name, args)
                dialog_logger.log_tool_call(name, args, result)
                logger.info(f"[AgentLoop] Tool executed: {name} → result type: {type(result).__name__}")

                # Stream tool_call event to frontend (IMPORTANT: with tid for matching)
                yield {
                    'type': 'tool_call',
                    'name': name,
                    'args': args,
                    'tid': tc_id
                }
                logger.info(f"[AgentLoop] Sent tool_call event: {name}, tid={tc_id}")

                # Stream tool_result event to frontend (IMPORTANT: with tid and snippet)
                result_str = json.dumps(result, ensure_ascii=False) if isinstance(result, dict) else str(result)
                yield {
                    'type': 'tool_result',
                    'result': result,
                    'tid': tc_id,
                    'snippet': result_str[:200] if len(result_str) > 200 else result_str
                }
                logger.info(f"[AgentLoop] Sent tool_result event: tid={tc_id}, snippet={result_str[:50]}")

                # Prepare tool result for next LLM iteration
                tool_results_for_next_iteration.append({
                    'tool_call_id': tc_id,
                    'role': 'tool',
                    'name': name,
                    'content': result_str
                })

                # Build assistant message with tool_calls for conversation history
                assistant_message_tool_calls.append({
                    'id': tc_id,
                    'type': 'function',
                    'function': {
                        'name': name,
                        'arguments': tc_data['arguments']
                    }
                })

            # Add assistant message (with tool_calls) to conversation history
            assistant_msg = {
                'role': 'assistant',
                'content': assistant_message_content or None,
                'tool_calls': assistant_message_tool_calls
            }
            messages.append(assistant_msg)

            # Add tool results to conversation history
            for tool_result in tool_results_for_next_iteration:
                messages.append({
                    'role': 'tool',
                    'tool_call_id': tool_result['tool_call_id'],
                    'name': tool_result['name'],
                    'content': tool_result['content']
                })

            logger.info(f"[AgentLoop] Added {len(tool_results_for_next_iteration)} tool results to messages")

            # Continue to next iteration (LLM will generate response based on tool results)
            continue

        else:
            # No tool calls → Final response reached
            logger.info(f"[AgentLoop] Final response (no tool calls)")

            # Add final assistant message to history
            if assistant_message_content:
                messages.append({
                    'role': 'assistant',
                    'content': assistant_message_content
                })

            # End session
            log_path = dialog_logger.end_session()
            yield {
                'type': 'session_end',
                'session_id': session_id,
                'log_path': str(log_path),
                'iterations': iteration
            }
            break

    if iteration >= max_iterations:
        logger.warning(f"[AgentLoop] Max iterations reached ({max_iterations})")
        yield {'type': 'error', 'content': '达到最大迭代次数，对话终止'}

    logger.info(f"[AgentLoop] Session ended after {iteration} iterations")