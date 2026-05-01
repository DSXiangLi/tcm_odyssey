// 辩证页面
const BianZheng = ({ data, onChange, summary, options }) => {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const selected = data.selected || [];

  const toggle = (id) => {
    set('selected', selected.includes(id)
      ? selected.filter(x => x !== id)
      : [...selected, id]);
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 28, height: '100%' }}>
      {/* 左：四诊汇总 */}
      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <h3 className="section-title">四诊合参</h3>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
          {/* 望（舌） */}
          <SummaryBlock title="望诊 · 舌象">
            {summary.tongue ? (
              <div style={{ lineHeight: 1.9 }}>
                舌色：<b>{summary.tongue.color || '—'}</b>　舌苔：<b>{summary.tongue.coating || '—'}</b><br/>
                舌形：<b>{summary.tongue.shape || '—'}</b>　润燥：<b>{summary.tongue.moisture || '—'}</b>
                {summary.tongue.notes && <div style={{ marginTop: 6, color: 'var(--ink-soft)' }}>注：{summary.tongue.notes}</div>}
              </div>
            ) : <em style={{ color: 'var(--ink-faint)' }}>尚未填写</em>}
          </SummaryBlock>

          {/* 切（脉） */}
          <SummaryBlock title="切诊 · 脉象">
            {summary.pulse ? (
              <div style={{ lineHeight: 1.9 }}>
                脉位：<b>{summary.pulse.position || '—'}部</b>　脉势：<b>{summary.pulse.quality || '—'}</b>
                {summary.pulse.notes && <div style={{ marginTop: 6, color: 'var(--ink-soft)' }}>注：{summary.pulse.notes}</div>}
              </div>
            ) : <em style={{ color: 'var(--ink-faint)' }}>尚未填写</em>}
          </SummaryBlock>

          {/* 问 */}
          <SummaryBlock title="问诊 · 收集症状">
            {summary.clueLabels && summary.clueLabels.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                {summary.clueLabels.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            ) : <em style={{ color: 'var(--ink-faint)' }}>未收集到线索</em>}
          </SummaryBlock>
        </div>
      </div>

      {/* 右：辩证选择 */}
      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <h3 className="section-title">辩证 · 拟定证型（可多选）</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {options.map(opt => {
            const sel = selected.includes(opt.id);
            return (
              <div key={opt.id} onClick={() => toggle(opt.id)}
                   style={{
                     padding: '14px 16px',
                     background: sel ? 'var(--ink)' : 'var(--paper)',
                     color: sel ? 'var(--paper)' : 'var(--ink)',
                     border: '1px solid ' + (sel ? 'var(--ink)' : 'var(--paper-deep)'),
                     cursor: 'pointer',
                     display: 'flex', alignItems: 'center', gap: 12,
                     fontFamily: 'var(--font-kai)', fontSize: 15, letterSpacing: 2
                   }}>
                <span style={{
                  width: 18, height: 18,
                  border: '1.5px solid ' + (sel ? 'var(--paper)' : 'var(--ink-soft)'),
                  background: sel ? 'var(--accent)' : 'transparent',
                  color: 'var(--paper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0
                }}>{sel && '✓'}</span>
                {opt.label}
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: 18 }}>
          <div className="field-label">其它证型（自行填写）</div>
          <input className="text-input"
                 placeholder="如：肝气犯胃、湿热蕴脾……"
                 value={data.custom || ''}
                 onChange={e => set('custom', e.target.value)} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="field-label">辩证依据 · 论述（必填）</div>
          <textarea className="textarea"
                    style={{ flex: 1, minHeight: 140 }}
                    placeholder="请结合舌、脉、症，论述您的辩证思路。&#10;例：患者苔白厚腻、脉濡缓、便溏、身重困倦、口黏不渴，乃湿邪困遏中焦之征……"
                    value={data.reasoning || ''}
                    onChange={e => set('reasoning', e.target.value)} />
        </div>
      </div>
    </div>
  );
};

const SummaryBlock = ({ title, children }) => (
  <div style={{
    background: 'var(--paper-2)',
    border: '1px solid var(--paper-deep)',
    padding: '14px 16px',
    marginBottom: 12,
    fontSize: 13,
    color: 'var(--ink-2)',
    fontFamily: 'var(--font-fangsong)'
  }}>
    <div style={{
      fontFamily: 'var(--font-kai)',
      fontSize: 13,
      color: 'var(--accent)',
      letterSpacing: 3,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: '1px solid var(--paper-deep)'
    }}>{title}</div>
    {children}
  </div>
);

window.BianZheng = BianZheng;
