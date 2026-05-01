// dialog-scroll.jsx — 变体 A：经典卷轴风
// 上下木轴 + 宣纸主体 + 角色立绘卡片 + 富文本对话历史 + 玩家输入区

const SCROLL_HISTORY = [
  {
    role: 'narration',
    text: '【辰时三刻 · 仁心堂内】檀香袅袅，老先生捻须而坐，案上摊开一卷《[[classic:上工治未病]]》。',
  },
  {
    role: 'npc',
    name: '苏老郎中',
    title: '杏林前辈 · 六十年临证',
    mood: '温和',
    text: '小友既来，便是有缘。方才你说近日总觉得[[symptom:气虚]]乏力，伸出手来，让老朽诊一诊脉象。',
  },
  {
    role: 'player',
    text: '多谢先生。学生只觉爬两层楼便气喘，夜间盗汗，舌淡苔白……',
  },
  {
    role: 'npc',
    name: '苏老郎中',
    mood: '思索',
    text: '脉浮而虚，确是中气不足之象。古人云："[[classic:阴阳者，天地之道也]]"，调养须从根本入手。可用[[herb:黄芪]]配[[herb:甘草]]为君，再灸[[acupoint:足三里]]以培土生金，旬日可见效。',
  },
  {
    role: 'system',
    text: '✦ 解锁医案条目：气虚证的基本调治',
  },
];

const SCROLL_OPTIONS = [
  { id: 'q1', text: '黄芪与甘草同用，是何配伍之理？', tag: '深问' },
  { id: 'q2', text: '足三里穴具体在何处？怎样取穴？', tag: '取穴' },
  { id: 'q3', text: '若不愿服药，可有食疗之法？', tag: '食疗' },
  { id: 'q4', text: '（自由作答）', tag: '自述' },
];

function ScrollDialog() {
  const [input, setInput] = React.useState('');
  const historyRef = React.useRef(null);

  React.useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, []);

  return (
    <div style={{
      width: '460px',
      height: '760px',
      position: 'relative',
      padding: '18px 6px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 顶部木轴 */}
      <div className="scroll-bar" style={{ marginBottom: '-2px', zIndex: 2 }} />

      {/* 宣纸主体 */}
      <div className="paper-tex" style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow:
          'inset 0 8px 16px -8px rgba(80,50,20,0.25), ' +
          'inset 0 -8px 16px -8px rgba(80,50,20,0.25), ' +
          '0 4px 16px rgba(60,40,20,0.2)',
        overflow: 'hidden',
      }}>
        {/* 顶部标题栏 */}
        <div style={{
          padding: '14px 24px 10px',
          borderBottom: '1px solid rgba(120,90,50,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(255,250,235,0.4) 0%, transparent 100%)',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-title)',
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '0.2em',
            }}>
              仁心堂 · 问诊录
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--ink-faint)',
              letterSpacing: '0.15em',
              marginTop: '2px',
            }}>
              第三章 · 气虚之证
            </div>
          </div>
          <div className="seal">仁心</div>
        </div>

        {/* 对话历史 · 富文本 · 可滚动 */}
        <div
          ref={historyRef}
          className="tcm-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 24px 12px',
          }}
        >
          {SCROLL_HISTORY.map((msg, i) => {
            if (msg.role === 'narration') {
              return (
                <div key={i} style={{
                  fontSize: '12px',
                  color: 'var(--ink-faint)',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  margin: '6px 0 18px',
                  letterSpacing: '0.05em',
                  lineHeight: 1.7,
                }}>
                  <RichText segments={parseRich(msg.text)} />
                </div>
              );
            }
            if (msg.role === 'system') {
              return (
                <div key={i} style={{
                  fontSize: '11px',
                  color: 'var(--vermilion)',
                  textAlign: 'center',
                  margin: '14px 0',
                  letterSpacing: '0.1em',
                  fontWeight: 500,
                }}>
                  {msg.text}
                </div>
              );
            }
            if (msg.role === 'npc') {
              return (
                <div key={i} style={{ marginBottom: '20px' }}>
                  {/* 姓名条 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      flexShrink: 0,
                      border: '1px solid var(--paper-edge)',
                      borderRadius: '50%',
                      overflow: 'hidden',
                    }}>
                      <div className="npc-avatar" style={{ borderRadius: '50%', border: 'none' }}>
                        <div className="npc-avatar-glyph" style={{ fontSize: '20px', margin: 0 }}>苏</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-title)',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}>
                        {msg.name}
                      </div>
                      {msg.title && (
                        <div style={{ fontSize: '10px', color: 'var(--ink-faint)' }}>
                          {msg.title}
                        </div>
                      )}
                    </div>
                    {msg.mood && (
                      <span style={{
                        fontSize: '10px',
                        color: 'var(--vermilion)',
                        border: '1px solid var(--vermilion-soft)',
                        padding: '2px 6px',
                        borderRadius: '1px',
                        letterSpacing: '0.1em',
                      }}>
                        {msg.mood}
                      </span>
                    )}
                  </div>
                  {/* 对话内容 */}
                  <div style={{
                    fontSize: '13.5px',
                    lineHeight: 1.85,
                    color: 'var(--ink-soft)',
                    paddingLeft: '44px',
                    textIndent: '0',
                  }}>
                    <RichText segments={parseRich(msg.text)} />
                  </div>
                </div>
              );
            }
            // player
            return (
              <div key={i} style={{
                marginBottom: '20px',
                paddingLeft: '40px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '4px',
                  fontFamily: 'var(--font-cursive)',
                  fontSize: '14px',
                  color: 'var(--vermilion)',
                  writingMode: 'vertical-rl',
                  letterSpacing: '0.1em',
                }}>
                  学生
                </div>
                <div style={{
                  fontSize: '13px',
                  lineHeight: 1.8,
                  color: 'var(--ink-soft)',
                  fontStyle: 'italic',
                  borderLeft: '2px solid var(--vermilion-soft)',
                  paddingLeft: '12px',
                }}>
                  <RichText segments={parseRich(msg.text)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 选项区 */}
        <div style={{
          borderTop: '1px solid rgba(120,90,50,0.2)',
          padding: '12px 20px 8px',
          background: 'rgba(255,250,235,0.3)',
        }}>
          <div style={{
            fontSize: '10px',
            color: 'var(--ink-faint)',
            letterSpacing: '0.15em',
            marginBottom: '8px',
          }}>
            ── 可问 ──
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SCROLL_OPTIONS.map(opt => (
              <button
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderLeft: '2px solid var(--paper-edge)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '12.5px',
                  color: 'var(--ink-soft)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(179,50,42,0.06)';
                  e.currentTarget.style.borderLeftColor = 'var(--vermilion)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'var(--paper-edge)';
                }}
              >
                <span style={{
                  fontSize: '9px',
                  color: 'var(--vermilion)',
                  border: '1px solid var(--vermilion-soft)',
                  padding: '1px 4px',
                  borderRadius: '1px',
                  flexShrink: 0,
                }}>
                  {opt.tag}
                </span>
                <span style={{ flex: 1 }}>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 自由输入 */}
        <div style={{
          padding: '10px 20px 14px',
          borderTop: '1px solid rgba(120,90,50,0.15)',
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'stretch',
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              background: 'var(--paper-light)',
              border: '1px solid var(--paper-edge)',
              borderRadius: '1px',
            }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="提笔作答……"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '10px 12px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '13px',
                  color: 'var(--ink)',
                }}
              />
            </div>
            <button
              className="tcm-btn tcm-btn-primary"
              style={{ padding: '0 18px', fontSize: '13px' }}
            >
              呈
            </button>
          </div>
        </div>
      </div>

      {/* 底部木轴 */}
      <div className="scroll-bar" style={{ marginTop: '-2px', zIndex: 2 }} />
    </div>
  );
}

window.ScrollDialog = ScrollDialog;
