// ============================================================
// 药材视图 - 用于"药材饮片"和"原始药材"
// 18大类按章节展示，每章节内为网格槽位
// ============================================================

function HerbView({ mode, onHover, onLeave }) {
  // mode: 'piece' | 'raw'
  const [filter, setFilter] = useState('all'); // 分类筛选：'all' 或某个分类id
  const [showEmpty, setShowEmpty] = useState(true);

  // 按分类分组
  const byCategory = useMemo(() => {
    const map = {};
    window.HERB_CATEGORIES.forEach(c => map[c.id] = []);
    window.HERBS.forEach(h => { if (map[h.cat]) map[h.cat].push(h); });
    return map;
  }, []);

  const visibleCats = filter === 'all'
    ? window.HERB_CATEGORIES
    : window.HERB_CATEGORIES.filter(c => c.id === filter);

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* 左侧分类印章列 */}
      <div style={{
        width: 96, flexShrink: 0,
        borderRight: '1px solid var(--paper-dark)',
        padding: '8px 6px',
        overflowY: 'auto',
      }} className="scroll-area">
        <CatChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="全部"
          glyph="全"
          color="var(--vermilion)"
        />
        {window.HERB_CATEGORIES.map(c => {
          const total = byCategory[c.id].reduce(
            (s, h) => s + (mode === 'piece' ? h.pieceCount : h.rawCount), 0
          );
          return (
            <CatChip
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
              label={c.name.replace('药', '')}
              glyph={c.glyph}
              color={c.color}
              count={total}
            />
          );
        })}
      </div>

      {/* 右侧药材区 */}
      <div className="scroll-area" style={{
        flex: 1, overflowY: 'auto',
        padding: '20px 28px 28px',
      }}>
        {/* 顶栏：模式标题 + 切换显示空槽 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          paddingBottom: 12,
          borderBottom: '1px dashed var(--paper-dark)',
        }}>
          <div>
            <div style={{
              fontFamily: 'STKaiti, KaiTi, serif',
              fontSize: 28, fontWeight: 900,
              letterSpacing: '0.2em', color: 'var(--ink)',
            }}>{mode === 'piece' ? '药材饮片' : '原始药材'}</div>
            <div style={{
              fontSize: 11, color: 'var(--ink-light)',
              letterSpacing: '0.3em', marginTop: 2,
            }}>{mode === 'piece' ? 'PROCESSED HERBAL SLICES' : 'RAW MATERIA MEDICA'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{
              fontSize: 11, color: 'var(--ink-light)',
              letterSpacing: '0.15em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <input type="checkbox" checked={showEmpty}
                onChange={e => setShowEmpty(e.target.checked)}
                style={{ accentColor: 'var(--vermilion)' }} />
              显示未藏
            </label>
          </div>
        </div>

        {visibleCats.map(cat => {
          const herbs = byCategory[cat.id].filter(h => {
            if (showEmpty) return true;
            return (mode === 'piece' ? h.pieceCount : h.rawCount) > 0;
          });
          if (herbs.length === 0) return null;
          const total = byCategory[cat.id].reduce(
            (s, h) => s + (mode === 'piece' ? h.pieceCount : h.rawCount), 0
          );
          return (
            <div key={cat.id} style={{ marginBottom: 24 }}>
              <ChapterHeadStyled cat={cat} total={total} />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
                gap: 8,
              }}>
                {herbs.map(h => (
                  <HerbSlot
                    key={h.id} herb={h} mode={mode}
                    onHover={onHover} onLeave={onLeave}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CatChip({ active, onClick, label, glyph, color, count }) {
  return (
    <div
      onClick={onClick}
      style={{
        marginBottom: 6,
        padding: '6px 4px',
        background: active ? color : 'transparent',
        color: active ? 'var(--paper-1)' : 'var(--ink)',
        cursor: 'pointer',
        textAlign: 'center',
        position: 'relative',
        border: active ? `1px solid ${color}` : '1px solid transparent',
        outline: active ? '1px solid var(--paper-dark)' : 'none',
        outlineOffset: 2,
        transition: 'all 150ms',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(139,95,52,0.1)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 22, fontWeight: 900,
        lineHeight: 1, marginBottom: 3,
        color: active ? 'var(--paper-1)' : color,
      }}>{glyph}</div>
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 11, fontWeight: 700,
        letterSpacing: '0.05em', lineHeight: 1.2,
      }}>{label}</div>
      {count != null && (
        <div style={{
          fontSize: 9,
          color: active ? 'rgba(255,255,255,0.7)' : 'var(--ink-light)',
          letterSpacing: '0.1em', marginTop: 2,
        }}>{count}</div>
      )}
    </div>
  );
}

function ChapterHeadStyled({ cat, total }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 10,
      paddingBottom: 6,
    }}>
      <div style={{
        width: 30, height: 30,
        background: cat.color,
        color: 'var(--paper-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 18, fontWeight: 900,
        boxShadow: 'inset 0 0 0 2px ' + cat.color + ', inset 0 0 0 3px var(--paper-1), inset 0 0 0 4px ' + cat.color,
      }}>{cat.glyph}</div>
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 19, fontWeight: 900,
        letterSpacing: '0.15em', color: 'var(--ink)',
      }}>{cat.name}</div>
      <div style={{
        flex: 1, height: 1,
        background: 'linear-gradient(90deg, ' + cat.color + '88, transparent)',
      }}></div>
      <div style={{
        fontSize: 11, color: 'var(--ink-light)',
        letterSpacing: '0.2em',
        fontFamily: 'STKaiti, KaiTi, serif',
      }}>共 {total} {total > 0 ? '味' : '味·待采'}</div>
    </div>
  );
}

window.HerbView = HerbView;
