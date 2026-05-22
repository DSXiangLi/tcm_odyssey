// src/ui/html/DialogUI.tsx
/**
 * 对话UI React组件
 * 古风卷轴风格 + 富文本教学标记 + SSE流式响应 + 对话历史（最多50条）+ Tool Card展示
 */

import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { SSEClient, ChatRequest } from '../../utils/sseClient';
import { EventBus } from '../../systems/EventBus';
import { DIALOG_EVENTS, DialogMessage, ToolCallState } from './bridge/dialog-events';
import { TCM_DATA, TCMKind } from './data/tcm-data';
import { GameStateBridge } from '../../utils/GameStateBridge';
import type { GameContextForNPC } from './bridge/npc-feedback-bridge';
import { formatScoreForNPC } from '../../utils/DiagnosisScorer';
import { hideDialogUI } from './dialog-entry';

const MAX_HISTORY = 50;

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

// Thinking展示组件 - 支持完全折叠
function ThinkingView({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="msg-thinking">
      <div className="msg-thinking-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="msg-thinking-icon">💭</span>
        <span className="msg-thinking-label">AI思考过程</span>
        <span className={`msg-thinking-toggle${isExpanded ? ' open' : ''}`}>▶</span>
      </div>
      {isExpanded && (
        <div className="msg-thinking-content">
          {content}
        </div>
      )}
    </div>
  );
}

export interface DialogUIOptions {
  npcId: string;
  npcName: string;
  playerId: string;
  /** 游戏上下文，用于feedback模式下向NPC提供游戏状态 */
  gameContext?: GameContextForNPC;
  /** 对话模式：normal(普通对话) | feedback(游戏结果反馈) */
  mode?: 'normal' | 'feedback';
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

// 富文本渲染（用于thinking等纯文本）
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

// Markdown富文本渲染（用于最终回答）
function MarkdownRichText({ text }: { text: string }) {
  // 先解析TCM标记，然后将剩余文本交给react-markdown处理
  const segments = parseRichText(text);

  return (
    <div className="markdown-content">
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          // 使用react-markdown渲染纯文本部分
          return <ReactMarkdown key={i}>{seg.content}</ReactMarkdown>;
        }
        if (['herb', 'acupoint', 'classic', 'symptom'].includes(seg.type)) {
          return <TCMTerm key={i} kind={seg.type as TCMKind} term={seg.content} />;
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </div>
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
        {/* 1. 第一轮思考 - tool执行前 */}
        {msg.preThinking && <ThinkingView content={msg.preThinking} />}
        {/* 2. Tool Cards */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="msg-tool-calls-section">
            {msg.toolCalls.map((tc, i) => <ToolCard key={tc.tid || i} tc={tc} />)}
          </div>
        )}
        {/* 3. 第二轮思考 - tool执行后 */}
        {msg.postThinking && <ThinkingView content={msg.postThinking} />}
        {/* 4. 最终回答文本 */}
        <div className="msg-npc-text">
          <MarkdownRichText text={msg.text} />
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

export function DialogUI({
  npcId,
  npcName,
  playerId,
  gameContext,
  mode = 'normal',
  onToolCall,
  onClose
}: DialogUIProps) {
  const [messages, setMessages] = useState<DialogMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);  // 用于强制渲染
  const historyRef = useRef<HTMLDivElement>(null);
  const sseClient = useRef(new SSEClient());
  const pendingToolCallsRef = useRef<ToolCallState[]>([]);  // tool calls
  const feedbackSentRef = useRef<boolean>(false);  // 标记是否已发送feedback初始prompt

  // 分段内容：tool_call之前的内容 vs tool_result之后的内容
  const preToolThinkingRef = useRef<string>('');   // 第一轮thinking
  const preToolTextRef = useRef<string>('');       // 第一轮text
  const postToolThinkingRef = useRef<string>('');  // 第二轮thinking
  const postToolTextRef = useRef<string>('');      // 第二轮text
  const hasToolBeenCalledRef = useRef<boolean>(false);  // 标记是否已触发tool

  // 用于UI渲染的state（从ref同步）
  const [displayThinking, setDisplayThinking] = useState('');
  const [displayText, setDisplayText] = useState('');

  // 调试：每次渲染时输出状态
  console.log('[DialogUI Render] hasToolCall:', hasToolBeenCalledRef.current,
    'preThinking:', preToolThinkingRef.current.length,
    'preText:', preToolTextRef.current.length,
    'postThinking:', postToolThinkingRef.current.length,
    'postText:', postToolTextRef.current.length);

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
  }, [messages, displayThinking, displayText]);  // update scroll trigger

  // Feedback模式：自动发送游戏上下文给NPC
  useEffect(() => {
    if (mode !== 'feedback' || !gameContext || feedbackSentRef.current || isGenerating) {
      return;
    }

    // 标记已发送，防止重复发送
    feedbackSentRef.current = true;

    // 根据context类型格式化prompt
    let feedbackPrompt: string;
    if (gameContext.type === 'diagnosis' && gameContext.diagnosisResult) {
      const { patientName, userAnswers, score } = gameContext.diagnosisResult;
      feedbackPrompt = formatScoreForNPC(score, patientName, userAnswers);
    } else {
      // heartbeat类型后续实现
      feedbackPrompt = '[心跳检查请求]\n请检查玩家的学习状态。';
    }

    // 自动发送prompt（模拟用户发送）
    setIsGenerating(true);
    setError(null);
    const systemMsg = { role: 'system' as const, text: '诊断完成，正在请求导师点评...', timestamp: Date.now() };
    setMessages([systemMsg]);

    // 清空所有buffer
    preToolThinkingRef.current = '';
    preToolTextRef.current = '';
    postToolThinkingRef.current = '';
    postToolTextRef.current = '';
    hasToolBeenCalledRef.current = false;
    pendingToolCallsRef.current = [];
    setDisplayThinking('');
    setDisplayText('');

    const request: ChatRequest = {
      npc_id: npcId,
      player_id: playerId,
      user_message: feedbackPrompt
    };

    sseClient.current.chatStream(
      request,
      // onChunk
      (chunk) => {
        if (hasToolBeenCalledRef.current) {
          postToolTextRef.current += chunk;
        } else {
          preToolTextRef.current += chunk;
        }
        setDisplayText(preToolTextRef.current + postToolTextRef.current);
      },
      // onComplete
      (full) => {
        setIsGenerating(false);
        const preThinking = preToolThinkingRef.current;
        const postThinking = postToolThinkingRef.current;
        const savedToolCalls = [...pendingToolCallsRef.current];

        setMessages(prev => {
          const npcMsg: DialogMessage = {
            role: 'npc',
            name: npcName,
            text: full,
            preThinking: preThinking,
            postThinking: postThinking,
            toolCalls: savedToolCalls,
            timestamp: Date.now()
          };
          const newMessages = [...prev, npcMsg];
          const trimmed = newMessages.length > MAX_HISTORY
            ? newMessages.slice(-MAX_HISTORY)
            : newMessages;
          const bridge = GameStateBridge.getInstance();
          bridge.setDialogHistory(npcId, trimmed);
          return trimmed;
        });

        // 清空streaming内容
        preToolThinkingRef.current = '';
        preToolTextRef.current = '';
        postToolThinkingRef.current = '';
        postToolTextRef.current = '';
        pendingToolCallsRef.current = [];
        hasToolBeenCalledRef.current = false;
        setDisplayThinking('');
        setDisplayText('');
        forceUpdate(n => n + 1);
      },
      // onError
      (err) => {
        setError(`错误: ${err.message}`);
        setIsGenerating(false);
      },
      // onToolCall
      (name, args, tid) => {
        const toolTid = tid || `${name}-${Date.now()}`;
        console.log('[DialogUI Feedback] Tool call received:', name, 'tid:', toolTid);
        hasToolBeenCalledRef.current = true;

        flushSync(() => {
          pendingToolCallsRef.current.push({
            name,
            args: args as Record<string, unknown>,
            done: false,
            tid: toolTid,
          });
          forceUpdate(n => n + 1);
        });

        const eventBus = EventBus.getInstance();
        const eventData: Record<string, unknown> = { name, args };
        eventBus.emit(DIALOG_EVENTS.TOOL_CALL, eventData);
        if (onToolCall) onToolCall(name, args as Record<string, unknown>);
      },
      // onToolResult
      (result, tid, snippet) => {
        console.log('[DialogUI Feedback] Tool result received:', tid);
        const pending = pendingToolCallsRef.current;
        const targetIdx = pending.findIndex(tc => tc.tid === tid);

        if (targetIdx !== -1) {
          const displaySnippet = snippet || (typeof result === 'object'
            ? JSON.stringify(result, null, 2)
            : String(result));

          flushSync(() => {
            pending[targetIdx] = {
              ...pending[targetIdx],
              result,
              snippet: displaySnippet,
              done: true,
            };
            forceUpdate(n => n + 1);
          });
        }
      },
      // onThinking
      (thinkingChunk) => {
        if (hasToolBeenCalledRef.current) {
          postToolThinkingRef.current += thinkingChunk;
        } else {
          preToolThinkingRef.current += thinkingChunk;
        }
        setDisplayThinking(preToolThinkingRef.current + postToolThinkingRef.current);
      }
    );
  }, [mode, gameContext, npcId, npcName, playerId, onToolCall, isGenerating]);

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

    // 清空所有buffer
    preToolThinkingRef.current = '';
    preToolTextRef.current = '';
    postToolThinkingRef.current = '';
    postToolTextRef.current = '';
    hasToolBeenCalledRef.current = false;
    pendingToolCallsRef.current = [];
    setDisplayThinking('');
    setDisplayText('');

    const request: ChatRequest = {
      npc_id: npcId,
      player_id: playerId,
      user_message: text
    };

    try {
      await sseClient.current.chatStream(
        request,
        // onChunk: text内容
        (chunk) => {
          if (hasToolBeenCalledRef.current) {
            // 第二轮：tool之后的text
            postToolTextRef.current += chunk;
          } else {
            // 第一轮：tool之前的text
            preToolTextRef.current += chunk;
          }
          // 更新显示状态（合并pre和post）
          setDisplayText(preToolTextRef.current + postToolTextRef.current);
        },
        // onComplete: 完成时保存消息
        (full) => {
          setIsGenerating(false);

          // 分别保存pre和post thinking
          const preThinking = preToolThinkingRef.current;
          const postThinking = postToolThinkingRef.current;
          const savedToolCalls = [...pendingToolCallsRef.current];
          const fullText = full;

          // 保存NPC消息到历史（分别保存preThinking和postThinking）
          setMessages(prev => {
            const npcMsg: DialogMessage = {
              role: 'npc',
              name: npcName,
              text: fullText,
              preThinking: preThinking,      // 第一轮思考（tool之前）
              postThinking: postThinking,    // 第二轮思考（tool之后）
              toolCalls: savedToolCalls,
              timestamp: Date.now()
            };
            const newMessages = [...prev, npcMsg];
            const trimmed = newMessages.length > MAX_HISTORY
              ? newMessages.slice(-MAX_HISTORY)
              : newMessages;
            const bridge = GameStateBridge.getInstance();
            bridge.setDialogHistory(npcId, trimmed);
            return trimmed;
          });

          // 清空所有streaming内容（避免与历史消息重复）
          preToolThinkingRef.current = '';
          preToolTextRef.current = '';
          postToolThinkingRef.current = '';
          postToolTextRef.current = '';
          pendingToolCallsRef.current = [];
          hasToolBeenCalledRef.current = false;

          // 清空显示状态
          setDisplayThinking('');
          setDisplayText('');
          forceUpdate(n => n + 1);
        },
        // onError
        (err) => {
          setError(`错误: ${err.message}`);
          setIsGenerating(false);
        },
        // onToolCall: 标记已触发tool，保存第一轮内容
        (name, args, tid) => {
          const toolTid = tid || `${name}-${Date.now()}`;
          console.log('[DialogUI] Tool call received:', name, 'tid:', toolTid);

          // 标记已触发tool - 之后的thinking/text都属于第二轮
          hasToolBeenCalledRef.current = true;

          flushSync(() => {
            pendingToolCallsRef.current.push({
              name,
              args: args as Record<string, unknown>,
              done: false,
              tid: toolTid,
            });
            forceUpdate(n => n + 1);
          });

          // 同时通过事件传递给Phaser
          const eventBus = EventBus.getInstance();
          const eventData: Record<string, unknown> = { name, args };
          eventBus.emit(DIALOG_EVENTS.TOOL_CALL, eventData);
          if (onToolCall) onToolCall(name, args as Record<string, unknown>);
        },
        // onToolResult: 更新对应的tool card
        (result, tid, snippet) => {
          console.log('[DialogUI] Tool result received:', tid);

          const pending = pendingToolCallsRef.current;
          const targetIdx = pending.findIndex(tc => tc.tid === tid);

          if (targetIdx !== -1) {
            const displaySnippet = snippet || (typeof result === 'object'
              ? JSON.stringify(result, null, 2)
              : String(result));

            flushSync(() => {
              pending[targetIdx] = {
                ...pending[targetIdx],
                result,
                snippet: displaySnippet,  // 保存完整内容
                done: true,
              };
              forceUpdate(n => n + 1);
            });
          }
        },
        // onThinking: thinking内容
        (thinkingChunk) => {
          if (hasToolBeenCalledRef.current) {
            // 第二轮：tool之后的thinking
            postToolThinkingRef.current += thinkingChunk;
          } else {
            // 第一轮：tool之前的thinking
            preToolThinkingRef.current += thinkingChunk;
          }
          // 更新显示状态（合并pre和post）
          setDisplayThinking(preToolThinkingRef.current + postToolThinkingRef.current);
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
    hideDialogUI();  // 移除Dialog UI容器
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
            {/* NPC 正在生成的消息 - 按正确顺序分段渲染 */}
            {(isGenerating || preToolThinkingRef.current || preToolTextRef.current || pendingToolCallsRef.current.length > 0 || postToolThinkingRef.current || postToolTextRef.current) && (
              <div className={`msg-npc${isGenerating ? ' msg-npc-streaming' : ''}`}>
                <div className="msg-npc-header">
                  <div className="msg-npc-avatar">{npcName.charAt(0)}</div>
                  <div className="msg-npc-name">{npcName}</div>
                  {isGenerating && <span className="msg-npc-status">生成中...</span>}
                </div>

                {/* 1. 第一轮thinking (tool之前) */}
                {preToolThinkingRef.current && (
                  <ThinkingView content={preToolThinkingRef.current} />
                )}

                {/* 2. 第一轮text (tool之前) */}
                {preToolTextRef.current && (
                  <div className="msg-npc-text">
                    <RichText text={preToolTextRef.current} />
                  </div>
                )}

                {/* 3. Tool Cards */}
                {pendingToolCallsRef.current.length > 0 && (
                  <div className="msg-tool-calls-section">
                    {pendingToolCallsRef.current.map((tc, i) => <ToolCard key={tc.tid || i} tc={tc} />)}
                  </div>
                )}

                {/* 4. 第二轮thinking (tool之后) */}
                {postToolThinkingRef.current && (
                  <ThinkingView content={postToolThinkingRef.current} />
                )}

                {/* 5. 第二轮text (tool之后) */}
                {postToolTextRef.current && (
                  <div className="msg-npc-text">
                    <MarkdownRichText text={postToolTextRef.current} />
                  </div>
                )}
              </div>
            )}
            {isGenerating && !preToolThinkingRef.current && !preToolTextRef.current && !postToolThinkingRef.current && !postToolTextRef.current && pendingToolCallsRef.current.length === 0 && (
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