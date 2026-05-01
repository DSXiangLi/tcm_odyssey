// ============================================================
// 中央扇形导航 - 5个子背包
// ============================================================
const FAN_ITEMS = [
  { id: 'piece', name: '药材饮片', sub: 'PROCESSED', glyph: '飲', desc: '炮制后的中药饮片' },
  { id: 'raw',   name: '原始药材', sub: 'RAW',       glyph: '原', desc: '采集的原始药材' },
  { id: 'formula',name:'方剂',     sub: 'FORMULAE',  glyph: '方', desc: '配伍而成的经典方剂' },
  { id: 'tool',  name: '工具',     sub: 'IMPLEMENTS',glyph: '器', desc: '炮制和加工的器具' },
  { id: 'book',  name: '图书馆',   sub: 'LIBRARY',   glyph: '冊', desc: '医家典籍藏书' },
];

window.FAN_ITEMS = FAN_ITEMS;

function FanNav({ active, onSelect }) {
  // 五个扇形花瓣，分布在中央圆周上
  // 角度：从顶部开始，每72度一个
  const N = 5;
  const radius = 110;
  return (
    <div className="fan-nav fan-nav-active" style={{ width: 1, height: 1 }}>
      {/* 中心圆 -- 印章/罗盘 */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 110, height: 110,
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--paper-1) 0%, var(--paper-2) 70%, var(--paper-3) 100%)',
        border: '2px solid var(--paper-dark)',
        boxShadow: '0 0 0 4px var(--paper-1), 0 0 0 5px var(--paper-dark), 0 8px 24px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 28,
          fontWeight: 900,
          color: 'var(--vermilion)',
          letterSpacing: '0.1em',
          lineHeight: 1,
        }}>百草</div>
        <div style={{
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 11,
          color: 'var(--ink-light)',
          letterSpacing: '0.4em',
          marginTop: 4,
        }}>笥</div>
        <div style={{
          fontSize: 8, color: 'var(--ink-light)',
          letterSpacing: '0.3em', marginTop: 3,
        }}>HERBARIUM</div>
      </div>

      {/* 5个花瓣 */}
      {FAN_ITEMS.map((item, i) => {
        const angle = -90 + i * (360 / N);  // 从顶部开始
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        const isActive = active === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              position: 'absolute',
              left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              width: 88, height: 88,
              cursor: 'pointer',
              transition: 'transform 200ms',
              zIndex: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.transform =
              `translate(calc(-50% + ${x*1.05}px), calc(-50% + ${y*1.05}px)) scale(1.08)`}
            onMouseLeave={e => e.currentTarget.style.transform =
              `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`}
          >
            <div style={{
              width: '100%', height: '100%',
              borderRadius: '50%',
              background: isActive
                ? 'radial-gradient(circle at 30% 30%, #d8492f 0%, var(--vermilion) 60%, var(--vermilion-deep) 100%)'
                : 'radial-gradient(circle at 30% 30%, var(--paper-1) 0%, var(--paper-2) 60%, var(--paper-3) 100%)',
              border: `2px solid ${isActive ? 'var(--vermilion-deep)' : 'var(--paper-dark)'}`,
              boxShadow: isActive
                ? '0 0 0 3px var(--paper-1), 0 0 0 4px var(--vermilion), 0 6px 14px rgba(0,0,0,0.6)'
                : '0 0 0 3px var(--paper-1), 0 0 0 4px var(--paper-dark), 0 4px 8px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
              fontFamily: 'STKaiti, KaiTi, serif',
              color: isActive ? 'var(--paper-1)' : 'var(--ink)',
            }}>
              <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{item.glyph}</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginTop: 4 }}>
                {item.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.FanNav = FanNav;
