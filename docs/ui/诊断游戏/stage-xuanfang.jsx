// 选方页面 + 卷轴方剂详情卡
const XuanFang = ({ data, onChange, options }) => {
  const [scrollFang, setScrollFang] = React.useState(null);
  const selected = data.selected || [];
  const set = (k, v) => onChange({ ...data, [k]: v });
  const toggle = (id) => set('selected', selected.includes(id)
    ? selected.filter(x => x !== id)
    : [...selected, id]);

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 className="section-title">选方 · 拟定主方（可多选）</h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 14,
        marginBottom: 18
      }}>
        {options.map(opt => {
          const sel = selected.includes(opt.id);
          return (
            <div key={opt.id}
                 style={{
                   padding: '16px 18px',
                   background: sel ? 'rgba(168,68,42,0.08)' : 'var(--paper)',
                   border: '1px solid ' + (sel ? 'var(--accent)' : 'var(--paper-deep)'),
                   borderLeft: '3px solid ' + (sel ? 'var(--accent)' : 'var(--paper-deep)'),
                   position: 'relative'
                 }}>
              <div onClick={() => toggle(opt.id)}
                   style={{
                     display: 'flex', alignItems: 'center', gap: 10,
                     cursor: 'pointer', marginBottom: 8
                   }}>
                <span style={{
                  width: 18, height: 18,
                  border: '1.5px solid ' + (sel ? 'var(--accent)' : 'var(--ink-soft)'),
                  background: sel ? 'var(--accent)' : 'transparent',
                  color: 'var(--paper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0
                }}>{sel && '✓'}</span>
                <span style={{
                  fontFamily: 'var(--font-kai)', fontSize: 17,
                  color: 'var(--ink)', letterSpacing: 3
                }}>{opt.name}</span>
              </div>
              <div style={{
                fontSize: 11, color: 'var(--ink-soft)',
                fontFamily: 'var(--font-fangsong)', letterSpacing: 1,
                marginBottom: 10
              }}>
                出自 {opt.source}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost"
                        style={{ padding: '5px 12px', fontSize: 12, letterSpacing: 2 }}
                        onClick={() => setScrollFang(opt)}>
                  展卷·详情
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="field-label">其它方剂（自行填写）</div>
        <input className="text-input"
               placeholder="如：胃苓汤、香砂六君子汤……"
               value={data.custom || ''}
               onChange={e => set('custom', e.target.value)} />
      </div>

      <div style={{
        marginTop: 'auto',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: 'var(--paper-2)',
        border: '1px dashed var(--ink-faint)'
      }}>
        <button className="btn btn-ghost"
                disabled
                style={{ cursor: 'not-allowed' }}>
          🔒 方剂加减
        </button>
        <span style={{
          fontSize: 12, color: 'var(--ink-soft)',
          fontFamily: 'var(--font-fangsong)', letterSpacing: 1
        }}>
          完成本案后解锁 · 可对所选方剂进行君臣佐使加减化裁
        </span>
      </div>

      {scrollFang && (
        <ScrollCard fang={scrollFang} onClose={() => setScrollFang(null)} />
      )}
    </div>
  );
};

// 卷轴详情卡 - 从中间向两侧展开
const ScrollCard = ({ fang, onClose }) => {
  const [opened, setOpened] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setOpened(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div onClick={onClose}
         style={{
           position: 'fixed', inset: 0,
           background: 'rgba(20,12,8,0.85)',
           display: 'flex', alignItems: 'center', justifyContent: 'center',
           zIndex: 100,
           cursor: 'zoom-out'
         }}>
      <div onClick={e => e.stopPropagation()}
           style={{
             width: opened ? 820 : 80,
             height: 540,
             transition: 'width 0.7s cubic-bezier(.6,.05,.3,1)',
             display: 'flex',
             alignItems: 'stretch',
             cursor: 'default'
           }}>
        {/* 左轴杆 */}
        <div style={{
          width: 28, flexShrink: 0,
          background: 'linear-gradient(90deg, #5a3a1c, #8a5a2e, #5a3a1c)',
          borderRadius: '4px 0 0 4px',
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: -6, left: -2, right: -2, height: 14,
            background: 'radial-gradient(ellipse, #b08d3f, #6a5022)',
            borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: -6, left: -2, right: -2, height: 14,
            background: 'radial-gradient(ellipse, #b08d3f, #6a5022)',
            borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
        </div>

        {/* 卷面 */}
        <div className="paper-bg" style={{
          flex: 1,
          background: '#ede0c0',
          padding: opened ? '36px 40px' : 0,
          overflow: 'hidden',
          opacity: opened ? 1 : 0,
          transition: 'opacity 0.4s 0.4s',
          position: 'relative',
          boxShadow: 'inset 0 0 60px rgba(120,80,30,0.2)'
        }}>
          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: 18, position: 'relative' }}>
            <div style={{
              fontFamily: 'var(--font-kai)',
              fontSize: 32, color: 'var(--ink)',
              letterSpacing: 12, fontWeight: 500
            }}>{fang.name}</div>
            <div style={{
              fontSize: 12, color: 'var(--ink-soft)',
              letterSpacing: 4, marginTop: 6,
              fontFamily: 'var(--font-fangsong)'
            }}>{fang.source}</div>
            <div style={{ marginTop: 10,
              height: 1, background: 'var(--ink-faint)',
              position: 'relative' }}>
              <span style={{
                position: 'absolute', top: -6, left: '50%',
                transform: 'translateX(-50%)',
                background: '#ede0c0', padding: '0 14px',
                color: 'var(--accent)', fontSize: 12,
                fontFamily: 'var(--font-kai)', letterSpacing: 2
              }}>◇</span>
            </div>
          </div>

          <FangSection title="配 伍" body={fang.composition} />
          <FangSection title="功 效" body={fang.function} />
          <FangSection title="主 治" body={fang.indication} />
          <FangSection title="按 语" body={fang.note} italic />

          {/* 印章 */}
          <div style={{ position: 'absolute', bottom: 20, right: 30 }}>
            <Seal text={fang.correct ? '正方' : '备参'} size={48}
                  color={fang.correct ? 'var(--seal)' : 'var(--ink-soft)'} />
          </div>

          {/* 关闭按钮 */}
          <button onClick={onClose}
                  style={{
                    position: 'absolute', top: 12, right: 16,
                    background: 'transparent', border: 'none',
                    color: 'var(--ink-soft)', fontSize: 22,
                    cursor: 'pointer', fontFamily: 'serif'
                  }}>×</button>
        </div>

        {/* 右轴杆 */}
        <div style={{
          width: 28, flexShrink: 0,
          background: 'linear-gradient(90deg, #5a3a1c, #8a5a2e, #5a3a1c)',
          borderRadius: '0 4px 4px 0',
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: -6, left: -2, right: -2, height: 14,
            background: 'radial-gradient(ellipse, #b08d3f, #6a5022)',
            borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: -6, left: -2, right: -2, height: 14,
            background: 'radial-gradient(ellipse, #b08d3f, #6a5022)',
            borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
        </div>
      </div>
    </div>
  );
};

const FangSection = ({ title, body, italic }) => (
  <div style={{ marginBottom: 14, display: 'flex', gap: 16 }}>
    <div style={{
      width: 56, flexShrink: 0,
      fontFamily: 'var(--font-kai)',
      fontSize: 15, color: 'var(--accent)',
      letterSpacing: 4, paddingTop: 2,
      borderRight: '1px solid var(--paper-deep)',
      textAlign: 'center'
    }}>{title}</div>
    <div style={{
      flex: 1,
      fontFamily: italic ? 'var(--font-kai)' : 'var(--font-fangsong)',
      fontSize: 14, lineHeight: 1.8,
      color: italic ? 'var(--ink-soft)' : 'var(--ink-2)',
      letterSpacing: 1,
      fontStyle: italic ? 'italic' : 'normal'
    }}>{body}</div>
  </div>
);

window.XuanFang = XuanFang;
