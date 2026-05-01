// ============================================================
// 通用组件
// ============================================================
const { useState, useRef, useEffect, useMemo } = React;

// 章节标题（每个分类的开头）
function ChapterHead({ category, total }) {
  return (
    <div className="chapter-head">
      <div className="glyph">{category.glyph}</div>
      <div className="name">{category.name}</div>
      <div className="line"></div>
      <div className="count">藏 {total} 味</div>
    </div>
  );
}

// 工具提示
function HerbTooltip({ herb, mode, x, y }) {
  if (!herb) return null;
  const cat = window.HERB_CATEGORIES.find(c => c.id === herb.cat);
  const count = mode === 'piece' ? herb.pieceCount : herb.rawCount;
  const flipX = x > window.innerWidth - 290;
  const flipY = y > window.innerHeight - 240;
  const left = flipX ? x - 280 : x + 18;
  const top = flipY ? y - 220 : y + 18;
  const RARITY_NAMES = ['', '常见', '精良', '珍贵', '稀世'];
  const RARITY_SEAL = { 1: '#8a7548', 2: '#4a7a8c', 3: '#6a3d8c', 4: '#b58a3a' };
  return (
    <div className="herb-tooltip" style={{ left, top }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="name">{herb.name}</div>
          <div className="pinyin">{cat.name.replace('药', '')} · {mode === 'piece' ? '饮片' : '原药'}</div>
        </div>
        <div style={{
          fontSize: 10, color: '#fff', fontWeight: 900,
          background: RARITY_SEAL[herb.rarity], padding: '2px 5px',
          letterSpacing: '0.1em',
        }}>{RARITY_NAMES[herb.rarity]}</div>
      </div>
      <div className="divider"></div>
      <div className="row"><span className="k">性</span><span className={`v xing-${herb.xing}`}>{herb.xing}</span></div>
      <div className="row"><span className="k">味</span><span className="v">{herb.wei}</span></div>
      <div className="row"><span className="k">归经</span><span className="v">{herb.gui}</span></div>
      <div className="row"><span className="k">藏量</span><span className="v" style={{ color: count > 0 ? 'var(--vermilion)' : 'var(--paper-dark)' }}>{count > 0 ? `${count} ${mode === 'piece' ? '剂' : '株'}` : '未藏'}</span></div>
    </div>
  );
}

// 单个药材槽位
function HerbSlot({ herb, mode, onHover, onLeave, selected, onClick }) {
  const count = mode === 'piece' ? herb.pieceCount : herb.rawCount;
  const isEmpty = count === 0;

  return (
    <div
      className={`slot ${isEmpty ? 'empty' : ''} ${selected ? 'selected' : ''}`}
      data-rarity={herb.rarity}
      onMouseEnter={(e) => onHover && onHover(herb, e)}
      onMouseMove={(e) => onHover && onHover(herb, e)}
      onMouseLeave={onLeave}
      onClick={() => onClick && onClick(herb)}
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* 药材图片占位 */}
      <div style={{
        position: 'absolute', inset: 8,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2,
      }}>
        {!isEmpty && (
          <>
            <div style={{
              fontFamily: 'STKaiti, KaiTi, serif',
              fontSize: 'clamp(14px, 2vw, 22px)',
              fontWeight: 900,
              color: 'var(--ink)',
              letterSpacing: '0.05em',
              textShadow: '0 1px 0 rgba(255,235,180,0.6)',
            }}>{herb.name}</div>
            <div style={{
              fontSize: 9,
              color: 'var(--ink-light)',
              letterSpacing: '0.2em',
              fontFamily: 'STKaiti, KaiTi, serif',
            }}>{mode === 'piece' ? '饮片' : '原药'}</div>
          </>
        )}
        {isEmpty && (
          <div style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 'clamp(12px, 1.6vw, 18px)',
            color: 'rgba(60, 40, 15, 0.35)',
            letterSpacing: '0.05em',
          }}>{herb.name}</div>
        )}
      </div>
      <div className={`count-badge ${isEmpty ? 'zero' : ''}`}>{count}</div>
    </div>
  );
}

window.ChapterHead = ChapterHead;
window.HerbTooltip = HerbTooltip;
window.HerbSlot = HerbSlot;
