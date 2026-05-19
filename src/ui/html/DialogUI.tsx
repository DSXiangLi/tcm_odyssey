// src/ui/html/DialogUI.tsx
/**
 * 对话UI React组件
 * 古风卷轴风格 + 富文本教学标记 + SSE流式响应 + 对话历史（最多50条）+ Tool Card展示
 */

import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { SSEClient, ChatRequest } from '../../utils/sseClient';
import { EventBus } from '../../systems/EventBus';
import { DIALOG_EVENTS, DialogMessage } from './bridge/dialog-events';
import { TCM_DATA, TCMKind } from './data/tcm-data';
import { GameStateBridge } from '../../utils/GameStateBridge';

const MAX_HISTORY = 50;

// Tool Call 数据结构（参考 Hermes WebUI）
interface ToolCallState {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  snippet?: string;        // 结果摘要
  done: boolean;           // false=运行中, true=完成
  tid: string;             // 工具调用ID（用于匹配 result）
}

// 工具图标映射（基于工具名）
const TOOL_ICONS: Record<string, string> = {
  get_inventory: '📦',
  get_learning_progress: '📚',
  get_case_progress: '📋',
  trigger_minigame: '🎮',
  record_weakness: '📝',
  get_npc_memory: '🧠',
};

function getToolIcon(name: string): string {
  return TOOL_ICONS[name] || '⚙️';
}

// 工具名称显示映射
const TOOL_NAMES: Record<string, string> = {
  get_inventory: '背包查询',
  get_learning_progress: '学习进度',
  get_case_progress: '病案进度',
  trigger_minigame: '触发小游戏',
  record_weakness: '记录薄弱点',
  get_npc_memory: 'NPC记忆',
};

function getToolDisplayName(name: string): string {
  return TOOL_NAMES[name] || name;
}

// Tool Card 组件
function ToolCard({ tc }: { tc: ToolCallState }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasDetail = tc.snippet || (tc.args && Object.keys(tc.args).length > 0);

  // 格式化结果摘要
  let displaySnippet = '';
  if (tc.snippet) {
    const s = tc.snippet;
    if (s.length <= 200) {
      displaySnippet = s;
    } else {
      displaySnippet = s.slice(0, 200) + '...';
    }
  }

  const cardClass = `tool-card${tc.done ? '' : ' tool-card-running'}`;

  return (
    <div className="tool-card-row">
      <div className={cardClass}>
        <div className="tool-card-header" onClick={() => hasDetail && setIsOpen(!isOpen)}>
          {!tc.done && <span className="tool-card-running-dot" />}
          <span className="tool-card-icon">{getToolIcon(tc.name)}</span>
          <span className="tool-card-name">{getToolDisplayName(tc.name)}</span>
          <span className="tool-card-preview">{displaySnippet || (tc.done ? '完成' : '执行中...')}</span>
          {hasDetail && (
            <span className={`tool-card-toggle${isOpen ? ' open' : ''}`}>▶</span>
          )}
        </div>
        {isOpen && hasDetail && (
          <div className="tool-card-detail">
            {tc.args && Object.keys(tc.args).length > 0 && (
              <div className="tool-card-args">
                {Object.entries(tc.args).map(([k, v]) => (
                  <div key={k}>
                    <span className="tool-arg-key">{k}</span>
                    <span className="tool-arg-val">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            {tc.snippet && (
              <div className="tool-card-result">
                <pre>{tc.snippet}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export interface DialogUIOptions {
  npcId: string;
  npcName: string;
  playerId: string;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onClose?: () => void;
}

interface DialogUIProps extends DialogUIOptions {}

// 富文本解析：[[kind:term]] -> segments
function parseRichText(str: string): Array<{ type: string; content: string }> {
  const out: Array<{ type: string; content: string }> = [];
  const re = /\[\[(\w+):([^\]]+)\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) {
      out.push({ type: 'text', content: str.slice(last, m.index) });
    }
    out.push({ type: m[1], content: m[2] });
    last = m.index + m[0].length;
  }
  if (last < str.length) {
    out.push({ type: 'text', content: str.slice(last) });
  }
  return out;
}

// 单个TCM标记组件
function TCMTerm({ kind, term }: { kind: TCMKind; term: string }) {
  const data = TCM_DATA[kind]?.[term];
  if (!data) return <span>{term}</span>;

  return (
    <span className={`tcm-term tcm-${kind}`}>
      {term}
      <span className="tcm-tooltip">
        <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
          {term}
          {data.pinyin && <span style={{ fontSize: '10px', color: 'var(--ink-faint)', marginLeft: '6px' }}>{data.pinyin}</span>}
        </div>
        <div style={{ fontSize: '10px', color: `var(--${kind === 'acupoint' ? 'acupoint' : kind})`, letterSpacing: '0.1em', marginBottom: '4px' }}>
          {data.tag}
        </div>
        <div style={{ height: '1px', background: 'var(--paper-edge)', margin: '6px 0', opacity: 0.5 }} />
        {Object.entries(data.meta || {}).map(([k, v]) => (
          <div key={k} style={{ fontSize: '11px', display: 'flex', gap: '6px' }}>
            <span style={{ color: 'var(--ink-faint)' }}>{k}</span>
            <span style={{ color: 'var(--ink)' }}>{v}</span>
          </div>
        ))}
        {data.body && (
          <>
            <div style={{ height: '1px', background: 'var(--paper-edge)', margin: '6px 0', opacity: 0.5 }} />
            <div style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--ink-soft)' }}>{data.body}</div>
          </>
        )}
      </span>
    </span>
  );
}

// 富文本渲染
function RichText({ text }: { text: string }) {
  const segments = parseRichText(text);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <React.Fragment key={i}>{seg.content}</React.Fragment>;
        if (['herb', 'acupoint', 'classic', 'symptom'].includes(seg.type)) {
          return <TCMTerm key={i} kind={seg.type as TCMKind} term={seg.content} />;
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </>
  );
}

// 消息组件
function MessageView({ msg }: { msg: DialogMessage }) {
  if (msg.role === 'narration') {
    return (
      <div className="msg-narration">
        <RichText text={msg.text} />
      </div>
    );
  }
  if (msg.role === 'system') {
    return <div className="msg-system">{msg.text}</div>;
  }
  if (msg.role === 'npc') {
    return (
      <div className="msg-npc">
        <div className="msg-npc-header">
          <div className="msg-npc-avatar">{msg.name?.charAt(0) || '医'}</div>
          <div>
            <div className="msg-npc-name">{msg.name}</div>
            {msg.title && <div className="msg-npc-title">{msg.title}</div>}
          </div>
          {msg.mood && <span className="msg-npc-mood">{msg.mood}</span>}
        </div>
        <div className="msg-npc-text">
          <RichText text={msg.text} />
        </div>
      </div>
    );
  }
  // player
  return (
    <div className="msg-player">
      <span className="msg-player-label">学生</span>
      <div className="msg-player-text">
        <RichText text={msg.text} />
      </div>
    </div>
  );
}

export function DialogUI({ npcId, npcName, playerId, onToolCall, onClose }: DialogUIProps) {
  const [messages, setMessages] = useState<DialogMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);  // 用于强制渲染
  const historyRef = useRef<HTMLDivElement>(null);
  const sseClient = useRef(new SSEClient());
  const pendingToolCallsRef = useRef<ToolCallState[]>([]);  // 用于同步访问当前 tool calls

  // 调试：每次渲染时输出 tool calls 状态
  console.log('[DialogUI Render] pendingToolCalls:', pendingToolCallsRef.current.length, 'currentText:', currentText.length, 'isGenerating:', isGenerating);

  // 加载历史对话
  useEffect(() => {
    const bridge = GameStateBridge.getInstance();
    const history = bridge.getDialogHistory(npcId);
    if (history && history.length > 0) {
      setMessages(history);
    }
  }, [npcId]);

  // 组件卸载时中止SSE，防止内存泄漏
  useEffect(() => {
    return () => {
      sseClient.current.stop();
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages, currentText]);

  // 保存历史（裁剪到50条）
  const saveHistory = (newMessages: DialogMessage[]) => {
    const trimmed = newMessages.length > MAX_HISTORY
      ? newMessages.slice(-MAX_HISTORY)
      : newMessages;
    setMessages(trimmed);
    const bridge = GameStateBridge.getInstance();
    bridge.setDialogHistory(npcId, trimmed);
  };

  // 发送消息
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isGenerating) return;

    setInput('');
    setError(null);
    const playerMsg = { role: 'player' as const, text, timestamp: Date.now() };
    saveHistory([...messages, playerMsg]);
    setIsGenerating(true);
    setCurrentText('');

    const request: ChatRequest = {
      npc_id: npcId,
      player_id: playerId,
      user_message: text
    };

    try {
      await sseClient.current.chatStream(
        request,
        (chunk) => setCurrentText(prev => prev + chunk),
        (full) => {
          // 完成时处理
          setIsGenerating(false);
          setCurrentText('');

          // 将完成的 Tool Calls 转换为消息保存到历史中
          const completedToolCalls = pendingToolCallsRef.current.filter(tc => tc.done);
          const toolMessages: DialogMessage[] = completedToolCalls.map(tc => ({
            role: 'system' as const,
            text: `⚙️ ${getToolDisplayName(tc.name)}${tc.snippet ? `: ${tc.snippet.slice(0, 100)}...` : ''}`,
            timestamp: Date.now(),
          }));

          // 清空 ref
          pendingToolCallsRef.current = [];

          // 添加消息到历史
          setMessages(prev => {
            const npcMsg = { role: 'npc' as const, name: npcName, text: full, timestamp: Date.now() };
            const newMessages = [...prev, ...toolMessages, npcMsg];
            const trimmed = newMessages.length > MAX_HISTORY
              ? newMessages.slice(-MAX_HISTORY)
              : newMessages;
            const bridge = GameStateBridge.getInstance();
            bridge.setDialogHistory(npcId, trimmed);
            return trimmed;
          });

          // 强制渲染（清空 Tool Cards）
          forceUpdate(n => n + 1);
        },
        (err) => {
          setError(`错误: ${err.message}`);
          setIsGenerating(false);
        },
        (name, args) => {
          // Tool Call: 添加到 ref，使用 flushSync 强制同步渲染
          const tid = `${name}-${Date.now()}`;
          console.log('[DialogUI] Tool call received:', name, args, 'tid:', tid);

          // 使用 flushSync 确保 DOM 立即更新（避免 React 批处理）
          flushSync(() => {
            // 更新 ref
            pendingToolCallsRef.current.push({
              name,
              args: args as Record<string, unknown>,
              done: false,
              tid,
            });
            // 强制渲染
            forceUpdate(n => n + 1);
          });

          // 同时通过事件传递给Phaser
          const eventBus = EventBus.getInstance();
          const eventData: Record<string, unknown> = { name, args };
          eventBus.emit(DIALOG_EVENTS.TOOL_CALL, eventData);
          if (onToolCall) onToolCall(name, args as Record<string, unknown>);
        },
        (result) => {
          // Tool Result: 更新 ref 中对应的 tool call，使用 flushSync 强制同步渲染
          console.log('[DialogUI] Tool result received:', result);

          const pending = pendingToolCallsRef.current;
          const lastRunningIdx = pending.findIndex(tc => !tc.done);
          console.log('[DialogUI] Updating tool call at index:', lastRunningIdx, 'total:', pending.length);

          if (lastRunningIdx !== -1) {
            const snippet = typeof result === 'object'
              ? JSON.stringify(result, null, 2)
              : String(result);

            // 使用 flushSync 确保 DOM 立即更新（避免 React 批处理）
            flushSync(() => {
              pending[lastRunningIdx] = {
                ...pending[lastRunningIdx],
                result,
                snippet: snippet.length > 300 ? snippet.slice(0, 300) + '...' : snippet,
                done: true,
              };
              // 强制渲染
              forceUpdate(n => n + 1);
            });

            console.log('[DialogUI] Tool call marked as done:', pending[lastRunningIdx].name);
          }
        }
      );
    } catch (err) {
      setError('连接失败，请稍后重试');
      setIsGenerating(false);
    }
  };

  // 停止生成
  const handleStop = () => {
    sseClient.current.stop();
    setIsGenerating(false);
  };

  // 关闭
  const handleClose = () => {
    if (onClose) onClose();
  };

  // 按Enter发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="dialog-root" onClick={(e) => e.stopPropagation()}>
      <div className="dialog-scroll">
        <div className="scroll-bar-top" />
        <div className="dialog-paper">
          {/* 标题栏 */}
          <div className="dialog-header">
            <div>
              <div className="dialog-title">{npcName} - 问诊</div>
              <div className="dialog-subtitle">对话记录</div>
            </div>
            <div className="dialog-seal">{npcName.charAt(0)}</div>
          </div>

          {/* 对话历史 */}
          <div className="dialog-history" ref={historyRef}>
            {messages.map((msg, i) => <MessageView key={i} msg={msg} />)}
            {/* NPC 正在生成的消息 */}
            {(currentText || pendingToolCallsRef.current.length > 0) && (
              <div className="msg-npc msg-npc-streaming">
                <div className="msg-npc-header">
                  <div className="msg-npc-avatar">{npcName.charAt(0)}</div>
                  <div className="msg-npc-name">{npcName}</div>
                  {isGenerating && <span className="msg-npc-status">生成中...</span>}
                </div>
                {/* 先显示已生成的文本 */}
                {currentText && (
                  <div className="msg-npc-text">
                    <RichText text={currentText} />
                  </div>
                )}
                {/* Tool Cards - 在文本之后显示，直接从 ref 渲染 */}
                {pendingToolCallsRef.current.map((tc, i) => <ToolCard key={tc.tid || i} tc={tc} />)}
              </div>
            )}
            {isGenerating && pendingToolCallsRef.current.length === 0 && !currentText && (
              <div className="dialog-loading">
                生成中... <span className="dialog-stop-btn" onClick={handleStop}>停止</span>
              </div>
            )}
            {error && (
              <div className="msg-system" style={{ color: 'var(--vermilion)' }}>{error}</div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="dialog-input-area">
            <div className="dialog-input-row">
              <input
                className="dialog-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="提笔作答..."
                disabled={isGenerating}
              />
              <button className="dialog-send-btn" onClick={handleSend} disabled={isGenerating || !input.trim()}>
                呈
              </button>
            </div>
          </div>
        </div>
        <div className="scroll-bar-bottom" />
        {/* 关闭按钮 */}
        <button className="dialog-close-btn" onClick={handleClose}>X</button>
      </div>
    </div>
  );
}

export default DialogUI;