// dialog-ledger-v2.jsx — B 版改进：医案册 + A 卷轴元素 + C 选项动效
// 教学场景：中医老师 ↔ 学生玩家
// 改动：① 顶部加木轴卷轴条 ② logo 用印章铭牌 ③ 选项一行一个，深色金朱描边 hover 动效 ④ 师生教学对话

const TEACH_HISTORY = [
  {
    role: 'narration',
    label: '今日',
    text: '杏林斋内，先生取出一卷《本草》，今日讲"四气五味"。',
  },
  {
    role: 'npc',
    name: '苏先生',
    text: '今日先讲一味[[herb:陈皮]]。问你：何以"年久者良"？',
  },
  {
    role: 'player',
    text: '弟子愚见——是否陈久后烈性减、药效更醇？',
  },
  {
    role: 'npc',
    name: '苏先生',
    text: '近矣。陈皮辛温，新者燥烈伤津。久陈则燥性渐去，唯留[[symptom:湿热]]之化、行气健脾之功，故曰"陈久者良"。',
  },
  {
    role: 'system',
    text: '【今日所记】陈皮 · 性味要诀',
    detail: '[[herb:陈皮]] —— 辛苦温，归脾肺。理气健脾，燥湿化痰。配[[herb:甘草]]调和，灸[[acupoint:足三里]]助运。',
  },
  {
    role: 'npc',
    name: '苏先生',
    text: '你既已明此理，可还有何疑问？',
  },
];

const TEACH_OPTIONS = [
  { id: 't1', icon: '问', text: '陈皮与青皮，同出一物，作用有何分别？', kind: 'study' },
  { id: 't2', icon: '验', text: '请先生示范[[acupoint:足三里]]的取穴之法', kind: 'practice' },
  { id: 't3', icon: '辩', text: '辛温之物岂非助火？此处温补可有忌？', kind: 'debate' },
  { id: 't4', icon: '记', text: '（自陈心得，或追问医理……）', kind: 'note' },
];

function LedgerV2Dialog() {
  const historyRef = React.useRef(null);

  React.useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, []);

  return (
    <div style={{
      width: '440px',
      height: '780px',
      background: '#3a2418',
      padding: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      position: 'relative',
      borderRadius: '2px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 木质边框装饰角 */}
      {[
        { top: 6, left: 6 }, { top: 6, right: 6 },
        { bottom: 6, left: 6 }, { bottom: 6, right: 6 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: '14px', height: '14px',
          border: '1.5px solid #b8893f',
          borderRightWidth: pos.right !== undefined ? 1.5 : 0,
          borderLeftWidth: pos.left !== undefined ? 1.5 : 0,
          borderTopWidth: pos.top !== undefined ? 1.5 : 0,
          borderBottomWidth: pos.bottom !== undefined ? 1.5 : 0,
          opacity: 0.7,
        }} />
      ))}

      {/* 顶部木轴（来自 A） */}
      <div className="scroll-bar" style={{ marginBottom: '0', zIndex: 2, flexShrink: 0 }} />

      <div className="paper-tex" style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset 0 0 40px rgba(120,80,40,0.15)',
        minHeight: 0,
      }}>
        {/* 装订线（左侧） */}
        <div style={{
          position: 'absolute', left: '20px', top: '12px', bottom: '12px',
          width: '1px', borderLeft: '1px dashed var(--ink-faint)', opacity: 0.4,
        }} />
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            position: 'absolute', left: '17px', top: `${60 + i * 130}px`,
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--ink-faint)', opacity: 0.4,
          }} />
        ))}

        {/* 顶部铭牌：朱栏题头 + 印章 logo（融合 A） */}
        <div style={{
          padding: '14px 20px 12px 38px',
          borderBottom: '2px solid var(--vermilion)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          {/* 朱砂印章 logo（来自 A） */}
          <div className="seal" style={{ flexShrink: 0 }}>杏林</div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0,
              width: '3px',
              borderLeft: '1px solid var(--vermilion)',
              borderRight: '1px solid var(--vermilion)',
            }} />
            <div style={{ paddingLeft: '12px' }}>
              <div style={{
                fontFamily: 'var(--font-title)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--vermilion-deep)',
                letterSpacing: '0.3em',
                lineHeight: 1,
              }}>
                杏林讲席
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--ink-faint)',
                letterSpacing: '0.2em',
                marginTop: '6px',
              }}>
                第七课 · 本草纲要
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '10px', color: 'var(--ink-faint)', letterSpacing: '0.1em',
            flexShrink: 0,
          }}>
            页 七 / 二十
          </div>
        </div>

        {/* 老师立绘卡片 */}
        <div style={{
          margin: '12px 20px 8px 38px',
          padding: '10px 12px',
          background: 'rgba(255,250,235,0.5)',
          border: '1px solid var(--paper-edge)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{
            width: '54px', height: '70px', flexShrink: 0,
            border: '1px solid var(--ink-faint)', position: 'relative', overflow: 'hidden',
          }}>
            <div className="npc-avatar">
              <div className="npc-avatar-glyph" style={{ fontSize: '36px' }}>苏</div>
              <div style={{ fontSize: '8px', letterSpacing: '0.2em' }}>立绘</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{
                fontFamily: 'var(--font-title)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)',
              }}>苏先生</span>
              <span style={{ fontSize: '10px', color: 'var(--ink-faint)' }}>· 杏林斋讲师</span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', marginBottom: '6px' }}>
              授业三十载 · 精于本草、针经
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
              <span style={{ color: 'var(--celadon-deep)' }}>
                ◆ 师徒情谊 <span style={{ letterSpacing: '-2px' }}>●●●</span>○○
              </span>
              <span style={{ color: 'var(--vermilion)' }}>
                ✦ 已学 12 / 30
              </span>
            </div>
          </div>
        </div>

        {/* 对话历史区 */}
        <div ref={historyRef} className="tcm-scroll" style={{
          flex: 1, overflowY: 'auto', padding: '4px 18px 12px 38px', minHeight: 0,
        }}>
          {TEACH_HISTORY.map((msg, i) => {
            if (msg.role === 'narration') {
              return (
                <div key={i} style={{ margin: '8px 0 12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0, fontFamily: 'var(--font-title)', fontSize: '11px',
                    color: 'var(--vermilion)', border: '1px solid var(--vermilion-soft)',
                    padding: '2px 4px', background: 'var(--paper-light)',
                    minWidth: '24px', textAlign: 'center',
                  }}>{msg.label}</div>
                  <div style={{
                    flex: 1, fontSize: '12px', color: 'var(--ink-faint)',
                    fontStyle: 'italic', lineHeight: 1.7, paddingTop: '2px',
                  }}>
                    <RichText segments={parseRich(msg.text)} />
                  </div>
                </div>
              );
            }
            if (msg.role === 'system') {
              return (
                <div key={i} style={{
                  margin: '14px 0', padding: '10px 12px',
                  background: 'rgba(184,137,63,0.08)',
                  border: '1px solid rgba(184,137,63,0.4)',
                  borderLeft: '3px solid var(--gold)',
                }}>
                  <div style={{
                    fontSize: '11px', color: 'var(--gold-deep)',
                    fontWeight: 600, letterSpacing: '0.15em', marginBottom: '6px',
                  }}>{msg.text}</div>
                  {msg.detail && (
                    <div style={{ fontSize: '12px', lineHeight: 1.7, color: 'var(--ink-soft)' }}>
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
                    fontSize: '10px', fontFamily: 'var(--font-title)',
                    color: 'var(--vermilion)', letterSpacing: '0.2em', marginBottom: '4px',
                  }}>师曰：</div>
                  <div style={{
                    fontSize: '13.5px', lineHeight: 1.9, color: 'var(--ink)',
                    paddingLeft: '8px', borderLeft: '2px solid var(--paper-edge)',
                  }}>
                    <RichText segments={parseRich(msg.text)} />
                  </div>
                </div>
              );
            }
            return (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '10px', fontFamily: 'var(--font-title)',
                  color: 'var(--celadon-deep)', letterSpacing: '0.2em', marginBottom: '4px',
                }}>弟子答：</div>
                <div style={{
                  fontSize: '13px', lineHeight: 1.85, color: 'var(--ink-soft)',
                  paddingLeft: '8px', borderLeft: '2px solid var(--celadon)',
                  fontStyle: 'italic',
                }}>
                  <RichText segments={parseRich(msg.text)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 选项区：一行一个 + C 的金朱描边动效 + 保留 B 的彩色图标 */}
        <div style={{
          padding: '10px 18px 8px 38px',
          borderTop: '1px solid rgba(120,90,50,0.25)',
          background: 'rgba(232,217,184,0.3)',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: '10px',
            color: 'var(--ink-faint)',
            letterSpacing: '0.2em',
            marginBottom: '6px',
          }}>── 可问 ──</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {TEACH_OPTIONS.map(opt => {
              const tagColor = {
                study: 'var(--celadon-deep)',
                practice: 'var(--vermilion)',
                debate: 'var(--gold-deep)',
                note: 'var(--ink-faint)',
              }[opt.kind];
              return (
                <button
                  key={opt.id}
                  className="teach-opt"
                  data-color={tagColor}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    background: 'var(--paper-light)',
                    border: '1px solid var(--paper-edge)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '12.5px',
                    color: 'var(--ink-soft)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(.2,.7,.3,1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = tagColor;
                    e.currentTarget.style.background = 'var(--paper)';
                    e.currentTarget.style.transform = 'translateX(3px)';
                    e.currentTarget.style.boxShadow = `-3px 0 0 ${tagColor}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--paper-edge)';
                    e.currentTarget.style.background = 'var(--paper-light)';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{
                    width: '22px', height: '22px', flexShrink: 0,
                    background: tagColor, color: 'var(--paper-light)',
                    fontFamily: 'var(--font-title)', fontSize: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700,
                  }}>{opt.icon}</span>
                  <span style={{ flex: 1, lineHeight: 1.5 }}>
                    <RichText segments={parseRich(opt.text)} />
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '14px',
                    color: tagColor,
                    flexShrink: 0,
                    opacity: 0.4,
                  }}>›</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 输入栏 */}
        <div style={{
          padding: '8px 18px 12px 38px',
          background: 'rgba(232,217,184,0.4)',
          borderTop: '1px solid rgba(120,90,50,0.15)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: '6px', alignItems: 'center',
            background: 'var(--paper-light)',
            border: '1px solid var(--paper-edge)',
            padding: '4px 4px 4px 12px',
          }}>
            <span style={{
              fontFamily: 'var(--font-cursive)', fontSize: '14px',
              color: 'var(--vermilion)', flexShrink: 0,
            }}>批：</span>
            <input
              placeholder="自陈所感，或追问医理……"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                padding: '6px 0', fontFamily: 'var(--font-serif)',
                fontSize: '12.5px', color: 'var(--ink)',
              }}
            />
            <button style={{
              background: 'var(--ink)', color: 'var(--paper-light)', border: 'none',
              padding: '6px 14px', fontFamily: 'var(--font-title)',
              fontSize: '12px', letterSpacing: '0.2em', cursor: 'pointer',
            }}>落笔</button>
          </div>
        </div>
      </div>

      {/* 底部木轴（来自 A） */}
      <div className="scroll-bar" style={{ marginTop: '0', zIndex: 2, flexShrink: 0 }} />
    </div>
  );
}

window.LedgerV2Dialog = LedgerV2Dialog;
