// dialog-ledger.jsx — 变体 B：药铺账册 / 医案册
// 朱栏 + 装订线 + 中医医案体例 + 现代游戏的角色立绘条

const LEDGER_HISTORY = [
  {
    role: 'narration',
    label: '初诊',
    text: '春分之日，患者求诊于堂。年三十有二，自述近月以来神疲乏力。',
  },
  {
    role: 'npc',
    name: '陈守中',
    title: '坐堂医 · 太医院传习',
    text: '观你面色萎黄，舌淡有齿痕——此乃[[symptom:气虚]]兼湿之象。可曾贪凉饮冷？',
  },
  {
    role: 'player',
    text: '夏日常饮冰镇酸梅汤，每日数盏。',
  },
  {
    role: 'npc',
    name: '陈守中',
    text: '冰冷直伤脾阳。脾为后天之本，主运化水湿。脾阳不振则[[symptom:湿热]]内生，气血生化乏源，故见乏力。',
  },
  {
    role: 'system',
    text: '【方剂记录】参苓白术散加减',
    detail: '[[herb:黄芪]]15g · [[herb:陈皮]]9g · [[herb:甘草]]6g · 配[[acupoint:足三里]]、[[acupoint:内关]]温和灸',
  },
];

const LEDGER_OPTIONS = [
  { id: 'l1', icon: '问', text: '陈皮为何"年久者良"？', kind: 'study' },
  { id: 'l2', icon: '验', text: '请教内关穴的具体取法', kind: 'practice' },
  { id: 'l3', icon: '辩', text: '我以为应清热，何以反温补？', kind: 'debate' },
  { id: 'l4', icon: '记', text: '（自由记录心得）', kind: 'note' },
];

function LedgerDialog() {
  const historyRef = React.useRef(null);

  return (
    <div style={{
      width: '440px',
      height: '760px',
      background: '#3a2418',
      padding: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      position: 'relative',
      borderRadius: '2px',
    }}>
      {/* 木质边框装饰角 */}
      {[
        { top: 6, left: 6 }, { top: 6, right: 6 },
        { bottom: 6, left: 6 }, { bottom: 6, right: 6 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...pos,
          width: '14px',
          height: '14px',
          border: '1.5px solid #b8893f',
          borderRightWidth: pos.right !== undefined ? 1.5 : 0,
          borderLeftWidth: pos.left !== undefined ? 1.5 : 0,
          borderTopWidth: pos.top !== undefined ? 1.5 : 0,
          borderBottomWidth: pos.bottom !== undefined ? 1.5 : 0,
          opacity: 0.7,
        }} />
      ))}

      <div className="paper-tex" style={{
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset 0 0 40px rgba(120,80,40,0.15)',
      }}>
        {/* 装订线（左侧） */}
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '12px',
          bottom: '12px',
          width: '1px',
          borderLeft: '1px dashed var(--ink-faint)',
          opacity: 0.4,
        }} />
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            position: 'absolute',
            left: '17px',
            top: `${50 + i * 130}px`,
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--ink-faint)',
            opacity: 0.4,
          }} />
        ))}

        {/* 顶部铭牌：朱栏题头 */}
        <div style={{
          padding: '14px 20px 12px 38px',
          borderBottom: '2px solid var(--vermilion)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: '14px',
            bottom: '12px',
            left: '38px',
            width: '3px',
            borderLeft: '1px solid var(--vermilion)',
            borderRight: '1px solid var(--vermilion)',
          }} />
          <div style={{ paddingLeft: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-title)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--vermilion-deep)',
                letterSpacing: '0.3em',
                lineHeight: 1,
              }}>
                医案册
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--ink-faint)',
                letterSpacing: '0.2em',
                marginTop: '6px',
              }}>
                丙辰年 · 春 · 第七卷
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{
                fontSize: '10px',
                color: 'var(--ink-faint)',
                letterSpacing: '0.1em',
              }}>页 七 / 二十</span>
            </div>
          </div>
        </div>

        {/* NPC 立绘卡片（顶部固定） */}
        <div style={{
          margin: '12px 20px 8px 38px',
          padding: '10px 12px',
          background: 'rgba(255,250,235,0.5)',
          border: '1px solid var(--paper-edge)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          position: 'relative',
        }}>
          {/* 立绘 */}
          <div style={{
            width: '54px',
            height: '70px',
            flexShrink: 0,
            border: '1px solid var(--ink-faint)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div className="npc-avatar">
              <div className="npc-avatar-glyph" style={{ fontSize: '36px' }}>陈</div>
              <div style={{ fontSize: '8px', letterSpacing: '0.2em' }}>立绘</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{
                fontFamily: 'var(--font-title)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--ink)',
              }}>陈守中</span>
              <span style={{ fontSize: '10px', color: 'var(--ink-faint)' }}>· 五十有七</span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', marginBottom: '6px' }}>
              坐堂医 · 太医院传习 · 善温补
            </div>
            {/* 好感度等小指示 */}
            <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
              <span style={{ color: 'var(--celadon-deep)' }}>
                ◆ 好感 <span style={{ letterSpacing: '-2px' }}>●●●</span>○○
              </span>
              <span style={{ color: 'var(--vermilion)' }}>
                ✦ 已学 12 / 30
              </span>
            </div>
          </div>
        </div>

        {/* 对话历史区（医案体例） */}
        <div ref={historyRef} className="tcm-scroll" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 18px 12px 38px',
        }}>
          {LEDGER_HISTORY.map((msg, i) => {
            if (msg.role === 'narration') {
              return (
                <div key={i} style={{ margin: '8px 0 12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0,
                    fontFamily: 'var(--font-title)',
                    fontSize: '11px',
                    color: 'var(--vermilion)',
                    border: '1px solid var(--vermilion-soft)',
                    padding: '2px 4px',
                    background: 'var(--paper-light)',
                    minWidth: '24px',
                    textAlign: 'center',
                  }}>
                    {msg.label}
                  </div>
                  <div style={{
                    flex: 1,
                    fontSize: '12px',
                    color: 'var(--ink-faint)',
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                    paddingTop: '2px',
                  }}>
                    <RichText segments={parseRich(msg.text)} />
                  </div>
                </div>
              );
            }
            if (msg.role === 'system') {
              return (
                <div key={i} style={{
                  margin: '14px 0',
                  padding: '10px 12px',
                  background: 'rgba(184,137,63,0.08)',
                  border: '1px solid rgba(184,137,63,0.4)',
                  borderLeft: '3px solid var(--gold)',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--gold-deep)',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    marginBottom: '6px',
                  }}>
                    {msg.text}
                  </div>
                  {msg.detail && (
                    <div style={{
                      fontSize: '12px',
                      lineHeight: 1.7,
                      color: 'var(--ink-soft)',
                    }}>
                      <RichText segments={parseRich(msg.detail)} />
                    </div>
                  )}
                </div>
              );
            }
            if (msg.role === 'npc') {
              return (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-title)',
                    color: 'var(--vermilion)',
                    letterSpacing: '0.2em',
                    marginBottom: '4px',
                  }}>
                    医曰：
                  </div>
                  <div style={{
                    fontSize: '13.5px',
                    lineHeight: 1.9,
                    color: 'var(--ink)',
                    paddingLeft: '8px',
                    borderLeft: '2px solid var(--paper-edge)',
                  }}>
                    <RichText segments={parseRich(msg.text)} />
                  </div>
                </div>
              );
            }
            return (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-title)',
                  color: 'var(--celadon-deep)',
                  letterSpacing: '0.2em',
                  marginBottom: '4px',
                }}>
                  患者答：
                </div>
                <div style={{
                  fontSize: '13px',
                  lineHeight: 1.85,
                  color: 'var(--ink-soft)',
                  paddingLeft: '8px',
                  borderLeft: '2px solid var(--celadon)',
                  fontStyle: 'italic',
                }}>
                  <RichText segments={parseRich(msg.text)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 选项卡片 · 网格 */}
        <div style={{
          padding: '10px 18px 8px 38px',
          borderTop: '1px solid rgba(120,90,50,0.25)',
          background: 'rgba(232,217,184,0.3)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {LEDGER_OPTIONS.map(opt => {
              const tagColor = {
                study: 'var(--celadon-deep)',
                practice: 'var(--vermilion)',
                debate: 'var(--gold-deep)',
                note: 'var(--ink-faint)',
              }[opt.kind];
              return (
                <button
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: 'var(--paper-light)',
                    border: '1px solid var(--paper-edge)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '11.5px',
                    color: 'var(--ink-soft)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = tagColor;
                    e.currentTarget.style.background = 'var(--paper)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--paper-edge)';
                    e.currentTarget.style.background = 'var(--paper-light)';
                  }}
                >
                  <span style={{
                    width: '20px',
                    height: '20px',
                    flexShrink: 0,
                    background: tagColor,
                    color: 'var(--paper-light)',
                    fontFamily: 'var(--font-title)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}>
                    {opt.icon}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.4 }}>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 输入栏 · 仿毛笔批注 */}
        <div style={{
          padding: '8px 18px 12px 38px',
          background: 'rgba(232,217,184,0.4)',
          borderTop: '1px solid rgba(120,90,50,0.15)',
        }}>
          <div style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            background: 'var(--paper-light)',
            border: '1px solid var(--paper-edge)',
            padding: '4px 4px 4px 12px',
          }}>
            <span style={{
              fontFamily: 'var(--font-cursive)',
              fontSize: '14px',
              color: 'var(--vermilion)',
              flexShrink: 0,
            }}>
              批：
            </span>
            <input
              placeholder="自陈所感，或追问医理……"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '6px 0',
                fontFamily: 'var(--font-serif)',
                fontSize: '12.5px',
                color: 'var(--ink)',
              }}
            />
            <button style={{
              background: 'var(--ink)',
              color: 'var(--paper-light)',
              border: 'none',
              padding: '6px 14px',
              fontFamily: 'var(--font-title)',
              fontSize: '12px',
              letterSpacing: '0.2em',
              cursor: 'pointer',
            }}>
              落笔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LedgerDialog = LedgerDialog;
