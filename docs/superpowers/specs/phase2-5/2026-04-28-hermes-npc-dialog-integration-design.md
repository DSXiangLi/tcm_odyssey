# Hermes NPC 对话完整集成设计规范

**版本**: v1.0
**日期**: 2026-04-28
**阶段**: Phase 2.5 NPC对话完善
**状态**: 待审阅

---

## 1. 背景与目标

### 1.1 当前状态

| 组件 | 状态 | 说明 |
|-----|------|------|
| HermesManager | ✅ 已实现 | 前端健康检查、状态管理 |
| SSEClient | ✅ 已实现 | SSE流式接收、非流式请求 |
| NPCInteractionSystem | ✅ 已实现 | NPC注册、触发检测、事件记录 |
| DialogUI | ⚠️ 部分实现 | 流式显示，缺少输入框 |
| Hermes后端 | ❌ 未实现 | Python服务不存在 |
| NPC精灵图 | ✅ 已提供 | 像素风格素材已就绪 |
| NPC配置文件 | ✅ 已存在 | 青木先生SOUL/MEMORY/USER/SYLLABUS/TASKS |

### 1.2 核心问题

1. **后端缺失**: 没有 Python 后端服务，对话无法真正调用 LLM
2. **输入缺失**: DialogUI 只有流式显示，玩家无法自由输入
3. **触发单一**: 只有进入场景自动触发，缺少靠近触发机制
4. **NPC单一**: 只有青木先生，缺少其他场景NPC
5. **工具简陋**: 现有工具定义过于简单，无法支持复杂交互

### 1.3 设计目标

| 目标 | 说明 |
|-----|------|
| 完整对话流程 | 玩家输入 → LLM响应 → 流式显示 → 工具调用反馈 |
| 多触发方式 | 进入场景自动触发 + 靠近NPC触发 |
| 多NPC支持 | 诊所(青木) + 药园(老张) + 家(邻居) |
| 状态同步 | NPC能查询/更新玩家学习进度、背包、病案 |
| 功能触发 | NPC对话可触发小游戏(问诊/煎药/种植等) |
| 分离启动 | 前端后端独立启动，手动管理 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         游戏前端 (Phaser)                        │
├─────────────────────────────────────────────────────────────────┤
│  TownOutdoorScene    ClinicScene    GardenScene    HomeScene    │
│       (室外)          (诊所)         (药园)         (家)         │
│                            ↓             ↓             ↓         │
│                      ┌─────────────────────────────────┐         │
│                      │      NPCInteractionSystem       │         │
│                      │  - 注册NPC配置                   │         │
│                      │  - 检测靠近触发                  │         │
│                      │  - 管理对话状态                  │         │
│                      └─────────────────────────────────┘         │
│                            ↓                                     │
│                      ┌─────────────────────────────────┐         │
│                      │         DialogUI                │         │
│                      │  - NPC精灵图/名字/对话内容        │         │
│                      │  - 文本输入框（新增）             │         │
│                      │  - 流式文字显示                  │         │
│                      │  - 停止生成按钮                  │         │
│                      │  - 工具调用回调                  │         │
│                      └─────────────────────────────────┘         │
│                            ↓                                     │
│                      ┌─────────────────────────────────┐         │
│                      │         SSEClient               │         │
│                      │  - POST /v1/chat/stream         │         │
│                      │  - SSE 流式接收                  │         │
│                      │  - 工具调用解析                  │         │
│                      └─────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                             ↓ HTTP/SSE (localhost:8642)
┌─────────────────────────────────────────────────────────────────┐
│                      Hermes Backend (Python)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    gateway/                              │    │
│  │  - main.py (FastAPI 入口, 端口8642)                      │    │
│  │  - stream_consumer.py (SSE 流式输出)                      │    │
│  │  - game_adapter.py (游戏状态桥接)                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    tools/                                │    │
│  │  - registry.py (工具注册机制)                            │    │
│  │  - game_tools.py (6个游戏状态工具)                        │    │
│  │  - score_tool.py (评分工具)                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               hermes/skills/ (语义自动加载)               │    │
│  │  - guided_questioning.md (引导式提问技巧)                 │    │
│  │  - case_analysis.md (病案分析方法)                       │    │
│  │  - feedback_evaluation.md (评分反馈模板)                  │    │
│  │  - herb_explanation.md (药材讲解方法)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               hermes/npcs/{npc_id}/                      │    │
│  │  - SOUL.md (身份性格，决定Skills加载)                     │    │
│  │  - USER.md (玩家观察，个性化对话基础)                     │    │
│  │  - MEMORY.md (教学心得)                                  │    │
│  │  - SYLLABUS.md (教学大纲)                                │    │
│  │  - TASKS.json (任务进度)                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    LLM API                               │    │
│  │  - DeepSeek / Qwen / OpenAI兼容模型                      │    │
│  │  - 配置于 .env 文件                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 启动流程

```
┌─ 用户手动启动 ─────────────────────────────────────────────────┐
│                                                                │
│  1. 启动后端:                                                  │
│     $ cd hermes_backend                                        │
│     $ python main.py                                           │
│     → 后端监听 http://localhost:8642                           │
│     → 显示: "Hermes Backend ready on port 8642"                │
│                                                                │
│  2. 启动前端:                                                  │
│     $ npm run dev                                              │
│     → 前端访问 http://localhost:5173                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌─ 游戏启动检查 ─────────────────────────────────────────────────┐
│                                                                │
│  BootScene.create():                                           │
│    → HermesManager.checkAvailable()                            │
│    → GET http://localhost:8642/health                          │
│                                                                │
│    响应成功:                                                   │
│      → status.available = true                                 │
│      → 显示绿色状态指示                                         │
│                                                                │
│    响应失败:                                                   │
│      → status.available = false                                │
│      → 显示 "[Hermes服务未连接，对话功能受限]"                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌─ NPC对话流程 ──────────────────────────────────────────────────┐
│                                                                │
│  进入场景自动触发:                                              │
│    ClinicScene.create()                                        │
│    → NPCInteractionSystem.recordEnter('qingmu')                │
│    → 延迟1秒                                                   │
│    → showWelcomeDialog()                                       │
│                                                                │
│  靠近NPC触发:                                                   │
│    ClinicScene.update()                                        │
│    → NPCInteractionSystem.checkNearbyTrigger(playerPos, scene) │
│    → 检测到NPC在triggerDistance内                               │
│    → 显示提示: "按空格与青木先生对话"                            │
│    → 空格键按下                                                 │
│    → showDialog('qingmu')                                      │
│                                                                │
│  对话交互:                                                     │
│    DialogUI.showInputDialog()                                  │
│    → 玩家输入问题                                               │
│    → 点击"发送"或回车                                           │
│    → POST /v1/chat/stream                                      │
│                                                                │
│  流式响应:                                                     │
│    SSEClient.chatStream()                                      │
│    → 接收 data: {"text": "你"}                                  │
│    → DialogUI.onChunk("你")                                    │
│    → 逐字显示                                                   │
│                                                                │
│  工具调用:                                                     │
│    接收 data: {"tool_call": {...}}                              │
│    → 解析工具名和参数                                           │
│    → 执行工具                                                   │
│    → 返回结果                                                   │
│    → NPC根据结果继续对话                                        │
│                                                                │
│  功能触发:                                                     │
│    工具: trigger_minigame                                       │
│    → 游戏引擎启动小游戏                                         │
│    → DialogUI.hide()                                           │
│    → 场景切换到小游戏场景                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. NPC配置系统

### 3.1 NPC列表

| NPC ID | 名称 | 所在场景 | 触发位置 | 教学领域 |
|--------|------|---------|---------|---------|
| qingmu | 青木先生 | ClinicScene | (200, 150) | 方剂、辨证、伤寒论 |
| laozhang | 老张 | GardenScene | (180, 120) | 药材种植、炮制 |
| neighbor | 邐居阿姨 | HomeScene | (150, 100) | 日常对话、药膳 |

### 3.2 NPC配置结构

```typescript
// src/data/npc-config.ts
export interface NPCConfig {
  id: string;                    // NPC唯一标识
  name: string;                  // 显示名称
  sceneId: string;               // 所在场景ID
  position: { x: number; y: number };  // 像素坐标
  triggerDistance: number;       // 触发距离(像素)
  spriteKey: string;             // 像素精灵图key
  welcomeMessage?: string;       // 进入场景欢迎语(可选)
  teachingStyle: string[];       // 教学风格关键词(用于Skills加载)
}

export const NPC_REGISTRY: NPCConfig[] = [
  {
    id: 'qingmu',
    name: '青木先生',
    sceneId: SCENES.CLINIC,
    position: { x: 200, y: 150 },
    triggerDistance: 100,
    spriteKey: 'npc_qingmu',
    welcomeMessage: '欢迎来到青木诊所。',
    teachingStyle: ['引导式教学', '经典引用', '案例驱动']
  },
  {
    id: 'laozhang',
    name: '老张',
    sceneId: SCENES.GARDEN,
    position: { x: 180, y: 120 },
    triggerDistance: 80,
    spriteKey: 'npc_laozhang',
    welcomeMessage: '药园里的事情问我。',
    teachingStyle: ['实践指导', '药材辨识']
  },
  {
    id: 'neighbor',
    name: '邻居阿姨',
    sceneId: SCENES.HOME,
    position: { x: 150, y: 100 },
    triggerDistance: 60,
    spriteKey: 'npc_neighbor',
    welcomeMessage: '今天天气不错。',
    teachingStyle: ['日常对话', '药膳介绍']
  }
];
```

### 3.3 SOUL.md 结构示例（青木先生）

```markdown
# 青木先生 - NPC身份定义

## 基本信息
- 姓名: 青木
- 职业: 百草镇唯一的中医师
- 专长: 伤寒论，外感病诊治
- 性格: 稳重温和、循循善诱

## 教学风格
- 引导式教学: 不直接给出答案，通过问题引导
- 经典引用: 讲解时引用《伤寒论》《温病条辨》
- 案例驱动: 通过真实病案让学生实践

## Skills自动加载规则
当对话涉及以下话题时，自动加载对应Skills：
- 辨证讨论 → guided_questioning.md + case_analysis.md
- 方剂讲解 → herb_explanation.md
- 评分反馈 → feedback_evaluation.md

## 经典引用风格
《伤寒论》第35条云：'太阳病，头痛发热...'
```

---

## 4. 前端组件扩展

### 4.1 DialogUI 扩展（添加输入框）

```typescript
// src/ui/DialogUI.ts (扩展)

export class DialogUI extends Phaser.GameObjects.Container {
  // 新增成员
  private inputContainer: Phaser.GameObjects.DOMElement;
  private inputElement: HTMLInputElement;
  private sendButton: Phaser.GameObjects.Text;
  private inputVisible: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: DialogUIConfig) {
    super(scene, x, y);

    // 原有组件...
    this.createBackground();
    this.createAvatar(config.npcSpriteKey);
    this.createNameText(config.npcName);
    this.createContentText();
    this.createStopButton();

    // 新增: 创建输入框
    this.createInputDialog();
  }

  /**
   * 创建输入对话框（HTML DOM元素）
   */
  private createInputDialog(): void {
    // 创建HTML容器
    const html = `
      <div style="display: flex; gap: 8px; width: 500px;">
        <input type="text" id="dialog-input"
               style="width: 400px; padding: 8px;
                      border: 2px solid #80a040;
                      background: #333; color: #fff;
                      font-size: 14px; border-radius: 4px;"
               placeholder="输入问题...">
        <button id="send-btn"
                style="padding: 8px 16px;
                       background: #80a040; color: #fff;
                       border: none; border-radius: 4px; cursor: pointer;">
          发送
        </button>
      </div>
    `;

    this.inputContainer = this.scene.add.dom(
      this.x,
      this.y + this.dialogHeight / 2 + 30,
      'div',
      html
    );
    this.inputContainer.setOrigin(0.5);
    this.inputContainer.setScrollFactor(0);
    this.inputContainer.setDepth(100);

    // 获取DOM元素引用
    this.inputElement = this.inputContainer.node.querySelector('#dialog-input');
    const sendBtn = this.inputContainer.node.querySelector('#send-btn');

    // 绑定事件
    sendBtn.addEventListener('click', () => this.handleSend());
    this.inputElement.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.handleSend();
    });

    // 默认隐藏
    this.inputContainer.setVisible(false);
    this.add(this.inputContainer);
  }

  /**
   * 显示输入框
   */
  showInputDialog(): void {
    this.inputVisible = true;
    this.inputContainer.setVisible(true);
    this.inputElement.value = '';
    this.inputElement.focus();
  }

  /**
   * 隐藏输入框
   */
  hideInputDialog(): void {
    this.inputVisible = false;
    this.inputContainer.setVisible(false);
    this.inputElement.value = '';
  }

  /**
   * 处理发送
   */
  private async handleSend(): Promise<void> {
    const message = this.inputElement.value.trim();
    if (!message) return;

    // 隐藏输入框，显示"正在思考..."
    this.hideInputDialog();
    this.contentText.setText('正在思考...');

    // 发送消息
    try {
      await this.sendMessage(message);
    } catch (error) {
      this.contentText.setText(`错误: ${error.message}`);
      // 3秒后重新显示输入框
      this.scene.time.delayedCall(3000, () => this.showInputDialog());
    }
  }

  /**
   * 对话完成后显示输入框
   */
  private onComplete(fullResponse: string): void {
    this.isGenerating = false;
    this.stopButton.setVisible(false);

    // 延迟显示输入框（让玩家阅读完回复）
    this.scene.time.delayedCall(2000, () => {
      this.showInputDialog();
    });

    if (this.config.onComplete) {
      this.config.onComplete();
    }
  }
}
```

### 4.2 NPCInteractionSystem 扩展（靠近触发）

```typescript
// src/systems/NPCInteraction.ts (扩展)

export class NPCInteractionSystem {
  // 新增成员
  private nearbyNpc: NPCConfig | null = null;
  private triggerHint: Phaser.GameObjects.Text | null = null;

  /**
   * 检测靠近触发（update中调用）
   */
  checkNearbyTrigger(
    playerPosition: { x: number; y: number },
    currentScene: string
  ): NPCConfig | null {
    this.nearbyNpc = null;

    for (const npc of this.npcs.values()) {
      if (npc.sceneId !== currentScene) continue;

      const distance = Math.sqrt(
        Math.pow(playerPosition.x - npc.position.x, 2) +
        Math.pow(playerPosition.y - npc.position.y, 2)
      );

      if (distance <= npc.triggerDistance) {
        this.nearbyNpc = npc;
        return npc;
      }
    }

    return null;
  }

  /**
   * 获取当前附近NPC
   */
  getNearbyNPC(): NPCConfig | null {
    return this.nearbyNpc;
  }

  /**
   * 获取触发提示文字
   */
  getTriggerHint(npcId: string): string {
    const npc = this.npcs.get(npcId);
    if (!npc) return '';
    return `按空格与${npc.name}对话`;
  }

  /**
   * 清除触发提示
   */
  clearTriggerHint(): void {
    if (this.triggerHint) {
      this.triggerHint.destroy();
      this.triggerHint = null;
    }
  }
}
```

### 4.3 场景集成示例（ClinicScene）

```typescript
// src/scenes/ClinicScene.ts (扩展)

export class ClinicScene extends Phaser.Scene {
  // 新增成员
  private nearbyHintText: Phaser.GameObjects.Text | null = null;

  create(): void {
    // 原有代码...

    // 创建NPC（使用像素精灵图）
    this.createNPC();

    // 创建靠近提示文字（初始隐藏）
    this.nearbyHintText = this.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffcc00',
      backgroundColor: '#333333aa',
      padding: { x: 8, y: 4 }
    });
    this.nearbyHintText.setScrollFactor(0);
    this.nearbyHintText.setDepth(50);
    this.nearbyHintText.setVisible(false);
  }

  private createNPC(): void {
    const qingmuConfig = NPC_REGISTRY.find(n => n.id === 'qingmu');

    // 注册NPC
    this.npcSystem.registerNPC(qingmuConfig);

    // 创建NPC精灵图（使用提供的像素素材）
    this.npcSprite = this.add.image(
      qingmuConfig.position.x,
      qingmuConfig.position.y,
      qingmuConfig.spriteKey
    );
    this.npcSprite.setDisplaySize(64, 64);
    this.npcSprite.setDepth(5);

    // 添加NPC名字标签
    const nameLabel = this.add.text(
      qingmuConfig.position.x,
      qingmuConfig.position.y + 50,
      qingmuConfig.name,
      { fontSize: '14px', color: '#ffffff', backgroundColor: '#333333aa' }
    );
    nameLabel.setOrigin(0.5);
    nameLabel.setDepth(5);

    // 进入触发
    this.npcSystem.recordEnter('qingmu');

    // 延迟显示欢迎对话
    this.time.delayedCall(1000, () => {
      this.showWelcomeDialog();
    });
  }

  update(): void {
    // 原有代码...

    // 检测靠近NPC触发
    const nearbyNpc = this.npcSystem.checkNearbyTrigger(
      { x: this.player.x, y: this.player.y },
      SCENES.CLINIC
    );

    if (nearbyNpc && !this.dialogUI) {
      // 显示提示
      this.nearbyHintText.setText(this.npcSystem.getTriggerHint(nearbyNpc.id));
      this.nearbyHintText.setPosition(this.player.x, this.player.y - 30);
      this.nearbyHintText.setVisible(true);

      // 检测空格键按下
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.showDialog(nearbyNpc.id);
      }
    } else {
      // 隐藏提示
      this.nearbyHintText.setVisible(false);
    }
  }

  /**
   * 显示对话UI
   */
  private showDialog(npcId: string): void {
    if (this.dialogUI) return;

    const npc = this.npcSystem.getNPCConfig(npcId);
    const dialogConfig: DialogUIConfig = {
      npcId: npc.id,
      npcName: npc.name,
      npcSpriteKey: npc.spriteKey,
      playerId: 'player_001',
      onToolCall: (toolName, args) => this.handleToolCall(toolName, args),
      onComplete: () => {
        console.log(`[ClinicScene] Dialog with ${npcId} complete`);
      }
    };

    this.dialogUI = new DialogUI(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height - 150,
      dialogConfig
    );
    this.dialogUI.setScrollFactor(0);

    // 显示输入框（等待玩家输入）
    this.dialogUI.showInputDialog();
  }

  /**
   * 处理工具调用
   */
  private handleToolCall(toolName: string, args: object): void {
    console.log(`[ClinicScene] Tool call: ${toolName}`, args);

    switch (toolName) {
      case 'trigger_minigame':
        const { game_type, case_id } = args as any;
        this.startMinigame(game_type, case_id);
        break;

      default:
        console.warn(`[ClinicScene] Unknown tool: ${toolName}`);
    }
  }

  /**
   * 启动小游戏
   */
  private startMinigame(gameType: string, caseId: string): void {
    // 关闭对话UI
    if (this.dialogUI) {
      this.dialogUI.destroy();
      this.dialogUI = null;
    }

    // 场景切换
    switch (gameType) {
      case 'inquiry':
        this.scene.start(SCENES.INQUIRY, { caseId });
        break;
      case 'diagnosis':
        this.scene.start(SCENES.PULSE, { caseId });
        break;
      case 'decoction':
        this.scene.start(SCENES.DECOCTION, { caseId });
        break;
      default:
        console.warn(`[ClinicScene] Unknown game type: ${gameType}`);
    }
  }
}
```

---

## 5. Hermes 后端实现

### 5.1 目录结构

```
hermes_backend/
├── main.py                    # FastAPI 入口
├── requirements.txt           # Python依赖
├── .env                       # LLM配置（从项目根目录读取）
│
├── gateway/
│   ├── __init__.py
│   ├── stream_consumer.py     # SSE 流式输出
│   ├── game_adapter.py        # 游戏状态桥接
│   └── tools_loader.py        # 工具发现与加载
│
├── tools/
│   ├── __init__.py
│   ├── registry.py            # 工具注册机制
│   ├── game_tools.py          # 6个游戏状态工具
│   └── score_tool.py          # 评分工具
│
├── models/
│   ├── __init__.py
│   ├── chat.py                # 请求/响应模型
│   └── tool.py                # 工具调用模型
│
└── agent/
    ├── __init__.py
    ├── npc_agent.py           # NPC Agent核心逻辑
    └── prompt_builder.py      # System Prompt构建
```

### 5.2 FastAPI 入口

```python
# hermes_backend/main.py

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from gateway.stream_consumer import stream_chat
from gateway.tools_loader import discover_tools
from models.chat import ChatRequest, ChatResponse
import os
import json

app = FastAPI(title="Hermes Backend", version="1.0")

# 启动时发现并注册工具
@app.on_event("startup")
async def startup():
    discover_tools()
    print("[Hermes] Tools discovered and registered")

# 健康检查
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "npcs": ["qingmu", "laozhang", "neighbor"],
        "tools_count": len(registry.get_all_tools())
    }

# SSE 流式对话
@app.post("/v1/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        for chunk in stream_chat(request):
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

# 非流式对话
@app.post("/v1/chat")
async def chat(request: ChatRequest):
    result = await run_agent(request)
    return ChatResponse(
        response=result.text,
        tool_calls=result.tool_calls
    )

# NPC状态查询
@app.get("/v1/npc/{npc_id}/status")
async def get_npc_status(npc_id: str, player_id: str):
    from agent.prompt_builder import get_npc_memory
    return get_npc_memory(npc_id, player_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8642)
```

### 5.3 工具定义（详细版）

```python
# hermes_backend/tools/game_tools.py

import json
import os
import requests
from tools.registry import registry
from gateway.game_adapter import get_game_store, get_user_store

# ========================================
# Tool 1: get_learning_progress
# 查询玩家学习进度
# ========================================

GET_LEARNING_PROGRESS_SCHEMA = {
    "name": "get_learning_progress",
    "description": (
        "查询玩家的学习进度。"
        "【调用时机】当师傅需要了解弟子当前学习状态时调用，例如："
        "1. 学生询问'我学到哪了'时"
        "2. 师傅准备安排新任务时"
        "3. 师傅需要针对性讲解弱点时"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {
                "type": "string",
                "description": "玩家唯一标识"
            },
            "task_type": {
                "type": "string",
                "enum": ["prescription", "syndrome", "all"],
                "description": (
                    "任务类型筛选："
                    "'prescription' - 方剂学习（麻黄汤、桂枝汤等）"
                    "'syndrome' - 证型学习（风寒表实、风热犯卫等）"
                    "'all' - 全部任务"
                )
            }
        },
        "required": ["player_id"]
    }
}

def get_learning_progress_handler(args: dict, **kw) -> dict:
    player_id = args["player_id"]
    task_type = args.get("task_type", "all")
    store = get_game_store()
    return store.get_player_tasks(player_id, task_type)

registry.register(
    name="get_learning_progress",
    toolset="tcm_game",
    schema=GET_LEARNING_PROGRESS_SCHEMA,
    handler=get_learning_progress_handler,
    emoji="📊"
)


# ========================================
# Tool 2: get_case_progress
# 查询病案诊治进度
# ========================================

GET_CASE_PROGRESS_SCHEMA = {
    "name": "get_case_progress",
    "description": (
        "查询玩家的病案诊治进度。"
        "【调用时机】当师傅需要了解弟子实践情况时调用，例如："
        "1. 学生询问'我治过哪些病人'时"
        "2. 师傅准备安排新病案时"
        "3. 师傅点评学生诊治表现时"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {
                "type": "string",
                "description": "玩家唯一标识"
            },
            "case_id": {
                "type": "string",
                "description": (
                    "病案ID查询："
                    "'all' - 查询所有病案"
                    "'case_001' - 查询特定病案详情"
                    "'current' - 查询当前进行中的病案"
                )
            }
        },
        "required": ["player_id"]
    }
}

def get_case_progress_handler(args: dict, **kw) -> dict:
    player_id = args["player_id"]
    case_id = args.get("case_id", "all")
    store = get_game_store()
    return store.get_case_progress(player_id, case_id)

registry.register(
    name="get_case_progress",
    toolset="tcm_game",
    schema=GET_CASE_PROGRESS_SCHEMA,
    handler=get_case_progress_handler,
    emoji="📋"
)


# ========================================
# Tool 3: get_inventory
# 查询玩家背包
# ========================================

GET_INVENTORY_SCHEMA = {
    "name": "get_inventory",
    "description": (
        "查询玩家背包内容。"
        "【调用时机】当师傅需要了解弟子拥有的药材或知识储备时调用，例如："
        "1. 学生询问'我有什么药材'时"
        "2. 师傅讲解方剂时，检查学生是否具备相关药材知识"
        "3. 学生准备煎药时，检查药材是否齐全"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {
                "type": "string",
                "description": "玩家唯一标识"
            },
            "category": {
                "type": "string",
                "enum": ["herbs", "seeds", "tools", "knowledge", "all"],
                "description": (
                    "背包类别："
                    "'herbs' - 药材（麻黄、桂枝等）"
                    "'seeds' - 种子（用于药园种植）"
                    "'tools' - 工具（煎药壶、炮制锅等）"
                    "'knowledge' - 知识卡片（已解锁的药材知识）"
                    "'all' - 全部类别"
                )
            }
        },
        "required": ["player_id"]
    }
}

def get_inventory_handler(args: dict, **kw) -> dict:
    player_id = args["player_id"]
    category = args.get("category", "herbs")
    store = get_game_store()
    return store.get_inventory(player_id, category)

registry.register(
    name="get_inventory",
    toolset="tcm_game",
    schema=GET_INVENTORY_SCHEMA,
    handler=get_inventory_handler,
    emoji="🎒"
)


# ========================================
# Tool 4: trigger_minigame
# 启动小游戏
# ========================================

TRIGGER_MINIGAME_SCHEMA = {
    "name": "trigger_minigame",
    "description": (
        "启动指定类型的小游戏。"
        "【调用时机】当师傅讲解完毕准备让弟子实践时调用，例如："
        "1. 讲完麻黄汤组成后，启动煎药游戏实践"
        "2. 讲完风寒表实证后，启动问诊+辨证游戏"
        "3. 学生主动请求'我想试试'时"
        "4. 根据教学大纲任务需要启动特定游戏"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "game_type": {
                "type": "string",
                "enum": ["inquiry", "diagnosis", "decoction", "processing", "planting"],
                "description": (
                    "游戏类型："
                    "'inquiry' - 问诊游戏（收集病人症状）"
                    "'diagnosis' - 辨证选方游戏（脉诊→舌诊→辨证→选方）"
                    "'decoction' - 煎药游戏（实践方剂煎煮）"
                    "'processing' - 炮制游戏（药材炮制方法）"
                    "'planting' - 种植游戏（药园种植药材）"
                )
            },
            "case_id": {
                "type": "string",
                "description": (
                    "关联的病案/方剂/药材ID："
                    "问诊/辨证游戏 → 病案ID如 'case_wind_cold_001'"
                    "煎药游戏 → 方剂ID如 'mahuang_tang'"
                    "炮制/种植游戏 → 药材ID如 'mahuang'"
                )
            },
            "difficulty": {
                "type": "integer",
                "enum": [1, 2, 3],
                "description": (
                    "难度等级："
                    "1 - 初学（有提示，容错高）"
                    "2 - 进阶（少提示，评分严格）"
                    "3 - 精通（无提示，需完美操作）"
                )
            },
            "related_task": {
                "type": "string",
                "description": (
                    "关联的学习任务ID（可选）："
                    "用于记录游戏完成后的学习进度更新"
                    "如 'mahuang-tang-learning'"
                )
            }
        },
        "required": ["game_type", "case_id"]
    }
}

def trigger_minigame_handler(args: dict, **kw) -> dict:
    game_type = args["game_type"]
    case_id = args["case_id"]
    difficulty = args.get("difficulty", 1)
    related_task = args.get("related_task")

    engine_url = os.getenv("GAME_ENGINE_URL", "http://localhost:5173")

    try:
        resp = requests.post(
            f"{engine_url}/api/minigame/start",
            json={
                "game_type": game_type,
                "case_id": case_id,
                "difficulty": difficulty,
                "related_task": related_task
            },
            timeout=5
        )
        return resp.json()
    except requests.RequestException as e:
        return {
            "status": "error",
            "message": f"无法连接游戏引擎: {str(e)}"
        }

def check_game_engine_available():
    return bool(os.getenv("GAME_ENGINE_URL"))

registry.register(
    name="trigger_minigame",
    toolset="tcm_game",
    schema=TRIGGER_MINIGAME_SCHEMA,
    handler=trigger_minigame_handler,
    check_fn=check_game_engine_available,
    emoji="🎮"
)


# ========================================
# Tool 5: record_weakness
# 记录学习弱点
# ========================================

RECORD_WEAKNESS_SCHEMA = {
    "name": "record_weakness",
    "description": (
        "记录学生的学习弱点，用于后续针对性教学。"
        "【调用时机】当师傅发现学生理解有偏差时调用，例如："
        "1. 学生回答错误时，记录错误类型"
        "2. 学生游戏评分低时，记录薄弱环节"
        "3. 师傅主动观察到的学习困难"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {
                "type": "string",
                "description": "玩家唯一标识"
            },
            "task_id": {
                "type": "string",
                "description": "关联的学习任务ID，如 'mahuang-tang-learning'"
            },
            "weakness_type": {
                "type": "string",
                "enum": [
                    "组成记忆", "配伍理解", "功效理解",
                    "主治判断", "煎服法", "禁忌认知",
                    "辨证思路", "脉诊判断", "舌诊判断"
                ],
                "description": "弱点类型分类"
            },
            "details": {
                "type": "string",
                "description": "具体描述，如'不理解桂枝为臣药的温通作用'"
            }
        },
        "required": ["player_id", "task_id", "weakness_type", "details"]
    }
}

def record_weakness_handler(args: dict, **kw) -> dict:
    player_id = args["player_id"]
    task_id = args["task_id"]
    weakness_type = args["weakness_type"]
    details = args["details"]

    store = get_game_store()
    return store.add_weakness(player_id, task_id, weakness_type, details)

registry.register(
    name="record_weakness",
    toolset="tcm_game",
    schema=RECORD_WEAKNESS_SCHEMA,
    handler=record_weakness_handler,
    emoji="📝"
)


# ========================================
# Tool 6: get_npc_memory
# 获取NPC对玩家的观察
# ========================================

GET_NPC_MEMORY_SCHEMA = {
    "name": "get_npc_memory",
    "description": (
        "获取NPC对玩家的观察记录。"
        "【调用时机】当NPC需要个性化对话时调用，例如："
        "1. 场景进入时的欢迎语（参考上次对话内容）"
        "2. 学生询问上次未解答的问题"
        "3. NPC主动询问学习进展"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "npc_id": {
                "type": "string",
                "description": "NPC唯一标识，如 'qingmu'"
            },
            "player_id": {
                "type": "string",
                "description": "玩家唯一标识"
            }
        },
        "required": ["npc_id", "player_id"]
    }
}

def get_npc_memory_handler(args: dict, **kw) -> dict:
    npc_id = args["npc_id"]
    player_id = args["player_id"]

    user_store = get_user_store()
    return user_store.get_player_profile(npc_id, player_id)

registry.register(
    name="get_npc_memory",
    toolset="tcm_game",
    schema=GET_NPC_MEMORY_SCHEMA,
    handler=get_npc_memory_handler,
    emoji="🧠"
)
```

### 5.4 Skills 文档（语义自动加载）

Skills 存放在 `hermes/skills/`，根据 NPC 的 SOUL.md 和对话语义自动加载：

```markdown
# hermes/skills/guided_questioning.md

# 引导式提问技巧

## 适用NPC
- 青木先生（教学风格包含：引导式教学）

## 加载条件
- NPC的SOUL.md中teaching_style包含"引导式教学"
- 或对话上下文涉及"辨证讨论"、"方剂讲解"

## 核心原则
- 不直接给出答案，而是通过问题引导学生思考
- 每个回答至少包含一个引导性问题
- 使用"你可记得"、"你可思考"等引导语

## 对话模式

### 模式1：反问启发
当学生问定义类问题时，引导学生回顾基础知识。

学生："什么是风寒表实证？"
NPC："你可还记得太阳病的主症？那'脉浮，头项强痛而恶寒'的描述，说的是什么道理？"

### 模式2：对比引导
当学生问选择类问题时，引导学生对比思考。

学生："为什么要用麻黄汤？"
NPC："麻黄汤与桂枝汤，同为解表之剂，却有一'实'一'虚'之别。你可知这'实'字，指的是什么？"

### 模式3：案例引导
当学生问实践类问题时，引导学生分析具体案例。

学生："怎么辨证？"
NPC："这位病人恶寒重、发热轻、无汗、脉浮紧。你先说说，这四症各代表什么病理？"

### 模式4：层层深入
逐层推进，引导学生深入思考。

NPC："脉浮——说明病在何处？"
（等待回答）
NPC："浮而紧——这'紧'又说明什么？"
（继续引导）

## 禁止行为
- 直接给出答案："风寒表实证就是..."
- 照本宣科："定义是..."
- 过于简略："用麻黄汤即可。"

## 必须行为
- 先提问后解释："你可思考..."
- 引用经典作为引导素材
- 每次回答包含至少一个引导性问题
- 保持教学节奏，不急于揭示答案

## 工具配合
当检测到学生理解困难时，调用 `record_weakness` 工具记录：
- weakness_type: "辨证思路" / "配伍理解" 等
- details: 具体困惑点描述

当学生准备好实践时，调用 `trigger_minigame` 工具：
- game_type: 根据讨论内容选择
- difficulty: 根据学生掌握程度调整
```

---

## 6. 通信协议

### 6.1 SSE 请求格式

```typescript
// POST /v1/chat/stream
interface ChatRequest {
  npc_id: string;        // "qingmu" | "laozhang" | "neighbor"
  player_id: string;     // "player_001"
  user_message: string;  // 玩家输入的问题
  context?: {            // 可选：对话上下文
    scene_id?: string;   // 当前场景
    recent_history?: Array<{role: string, content: string}>;  // 最近对话
  };
}
```

### 6.2 SSE 响应格式

```
# 文本块
data: {"type": "text", "content": "你"}

# 继续流式文本
data: {"type": "text", "content": "可"}
data: {"type": "text", "content": "记"}
data: {"type": "text", "content": "得"}

# 工具调用
data: {"type": "tool_call", "name": "get_learning_progress", "args": {"player_id": "player_001"}}

# 工具结果
data: {"type": "tool_result", "result": {"tasks": [...], "statistics": {...}}}

# 根据工具结果继续对话
data: {"type": "text", "content": "你当前麻黄汤学习进度65%，配伍理解还需加强。"}

# 完成标记
data: [DONE]
```

### 6.3 前端解析逻辑

```typescript
// src/utils/sseClient.ts (扩展)

async chatStream(
  request: ChatRequest,
  onChunk: (text: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void,
  onToolCall?: (name: string, args: object) => void  // 新增回调
): Promise<void> {
  // ...原有代码...

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        onComplete(fullResponse);
        return;
      }

      try {
        const parsed = JSON.parse(data);

        // 文本块
        if (parsed.type === 'text' && parsed.content) {
          fullResponse += parsed.content;
          onChunk(parsed.content);
        }

        // 工具调用（新增）
        if (parsed.type === 'tool_call' && onToolCall) {
          onToolCall(parsed.name, parsed.args);
        }

        // 工具结果（可选显示）
        if (parsed.type === 'tool_result') {
          console.log('[SSEClient] Tool result:', parsed.result);
        }
      } catch {
        // 非JSON格式，直接作为文本
        fullResponse += data;
        onChunk(data);
      }
    }
  }
}
```

---

## 7. 测试验收标准

### 7.1 E2E 测试场景

| 测试ID | 场景 | 验收标准 |
|--------|------|---------|
| NPC-001 | 后端启动 | `python main.py` 成功启动，`/health` 返回200 |
| NPC-002 | 前端连接 | 游戏启动显示"Hermes服务已连接"绿色状态 |
| NPC-003 | 进入触发 | 进入诊所，1秒后显示青木欢迎对话 |
| NPC-004 | 靠近触发 | 走到青木附近，显示"按空格对话"提示 |
| NPC-005 | 自由输入 | 对话框显示输入框，玩家可输入问题 |
| NPC-006 | 流式显示 | NPC回复逐字显示，无卡顿 |
| NPC-007 | 工具调用 | 询问"我学到哪了"，NPC调用工具返回进度 |
| NPC-008 | 功能触发 | NPC说"开始实践"，成功启动小游戏 |
| NPC-009 | 多NPC切换 | 离开诊所进入药园，显示老张欢迎对话 |
| NPC-010 | 状态同步 | 完成煎药游戏后，NPC能查询到最新进度 |

### 7.2 单元测试覆盖

| 模块 | 测试数 | 覆盖内容 |
|-----|--------|---------|
| HermesManager | 10 | 健康检查、超时、状态暴露 |
| NPCInteractionSystem | 15 | 注册、触发检测、事件记录 |
| DialogUI | 20 | 创建、输入框、流式显示、工具回调 |
| SSEClient | 10 | 流式解析、工具调用解析、错误处理 |
| game_tools.py | 30 | 6个工具的正确调用和返回格式 |
| stream_consumer.py | 15 | SSE格式、Skills加载、Prompt构建 |

---

## 8. 实现优先级

### 8.1 Phase 2.5 实现步骤

| 步骤 | 内容 | 依赖 | 预估工作量 |
|-----|------|------|----------|
| S1 | 创建hermes_backend目录结构 | 无 | 基础搭建 |
| S2 | 实现6个game_tools | S1 | 核心工具 |
| S3 | 实现gateway(FastAPI+SSE) | S2 | 后端核心 |
| S4 | 扩展DialogUI(输入框) | 无 | 前端UI |
| S5 | 扩展NPCInteraction(靠近触发) | 无 | 前端交互 |
| S6 | 场景集成(ClinicScene) | S4, S5 | 场景适配 |
| S7 | NPC精灵图加载 | 无 | 素材集成 |
| S8 | Skills文档编写 | S3 | 教学方法 |
| S9 | 添加其他NPC(老张/邻居) | S6 | NPC扩展 |
| S10 | E2E测试编写 | S1-S9 | 测试验收 |

### 8.2 开发顺序建议

```
后端优先 → 前端适配 → 素材集成 → 测试验收

具体顺序:
1. S1 → S2 → S3 (后端完整实现)
2. S4 → S5 → S6 (前端完整适配)
3. S7 → S8 → S9 (NPC扩展)
4. S10 (测试验收)
```

---

## 9. 相关文档索引

- [Phase 2 NPC Agent设计](../phase2/2026-04-12-phase2-npc-agent-design.md)
- [Hermes后端集成设计](./2026-04-23-hermes-backend-integration-design.md)
- [NPC对话AI评估设计](./2026-04-25-hermes-dialog-ai-eval-design.md)

---

*本文档由 Claude Code 维护，创建于 2026-04-28*