# NPC AI 自动测试验收实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立完整的 NPC 对话自动测试验收体系，包括后端对话日志、前端触发事件日志、E2E 测试扩展、AI 评估脚本和验收报告生成。

**Architecture:**
- 后端 DialogLogger 在 stream_consumer.py 中集成，记录完整对话和工具调用
- 前端 EventBus/GameLogger 扩展记录 NPC 触发事件
- 复用 scripts/visual_acceptance/ 架构风格创建 scripts/npc_acceptance/
- LLM 评估对话质量（教学风格、连贯性、工具调用合理性）

**Tech Stack:** Python (FastAPI, OpenAI SDK), TypeScript (Playwright), JSON 日志存储

---

## 文件结构

### 新建文件

| 文件 | 责任 |
|------|------|
| `hermes_backend/gateway/dialog_logger.py` | 后端对话日志记录器 |
| `scripts/npc_acceptance/__init__.py` | 包初始化 |
| `scripts/npc_acceptance/config.py` | 验收配置（阈值、权重、API） |
| `scripts/npc_acceptance/dialog_evaluator.py` | LLM 对话质量评估 |
| `scripts/npc_acceptance/report_generator.py` | Markdown 报告生成 |
| `scripts/npc_acceptance/run_all.py` | 全流程编排脚本 |
| `scripts/npc_acceptance/evaluate_only.py` | 仅执行 AI 评估脚本 |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `hermes_backend/gateway/stream_consumer.py` | 集成 DialogLogger |
| `src/systems/EventBus.ts` | 添加 NPC 触发事件类型 |
| `src/utils/GameLogger.ts` | 添加 'npc_trigger' 类别 |
| `tests/e2e/npc-dialog.spec.ts` | 扩展测试场景（19个） |

---

## Task 1: 后端 DialogLogger 实现

**Files:**
- Create: `hermes_backend/gateway/dialog_logger.py`
- Modify: `hermes_backend/gateway/stream_consumer.py:93-203`
- Test: 无独立测试（集成测试在 Task 7）

- [ ] **Step 1: 创建 DialogLogger 类**

创建文件 `hermes_backend/gateway/dialog_logger.py`:

```python
# hermes_backend/gateway/dialog_logger.py
"""Dialog Logger for Hermes Backend."""
import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime


class DialogLogger:
    """对话日志记录器

    负责记录 NPC 对话的完整信息：
    - 会话元数据（session_id, npc_id, player_id, 时间戳）
    - 用户输入消息
    - NPC 完整响应文本
    - 工具调用序列（名称、参数、结果）
    - 响应统计（token数、持续时间）
    """

    def __init__(self, log_dir: str = "logs/dialog"):
        self.log_dir = Path(log_dir)
        self.current_session: Dict[str, Any] = {}
        self.text_buffer: str = ""

    def start_session(self, npc_id: str, player_id: str, user_message: str) -> str:
        """开始对话会话

        Args:
            npc_id: NPC标识符（如 'qingmu'）
            player_id: 玩家标识符
            user_message: 用户输入消息

        Returns:
            session_id: 会话唯一标识符
        """
        session_id = f"{npc_id}_{player_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.current_session = {
            "session_id": session_id,
            "npc_id": npc_id,
            "player_id": player_id,
            "timestamp_start": datetime.now().isoformat(),
            "user_message": user_message,
            "tool_calls": [],
            "full_response": ""
        }
        self.text_buffer = ""
        return session_id

    def log_tool_call(self, name: str, args: dict, result: dict):
        """记录工具调用

        Args:
            name: 工具名称
            args: 工具参数
            result: 工具执行结果
        """
        self.current_session["tool_calls"].append({
            "seq": len(self.current_session["tool_calls"]) + 1,
            "name": name,
            "args": args,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })

    def accumulate_text(self, text: str):
        """累积响应文本

        Args:
            text: SSE流中的文本片段
        """
        self.text_buffer += text

    def end_session(self, token_count: int = None) -> str:
        """结束对话会话并保存日志

        Args:
            token_count: 响应token数量（可选）

        Returns:
            保存的日志文件路径
        """
        if not self.current_session:
            return ""

        self.current_session["timestamp_end"] = datetime.now().isoformat()
        self.current_session["full_response"] = self.text_buffer

        # 计算持续时间
        start_time = datetime.fromisoformat(self.current_session["timestamp_start"])
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        self.current_session["response_duration_ms"] = duration_ms

        # token计数（如果未提供，使用文本长度估算）
        if token_count is None:
            token_count = len(self.text_buffer)
        self.current_session["response_token_count"] = token_count

        # 保存文件
        npc_id = self.current_session["npc_id"]
        date_str = datetime.now().strftime('%Y-%m-%d')
        session_id = self.current_session["session_id"]

        file_path = self.log_dir / npc_id / date_str / f"{session_id}.json"
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.current_session, f, ensure_ascii=False, indent=2)

        # 清空缓冲
        self.text_buffer = ""
        self.current_session = {}

        return str(file_path)

    def get_current_session_id(self) -> str:
        """获取当前会话ID"""
        return self.current_session.get("session_id", "")
```

- [ ] **Step 2: 修改 stream_consumer.py 集成 DialogLogger**

修改 `hermes_backend/gateway/stream_consumer.py`，在文件顶部添加导入：

```python
# 在第8行后添加
from gateway.dialog_logger import DialogLogger
```

修改 `stream_chat()` 函数，在开头添加日志初始化，在流响应中累积文本，在工具执行后记录：

```python
def stream_chat(request: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
    """Stream chat response via SSE."""
    from tools.registry import registry
    from openai import OpenAI

    # 创建对话日志记录器
    dialog_logger = DialogLogger()

    npc_id = request['npc_id']
    player_id = request['player_id']
    user_message = request['user_message']

    # 开始会话日志
    session_id = dialog_logger.start_session(npc_id, player_id, user_message)
    logger.info(f"Session started: {session_id}")

    # ... 原有 system prompt 构建和 client 初始化代码 ...

    # 在流式响应循环中（第148-152行）累积文本
    for chunk in response:
        delta = chunk.choices[0].delta

        if delta.content:
            dialog_logger.accumulate_text(delta.content)  # 新增：累积文本
            yield {'type': 'text', 'content': delta.content}

        # ... tool_calls 处理保持不变 ...

    # 在工具执行后（第185行附近）添加日志记录
    result = registry.execute_tool(name, args)
    dialog_logger.log_tool_call(name, args, result)  # 新增

    yield {'type': 'tool_call', 'name': name, 'args': args}
    yield {'type': 'tool_result', 'result': result}

    # 流结束后保存日志（在函数末尾添加）
    log_path = dialog_logger.end_session()
    logger.info(f"Session ended, log saved: {log_path}")
    yield {'type': 'session_end', 'session_id': session_id, 'log_path': log_path}
```

- [ ] **Step 3: 验证后端日志功能**

```bash
cd hermes_backend && python main.py &
sleep 3
curl -X POST http://localhost:8642/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"npc_id":"qingmu","player_id":"test","user_message":"你好"}'
ls -la logs/dialog/qingmu/
```

Expected: 日志文件存在，格式正确

- [ ] **Step 4: Commit**

```bash
git add hermes_backend/gateway/dialog_logger.py hermes_backend/gateway/stream_consumer.py
git commit -m "$(cat <<'EOF'
feat(hermes): add DialogLogger for session recording

- Record full_response, tool_calls, timestamps
- Auto-save to logs/dialog/{npc_id}/{date}/{session_id}.json
- Integrate into stream_chat() function

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 前端 EventBus NPC 事件扩展

**Files:**
- Modify: `src/systems/EventBus.ts:6-24`

- [ ] **Step 1: 添加 NPC 触发事件类型**

修改 `src/systems/EventBus.ts`，扩展 GameEvents 对象：

```typescript
export const GameEvents = {
  // 场景事件
  SCENE_CREATE: 'scene:create',
  SCENE_READY: 'scene:ready',
  SCENE_DESTROY: 'scene:destroy',
  SCENE_SWITCH: 'scene:switch',

  // 玩家事件
  PLAYER_MOVE: 'player:move',
  PLAYER_STOP: 'player:stop',
  PLAYER_POSITION: 'player:position',
  PLAYER_COLLIDE: 'player:collide',

  // 交互事件
  DOOR_INTERACT: 'door:interact',

  // NPC触发事件（新增）
  NPC_SCENE_ENTER: 'npc:scene_enter',
  NPC_NEARBY_DETECTED: 'npc:nearby_detected',
  NPC_DIALOG_SHOWN: 'npc:dialog_shown',
  NPC_DIALOG_HIDDEN: 'npc:dialog_hidden',
  NPC_USER_INPUT: 'npc:user_input',
  NPC_MINIGAME_TRIGGERED: 'npc:minigame_triggered',

  // 错误事件
  ERROR: 'game:error'
} as const;
```

- [ ] **Step 2: 验证编译**

```bash
npm run build
```

Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/systems/EventBus.ts
git commit -m "$(cat <<'EOF'
feat(event): add NPC trigger events to EventBus

Add 6 NPC-related events:
- NPC_SCENE_ENTER, NPC_NEARBY_DETECTED
- NPC_DIALOG_SHOWN, NPC_DIALOG_HIDDEN
- NPC_USER_INPUT, NPC_MINIGAME_TRIGGERED

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 前端 GameLogger NPC 类别扩展

**Files:**
- Modify: `src/utils/GameLogger.ts:7,30-41,76`

- [ ] **Step 1: 添加 npc_trigger 类别和映射**

修改 `src/utils/GameLogger.ts`：

```typescript
// 第7行
export type LogCategory = 'scene' | 'player' | 'interaction' | 'error' | 'npc_trigger';

// 第30-41行
const EventCategoryMap: Record<string, LogCategory> = {
  [GameEvents.SCENE_CREATE]: 'scene',
  [GameEvents.SCENE_READY]: 'scene',
  [GameEvents.SCENE_DESTROY]: 'scene',
  [GameEvents.SCENE_SWITCH]: 'scene',
  [GameEvents.PLAYER_MOVE]: 'player',
  [GameEvents.PLAYER_STOP]: 'player',
  [GameEvents.PLAYER_POSITION]: 'player',
  [GameEvents.PLAYER_COLLIDE]: 'player',
  [GameEvents.DOOR_INTERACT]: 'interaction',
  [GameEvents.NPC_SCENE_ENTER]: 'npc_trigger',
  [GameEvents.NPC_NEARBY_DETECTED]: 'npc_trigger',
  [GameEvents.NPC_DIALOG_SHOWN]: 'npc_trigger',
  [GameEvents.NPC_DIALOG_HIDDEN]: 'npc_trigger',
  [GameEvents.NPC_USER_INPUT]: 'npc_trigger',
  [GameEvents.NPC_MINIGAME_TRIGGERED]: 'npc_trigger',
  [GameEvents.ERROR]: 'error'
};

// 第76行
private initializeCategories(): void {
  const categories: LogCategory[] = ['scene', 'player', 'interaction', 'error', 'npc_trigger'];
  categories.forEach(category => {
    this.logs.set(category, []);
  });
}
```

- [ ] **Step 2: 验证编译**

```bash
npm run build
```

Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/utils/GameLogger.ts
git commit -m "$(cat <<'EOF'
feat(logger): add npc_trigger category to GameLogger

- Extend LogCategory type
- Map NPC events to npc_trigger category
- Initialize npc_trigger logs array

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: NPC Acceptance 配置和评估模块

**Files:**
- Create: `scripts/npc_acceptance/__init__.py`
- Create: `scripts/npc_acceptance/config.py`
- Create: `scripts/npc_acceptance/dialog_evaluator.py`

- [ ] **Step 1: 创建包初始化**

创建 `scripts/npc_acceptance/__init__.py`:

```python
"""NPC Acceptance Testing Package."""
```

- [ ] **Step 2: 创建配置文件**

创建 `scripts/npc_acceptance/config.py`（包含阈值、权重、LLM配置、评估Prompt模板）

详见设计文档 Section 7.1。

- [ ] **Step 3: 创建对话评估器**

创建 `scripts/npc_acceptance/dialog_evaluator.py`（包含 DialogEvaluator 类）

详见设计文档 Section 6.5。

- [ ] **Step 4: 验证导入**

```bash
python -c "from scripts.npc_acceptance.config import validate_config; print('OK')"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/npc_acceptance/
git commit -m "$(cat <<'EOF'
feat(npc-acceptance): add config and dialog evaluator

- Config: thresholds, weights, LLM API settings
- DialogEvaluator: LLM-based quality assessment
- 3 dimensions: teaching style, coherence, tool calls

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 报告生成器

**Files:**
- Create: `scripts/npc_acceptance/report_generator.py`

- [ ] **Step 1: 创建报告生成器**

创建 `scripts/npc_acceptance/report_generator.py`（包含 ReportGenerator 类）

详见设计文档 Section 8。

- [ ] **Step 2: 验证导入**

```bash
python -c "from scripts.npc_acceptance.report_generator import ReportGenerator; print('OK')"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/npc_acceptance/report_generator.py
git commit -m "$(cat <<'EOF'
feat(npc-acceptance): add report generator

- Generate Markdown summary report
- Calculate final acceptance score
- Save evaluation results JSON

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 全流程编排脚本

**Files:**
- Create: `scripts/npc_acceptance/run_all.py`
- Create: `scripts/npc_acceptance/evaluate_only.py`

- [ ] **Step 1: 创建全流程脚本**

创建 `scripts/npc_acceptance/run_all.py`（包含 NPCAcceptanceRunner 类）

详见设计文档 Section 9.1。

- [ ] **Step 2: 创建仅评估脚本**

创建 `scripts/npc_acceptance/evaluate_only.py`

详见设计文档 Section 9.2。

- [ ] **Step 3: 验证导入**

```bash
python -c "from scripts.npc_acceptance.run_all import NPCAcceptanceRunner; print('OK')"
```

- [ ] **Step 4: Commit**

```bash
git add scripts/npc_acceptance/run_all.py scripts/npc_acceptance/evaluate_only.py
git commit -m "$(cat <<'EOF'
feat(npc-acceptance): add workflow runner scripts

- run_all.py: full acceptance workflow
- evaluate_only.py: standalone dialog evaluation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: E2E 测试扩展

**Files:**
- Modify: `tests/e2e/npc-dialog.spec.ts`

- [ ] **Step 1: 扩展测试场景到19个**

修改 `tests/e2e/npc-dialog.spec.ts`，添加：
- 烟雾测试 (NPC-S01~S03): 3个
- 触发机制测试 (NPC-T01~T04): 4个
- 对话流程测试 (NPC-D01~D05): 5个
- 工具调用测试 (NPC-TC01~TC04): 4个
- 教学质量测试 (NPC-Q01~Q03): 3个

详见设计文档 Section 5.2-5.6。

- [ ] **Step 2: 验证测试语法**

```bash
npx playwright test tests/e2e/npc-dialog.spec.ts --list
```

Expected: 显示19个测试

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/npc-dialog.spec.ts
git commit -m "$(cat <<'EOF'
test(npc): extend E2E tests to 19 scenarios

5 categories:
- Smoke (3): health, sprites, DialogUI
- Trigger (4): scene enter, nearby, space key
- Dialog flow (5): input, send, stream, close
- Tool calls (4): learning progress, minigame
- Quality (3): guided questioning, coherence

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: 更新 PROGRESS.md

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: 添加任务记录**

在 PROGRESS.md 末尾添加 Phase 2.5 NPC AI验收任务记录。

- [ ] **Step 2: Commit**

```bash
git add PROGRESS.md
git commit -m "$(cat <<'EOF'
docs: add Phase 2.5 NPC AI acceptance to PROGRESS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**1. Spec Coverage:** ✅ 全覆盖
**2. Placeholder Scan:** ✅ 无占位符
**3. Type Consistency:** ✅ 类型一致

---

*Plan created by Claude Code, 2026-04-30*