// ============================================================
// 工具视图 + 图书馆视图
// ============================================================

function ToolView() {
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
        }}>工具</div>
        <div style={{
          fontSize: 11, color: 'var(--ink-light)',
          letterSpacing: '0.3em', marginTop: 2,
        }}>IMPLEMENTS · 炮制器具与辅料</div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {window.TOOLS.map(t => (
          <ToolCard key={t.id} tool={t}
            selected={selected === t.id}
            onClick={() => setSelected(selected === t.id ? null : t.id)} />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool, selected, onClick }) {
  const isEmpty = tool.count === 0;
  const tierColor = ['', '#8a7548', '#4a7a8c', '#b58a3a'][tool.tier] || '#8a7548';
  return (
    <div className="tool-card" onClick={onClick}
      style={{
        opacity: isEmpty ? 0.55 : 1,
        boxShadow: selected ? '0 0 0 2px var(--vermilion), 0 0 0 4px var(--paper-1), 0 0 0 5px var(--vermilion)' : null,
      }}
    >
      <div className="icon" style={{
        background: isEmpty
          ? 'repeating-linear-gradient(45deg, rgba(139,100,50,0.18) 0 4px, rgba(139,100,50,0.08) 4px 8px)'
          : null,
      }}>
        {tool.name.charAt(0)}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <div style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 18, fontWeight: 900,
            letterSpacing: '0.1em', color: 'var(--ink)',
          }}>{tool.name}</div>
          <div style={{
            fontSize: 9, color: 'var(--paper-1)',
            background: tierColor, padding: '1px 5px',
            letterSpacing: '0.15em',
          }}>{['', '凡品', '良品', '上品'][tool.tier]}</div>
          <div style={{
            marginLeft: 'auto',
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 12, fontWeight: 700,
            color: isEmpty ? 'var(--paper-dark)' : 'var(--vermilion)',
            background: 'rgba(240,227,196,0.7)',
            border: '1px solid var(--ink-soft)',
            padding: '0 5px',
          }}>{tool.count > 0 ? `× ${tool.count}` : '未得'}</div>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--ink-soft)',
          lineHeight: 1.5,
        }}>{tool.desc}</div>
      </div>
    </div>
  );
}

// ----------- 图书馆 -----------
function BookView() {
  const [selected, setSelected] = useState(null);
  const cur = window.BOOKS.find(b => b.id === selected);
  // 书架按朝代分组
  const shelves = useMemo(() => {
    const groups = { '上古': [], '汉晋': [], '隋唐宋': [], '金元明清': [] };
    window.BOOKS.forEach(b => {
      if (b.dynasty.includes('先秦') || b.dynasty.includes('汉')) groups['汉晋'].push(b);
      else if (b.dynasty.includes('唐') || b.dynasty.includes('宋') || b.dynasty.includes('南北朝')) groups['隋唐宋'].push(b);
      else if (b.dynasty.includes('明') || b.dynasty.includes('清') || b.dynasty.includes('金') || b.dynasty.includes('元')) groups['金元明清'].push(b);
      else groups['上古'].push(b);
    });
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, []);

  // 书脊颜色
  const SPINE_COLORS = ['#5b3a2a', '#3a4a5a', '#5a4a2a', '#4a2a3a', '#2a4a3a', '#5a2a3a', '#3a3a5a', '#4a3a2a'];

  return (
    <div className="scroll-area" style={{
      height: '100%', overflowY: 'auto',
      padding: '24px 32px',
      display: 'flex', gap: 18,
    }}>
      {/* 书架 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          marginBottom: 18, paddingBottom: 12,
          borderBottom: '1px dashed var(--paper-dark)',
        }}>
          <div style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 28, fontWeight: 900,
            letterSpacing: '0.2em', color: 'var(--ink)',
          }}>图书馆</div>
          <div style={{
            fontSize: 11, color: 'var(--ink-light)',
            letterSpacing: '0.3em', marginTop: 2,
          }}>LIBRARY · 已藏 {window.BOOKS.filter(b => b.owned).length} / {window.BOOKS.length} 卷</div>
        </div>

        {shelves.map(([era, books]) => (
          <div key={era} style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 12,
            }}>
              <div style={{
                fontFamily: 'STKaiti, KaiTi, serif',
                fontSize: 16, fontWeight: 900,
                letterSpacing: '0.2em', color: 'var(--ink-soft)',
              }}>{era}</div>
              <div style={{
                flex: 1, height: 1,
                background: 'linear-gradient(90deg, var(--paper-dark), transparent)',
              }}></div>
            </div>

            {/* 书架架板 */}
            <div style={{
              position: 'relative',
              padding: '0 12px 6px',
              borderBottom: '6px solid #3a2616',
              boxShadow: '0 8px 12px -4px rgba(0,0,0,0.6)',
              background: 'linear-gradient(180deg, transparent 0%, transparent 80%, rgba(58,38,22,0.2) 100%)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end',
                gap: 6, paddingBottom: 0,
                minHeight: 230,
              }}>
                {books.map((b, i) => (
                  <BookSpine
                    key={b.id} book={b}
                    color={SPINE_COLORS[i % SPINE_COLORS.length]}
                    selected={selected === b.id}
                    onClick={() => setSelected(b.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 右侧详情 */}
      {cur && (
        <div style={{
          width: 280, flexShrink: 0,
          padding: '18px 18px',
          background: 'var(--paper-2)',
          border: '1px solid var(--paper-dark)',
          outline: '1px solid var(--paper-dark)',
          outlineOffset: 3,
          alignSelf: 'flex-start',
          position: 'sticky', top: 0,
        }}>
          <div style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 24, fontWeight: 900,
            letterSpacing: '0.15em', color: 'var(--ink)',
            textAlign: 'center', marginBottom: 4,
          }}>{cur.name}</div>
          <div style={{
            fontSize: 11, color: 'var(--ink-light)',
            letterSpacing: '0.2em', textAlign: 'center',
            marginBottom: 12,
          }}>{cur.dynasty}</div>
          <div style={{
            height: 1, background: 'var(--vermilion)',
            margin: '0 16px 12px', opacity: 0.6,
          }}></div>
          <div style={{
            fontSize: 12, lineHeight: 1.7,
            color: 'var(--ink-soft)',
            textAlign: 'justify',
            marginBottom: 14,
          }}>{cur.desc}</div>
          {cur.owned ? (
            <div>
              <div style={{
                fontSize: 10, color: 'var(--ink-light)',
                letterSpacing: '0.2em', marginBottom: 4,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>研读进度</span>
                <span style={{ color: 'var(--vermilion)', fontWeight: 700 }}>{cur.progress}%</span>
              </div>
              <div style={{
                height: 6, background: 'var(--paper-3)',
                border: '1px solid var(--paper-dark)',
              }}>
                <div style={{
                  width: cur.progress + '%', height: '100%',
                  background: 'var(--vermilion)',
                }}></div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '6px 8px',
              background: 'rgba(139,95,52,0.15)',
              border: '1px dashed var(--paper-dark)',
              fontSize: 11, color: 'var(--ink-light)',
              textAlign: 'center', letterSpacing: '0.1em',
            }}>未得 · 待寻</div>
          )}
        </div>
      )}
    </div>
  );
}

function BookSpine({ book, color, selected, onClick }) {
  const tierGold = book.tier === 4 ? 'gold' : null;
  return (
    <div
      className={`book-spine ${!book.owned ? 'locked' : ''}`}
      onClick={book.owned ? onClick : undefined}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, color-mix(in srgb, ${color}, black 40%) 100%)`,
        height: 180 + (book.tier * 10),
        borderTop: tierGold ? '2px solid var(--gold)' : null,
        outline: selected ? '2px solid var(--vermilion)' : null,
        outlineOffset: 1,
      }}
    >
      {tierGold && (
        <div style={{
          fontSize: 9, color: 'var(--gold)',
          letterSpacing: '0.2em',
        }}>※</div>
      )}
      <div className="spine-title">{book.name}</div>
      <div className="spine-tag" style={{
        fontSize: 8, color: book.owned ? 'rgba(247,230,208,0.7)' : 'rgba(247,230,208,0.4)',
      }}>{book.owned ? book.dynasty.split('·')[0] : '未得'}</div>
    </div>
  );
}

window.ToolView = ToolView;
window.BookView = BookView;
