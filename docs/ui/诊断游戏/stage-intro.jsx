// NPC 小窗（弟子来报） + 病案引子弹窗
// NPC 浮窗常驻右下角，点击打开对话气泡；对话推进后弹出病案简介

const NpcDoorbell = ({ onOpen, hasNotice }) => (
  <div onClick={onOpen}
       style={{
         position: 'absolute',
         right: 24, bottom: 90,
         width: 64, height: 64,
         background: 'linear-gradient(180deg, #3a2a1c, #1a1208)',
         border: '2px solid var(--gold)',
         borderRadius: '50%',
         display: 'flex', alignItems: 'center', justifyContent: 'center',
         cursor: 'pointer',
         boxShadow: '0 6px 18px rgba(0,0,0,0.4), inset 0 0 12px rgba(176,141,63,0.3)',
         zIndex: 60,
         transition: 'transform 0.2s'
       }}
       onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
       onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
    <div style={{
      fontFamily: 'var(--font-kai)',
      fontSize: 22, color: 'var(--gold)',
      letterSpacing: 0
    }}>徒</div>
    {hasNotice && (
      <span style={{
        position: 'absolute', top: -2, right: -2,
        width: 16, height: 16, borderRadius: '50%',
        background: 'var(--seal)',
        border: '2px solid var(--paper)',
        boxShadow: '0 0 0 2px var(--seal)'
      }}>
        <span style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%', border: '2px solid var(--seal)',
          animation: 'doorbellPing 1.4s ease-out infinite'
        }} />
      </span>
    )}
    <style>{`
      @keyframes doorbellPing {
        0% { transform: scale(0.8); opacity: 0.9; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    `}</style>
  </div>
);

// NPC 对话浮窗（小，不打断）
const NpcChat = ({ lines, onAdvance, onClose, lineIdx, onAcceptCase }) => {
  const safeLines = lines || [];
  const isLast = lineIdx >= safeLines.length - 1;

  return (
    <div style={{
      position: 'absolute',
      right: 24, bottom: 170,
      width: 360,
      background: 'var(--paper)',
      border: '1px solid var(--ink)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
      zIndex: 70,
      animation: 'chatPop 0.25s ease'
    }}>
      <style>{`
        @keyframes chatPop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* 顶 */}
      <div style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--gold)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-kai)', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600
          }}>徒</span>
          <div>
            <div style={{ fontFamily: 'var(--font-kai)', fontSize: 14, letterSpacing: 3 }}>
              药童 · 阿青
            </div>
            <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1 }}>
              悬壶诊室 · 当值
            </div>
          </div>
        </div>
        <span onClick={onClose}
              style={{ cursor: 'pointer', fontSize: 18, opacity: 0.7 }}>×</span>
      </div>

      {/* 对话 */}
      <div style={{ padding: '18px 18px 14px' }}>
        {safeLines.slice(0, lineIdx + 1).map((line, i) => (
          <div key={i} style={{
            background: 'var(--paper-2)',
            border: '1px solid var(--paper-deep)',
            padding: '10px 14px',
            marginBottom: 8,
            fontFamily: 'var(--font-serif)',
            fontSize: 14, lineHeight: 1.7,
            letterSpacing: 1,
            color: 'var(--ink)',
            position: 'relative',
            opacity: i === lineIdx ? 1 : 0.65
          }}>
            {line}
          </div>
        ))}

        {/* 操作 */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 10,
          justifyContent: 'flex-end'
        }}>
          {!isLast ? (
            <button className="btn"
                    style={{ padding: '6px 16px', fontSize: 13 }}
                    onClick={onAdvance}>继续 ▸</button>
          ) : (
            <>
              <button className="btn btn-ghost"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={onClose}>稍候</button>
              <button className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: 13 }}
                      onClick={onAcceptCase}>请她进来 ▸</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 病案简介弹窗（不透露病机/证型/方剂）
const CaseIntroModal = ({ patient, onStart, onClose }) => {
  const [opened, setOpened] = React.useState(false);
  React.useEffect(() => { setTimeout(() => setOpened(true), 50); }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(20,12,8,0.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(2px)'
    }}>
      <div className="paper-bg" style={{
        width: 720,
        background: 'var(--paper)',
        border: '1px solid var(--ink)',
        position: 'relative',
        transform: opened ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(20px)',
        opacity: opened ? 1 : 0,
        transition: 'all 0.45s cubic-bezier(.5,.1,.3,1)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)'
      }}>
        {/* 装饰边角 */}
        <CornerOrnament pos="tl" />
        <CornerOrnament pos="tr" />
        <CornerOrnament pos="bl" />
        <CornerOrnament pos="br" />

        {/* 顶部标题区 */}
        <div style={{
          padding: '32px 60px 20px',
          textAlign: 'center',
          borderBottom: '1px double var(--paper-deep)'
        }}>
          <div style={{
            fontSize: 11, letterSpacing: 8,
            color: 'var(--accent)',
            fontFamily: 'var(--font-fangsong)',
            marginBottom: 6
          }}>NEW CASE · 新 案 来 报</div>
          <div style={{
            fontFamily: 'var(--font-kai)',
            fontSize: 36, letterSpacing: 12,
            color: 'var(--ink)', fontWeight: 500
          }}>初 诊 病 案</div>
          <div style={{
            marginTop: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            fontSize: 11, color: 'var(--ink-soft)',
            fontFamily: 'var(--font-fangsong)', letterSpacing: 3
          }}>
            <span>◆</span>
            <span>悬壶济世 · 第 壹 案</span>
            <span>◆</span>
          </div>
        </div>

        {/* 主体 */}
        <div style={{
          padding: '28px 50px 24px',
          display: 'grid', gridTemplateColumns: '180px 1fr',
          gap: 32
        }}>
          {/* 头像 */}
          <div>
            <div style={{
              width: 180, height: 220,
              background: 'linear-gradient(180deg, #d8c89c, #b89e6a)',
              border: '2px solid var(--ink)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
              }}>
                {/* 用立绘的上半身 */}
                <div style={{
                  transform: 'scale(1.6) translateY(20px)',
                  transformOrigin: 'top center'
                }}>
                  <PatientPortrait height={300} />
                </div>
              </div>
              {/* 印章 */}
              <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                <Seal text="女" size={36} />
              </div>
            </div>
            <div style={{
              marginTop: 10,
              textAlign: 'center',
              fontFamily: 'var(--font-kai)',
              fontSize: 17, letterSpacing: 4,
              color: 'var(--ink)'
            }}>{patient.name}</div>
            <div style={{
              textAlign: 'center', fontSize: 11,
              color: 'var(--ink-soft)', letterSpacing: 2,
              fontFamily: 'var(--font-fangsong)', marginTop: 2
            }}>
              年 {patient.age} · {patient.occupation}
            </div>
          </div>

          {/* 描述 */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 18
            }}>
              {patient.intro_meta.map((m, i) => (
                <div key={i} style={{
                  fontSize: 12, color: 'var(--ink-soft)',
                  fontFamily: 'var(--font-fangsong)',
                  letterSpacing: 2,
                  padding: '6px 10px',
                  background: 'rgba(168,68,42,0.05)',
                  border: '1px solid var(--paper-deep)',
                  borderLeft: '3px solid var(--accent)'
                }}>{m}</div>
              ))}
            </div>

            <div style={{
              fontSize: 11, letterSpacing: 4,
              color: 'var(--accent)', marginBottom: 8,
              fontFamily: 'var(--font-fangsong)'
            }}>—— 患 者 自 述 ——</div>

            <div style={{
              flex: 1,
              padding: '16px 18px',
              background: 'var(--paper-2)',
              border: '1px solid var(--paper-deep)',
              fontFamily: 'var(--font-kai)',
              fontSize: 16,
              lineHeight: 2,
              letterSpacing: 2,
              color: 'var(--ink-2)',
              textIndent: '2em',
              position: 'relative'
            }}>
              「{patient.intro_brief}」
              <div style={{
                position: 'absolute', top: -1, left: -1, width: 10, height: 10,
                borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)'
              }} />
              <div style={{
                position: 'absolute', bottom: -1, right: -1, width: 10, height: 10,
                borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)'
              }} />
            </div>

            <div style={{
              marginTop: 10,
              fontSize: 11, color: 'var(--ink-faint)',
              fontFamily: 'var(--font-fangsong)',
              letterSpacing: 1.5,
              fontStyle: 'italic'
            }}>
              · 病机未明，需先生四诊合参，因证立法。
            </div>
          </div>
        </div>

        {/* 底部：操作 */}
        <div style={{
          padding: '18px 50px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(0deg, var(--paper-2), transparent)'
        }}>
          <div style={{
            fontSize: 11, color: 'var(--ink-soft)',
            letterSpacing: 3, fontFamily: 'var(--font-fangsong)'
          }}>
            按次序：舌 › 脉 › 问 › 辩证 › 选方
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost"
                    onClick={onClose}>暂 缓</button>
            <button className="btn btn-primary"
                    style={{ padding: '12px 32px', fontSize: 16 }}
                    onClick={onStart}>
              开 始 诊 断 ▸
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CornerOrnament = ({ pos }) => {
  const styleMap = {
    tl: { top: 8, left: 8, transform: 'rotate(0deg)' },
    tr: { top: 8, right: 8, transform: 'rotate(90deg)' },
    bl: { bottom: 8, left: 8, transform: 'rotate(-90deg)' },
    br: { bottom: 8, right: 8, transform: 'rotate(180deg)' }
  };
  return (
    <svg width="36" height="36" viewBox="0 0 36 36"
         style={{ position: 'absolute', ...styleMap[pos], opacity: 0.7 }}>
      <path d="M 4 4 L 4 18 M 4 4 L 18 4
               M 4 8 L 14 8 M 8 4 L 8 14"
            stroke="var(--accent)" strokeWidth="1.2" fill="none" />
      <circle cx="4" cy="4" r="2" fill="var(--accent)" />
    </svg>
  );
};

window.NpcDoorbell = NpcDoorbell;
window.NpcChat = NpcChat;
window.CaseIntroModal = CaseIntroModal;
