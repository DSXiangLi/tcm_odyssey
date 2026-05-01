// ============================================================
// 主应用
// ============================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showFanNav": true,
  "navStyle": "fan",
  "paperWarmth": 1.0,
  "showXingColor": true,
  "compactSlots": false
}/*EDITMODE-END*/;

function App() {
  const [active, setActive] = useState('piece');
  const [tweaks, setTweak] = (window.useTweaks || (() => [TWEAK_DEFAULTS, () => {}]))(TWEAK_DEFAULTS);
  const [tooltip, setTooltip] = useState(null);

  const handleHover = (herb, e) => setTooltip({ herb, x: e.clientX, y: e.clientY });
  const handleLeave = () => setTooltip(null);

  // 用 mode 把饮片/原始药材都路由到 HerbView
  const renderView = () => {
    switch (active) {
      case 'piece':   return <window.HerbView mode="piece" onHover={handleHover} onLeave={handleLeave} />;
      case 'raw':     return <window.HerbView mode="raw"   onHover={handleHover} onLeave={handleLeave} />;
      case 'formula': return <window.FormulaView />;
      case 'tool':    return <window.ToolView />;
      case 'book':    return <window.BookView />;
      default: return null;
    }
  };

  return (
    <div className="wood-bg" style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 28, position: 'relative',
    }}>
      {/* 主卷轴容器 */}
      <div style={{
        width: '100%', height: '100%',
        maxWidth: 1480, maxHeight: 920,
        display: 'grid',
        gridTemplateColumns: '1fr 280px 1fr',
        gridTemplateRows: '1fr',
        gap: 0,
        position: 'relative',
      }}>
        {/* 左卷 */}
        <ScrollPanel side="left">
          {renderView()}
        </ScrollPanel>

        {/* 中央扇形导航 */}
        <CenterDial active={active} setActive={setActive} />

        {/* 右卷 -- 摘要面板 */}
        <ScrollPanel side="right">
          <SummaryPanel active={active} />
        </ScrollPanel>
      </div>

      {tooltip && <window.HerbTooltip {...tooltip} mode={active === 'piece' ? 'piece' : 'raw'} />}
    </div>
  );
}

// 卷轴面板（带卷轴顶/底装饰）
function ScrollPanel({ side, children }) {
  return (
    <div style={{
      position: 'relative',
      height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'transparent',
    }}>
      {/* 顶端卷轴轴 */}
      <div style={{
        height: 22, flexShrink: 0,
        background:
          'linear-gradient(180deg, #8b6520 0%, #b58a3a 30%, #5a3e15 70%, #3a2810 100%)',
        borderRadius: '4px 4px 0 0',
        boxShadow: '0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,150,0.3)',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          position: 'absolute', left: 6, right: 6,
          top: '50%', transform: 'translateY(-50%)',
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.4), transparent)',
        }}></div>
      </div>

      {/* 主体纸张 */}
      <div className="paper-tex" style={{
        flex: 1,
        position: 'relative',
        boxShadow: 'inset 0 0 30px rgba(139,95,52,0.3), 0 0 0 1px var(--paper-dark)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      </div>

      {/* 底端卷轴轴 */}
      <div style={{
        height: 22, flexShrink: 0,
        background:
          'linear-gradient(180deg, #3a2810 0%, #5a3e15 30%, #b58a3a 70%, #8b6520 100%)',
        borderRadius: '0 0 4px 4px',
        boxShadow: '0 -4px 8px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,220,150,0.3)',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          position: 'absolute', left: 6, right: 6,
          top: '50%', transform: 'translateY(-50%)',
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.4), transparent)',
        }}></div>
      </div>
    </div>
  );
}

// 中央旋钮 -- 五瓣扇形
function CenterDial({ active, setActive }) {
  const FAN = window.FAN_ITEMS;
  const N = 5;
  const radius = 105;

  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* 背景圆盘 */}
      <div style={{
        position: 'absolute',
        width: 280, height: 280,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(40,25,10,0.4) 0%, rgba(20,12,5,0.2) 50%, transparent 75%)',
        filter: 'blur(8px)',
      }}></div>

      {/* 扇形花瓣 */}
      <div style={{
        position: 'relative',
        width: 260, height: 260,
      }}>
        {FAN.map((item, i) => {
          const angle = -90 + i * (360 / N);
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const isActive = active === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                position: 'absolute',
                left: '50%', top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                width: 78, height: 78,
                cursor: 'pointer',
                transition: 'all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background: isActive
                  ? 'radial-gradient(circle at 30% 30%, #d8492f 0%, #b53a2c 55%, #6e1d12 100%)'
                  : 'radial-gradient(circle at 30% 30%, #f0e3c4 0%, #d9c599 60%, #a88955 100%)',
                border: `2px solid ${isActive ? '#5a1a10' : 'var(--paper-dark)'}`,
                boxShadow: isActive
                  ? 'inset 0 0 0 2px rgba(247,230,208,0.5), 0 0 0 3px var(--paper-1), 0 0 0 4px var(--vermilion-deep), 0 8px 18px rgba(0,0,0,0.6)'
                  : 'inset 0 0 0 2px rgba(247,230,208,0.5), 0 0 0 3px var(--paper-1), 0 0 0 4px var(--paper-dark), 0 6px 12px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column',
                fontFamily: 'STKaiti, KaiTi, serif',
                color: isActive ? 'var(--paper-1)' : 'var(--ink)',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 200ms',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, marginBottom: 2 }}>{item.glyph}</div>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.05em',
                }}>{item.name}</div>
              </div>
            </div>
          );
        })}

        {/* 中心罗盘 */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 110, height: 110,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--paper-1) 0%, var(--paper-2) 60%, var(--paper-3) 100%)',
          border: '2px solid var(--paper-dark)',
          boxShadow: 'inset 0 0 12px rgba(139,95,52,0.4), 0 0 0 4px var(--paper-1), 0 0 0 5px var(--paper-dark), 0 10px 24px rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <div style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 30, fontWeight: 900,
            color: 'var(--vermilion)',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}>百草</div>
          <div style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 14, fontWeight: 900,
            color: 'var(--vermilion)',
            letterSpacing: '0.4em',
            marginTop: 4,
          }}>笥</div>
          <div style={{
            fontSize: 7, color: 'var(--ink-light)',
            letterSpacing: '0.3em', marginTop: 4,
          }}>HERBARIUM</div>
        </div>

        {/* 装饰圆环 */}
        <svg style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none',
        }} viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="125"
            fill="none" stroke="var(--paper-dark)" strokeWidth="1"
            strokeDasharray="2 4" opacity="0.5" />
          <circle cx="130" cy="130" r="68"
            fill="none" stroke="var(--vermilion)" strokeWidth="0.5"
            opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

// 右侧摘要
function SummaryPanel({ active }) {
  const fan = window.FAN_ITEMS.find(f => f.id === active);
  const stats = useMemo(() => {
    if (active === 'piece') {
      const total = window.HERBS.reduce((s, h) => s + h.pieceCount, 0);
      const owned = window.HERBS.filter(h => h.pieceCount > 0).length;
      return [
        { label: '已藏种数', value: `${owned} / ${window.HERBS.length}` },
        { label: '饮片总量', value: total + ' 剂' },
        { label: '常用之品', value: window.HERBS.slice().sort((a, b) => b.pieceCount - a.pieceCount).slice(0, 3).map(h => h.name).join('·') },
      ];
    }
    if (active === 'raw') {
      const total = window.HERBS.reduce((s, h) => s + h.rawCount, 0);
      const owned = window.HERBS.filter(h => h.rawCount > 0).length;
      return [
        { label: '已采种数', value: `${owned} / ${window.HERBS.length}` },
        { label: '药材总量', value: total + ' 株' },
        { label: '稀世之物', value: window.HERBS.filter(h => h.rarity >= 4 && h.rawCount > 0).map(h => h.name).join('·') || '尚无' },
      ];
    }
    if (active === 'formula') {
      const owned = window.FORMULAS.filter(f => f.count > 0).length;
      return [
        { label: '已掌方', value: `${owned} / ${window.FORMULAS.length}` },
        { label: '总方数', value: window.FORMULAS.reduce((s, f) => s + f.count, 0) + ' 张' },
        { label: '最珍方', value: window.FORMULAS.filter(f => f.rarity >= 3 && f.count > 0).map(f => f.name).join('·') || '尚无' },
      ];
    }
    if (active === 'tool') {
      const owned = window.TOOLS.filter(t => t.count > 0).length;
      return [
        { label: '已得器', value: `${owned} / ${window.TOOLS.length}` },
        { label: '总数', value: window.TOOLS.reduce((s, t) => s + t.count, 0) + ' 件' },
        { label: '上品器具', value: window.TOOLS.filter(t => t.tier >= 3 && t.count > 0).map(t => t.name).join('·') || '尚无' },
      ];
    }
    if (active === 'book') {
      const owned = window.BOOKS.filter(b => b.owned).length;
      const avg = Math.round(window.BOOKS.filter(b => b.owned).reduce((s, b) => s + b.progress, 0) / Math.max(owned, 1));
      return [
        { label: '已藏典籍', value: `${owned} / ${window.BOOKS.length}` },
        { label: '研读均度', value: avg + '%' },
        { label: '所修要书', value: window.BOOKS.filter(b => b.owned && b.progress >= 60).map(b => b.name).join('·') || '尚无' },
      ];
    }
    return [];
  }, [active]);

  return (
    <div style={{ padding: '24px 22px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部印章 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--vermilion)',
          color: 'var(--paper-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 22, fontWeight: 900,
          boxShadow: 'inset 0 0 0 2px var(--vermilion), inset 0 0 0 3px var(--paper-1), inset 0 0 0 4px var(--vermilion-deep)',
        }}>{fan.glyph}</div>
        <div>
          <div style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 18, fontWeight: 900,
            letterSpacing: '0.15em', color: 'var(--ink)',
          }}>{fan.name}</div>
          <div style={{ fontSize: 9, color: 'var(--ink-light)', letterSpacing: '0.3em' }}>
            {fan.sub}
          </div>
        </div>
      </div>

      <div style={{
        height: 1, background: 'var(--vermilion)',
        margin: '0 0 16px', position: 'relative', opacity: 0.6,
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--paper-1)', color: 'var(--vermilion)',
          padding: '0 6px', fontSize: 10,
        }}>◆</div>
      </div>

      <div style={{
        fontSize: 12, color: 'var(--ink-soft)',
        lineHeight: 1.7, marginBottom: 18,
        fontFamily: 'STKaiti, KaiTi, serif',
        letterSpacing: '0.05em',
      }}>{fan.desc}</div>

      {/* 统计 */}
      <div style={{ marginBottom: 'auto' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            padding: '8px 10px',
            background: i % 2 === 0 ? 'rgba(139,95,52,0.08)' : 'transparent',
            borderLeft: '2px solid var(--vermilion)',
            marginBottom: 6,
          }}>
            <div style={{
              fontSize: 10, color: 'var(--ink-light)',
              letterSpacing: '0.2em',
              fontFamily: 'STKaiti, KaiTi, serif',
            }}>{s.label}</div>
            <div style={{
              fontSize: 14, color: 'var(--ink)', fontWeight: 700,
              fontFamily: 'STKaiti, KaiTi, serif',
              letterSpacing: '0.05em',
              marginTop: 2,
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 底部印章 */}
      <div style={{
        marginTop: 18,
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <div className="seal" style={{
          width: 56, height: 56,
          fontSize: 11, lineHeight: 1.1,
          fontFamily: 'STKaiti, KaiTi, serif',
          flexDirection: 'column',
          padding: 4,
        }}>
          <div>岐黄</div>
          <div>之印</div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
