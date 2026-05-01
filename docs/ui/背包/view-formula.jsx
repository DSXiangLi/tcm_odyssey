// ============================================================
// 方剂视图 - 卡牌陈列
// ============================================================

function FormulaView({ onHover, onLeave }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="scroll-area" style={{
      height: '100%', overflowY: 'auto',
      padding: '24px 32px',
    }}>
      <div style={{
        marginBottom: 18, paddingBottom: 12,
        borderBottom: '1px dashed var(--paper-dark)',
      }}>
        <div style={{
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 28, fontWeight: 900,
          letterSpacing: '0.2em', color: 'var(--ink)',
        }}>方剂</div>
        <div style={{
          fontSize: 11, color: 'var(--ink-light)',
          letterSpacing: '0.3em', marginTop: 2,
        }}>FORMULAE · 已掌握 {window.FORMULAS.filter(f => f.count > 0).length} / {window.FORMULAS.length}</div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
      }}>
        {window.FORMULAS.map(f => (
          <FormulaCard key={f.id} formula={f}
            selected={selected === f.id}
            onClick={() => setSelected(selected === f.id ? null : f.id)} />
        ))}
      </div>
    </div>
  );
}

const FORMULA_CLASS_COLOR = {
  '解表剂': '#7c8c5a',
  '清热剂': '#3f7d8c',
  '和解剂': '#8c6d3f',
  '补益剂': '#a86a3a',
  '祛湿剂': '#4a7d96',
  '祛痰剂': '#5a6a8c',
};

function FormulaCard({ formula, selected, onClick }) {
  const color = FORMULA_CLASS_COLOR[formula.class] || 'var(--ink-soft)';
  const isEmpty = formula.count === 0;
  return (
    <div className="formula-card" onClick={onClick}
      style={{
        opacity: isEmpty ? 0.55 : 1,
        boxShadow: selected ? '0 0 0 2px var(--vermilion), 0 0 0 4px var(--paper-1), 0 0 0 5px var(--vermilion), 0 12px 24px rgba(0,0,0,0.4)' : null,
      }}
    >
      {/* 顶部：分类标签 + 数量 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 8,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: 'var(--paper-1)', background: color,
          padding: '2px 6px', letterSpacing: '0.15em',
          fontFamily: 'STKaiti, KaiTi, serif',
        }}>{formula.class}</div>
        <div style={{
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 13, fontWeight: 700,
          color: isEmpty ? 'var(--paper-dark)' : 'var(--vermilion)',
          background: 'rgba(240,227,196,0.7)',
          border: '1px solid var(--ink-soft)',
          padding: '0 6px',
        }}>{formula.count > 0 ? `× ${formula.count}` : '未得'}</div>
      </div>

      {/* 方名 */}
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 28, fontWeight: 900,
        letterSpacing: '0.1em', color: 'var(--ink)',
        textAlign: 'center', margin: '6px 0 4px',
      }}>{formula.name}</div>
      <div style={{
        fontSize: 10, color: 'var(--ink-light)',
        letterSpacing: '0.15em', textAlign: 'center',
        marginBottom: 10,
      }}>{formula.source}</div>

      {/* 朱砂分隔 */}
      <div style={{
        height: 1, background: 'var(--vermilion)',
        margin: '0 16px 10px', position: 'relative',
        opacity: 0.6,
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--paper-1)',
          color: 'var(--vermilion)', padding: '0 6px',
          fontSize: 10,
        }}>◆</div>
      </div>

      {/* 组成 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-light)', letterSpacing: '0.2em', marginBottom: 3 }}>方义</div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
          {formula.composition.join(' · ')}
        </div>
      </div>

      {/* 功效 */}
      <div style={{ marginTop: 'auto', paddingTop: 6 }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: 'var(--ink)', textAlign: 'center',
          fontFamily: 'STKaiti, KaiTi, serif',
          letterSpacing: '0.1em',
        }}>{formula.effect}</div>
        <div style={{
          fontSize: 10, color: 'var(--ink-light)',
          textAlign: 'center', marginTop: 3,
          letterSpacing: '0.1em',
        }}>主治：{formula.indication}</div>
      </div>
    </div>
  );
}

window.FormulaView = FormulaView;
