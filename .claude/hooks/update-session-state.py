#!/usr/bin/env python3
"""
Session state updater - Analyzes transcript and updates CLAUDE.md.

Runs on PreCompact and SessionEnd hooks.
Reads the last 15 messages from transcript, analyzes progress,
and updates CLAUDE.md with current status and next steps.

Input: JSON via stdin (from Claude Code hook)
  - transcript_path: Path to the session transcript JSONL
  - session_id: Session identifier
  - cwd: Current working directory
  - hook_event_name: PreCompact or SessionEnd
"""

import json
import sys
import os
import re
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", "/home/lixiang/Desktop/zhongyi_game_v3"))
CLAUDE_MD = PROJECT_DIR / "CLAUDE.md"
PLAN_FILE = PROJECT_DIR / "docs/superpowers/plans/2026-04-12-phase2-implementation-plan.md"
MAX_MESSAGES = 15

def read_transcript(transcript_path: str, max_messages: int = MAX_MESSAGES) -> list:
    """Read the last N messages from transcript JSONL file."""
    messages = []
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines[-max_messages:]:
                if line.strip():
                    try:
                        msg = json.loads(line)
                        messages.append(msg)
                    except json.JSONDecodeError:
                        continue
    except FileNotFoundError:
        print(f"Transcript not found: {transcript_path}", file=sys.stderr)
    return messages

def extract_modified_files(messages: list) -> list:
    """Extract file paths that were modified (Write/Edit tools)."""
    files = []
    for msg in messages:
        msg_type = msg.get("type", "")

        # Check assistant messages for tool_use
        if msg_type == "assistant":
            content = msg.get("message", {}).get("content", [])
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "tool_use":
                        tool_name = block.get("name", "")
                        if tool_name in ["Edit", "Write"]:
                            file_path = block.get("input", {}).get("file_path", "")
                            if file_path:
                                files.append(Path(file_path).name)

        # Check for tool_result with file info
        if msg_type == "user":
            content = msg.get("message", {}).get("content", [])
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "tool_result":
                        tool_id = block.get("tool_use_id", "")
                        # Tool results don't have file_path directly, skip
    return files

def extract_user_tasks(messages: list) -> list:
    """Extract user messages (tasks requested)."""
    tasks = []
    for msg in messages:
        if msg.get("type") == "user":
            content = msg.get("message", {}).get("content", "")
            if isinstance(content, str) and len(content) > 20:
                # Clean up command messages
                if not content.startswith("<local-command") and not content.startswith("<command"):
                    tasks.append(content[:100])
            elif isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        text = block.get("text", "")
                        if len(text) > 20 and not text.startswith("<"):
                            tasks.append(text[:100])
    return tasks[-5:]  # Last 5 tasks

def determine_current_step(claude_md_content: str) -> str:
    """Determine current development step from CLAUDE.md."""
    # Look for step markers like S1, S2, etc.
    step_pattern = r'S(\d+).*?(✅|⏳)'
    matches = re.findall(step_pattern, claude_md_content)

    completed = [int(m[0]) for m in matches if m[1] == '✅']
    in_progress = [int(m[0]) for m in matches if m[1] == '⏳']

    if in_progress:
        return f"S{in_progress[0]}"
    elif completed:
        return f"S{max(completed) + 1}"
    else:
        return "S1"

def read_plan_progress() -> dict:
    """Read plan file to determine next steps."""
    try:
        content = PLAN_FILE.read_text(encoding='utf-8')
        # Extract phase/step info
        # This is simplified - could be more sophisticated
        return {"has_plan": True, "phase": "Phase 2"}
    except FileNotFoundError:
        return {"has_plan": False}

def generate_status_line(messages: list, claude_md_content: str) -> str:
    """Generate a concise status line."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Extract info
    modified_files = extract_modified_files(messages)
    tasks = extract_user_tasks(messages)
    current_step = determine_current_step(claude_md_content)

    # Build status
    files_str = ", ".join(modified_files[:3]) if modified_files else "无"

    # Determine phase from CLAUDE.md
    if "Phase 2" in claude_md_content:
        phase = "Phase 2"
    elif "Phase 1.5" in claude_md_content:
        phase = "Phase 1.5"
    else:
        phase = "Phase 1"

    # Determine next todo based on step
    next_steps = {
        "S1": "Hermes基础设施",
        "S2": "数据结构定义",
        "S3": "NPC对话基础",
        "S4": "问诊重构",
        "S5": "病案系统",
        "S6": "诊治游戏流程",
        "S7": "存档系统",
        "S8": "背包系统",
        "S9": "煎药系统",
        "S10": "炮制系统",
        "S11": "种植系统",
        "S12": "经验系统",
        "S13": "引导系统"
    }

    step_desc = next_steps.get(current_step, "开发中")
    return f"{timestamp} | 当前状态: {phase} {current_step} {step_desc} | 最近修改: {files_str} | 下一步: 继续{current_step}开发"

def update_claude_md(status_line: str) -> bool:
    """Update CLAUDE.md with the status line."""
    try:
        if not CLAUDE_MD.exists():
            print(f"CLAUDE.md not found: {CLAUDE_MD}", file=sys.stderr)
            return False

        content = CLAUDE_MD.read_text(encoding='utf-8')

        # Remove old session state marker
        content = re.sub(r'<!-- SESSION_STATE:.*?-->\n?', '', content)

        # Find position to insert (after first heading block)
        lines = content.split('\n')
        insert_pos = 5  # Default position

        for i, line in enumerate(lines[:20]):
            if line.startswith('# ') and i < 3:
                insert_pos = i + 3
            elif not line.startswith('#') and i > 3 and line.strip():
                insert_pos = i
                break

        # Insert new status marker
        lines.insert(insert_pos, f'\n<!-- SESSION_STATE: {status_line} -->\n')

        # Write back
        new_content = '\n'.join(lines)
        CLAUDE_MD.write_text(new_content, encoding='utf-8')

        return True
    except Exception as e:
        print(f"Error updating CLAUDE.md: {e}", file=sys.stderr)
        return False

def main():
    """Main hook execution."""
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("Invalid JSON input", file=sys.stderr)
        sys.exit(0)  # Don't block on error

    hook_event = input_data.get("hook_event_name", "")
    transcript_path = input_data.get("transcript_path", "")

    # Only process PreCompact and SessionEnd
    if hook_event not in ["PreCompact", "SessionEnd"]:
        sys.exit(0)

    if not transcript_path:
        print("No transcript_path in input", file=sys.stderr)
        sys.exit(0)

    # Read current CLAUDE.md
    try:
        claude_md_content = CLAUDE_MD.read_text(encoding='utf-8')
    except FileNotFoundError:
        print("CLAUDE.md not found", file=sys.stderr)
        sys.exit(0)

    # Read transcript
    messages = read_transcript(transcript_path)

    if not messages:
        print("No messages in transcript", file=sys.stderr)
        sys.exit(0)

    # Generate and write status
    status_line = generate_status_line(messages, claude_md_content)

    if update_claude_md(status_line):
        print(f"✓ Session state updated: {status_line}")
    else:
        print("Failed to update session state", file=sys.stderr)

    # Exit 0 to allow action to proceed
    sys.exit(0)

if __name__ == "__main__":
    main()