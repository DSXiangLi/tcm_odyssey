// dialog-modern.jsx — 变体 C：现代游戏 RPG × 古风
// 深色半透明面板 + 朱砂细描边 + 角色立绘大图 + 教学卡片侧栏
// 适合作为悬浮在 3D 场景上的 HUD 风格

const MODERN_HISTORY = [
  {
    role: 'system',
    text: '场景：药王山 · 静室',
  },
  {
    role: 'npc',
    name: '玄真子',
    text: '你能寻到此处，看来与道有缘。先问你一句——什么是"[[classic:上工治未病]]"？',
  },
  {
    role: 'player',
    text: '是说……治病要趁早？',
  },
  {
    role: 'npc',
    name: '玄真子',
    text: '差矣。"未病"非"轻病"。是于尚未发病之时，调摄起居饮食，使邪不可干。此乃[[symptom:气虚]]、[[symptom:风寒]]诸病之防患。',
  },
  {
    role: 'reward',
    text: '心法 +1 · 解锁穴位图谱',
  },
];

const MODERN_OPTIONS = [
  { id: 'm1', text: '此理与《[[classic:阴阳者，天地之道也]]》如何相通？', cost: '心法 1' },
  { id: 'm2', text: '请玄真子示范"[[acupoint:合谷]]"取穴', cost: '体力 2' },
  { id: 'm3', text: '我欲学[[herb:当归]]之用法', cost: '机缘 1' },
];

function ModernDialog() {
  const [tab, setTab] = React.useState('dialog'); // dialog | knowledge

  return (
    <div style={{
      width: '440px',
      height: '760px',
      background:
        'linear-gradient(180deg, #1a0f08 0%, #2a1810 40%, #1a0f08 100%)',
      position: 'relative',
      borderRadius: '4px',
      border: '1px solid rgba(184,137,63,0.35)',
      boxShadow:
        '0 0 40px rgba(0,0,0,0.5), ' +
        'inset 0 0 60px rgba(60,30,15,0.6), ' +
        'inset 0 0 0 1px rgba(255,200,120,0.08)',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* 角线纹饰 */}
      {['tl', 'tr', 'bl', 'br'].map(corner => {
        const isTop = corner.startsWith('t');
        const isLeft = corner.endsWith('l');
        return (
          <svg
            key={corner}
            width="32"
            height="32"
            style={{
              position: 'absolute',
              [isTop ? 'top' : 'bottom']: '8px',
              [isLeft ? 'left' : 'right']: '8px',
              transform: `scale(${isLeft ? 1 : -1}, ${isTop ? 1 : -1})`,
              opacity: 0.7,
            }}
          >
            <path
              d="M 2 14 L 2 2 L 14 2 M 2 8 L 8 8 L 8 2"
              stroke="#b8893f"
              strokeWidth="1"
              fill="none"
            />
            <circle cx="2" cy="2" r="1.5" fill="#b3322a" />
          </svg>
        );
      })}

      {/* NPC 立绘头部区 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '8px 10px 12px',
        borderBottom: '1px solid rgba(184,137,63,0.3)',
        marginBottom: '0',
        position: 'relative',
      }}>
        {/* 立绘 */}
        <div style={{
          width: '70px',
          height: '90px',
          flexShrink: 0,
          border: '1px solid rgba(184,137,63,0.5)',
          background: 'rgba(40,25,15,0.6)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(45deg, rgba(184,137,63,0.06) 0, rgba(184,137,63,0.06) 4px, transparent 4px, transparent 8px)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(232,210,170,0.6)',
          }}>
            <div style={{
              fontFamily: 'var(--font-cursive)',
              fontSize: '40px',
              color: 'rgba(232,210,170,0.85)',
              lineHeight: 1,
            }}>玄</div>
            <div style={{
              fontSize: '8px',
              letterSpacing: '0.2em',
              marginTop: '4px',
              color: 'rgba(184,137,63,0.7)',
            }}>立绘</div>
          </div>
          {/* 等级角标 */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'var(--vermilion)',
            color: '#f7efde',
            fontFamily: 'var(--font-title)',
            fontSize: '10px',
            padding: '2px 5px',
            letterSpacing: '0.05em',
          }}>仙</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
            <span style={{
              fontFamily: 'var(--font-title)',
              fontSize: '20px',
              color: '#e8d2aa',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}>玄真子</span>
            <span style={{
              fontSize: '10px',
              color: 'rgba(232,210,170,0.5)',
              border: '1px solid rgba(184,137,63,0.4)',
              padding: '1px 5px',
            }}>道家 · 隐医</span>
          </div>
          <div style={{
            fontSize: '11px',
            color: 'rgba(232,210,170,0.55)',
            marginBottom: '8px',
            fontStyle: 'italic',
          }}>
            "未病先防，既病防变"
          </div>
          {/* 关系状态条 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9.5px' }}>
              <span style={{ color: 'rgba(232,210,170,0.6)', minWidth: '24px', letterSpacing: '0.1em' }}>悟性</span>
              <div style={{ flex: 1, height: '4px', background: 'rgba(60,40,20,0.6)', position: 'relative' }}>
                <div style={{
                  width: '62%',
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--vermilion), var(--gold))',
                }} />
              </div>
              <span style={{ color: '#e8d2aa', minWidth: '32px', textAlign: 'right' }}>62/100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9.5px' }}>
              <span style={{ color: 'rgba(232,210,170,0.6)', minWidth: '24px', letterSpacing: '0.1em' }}>缘分</span>
              <div style={{ flex: 1, height: '4px', background: 'rgba(60,40,20,0.6)' }}>
                <div style={{
                  width: '38%',
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--celadon), var(--gold))',
                }} />
              </div>
              <span style={{ color: '#e8d2aa', minWidth: '32px', textAlign: 'right' }}>38/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* 标签栏 */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid rgba(184,137,63,0.25)',
        padding: '0 4px',
      }}>
        {[
          { id: 'dialog', label: '对话' },
          { id: 'knowledge', label: '医典' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--vermilion)' : '2px solid transparent',
              color: tab === t.id ? '#e8d2aa' : 'rgba(232,210,170,0.5)',
              fontFamily: 'var(--font-title)',
              fontSize: '13px',
              letterSpacing: '0.2em',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{
          alignSelf: 'center',
          fontSize: '10px',
          color: 'rgba(232,210,170,0.4)',
          letterSpacing: '0.15em',
        }}>
          {tab === 'dialog' ? '可点击下划线词条查看注解' : ''}
        </div>
      </div>

      {/* 主区域：对话历史 */}
      {tab === 'dialog' && (
        <div className="tcm-scroll" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 8px 8px',
          minHeight: 0,
        }}>
          {MODERN_HISTORY.map((msg, i) => {
            if (msg.role === 'system') {
              return (
                <div key={i} style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  color: 'rgba(232,210,170,0.5)',
                  letterSpacing: '0.3em',
                  margin: '4px 0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(184,137,63,0.2)' }} />
                  {msg.text}
                  <div style={{ flex: 1, height: '1px', background: 'rgba(184,137,63,0.2)' }} />
                </div>
              );
            }
            if (msg.role === 'reward') {
              return (
                <div key={i} style={{
                  margin: '10px auto',
                  padding: '6px 14px',
                  background: 'linear-gradient(90deg, transparent, rgba(184,137,63,0.2), transparent)',
                  border: '1px solid rgba(184,137,63,0.5)',
                  borderLeft: 'none',
                  borderRight: 'none',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'var(--gold)',
                  letterSpacing: '0.2em',
                  fontFamily: 'var(--font-title)',
                }}>
                  ✦ {msg.text} ✦
                </div>
              );
            }
            if (msg.role === 'npc') {
              return (
                <div key={i} style={{
                  marginBottom: '14px',
                  background: 'rgba(40,25,15,0.5)',
                  border: '1px solid rgba(184,137,63,0.25)',
                  borderLeft: '3px solid var(--vermilion)',
                  padding: '10px 12px',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '11px',
                    color: 'var(--vermilion-soft)',
                    letterSpacing: '0.2em',
                    marginBottom: '6px',
                  }}>
                    {msg.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    lineHeight: 1.85,
                    color: '#e8d2aa',
                  }}>
                    <RichText segments={parseRich(msg.text)} />
                  </div>
                </div>
              );
            }
            return (
              <div key={i} style={{
                marginBottom: '14px',
                marginLeft: '32px',
                background: 'rgba(50,40,30,0.4)',
                border: '1px solid rgba(232,210,170,0.15)',
                borderRight: '3px solid var(--celadon)',
                padding: '8px 12px',
              }}>
                <div style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '10px',
                  color: 'var(--celadon)',
                  letterSpacing: '0.2em',
                  marginBottom: '4px',
                  textAlign: 'right',
                }}>
                  我
                </div>
                <div style={{
                  fontSize: '12.5px',
                  lineHeight: 1.8,
                  color: 'rgba(232,210,170,0.85)',
                  textAlign: 'right',
                  fontStyle: 'italic',
                }}>
                  <RichText segments={parseRich(msg.text)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'knowledge' && (
        <div className="tcm-scroll" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 8px',
          minHeight: 0,
        }}>
          <div style={{
            fontSize: '11px',
            color: 'rgba(232,210,170,0.5)',
            letterSpacing: '0.15em',
            marginBottom: '10px',
          }}>
            ── 本章已收录 ──
          </div>
          {[
            { kind: 'herb', items: ['黄芪', '当归', '甘草'] },
            { kind: 'acupoint', items: ['足三里', '合谷', '内关'] },
            { kind: 'classic', items: ['上工治未病', '阴阳者，天地之道也'] },
          ].map(group => (
            <div key={group.kind} style={{ marginBottom: '14px' }}>
              <div style={{
                fontFamily: 'var(--font-title)',
                fontSize: '12px',
                color: '#e8d2aa',
                letterSpacing: '0.2em',
                marginBottom: '6px',
              }}>
                {{ herb: '· 药材 ·', acupoint: '· 穴位 ·', classic: '· 古文 ·' }[group.kind]}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {group.items.map(t => (
                  <div key={t} style={{ position: 'relative' }}>
                    <TCMTerm kind={group.kind} term={t} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 选项区 */}
      {tab === 'dialog' && (
        <div style={{
          padding: '8px 6px 6px',
          borderTop: '1px solid rgba(184,137,63,0.3)',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {MODERN_OPTIONS.map((opt, i) => (
              <button
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'rgba(40,25,15,0.6)',
                  border: '1px solid rgba(184,137,63,0.3)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '12px',
                  color: '#d8c2a0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--vermilion-soft)';
                  e.currentTarget.style.background = 'rgba(80,40,30,0.5)';
                  e.currentTarget.style.color = '#f0dab0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(184,137,63,0.3)';
                  e.currentTarget.style.background = 'rgba(40,25,15,0.6)';
                  e.currentTarget.style.color = '#d8c2a0';
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '11px',
                  color: 'var(--vermilion-soft)',
                  flexShrink: 0,
                  width: '14px',
                  textAlign: 'center',
                }}>
                  {['一', '二', '三', '四'][i]}
                </span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>
                  <RichText segments={parseRich(opt.text)} />
                </span>
                <span style={{
                  fontSize: '9.5px',
                  color: 'var(--gold)',
                  border: '1px solid rgba(184,137,63,0.5)',
                  padding: '1px 5px',
                  flexShrink: 0,
                  letterSpacing: '0.05em',
                }}>
                  {opt.cost}
                </span>
              </button>
            ))}
          </div>

          {/* 自由输入 */}
          <div style={{
            marginTop: '8px',
            display: 'flex',
            gap: '6px',
            background: 'rgba(20,12,8,0.7)',
            border: '1px solid rgba(184,137,63,0.3)',
            padding: '4px 4px 4px 12px',
          }}>
            <input
              placeholder="自陈所感……"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '6px 0',
                fontFamily: 'var(--font-serif)',
                fontSize: '12px',
                color: '#e8d2aa',
              }}
            />
            <button style={{
              background: 'var(--vermilion)',
              color: '#f7efde',
              border: 'none',
              padding: '6px 14px',
              fontFamily: 'var(--font-title)',
              fontSize: '12px',
              letterSpacing: '0.2em',
              cursor: 'pointer',
            }}>
              问
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

window.ModernDialog = ModernDialog;
