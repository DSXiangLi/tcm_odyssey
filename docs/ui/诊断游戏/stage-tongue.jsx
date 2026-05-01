// 舌诊页面
const { useState } = React;

const TongueDiagnosis = ({ data, onChange }) => {
  const [zoom, setZoom] = useState(false);

  const groups = [
    { key: 'color',    label: '舌色',  options: ['淡红', '淡白', '红', '绛', '紫暗', '青紫'] },
    { key: 'coating',  label: '舌苔',  options: ['薄白', '白腻', '白厚', '黄腻', '黄燥', '灰黑', '剥脱', '少苔'] },
    { key: 'shape',    label: '舌形',  options: ['正常', '胖大有齿痕', '瘦薄', '裂纹', '芒刺', '舌尖红'] },
    { key: 'moisture', label: '润燥',  options: ['润', '燥', '水滑', '少津'] }
  ];

  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 32, height: '100%' }}>
      {/* 左：舌象 */}
      <div>
        <div className="field-label">舌象（点击放大）</div>
        <div onClick={() => setZoom(true)}
             style={{
               background: '#1a0e0a',
               border: '1px solid var(--paper-deep)',
               padding: 28,
               cursor: 'zoom-in',
               position: 'relative',
               display: 'flex', justifyContent: 'center'
             }}>
          <TongueImage size={320} />
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(241,230,204,0.85)',
            color: 'var(--ink)',
            padding: '4px 10px',
            fontSize: 11, letterSpacing: 2,
            fontFamily: 'var(--font-fangsong)'
          }}>⊕ 放大查看</div>
        </div>
        <div style={{
          marginTop: 14,
          padding: '12px 16px',
          background: 'rgba(168,68,42,0.06)',
          border: '1px solid var(--paper-deep)',
          borderLeft: '3px solid var(--accent)',
          fontFamily: 'var(--font-kai)',
          fontSize: 14,
          color: 'var(--ink-2)',
          letterSpacing: 1.5,
          lineHeight: 1.7
        }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: 3, marginBottom: 6 }}>师 训</div>
          望舌须明窗、伸舌自然、毋使久伸。先观舌质，次察舌苔。
        </div>
      </div>

      {/* 右：选项 */}
      <div style={{ overflowY: 'auto', paddingRight: 8 }}>
        {groups.map(g => (
          <div key={g.key} style={{ marginBottom: 22 }}>
            <h3 className="section-title">{g.label}</h3>
            <div className="chip-group">
              {g.options.map(opt => (
                <button
                  key={opt}
                  className={'chip' + (data[g.key] === opt ? ' selected accent' : '')}
                  onClick={() => set(g.key, opt)}>{opt}</button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 28 }}>
          <h3 className="section-title">补充观察</h3>
          <textarea
            className="textarea"
            rows="3"
            placeholder="可记录其它细节，如：舌下络脉、动态等……"
            value={data.notes || ''}
            onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      {/* 放大模态框 */}
      {zoom && (
        <div onClick={() => setZoom(false)}
             style={{
               position: 'fixed', inset: 0,
               background: 'rgba(20,12,8,0.88)',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               zIndex: 100, cursor: 'zoom-out'
             }}>
          <div style={{
            background: '#1a0e0a',
            padding: 40,
            border: '2px solid var(--paper-deep)',
            position: 'relative'
          }}>
            <TongueImage size={520} />
            <div style={{
              position: 'absolute', bottom: -40, left: 0, right: 0,
              textAlign: 'center', color: 'var(--paper-deep)',
              fontFamily: 'var(--font-kai)', fontSize: 14, letterSpacing: 4
            }}>
              点击任意处关闭 · ESC
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.TongueDiagnosis = TongueDiagnosis;
