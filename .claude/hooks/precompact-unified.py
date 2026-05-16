#!/usr/bin/env python3
"""
PreCompact Hook - 解析transcript并调用Claude自主更新文档

改进：
- 不使用JSON输出格式
- Claude自主使用Edit/Write工具完成文档更新
- Claude根据实际判断选择insert/replace/append等方式

Input (stdin JSON):
  - transcript_path: 完整对话记录路径 (JSONL格式)
  - session_id: 当前session ID
"""

import json
import sys
import subprocess
import os
import select
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

PROJECT_DIR = Path("/home/lixiang/Desktop/zhongyi_game_v3")
CORE_DOCS = ["STATE.md", "PROGRESS.md", "handover.md"]
LOG_FILE = PROJECT_DIR / ".claude" / "hooks" / "precompact.log"

# 限制参数
MAX_DIALOGUE_ROUNDS = 5  # 保留最近5轮对话
MAX_TEXT_LENGTH = 1000   # 每条消息最大长度
CLAUDE_TIMEOUT = 120     # Claude调用超时时间（秒）

def log(message: str):
    """写入日志文件"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}\n"
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_entry)
    except:
        pass

def parse_transcript(transcript_path: str) -> List[Dict[str, Any]]:
    """解析JSONL transcript，提取对话记录"""
    messages = []
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if entry.get('type') == 'user':
                        content_raw = entry.get('message', {}).get('content', '')
                        if isinstance(content_raw, list):
                            content = ' '.join([
                                str(p) if isinstance(p, str) else p.get('text', '')
                                for p in content_raw if p
                            ])
                        else:
                            content = str(content_raw)
                        if content:
                            messages.append({
                                'type': 'user',
                                'content': content[:MAX_TEXT_LENGTH],
                                'timestamp': entry.get('timestamp', '')
                            })
                    elif entry.get('type') == 'assistant':
                        content_parts = entry.get('message', {}).get('content', [])
                        text_content = ''
                        for part in content_parts:
                            if part.get('type') == 'text':
                                text_content += part.get('text', '')
                        if text_content:
                            messages.append({
                                'type': 'assistant',
                                'content': text_content[:MAX_TEXT_LENGTH],
                                'timestamp': entry.get('timestamp', '')
                            })
                except json.JSONDecodeError:
                    continue
        return messages
    except Exception as e:
        log(f"ERROR parsing transcript: {e}")
        return []

def extract_dialogue_summary(messages: List[Dict[str, Any]]) -> str:
    """提取最近对话摘要（最多5轮）"""
    if not messages:
        return "无对话记录"

    # 取最近5轮（10条消息：5个user + 5个assistant）
    recent = messages[-MAX_DIALOGUE_ROUNDS * 2:] if len(messages) > MAX_DIALOGUE_ROUNDS * 2 else messages

    dialogue_parts = []
    for msg in recent:
        role = "用户" if msg['type'] == 'user' else "助手"
        content = msg['content']
        if len(content) > 400:
            content = content[:400] + "..."
        dialogue_parts.append(f"**{role}**: {content}")

    return "\n\n".join(dialogue_parts)

def read_doc_content(doc_name: str, max_length: int = 2000) -> str:
    """读取文档内容"""
    doc_path = PROJECT_DIR / doc_name
    try:
        if doc_path.exists():
            with open(doc_path, 'r', encoding='utf-8') as f:
                return f.read()[:max_length]
    except Exception as e:
        log(f"Warning: Failed to read {doc_name}: {e}")
    return f"{doc_name} 文件不存在或无法读取"

def generate_task_prompt(dialogue_summary: str, session_id: str) -> str:
    """生成任务prompt - Claude自主使用工具完成更新"""

    progress_content = read_doc_content("PROGRESS.md", 2500)
    state_content = read_doc_content("STATE.md", 1500)
    handover_content = read_doc_content("handover.md", 800)
    today = datetime.now().strftime("%Y-%m-%d")

    prompt = f"""你是项目文档维护助手。请根据对话记录，自主更新项目文档。

## 当前日期
{today}

## 最近对话记录（Session: {session_id}）

{dialogue_summary}

## 当前文档状态

### handover.md（前800字符）
{handover_content}

### PROGRESS.md（前2500字符）
{progress_content}

### STATE.md（前1500字符）
{state_content}

---

## 你的任务

请自主判断并更新文档：

### 1. handover.md（必须更新）
使用 **Write** 工具重写整个文件，为下一个session提供完整上下文。

必须包含：
- 当前任务（从对话提取）
- 待处理列表（表格）
- 执行步骤
- PROGRESS摘要
- STATE摘要
- 参考文档链接

如果对话无实质进展，内容简短：
"# Handover - 无重大进展
继续当前任务，参考 PROGRESS.md 和 STATE.md"

### 2. PROGRESS.md（按需更新）
根据对话判断是否有实质进展：
- **有新任务开始** → 使用 **Edit** 在末尾追加新章节（insert模式）
- **任务有进展** → 使用 **Edit** 更新相关章节内容
- **问题修复** → 使用 **Edit** 在修复章节追加记录
- **任务完成** → 使用 **Edit** 标记✅，追加完成记录
- **无实质进展**（仅咨询/讨论） → 不更新

### 3. STATE.md（按需更新）
仅在Phase完全完成时更新：
- **Phase完成**（设计+实现+测试+Git） → 使用 **Edit** 追加新Phase章节
- **Phase未完成** → 不更新，仅记录在PROGRESS.md

---

## 执行步骤

1. 先分析对话，判断进展类型
2. 使用 **Write** 工具更新 handover.md
3. 如果有实质进展，使用 **Edit** 更新 PROGRESS.md
4. 如果Phase完成，使用 **Edit** 更新 STATE.md
5. 最后输出简短总结

---

## 注意

- 直接使用工具执行更新，不要输出JSON
- Edit时使用准确的old_string匹配，避免失败
- 保持文档格式一致性
- 日期使用 {today}
- 完成后简要说明更新了哪些内容"""

    return prompt

def call_claude_with_tools(prompt: str, timeout: int = CLAUDE_TIMEOUT) -> bool:
    """
    使用 subprocess.Popen 调用Claude执行工具更新

    优化：不累积文本输出，只监控工具调用状态
    Claude会直接使用Edit/Write工具修改文件，无需记录文本

    Returns:
        bool: 是否成功执行（至少有一个Write/Edit工具调用成功）
    """
    log(f"Starting Claude subprocess (timeout={timeout}s)...")
    log(f"Prompt size: {len(prompt)} chars")

    # 移除CLAUDECODE环境变量以允许嵌套调用
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

    cmd = [
        "claude",
        "-p", prompt,
        "--output-format", "stream-json",
        "--dangerously-skip-permissions",
    ]

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(PROJECT_DIR),
            env=env,
        )
    except Exception as e:
        log(f"ERROR: Failed to start Claude process: {e}")
        return False

    start_time = time.time()
    buffer = ""
    tool_success_count = 0  # 成功的工具调用数量
    tool_calls_log = []  # 记录工具调用详情

    try:
        while time.time() - start_time < timeout:
            # 检查进程是否结束
            if process.poll() is not None:
                remaining = process.stdout.read()
                if remaining:
                    buffer += remaining.decode("utf-8", errors="replace")
                break

            # 使用select等待输出
            ready, _, _ = select.select([process.stdout], [], [], 1.0)
            if not ready:
                continue

            # 读取数据
            try:
                chunk = os.read(process.stdout.fileno(), 8192)
                if not chunk:
                    break
                buffer += chunk.decode("utf-8", errors="replace")
            except OSError:
                break

            # 解析JSON行，只关注工具相关事件
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                line = line.strip()
                if not line:
                    continue

                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue

                etype = event.get("type", "")

                # 处理assistant消息（记录工具调用）
                if etype == "assistant":
                    message = event.get("message", {})
                    for content_item in message.get("content", []):
                        if content_item.get("type") == "tool_use":
                            tool_name = content_item.get("name", "")
                            tool_input = content_item.get("input", {})
                            tool_id = content_item.get("id", "")

                            if tool_name in ("Write", "Edit"):
                                path = tool_input.get("file_path", "")
                                tool_calls_log.append({
                                    "name": tool_name,
                                    "path": path,
                                    "id": tool_id,
                                    "status": "pending"
                                })
                                log(f"Tool: {tool_name} → {Path(path).name if path else '?'}")

                # 处理工具执行结果
                elif etype == "tool_result":
                    tool_use_id = event.get("tool_use_id", "")
                    # 简化判断：如果有tool_result，说明工具执行了
                    # 文件是否被修改由后续git status确认
                    for tc in tool_calls_log:
                        if tc["id"] == tool_use_id and tc["status"] == "pending":
                            tc["status"] = "executed"
                            if tc["name"] in ("Write", "Edit"):
                                tool_success_count += 1
                                log(f"  ✓ {tc['name']} executed")
                            break

                # 处理最终结果
                elif etype == "result":
                    # 统计结果
                    write_count = sum(1 for tc in tool_calls_log if tc["name"] == "Write")
                    edit_count = sum(1 for tc in tool_calls_log if tc["name"] == "Edit")
                    log(f"Completed: Write={write_count}, Edit={edit_count}")

                    # 至少有一个Write/Edit被调用
                    return len(tool_calls_log) > 0

        # 超时处理
        log(f"ERROR: Timeout after {timeout}s")
        log(f"Tools before timeout: {len(tool_calls_log)} called, {tool_success_count} succeeded")
        return tool_success_count > 0

    finally:
        # 清理进程
        if process.poll() is None:
            process.kill()
            process.wait()

def git_backup() -> bool:
    """Git备份核心文档"""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", *CORE_DOCS],
            capture_output=True, text=True, cwd=str(PROJECT_DIR)
        )
        if result.stdout.strip():
            subprocess.run(
                ["git", "add", *CORE_DOCS],
                cwd=str(PROJECT_DIR), check=True
            )
            subprocess.run(
                ["git", "commit", "-m", f"backup: pre-compact snapshot ({datetime.now().strftime('%Y-%m-%d %H:%M')})"],
                cwd=str(PROJECT_DIR), check=True
            )
            log("Git backup commit created")
            return True
        return False
    except subprocess.CalledProcessError as e:
        log(f"ERROR: Git backup failed: {e}")
        return False

def git_commit_updates() -> bool:
    """Git提交文档更新"""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", *CORE_DOCS],
            capture_output=True, text=True, cwd=str(PROJECT_DIR)
        )
        if result.stdout.strip():
            subprocess.run(
                ["git", "add", *CORE_DOCS],
                cwd=str(PROJECT_DIR), check=True
            )
            subprocess.run(
                ["git", "commit", "-m", f"docs: PreCompact auto-update ({datetime.now().strftime('%Y-%m-%d %H:%M')})"],
                cwd=str(PROJECT_DIR), check=True
            )
            log("Git commit: docs auto-updated")
            return True
        return False
    except subprocess.CalledProcessError as e:
        log(f"ERROR: Git commit failed: {e}")
        return False

def main():
    log("=== PreCompact Hook Started (Auto Tool) ===")

    # 解析输入
    try:
        input_data = json.load(sys.stdin)
        transcript_path = input_data.get('transcript_path', '')
        session_id = input_data.get('session_id', 'unknown')
        log(f"Session: {session_id}")
        log(f"Transcript: {transcript_path}")
    except Exception as e:
        log(f"WARNING: Failed to parse stdin: {e}")
        transcript_path = ''
        session_id = 'unknown'

    # 1. Git备份（先做，保护现有文档）
    git_backup()

    # 2. 解析transcript（保留最近5轮对话）
    if transcript_path and Path(transcript_path).exists():
        messages = parse_transcript(transcript_path)
        log(f"Parsed {len(messages)} messages from transcript")

        dialogue_summary = extract_dialogue_summary(messages)
        log(f"Dialogue summary (recent {MAX_DIALOGUE_ROUNDS} rounds): {len(dialogue_summary)} chars")

        # 3. 生成任务prompt（让Claude自主使用工具）
        prompt = generate_task_prompt(dialogue_summary, session_id)

        # 4. 调用Claude（自主使用Edit/Write工具）
        success = call_claude_with_tools(prompt, timeout=CLAUDE_TIMEOUT)

        if success:
            # 5. Git提交更新（Claude已经执行了工具调用）
            git_commit_updates()
        else:
            log("No successful Write/Edit operations")
    else:
        log(f"Transcript not found: {transcript_path}")

    log("=== PreCompact Hook Completed ===")
    sys.exit(0)  # 始终成功，不阻塞compact

if __name__ == "__main__":
    main()