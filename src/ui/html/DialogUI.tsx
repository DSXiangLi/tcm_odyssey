// src/ui/html/DialogUI.tsx
/**
 * 对话UI React组件
 * 古风卷轴风格 + 富文本教学标记 + SSE流式响应 + 对话历史（最多50条）
 */

import React, { useState, useEffect, useRef } from 'react';
import { SSEClient, ChatRequest } from '../../utils/sseClient';
import { EventBus } from '../../systems/EventBus';
import { DIALOG_EVENTS, DialogMessage } from './bridge/dialog-events';
import { TCM_DATA, TCMKind } from './data/tcm-data';
import { GameStateBridge } from '../../utils/GameStateBridge';

const MAX_HISTORY = 50;

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
  const historyRef = useRef<HTMLDivElement>(null);
  const sseClient = useRef(new SSEClient());

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
          // 使用函数形式更新状态，避免 stale closure
          setMessages(prev => {
            const npcMsg = { role: 'npc' as const, name: npcName, text: full, timestamp: Date.now() };
            const newMessages = [...prev, npcMsg];
            const trimmed = newMessages.length > MAX_HISTORY
              ? newMessages.slice(-MAX_HISTORY)
              : newMessages;
            const bridge = GameStateBridge.getInstance();
            bridge.setDialogHistory(npcId, trimmed);
            return trimmed;
          });
          setCurrentText('');
          setIsGenerating(false);
        },
        (err) => {
          setError(`错误: ${err.message}`);
          setIsGenerating(false);
        },
        (name, args) => {
          // Tool Call通过事件传递给Phaser
          const eventBus = EventBus.getInstance();
          const eventData: Record<string, unknown> = { name, args };
          eventBus.emit(DIALOG_EVENTS.TOOL_CALL, eventData);
          if (onToolCall) onToolCall(name, args as Record<string, unknown>);
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
            {currentText && (
              <div className="msg-npc">
                <div className="msg-npc-header">
                  <div className="msg-npc-avatar">{npcName.charAt(0)}</div>
                  <div className="msg-npc-name">{npcName}</div>
                </div>
                <div className="msg-npc-text">
                  <RichText text={currentText} />
                </div>
              </div>
            )}
            {isGenerating && (
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