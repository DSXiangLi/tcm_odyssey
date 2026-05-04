// src/ui/html/InventoryUI.tsx
/**
 * 背包UI主组件 - 合并自 docs/ui/背包/*.jsx
 * 古卷轴风格，扇形导航，5视图切换
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  HERB_CATEGORIES,
  HERBS,
  HERB_IMAGES,
  FORMULAS,
  TOOLS,
  BOOKS,
  FAN_ITEMS,
  HerbData,
  FormulaData,
  ToolData,
  BookData,
} from './data/inventory-herbs';
import {
  emitInventoryClose,
  emitHerbClick,
  emitViewChanged,
  emitFormulaClick,
  emitToolClick,
  emitBookClick,
} from './bridge/inventory-events';

// ============================================================
// 类型定义
// ============================================================
interface InventoryUIProps {
  onClose: () => void;
}

interface TooltipState {
  herb: HerbData | null;
  x: number;
  y: number;
}

type ViewType = 'piece' | 'raw' | 'formula' | 'tool' | 'book';

// ============================================================
// 主应用
// ============================================================
export function InventoryUI({ onClose }: InventoryUIProps) {
  const [active, setActive] = useState<ViewType>('piece');
  const [tooltip, setTooltip] = useState<TooltipState>({ herb: null, x: 0, y: 0 });

  const handleHover = useCallback((herb: HerbData, e: React.MouseEvent) => {
    setTooltip({ herb, x: e.clientX, y: e.clientY });
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip({ herb: null, x: 0, y: 0 });
  }, []);

  const handleSetActive = useCallback((view: ViewType) => {
    setActive(view);
    emitViewChanged(view);
  }, []);

  const handleClose = useCallback(() => {
    emitInventoryClose();
    onClose();
  }, [onClose]);

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // 卸载时确保焦点返回到canvas，让Phaser能接收键盘事件
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.focus();
      }
    };
  }, [handleClose]);

  // 用 mode 把饮片/原始药材都路由到 HerbView
  const renderView = () => {
    switch (active) {
      case 'piece': return <HerbView mode="piece" onHover={handleHover} onLeave={handleLeave} />;
      case 'raw':   return <HerbView mode="raw" onHover={handleHover} onLeave={handleLeave} />;
      case 'formula': return <FormulaView />;
      case 'tool':  return <ToolView />;
      case 'book':  return <BookView />;
      default: return null;
    }
  };

  return (
    <div className="inventory-ui">
      {/* 暗木桌面背景 */}
      <div className="wood-bg" />

      {/* 关闭按钮 */}
      <div className="close-btn" onClick={handleClose}>
        ✕
      </div>

      {/* 主容器布局 */}
      <div className="main-container">
        {/* 左卷 */}
        <ScrollPanel side="left">
          {renderView()}
        </ScrollPanel>

        {/* 中央扇形导航 */}
        <CenterDial active={active} setActive={handleSetActive} />

        {/* 右卷 -- 摘要面板 */}
        <ScrollPanel side="right">
          <SummaryPanel active={active} />
        </ScrollPanel>
      </div>

      {/* tooltip */}
      {tooltip.herb && (
        <HerbTooltip
          herb={tooltip.herb}
          mode={active === 'piece' ? 'piece' : 'raw'}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
    </div>
  );
}

// ============================================================
// 卷轴面板
// ============================================================
function ScrollPanel({ children }: { side: 'left' | 'right'; children: React.ReactNode }) {
  return (
    <div className="scroll-panel" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      {/* 顶端卷轴轴 */}
      <div style={{
        height: 22, flexShrink: 0,
        background: 'linear-gradient(180deg, #8b6520 0%, #b58a3a 30%, #5a3e15 70%, #3a2810 100%)',
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
        }} />
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
        background: 'linear-gradient(180deg, #3a2810 0%, #5a3e15 30%, #b58a3a 70%, #8b6520 100%)',
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
        }} />
      </div>
    </div>
  );
}

// ============================================================
// 中央扇形导航
// ============================================================
function CenterDial({ active, setActive }: { active: ViewType; setActive: (v: ViewType) => void }) {
  const N = 5;
  const radius = 105;

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 背景圆盘 */}
      <div style={{
        position: 'absolute',
        width: 280, height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(40,25,10,0.4) 0%, rgba(20,12,5,0.2) 50%, transparent 75%)',
        filter: 'blur(8px)',
      }} />

      {/* 扇形花瓣 */}
      <div style={{ position: 'relative', width: 260, height: 260 }}>
        {FAN_ITEMS.map((item, i) => {
          const angle = -90 + i * (360 / N);
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const isActive = active === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActive(item.id as ViewType)}
              className={`fan-petal ${isActive ? 'active' : ''}`}
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
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, marginBottom: 2 }}>{item.glyph}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>{item.name}</div>
              </div>
            </div>
          );
        })}

        {/* 中心罗盘 */}
        <div className="center-dial" style={{
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
          <div className="title" style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 30, fontWeight: 900,
            color: 'var(--vermilion)',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}>百草</div>
          <div className="subtitle" style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 14, fontWeight: 900,
            color: 'var(--vermilion)',
            letterSpacing: '0.4em',
            marginTop: 4,
          }}>笥</div>
          <div style={{ fontSize: 7, color: 'var(--ink-light)', letterSpacing: '0.3em', marginTop: 4 }}>HERBARIUM</div>
        </div>

        {/* 装饰圆环 */}
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="125" fill="none" stroke="var(--paper-dark)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
          <circle cx="130" cy="130" r="68" fill="none" stroke="var(--vermilion)" strokeWidth="0.5" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// 摘要面板
// ============================================================
function SummaryPanel({ active }: { active: ViewType }) {
  const fan = FAN_ITEMS.find(f => f.id === active);
  const stats = useMemo(() => {
    if (active === 'piece') {
      const total = HERBS.reduce((s, h) => s + h.pieceCount, 0);
      const owned = HERBS.filter(h => h.pieceCount > 0).length;
      const topHerbs = HERBS.slice().sort((a, b) => b.pieceCount - a.pieceCount).slice(0, 3).map(h => h.name).join('·');
      return [
        { label: '已藏种数', value: `${owned} / ${HERBS.length}` },
        { label: '饮片总量', value: total + ' 剂' },
        { label: '常用之品', value: topHerbs },
      ];
    }
    if (active === 'raw') {
      const total = HERBS.reduce((s, h) => s + h.rawCount, 0);
      const owned = HERBS.filter(h => h.rawCount > 0).length;
      const rareHerbs = HERBS.filter(h => h.rarity >= 4 && h.rawCount > 0).map(h => h.name).join('·') || '尚无';
      return [
        { label: '已采种数', value: `${owned} / ${HERBS.length}` },
        { label: '药材总量', value: total + ' 株' },
        { label: '稀世之物', value: rareHerbs },
      ];
    }
    if (active === 'formula') {
      const owned = FORMULAS.filter(f => f.count > 0).length;
      const total = FORMULAS.reduce((s, f) => s + f.count, 0);
      const rareFormulas = FORMULAS.filter(f => f.rarity >= 3 && f.count > 0).map(f => f.name).join('·') || '尚无';
      return [
        { label: '已掌方', value: `${owned} / ${FORMULAS.length}` },
        { label: '总方数', value: total + ' 张' },
        { label: '最珍方', value: rareFormulas },
      ];
    }
    if (active === 'tool') {
      const owned = TOOLS.filter(t => t.count > 0).length;
      const total = TOOLS.reduce((s, t) => s + t.count, 0);
      const topTools = TOOLS.filter(t => t.tier >= 3 && t.count > 0).map(t => t.name).join('·') || '尚无';
      return [
        { label: '已得器', value: `${owned} / ${TOOLS.length}` },
        { label: '总数', value: total + ' 件' },
        { label: '上品器具', value: topTools },
      ];
    }
    if (active === 'book') {
      const owned = BOOKS.filter(b => b.owned).length;
      const avg = Math.round(BOOKS.filter(b => b.owned).reduce((s, b) => s + b.progress, 0) / Math.max(owned, 1));
      const readBooks = BOOKS.filter(b => b.owned && b.progress >= 60).map(b => b.name).join('·') || '尚无';
      return [
        { label: '已藏典籍', value: `${owned} / ${BOOKS.length}` },
        { label: '研读均度', value: avg + '%' },
        { label: '所修要书', value: readBooks },
      ];
    }
    return [];
  }, [active]);

  if (!fan) return null;

  return (
    <div className="summary-panel" style={{ padding: '24px 22px', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ fontSize: 9, color: 'var(--ink-light)', letterSpacing: '0.3em' }}>{fan.sub}</div>
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
          <div key={i} className="stat-item" style={{
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
      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
        <div className="seal" style={{
          width: 56, height: 56,
          fontSize: 11, lineHeight: 1.1,
          fontFamily: 'STKaiti, KaiTi, serif',
          flexDirection: 'column',
          padding: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--vermilion)',
          color: '#f7e6d0',
          fontWeight: 900,
          letterSpacing: '0.05em',
          textShadow: '0 0 1px rgba(0,0,0,0.4)',
          boxShadow: 'inset 0 0 0 2px var(--vermilion), inset 0 0 0 4px transparent, inset 0 0 0 5px var(--vermilion-deep)',
        }}>
          <div>岐黄</div>
          <div>之印</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 药材视图
// ============================================================
function HerbView({ mode, onHover, onLeave }: { mode: 'piece' | 'raw'; onHover: (herb: HerbData, e: React.MouseEvent) => void; onLeave: () => void }) {
  const [filter, setFilter] = useState<string>('all');
  const [showEmpty, setShowEmpty] = useState(true);

  const byCategory = useMemo(() => {
    const map: Record<string, HerbData[]> = {};
    HERB_CATEGORIES.forEach(c => map[c.id] = []);
    HERBS.forEach(h => { if (map[h.cat]) map[h.cat].push(h); });
    return map;
  }, []);

  const visibleCats = filter === 'all'
    ? HERB_CATEGORIES
    : HERB_CATEGORIES.filter(c => c.id === filter);

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* 左侧分类印章列 */}
      <div className="scroll-area" style={{
        width: 96, flexShrink: 0,
        borderRight: '1px solid var(--paper-dark)',
        padding: '8px 6px',
        overflowY: 'auto',
      }}>
        <CatChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="全部"
          glyph="全"
          color="var(--vermilion)"
        />
        {HERB_CATEGORIES.map(c => {
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
        {/* 顶栏 */}
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
              <div className="slots-grid" style={{
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

function CatChip({ active, onClick, label, glyph, color, count }: {
  active: boolean;
  onClick: () => void;
  label: string;
  glyph: string;
  color: string;
  count?: number;
}) {
  return (
    <div
      className={`cat-chip ${active ? 'active' : ''}`}
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
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(139,95,52,0.1)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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

function ChapterHeadStyled({ cat, total }: { cat: { id: string; name: string; glyph: string; color: string }; total: number }) {
  return (
    <div className="chapter-head" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 10,
      paddingBottom: 6,
    }}>
      <div className="glyph" style={{
        width: 30, height: 30,
        background: cat.color,
        color: 'var(--paper-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 18, fontWeight: 900,
        boxShadow: `inset 0 0 0 2px ${cat.color}, inset 0 0 0 3px var(--paper-1), inset 0 0 0 4px ${cat.color}`,
      }}>{cat.glyph}</div>
      <div className="name" style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 19, fontWeight: 900,
        letterSpacing: '0.15em', color: 'var(--ink)',
      }}>{cat.name}</div>
      <div className="line" style={{
        flex: 1, height: 1,
        background: `linear-gradient(90deg, ${cat.color}88, transparent)`,
      }} />
      <div className="count" style={{
        fontSize: 11, color: 'var(--ink-light)',
        letterSpacing: '0.2em',
        fontFamily: 'STKaiti, KaiTi, serif',
      }}>共 {total} {total > 0 ? '味' : '味·待采'}</div>
    </div>
  );
}

// ============================================================
// 药材槽位
// ============================================================
function HerbSlot({ herb, mode, onHover, onLeave }: {
  herb: HerbData;
  mode: 'piece' | 'raw';
  onHover: (herb: HerbData, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const count = mode === 'piece' ? herb.pieceCount : herb.rawCount;
  const isEmpty = count === 0;
  const imagePath = HERB_IMAGES[herb.id];

  const handleClick = useCallback(() => {
    emitHerbClick(herb.id, herb.name, herb.cat);
  }, [herb]);

  return (
    <div
      className={`slot ${isEmpty ? 'empty' : ''}`}
      data-rarity={herb.rarity}
      onMouseEnter={(e) => onHover(herb, e)}
      onMouseMove={(e) => onHover(herb, e)}
      onMouseLeave={onLeave}
      onClick={handleClick}
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* 药材图片 */}
      {imagePath && !isEmpty && (
        <img
          src={imagePath}
          alt={herb.name}
          style={{
            position: 'absolute',
            inset: 8,
            objectFit: 'contain',
            opacity: 0.85,
          }}
        />
      )}

      {/* 名称 */}
      {!isEmpty && !imagePath && (
        <div className="herb-name" style={{
          position: 'absolute', inset: 8,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2,
        }}>
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
        </div>
      )}

      {/* 空槽位名称 */}
      {isEmpty && (
        <div style={{
          position: 'absolute', inset: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 'clamp(12px, 1.6vw, 18px)',
          color: 'rgba(60, 40, 15, 0.35)',
          letterSpacing: '0.05em',
        }}>{herb.name}</div>
      )}

      <div className={`count-badge ${isEmpty ? 'zero' : ''}`}>{count}</div>
    </div>
  );
}

// ============================================================
// 药材Tooltip
// ============================================================
function HerbTooltip({ herb, mode, x, y }: { herb: HerbData; mode: 'piece' | 'raw'; x: number; y: number }) {
  const cat = HERB_CATEGORIES.find(c => c.id === herb.cat);
  const count = mode === 'piece' ? herb.pieceCount : herb.rawCount;
  const flipX = x > window.innerWidth - 290;
  const flipY = y > window.innerHeight - 240;
  const left = flipX ? x - 280 : x + 18;
  const top = flipY ? y - 220 : y + 18;
  const RARITY_NAMES = ['', '常见', '精良', '珍贵', '稀世'];
  const RARITY_SEAL: Record<number, string> = { 1: '#8a7548', 2: '#4a7a8c', 3: '#6a3d8c', 4: '#b58a3a' };

  if (!cat) return null;

  return (
    <div className="herb-tooltip" style={{ left, top }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="name">{herb.name}</div>
          <div className="pinyin">{cat.name.replace('药', '')} · {mode === 'piece' ? '饮片' : '原药'}</div>
        </div>
        <div className={`rarity-badge r${herb.rarity}`} style={{
          fontSize: 10, color: '#fff', fontWeight: 900,
          background: RARITY_SEAL[herb.rarity], padding: '2px 5px',
          letterSpacing: '0.1em',
        }}>{RARITY_NAMES[herb.rarity]}</div>
      </div>
      <div className="divider" />
      <div className="row"><span className="k">性</span><span className={`v xing-${herb.xing}`}>{herb.xing}</span></div>
      <div className="row"><span className="k">味</span><span className="v">{herb.wei}</span></div>
      <div className="row"><span className="k">归经</span><span className="v">{herb.gui}</span></div>
      <div className="row">
        <span className="k">藏量</span>
        <span className="v" style={{ color: count > 0 ? 'var(--vermilion)' : 'var(--paper-dark)' }}>
          {count > 0 ? `${count} ${mode === 'piece' ? '剂' : '株'}` : '未藏'}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// 方剂视图
// ============================================================
function FormulaView() {
  const [selected, setSelected] = useState<string | null>(null);

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
        }}>FORMULAE · 已掌握 {FORMULAS.filter(f => f.count > 0).length} / {FORMULAS.length}</div>
      </div>

      <div className="formula-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
      }}>
        {FORMULAS.map(f => (
          <FormulaCard
            key={f.id}
            formula={f}
            selected={selected === f.id}
            onClick={() => setSelected(selected === f.id ? null : f.id)}
          />
        ))}
      </div>
    </div>
  );
}

const FORMULA_CLASS_COLOR: Record<string, string> = {
  '解表剂': '#7c8c5a',
  '清热剂': '#3f7d8c',
  '和解剂': '#8c6d3f',
  '补益剂': '#a86a3a',
  '祛湿剂': '#4a7d96',
  '祛痰剂': '#5a6a8c',
};

function FormulaCard({ formula, selected, onClick }: { formula: FormulaData; selected: boolean; onClick: () => void }) {
  const color = FORMULA_CLASS_COLOR[formula.class] || 'var(--ink-soft)';
  const isEmpty = formula.count === 0;

  const handleClick = useCallback(() => {
    onClick();
    emitFormulaClick(formula.id, formula.name);
  }, [formula, onClick]);

  return (
    <div className="formula-card" onClick={handleClick}
      style={{
        opacity: isEmpty ? 0.55 : 1,
        boxShadow: selected ? '0 0 0 2px var(--vermilion), 0 0 0 4px var(--paper-1), 0 0 0 5px var(--vermilion), 0 12px 24px rgba(0,0,0,0.4)' : undefined,
      }}
    >
      {/* 顶部：分类标签 + 数量 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 8,
      }}>
        <div className="class-badge" style={{
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
      <div className="name" style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 28, fontWeight: 900,
        letterSpacing: '0.1em', color: 'var(--ink)',
        textAlign: 'center', margin: '6px 0 4px',
      }}>{formula.name}</div>
      <div className="source" style={{
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
        <div className="composition" style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
          {formula.composition.join(' · ')}
        </div>
      </div>

      {/* 功效 */}
      <div style={{ marginTop: 'auto', paddingTop: 6 }}>
        <div className="effect" style={{
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

// ============================================================
// 工具视图
// ============================================================
function ToolView() {
  const [selected, setSelected] = useState<string | null>(null);

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
        {TOOLS.map(t => (
          <ToolCard
            key={t.id}
            tool={t}
            selected={selected === t.id}
            onClick={() => setSelected(selected === t.id ? null : t.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool, selected, onClick }: { tool: ToolData; selected: boolean; onClick: () => void }) {
  const isEmpty = tool.count === 0;
  const tierColor = ['', '#8a7548', '#4a7a8c', '#b58a3a'][tool.tier] || '#8a7548';

  const handleClick = useCallback(() => {
    onClick();
    emitToolClick(tool.id, tool.name);
  }, [tool, onClick]);

  return (
    <div className="tool-card" onClick={handleClick}
      style={{
        opacity: isEmpty ? 0.55 : 1,
        boxShadow: selected ? '0 0 0 2px var(--vermilion), 0 0 0 4px var(--paper-1), 0 0 0 5px var(--vermilion)' : undefined,
      }}
    >
      <div className="icon" style={{
        background: isEmpty
          ? 'repeating-linear-gradient(45deg, rgba(139,100,50,0.18) 0 4px, rgba(139,100,50,0.08) 4px 8px)'
          : undefined,
      }}>
        {tool.name.charAt(0)}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <div className="info name" style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 18, fontWeight: 900,
            letterSpacing: '0.1em', color: 'var(--ink)',
          }}>{tool.name}</div>
          <div className={`tier-badge t${tool.tier}`} style={{
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
        <div className="info desc" style={{
          fontSize: 11, color: 'var(--ink-soft)',
          lineHeight: 1.5,
        }}>{tool.desc}</div>
      </div>
    </div>
  );
}

// ============================================================
// 图书馆视图
// ============================================================
function BookView() {
  const [selected, setSelected] = useState<string | null>(null);
  const cur = BOOKS.find(b => b.id === selected);

  const shelves = useMemo(() => {
    const groups: Record<string, BookData[]> = { '上古': [], '汉晋': [], '隋唐宋': [], '金元明清': [] };
    BOOKS.forEach(b => {
      if (b.dynasty.includes('先秦') || b.dynasty.includes('汉')) groups['汉晋'].push(b);
      else if (b.dynasty.includes('唐') || b.dynasty.includes('宋') || b.dynasty.includes('南北朝')) groups['隋唐宋'].push(b);
      else if (b.dynasty.includes('明') || b.dynasty.includes('清') || b.dynasty.includes('金') || b.dynasty.includes('元')) groups['金元明清'].push(b);
      else groups['上古'].push(b);
    });
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, []);

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
          }}>LIBRARY · 已藏 {BOOKS.filter(b => b.owned).length} / {BOOKS.length} 卷</div>
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
              }} />
            </div>

            {/* 书架架板 */}
            <div style={{
              position: 'relative',
              padding: '0 12px 6px',
              borderBottom: '6px solid #3a2616',
              boxShadow: '0 8px 12px -4px rgba(0,0,0,0.6)',
              background: 'linear-gradient(180deg, transparent 0%, transparent 80%, rgba(58,38,22,0.2) 100%)',
            }}>
              <div className="book-shelf" style={{
                display: 'flex', alignItems: 'flex-end',
                gap: 6, paddingBottom: 0,
                minHeight: 230,
              }}>
                {books.map((b, i) => (
                  <BookSpine
                    key={b.id} book={b}
                    color={SPINE_COLORS[i % SPINE_COLORS.length]}
                    selected={selected === b.id}
                    onClick={() => {
                      setSelected(b.id);
                      emitBookClick(b.id, b.name);
                    }}
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
          }} />
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
                }} />
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

function BookSpine({ book, color, selected, onClick }: {
  book: BookData;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const tierGold = book.tier === 4;

  return (
    <div
      className={`book-spine ${!book.owned ? 'locked' : ''}`}
      onClick={book.owned ? onClick : undefined}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, color-mix(in srgb, ${color}, black 40%) 100%)`,
        height: 180 + (book.tier * 10),
        borderTop: tierGold ? '2px solid var(--gold)' : undefined,
        outline: selected ? '2px solid var(--vermilion)' : undefined,
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

export default InventoryUI;