// 问诊页面：左患者立绘 / 右对话+线索抽屉
const WenZhen = ({ data, onChange, caseData, showHints }) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const dialogScrollRef = React.useRef(null);

  const messages = data.messages || [
    { from: 'system', text: '李秀梅缓步入诊室，倚坐于诊椅。' }
  ];
  const askedQs = data.asked || [];

  React.useEffect(() => {
    if (dialogScrollRef.current) {
      dialogScrollRef.current.scrollTop = dialogScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const askQuestion = (q) => {
    if (askedQs.includes(q)) return;
    const reply = caseData.dialog_tree[q] || '（患者沉默不语，或您可以换种问法。）';

    // 找已收集的线索
    const newClues = [...(data.clues || [])];
    caseData.clues.forEach(c => {
      if (c.found_by.includes(q) && !newClues.includes(c.id)) {
        // 至少答对一条问题就标记线索
        newClues.push(c.id);
      }
    });

    onChange({
      ...data,
      messages: [...messages,
        { from: 'doctor', text: q },
        { from: 'patient', text: reply }
      ],
      asked: [...askedQs, q],
      clues: newClues
    });
  };

  const sendCustom = () => {
    const v = (data.draft || '').trim();
    if (!v) return;
    // 模糊匹配建议问题
    const match = caseData.suggested_questions.find(q =>
      q.replace(/[？?]/g,'').split('').some(ch => v.includes(ch)) &&
      v.length >= 3
    );
    const reply = match ? caseData.dialog_tree[match] :
      '（患者听罢，似有些疑惑：「先生，可否换种问法？」）';
    const newClues = [...(data.clues || [])];
    if (match) {
      caseData.clues.forEach(c => {
        if (c.found_by.includes(match) && !newClues.includes(c.id)) newClues.push(c.id);
      });
    }
    onChange({
      ...data,
      messages: [...messages,
        { from: 'doctor', text: v },
        { from: 'patient', text: reply }
      ],
      draft: '',
      clues: newClues
    });
  };

  const collectedClues = data.clues || [];

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, height: '100%' }}>
      {/* 左：患者立绘 */}
      <div style={{
        background: 'linear-gradient(180deg, #d8c89c 0%, #c4b388 100%)',
        border: '1px solid var(--paper-deep)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* 患者卡片 */}
        <div style={{
          padding: '14px 18px',
          background: 'rgba(42,36,29,0.85)',
          color: 'var(--paper)'
        }}>
          <div style={{
            fontFamily: 'var(--font-kai)', fontSize: 18, letterSpacing: 4
          }}>{caseData.name}</div>
          <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7, marginTop: 2 }}>
            {caseData.gender} · {caseData.age}岁 · {caseData.occupation}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <PatientPortrait height={520} />
        </div>
        <div style={{
          padding: '10px 16px',
          background: 'rgba(42,36,29,0.7)',
          color: 'var(--paper-deep)',
          fontFamily: 'var(--font-fangsong)',
          fontSize: 12, letterSpacing: 1.5,
          borderTop: '1px solid rgba(241,230,204,0.2)'
        }}>
          神态：{caseData.portrait_desc}
        </div>
      </div>

      {/* 右：对话区 */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 12
        }}>
          <h3 className="section-title" style={{ margin: 0 }}>问 答</h3>
          <button className="btn btn-ghost"
                  style={{ padding: '6px 14px', fontSize: 12, letterSpacing: 2 }}
                  onClick={() => setDrawerOpen(!drawerOpen)}>
            线索册 {collectedClues.length}/{caseData.clues.length}
          </button>
        </div>

        {/* 对话流 */}
        <div ref={dialogScrollRef} style={{
          flex: 1,
          background: 'var(--paper-2)',
          border: '1px solid var(--paper-deep)',
          padding: 18,
          overflowY: 'auto',
          marginBottom: 12,
          display: 'flex', flexDirection: 'column', gap: 10
        }}>
          {messages.map((m, i) => {
            if (m.from === 'system') return (
              <div key={i} style={{
                textAlign: 'center', fontSize: 12,
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-fangsong)',
                letterSpacing: 2,
                padding: '6px 0',
                fontStyle: 'italic'
              }}>— {m.text} —</div>
            );
            const isDoctor = m.from === 'doctor';
            return (
              <div key={i} style={{
                display: 'flex',
                justifyContent: isDoctor ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '76%',
                  padding: '10px 14px',
                  background: isDoctor ? 'var(--ink)' : 'var(--paper)',
                  color: isDoctor ? 'var(--paper)' : 'var(--ink)',
                  border: '1px solid ' + (isDoctor ? 'var(--ink)' : 'var(--paper-deep)'),
                  fontFamily: 'var(--font-serif)',
                  fontSize: 14, lineHeight: 1.6,
                  letterSpacing: 1
                }}>
                  <div style={{
                    fontSize: 10, opacity: 0.6,
                    letterSpacing: 2, marginBottom: 4,
                    fontFamily: 'var(--font-fangsong)'
                  }}>{isDoctor ? '医' : '患'}</div>
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* 输入区 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input className="text-input"
                 placeholder="请输入问诊内容……"
                 value={data.draft || ''}
                 onChange={e => onChange({ ...data, draft: e.target.value })}
                 onKeyDown={e => e.key === 'Enter' && sendCustom()} />
          <button className="btn btn-primary" onClick={sendCustom}>发问</button>
        </div>

        {/* 推荐提问 */}
        {showHints && (
          <div>
            <div style={{
              fontSize: 11, letterSpacing: 3,
              color: 'var(--accent)', marginBottom: 8,
              fontFamily: 'var(--font-fangsong)'
            }}>建议提问 · 师承提示</div>
            <div className="chip-group">
              {caseData.suggested_questions.map(q => (
                <button key={q}
                        className={'chip' + (askedQs.includes(q) ? ' selected' : '')}
                        style={askedQs.includes(q) ? { opacity: 0.45 } : {}}
                        onClick={() => askQuestion(q)}
                        disabled={askedQs.includes(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 线索抽屉 */}
        {drawerOpen && (
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 320,
            background: 'var(--paper)',
            borderLeft: '2px solid var(--ink)',
            boxShadow: '-12px 0 30px rgba(0,0,0,0.15)',
            padding: 24,
            overflowY: 'auto',
            zIndex: 50
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 className="section-title" style={{ margin: 0 }}>线索册</h3>
              <button className="btn btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setDrawerOpen(false)}>×</button>
            </div>
            <div style={{
              fontSize: 11, color: 'var(--ink-soft)',
              letterSpacing: 2, marginBottom: 16,
              fontFamily: 'var(--font-fangsong)'
            }}>
              核心线索 {collectedClues.length} / {caseData.clues.length}
            </div>
            {caseData.clues.map(c => {
              const got = collectedClues.includes(c.id);
              return (
                <label key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  marginBottom: 8,
                  background: got ? 'rgba(168,68,42,0.08)' : 'transparent',
                  border: '1px solid ' + (got ? 'var(--accent)' : 'var(--paper-deep)'),
                  cursor: 'default'
                }}>
                  <span style={{
                    width: 18, height: 18,
                    border: '1.5px solid ' + (got ? 'var(--accent)' : 'var(--ink-soft)'),
                    background: got ? 'var(--accent)' : 'transparent',
                    color: 'var(--paper)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12
                  }}>{got && '✓'}</span>
                  <span style={{
                    fontSize: 13,
                    color: got ? 'var(--ink)' : 'var(--ink-faint)',
                    letterSpacing: 1
                  }}>
                    {got ? c.label : '？？？'}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

window.WenZhen = WenZhen;
