// src/ui/html/DecoctionUI.tsx
/**
 * 煎药小游戏 React 根组件
 * 直接迁移自 docs/ui/煎药小游戏/app.jsx (468行)
 *
 * 设计原则: 直接使用设计稿，不做拆分重构
 * 所有8个子组件保持在同一文件
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HerbPixelData, FormulaData, VialData, DecoctionUIProps } from './types/index';
import { DECOCTION_EVENTS } from './bridge/events';
import { HerbResultData, ScoreResultData, StateUpdateData } from './bridge/types';
import { pixelSprite } from './data/herb-pixels';
import './decoction.css';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Mix colors from multiple hex color strings
 * Returns averaged RGB values
 */
function mixColors(colors: string[]): { r: number; g: number; b: number } {
  if (!colors.length) return { r: 90, g: 60, b: 30 };
  let r = 0, g = 0, b = 0;
  colors.forEach(c => {
    const m = c.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (!m) return;
    r += parseInt(m[1], 16);
    g += parseInt(m[2], 16);
    b += parseInt(m[3], 16);
  });
  const n = colors.length;
  return { r: (r / n) | 0, g: (g / n) | 0, b: (b / n) | 0 };
}

/**
 * Bridge helper: dispatch custom event to Phaser
 */
function bridgeToPhaser<T>(eventName: string, data: T): void {
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event);
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

interface PotAreaProps {
  inPot: HerbPixelData[];
  finished: boolean;
}

interface StoveSceneProps {
  inPot: HerbPixelData[];
  finished: boolean;
  showSteam: boolean;
  shake: 'ok' | 'bad' | null;
}

interface HerbTagProps {
  herb: HerbPixelData;
  onDragStart: (e: React.DragEvent, herb: HerbPixelData) => void;
  onDragEnd: () => void;
  dragging: boolean;
}

interface VialProps {
  formula: VialData | null;
  empty: boolean;
  glow: boolean;
}

interface TargetScrollProps {
  formula: FormulaData;
  filled: number;
}

interface DropBurstProps {
  kind: 'ok' | 'bad';
  x: number;
  y: number;
}

interface BurstData {
  id: number;
  kind: 'ok' | 'bad';
  x: number;
  y: number;
}

interface SplashData {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface TrailData {
  id: number;
  x: number;
  y: number;
}

// ============================================================================
// Sub-Components (kept in same file per "直接使用设计稿" principle)
// ============================================================================

/**
 * Steam animation component
 */
function Steam(): React.ReactElement {
  return (
    <div className="steam">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`steam-puff s${i}`}
          style={{ '--dx': `${((i % 2 ? -1 : 1) * (8 + i * 3))}px` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/**
 * Pot/药罐 component with liquid color mixing
 */
function PotArea({ inPot, finished }: PotAreaProps): React.ReactElement {
  const accentColors = inPot.map(h => h.pal[Object.keys(h.pal)[1]] || '#8a5028');
  const mix = mixColors(accentColors);
  const liquidColor = `rgb(${mix.r},${mix.g},${mix.b})`;

  return (
    <div className="pot-wrap">
      <div
        className="pot-body"
        style={{
          boxShadow: finished
            ? 'inset 4px 4px 0 rgba(255,220,140,.5), inset -4px -4px 0 rgba(0,0,0,.5), 0 0 20px rgba(255,210,74,.6)'
            : undefined
        }}
      />
      <div className="pot-rim" />
      <div
        className="pot-liquid"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${liquidColor} 0%, rgba(58,26,10,.9) 100%)`
        }}
      />
      <div className="pot-handle l" />
      <div className="pot-handle r" />
      {inPot.slice(0, 4).map((h, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${16 + i * 12}%`,
            top: '24%',
            width: 6,
            height: 6,
            background: h.pal[Object.keys(h.pal)[1]] || '#8a5028',
            border: '1px solid #2a1408',
            animation: 'liquidRipple 2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </div>
  );
}

/**
 * Stove/炉灶 scene component with fire, pot, and effects
 */
function StoveScene({ inPot, finished, showSteam, shake }: StoveSceneProps): React.ReactElement {
  return (
    <div className={`stove-area ${shake ? `shake-${shake}` : ''}`}>
      <div className="pixel-canvas">
        <div className="floor" />
        <div className="stove-shadow" />
        <div className="stove-body" />
        <div className="stove-top" />
        <div className="fire-hole">
          {[1, 2, 3, 4].map(i => <div key={i} className={`flame f${i}`} />)}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="ember-spark"
              style={{
                left: `${10 + i * 14}%`,
                '--drift': `${((i % 2 ? -1 : 1) * (10 + i * 4))}px`,
                animationDelay: `${i * 0.35}s`
              } as React.CSSProperties}
            />
          ))}
        </div>
        <PotArea inPot={inPot} finished={finished} />
        <div className="ladle">
          <div className="ladle-stick" />
          <div className="ladle-scoop" />
        </div>
        {showSteam && <Steam />}
      </div>
      {finished && (
        <div
          className="gold-burst"
          style={{ '--x': '50%', '--y': '55%' } as React.CSSProperties}
        />
      )}
    </div>
  );
}

/**
 * HerbTag/药牌 component with pixel icon and drag support
 */
function HerbTag({ herb, onDragStart, onDragEnd, dragging }: HerbTagProps): React.ReactElement {
  const { style, innerStyle } = pixelSprite(herb.grid, herb.pal, 3);

  return (
    <div
      className={`tag ${dragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, herb)}
      onDragEnd={onDragEnd}
    >
      <div className="tag-string" />
      <div className="tag-plank">
        <div className="herb-icon">
          <div style={style}>
            <div style={innerStyle} />
          </div>
        </div>
        <div className="tag-name">{herb.name}</div>
        <div className="tag-prop">{herb.prop}</div>
      </div>
      <div className="tag-count">×{herb.count}</div>
    </div>
  );
}

/**
 * Vial/药瓶 component for completed prescriptions
 */
function Vial({ formula, empty, glow }: VialProps): React.ReactElement {
  if (empty) {
    return (
      <div className="vial vial-empty">
        <div className="vial-cap" />
        <div className="vial-body" />
      </div>
    );
  }

  const accent = formula?.color || '#6a9c7e';
  return (
    <div className={`vial ${glow ? 'gold-glow' : ''}`}>
      <div className="vial-cap" />
      <div className="vial-neck" />
      <div className="vial-body">
        <div
          className="vial-liquid"
          style={{
            height: '70%',
            background: `linear-gradient(180deg, ${accent}cc 0%, ${accent} 100%)`
          }}
        />
      </div>
      <div className="vial-label">{formula?.name || '药'}</div>
    </div>
  );
}

/**
 * TargetScroll/目标卷轴 showing current formula goal
 */
function TargetScroll({ formula, filled }: TargetScrollProps): React.ReactElement {
  return (
    <div className="target-scroll">
      <div className="rod" />
      <div className="parchment">
        <div className="tgt-label">今 日 医 嘱</div>
        <div className="tgt-name">{formula.name}</div>
        <div className="tgt-clue">{formula.hint}</div>
        <div className="tgt-progress">
          {[...Array(formula.count)].map((_, i) => (
            <div key={i} className={`tgt-dot ${i < filled ? 'on' : ''}`} />
          ))}
        </div>
      </div>
      <div className="rod" />
    </div>
  );
}

/**
 * DropBurst/拖放效果 for correct/wrong feedback
 */
function DropBurst({ kind, x, y }: DropBurstProps): React.ReactElement {
  const rays = [...Array(12)].map((_, i) => ({ i, a: i * 30 }));
  const sparks = [...Array(10)].map((_, i) => ({
    i,
    dx: Math.cos(i * 0.628) * (30 + Math.random() * 30),
    dy: Math.sin(i * 0.628) * (30 + Math.random() * 30) - 20,
  }));

  return (
    <div className={`drop-burst burst-${kind}`} style={{ left: x, top: y }}>
      <div className="burst-ring" />
      <div className="burst-ring burst-ring-2" />
      {kind === 'ok' && rays.map(r => (
        <div
          key={r.i}
          className="burst-ray"
          style={{ transform: `rotate(${r.a}deg) translateY(-8px)` }}
        />
      ))}
      {kind === 'ok' && <div className="burst-stamp">合</div>}
      {kind === 'bad' && (
        <div className="burst-cross">
          <span />
          <span />
        </div>
      )}
      {kind === 'bad' && <div className="burst-smoke" />}
      {sparks.map(s => (
        <div
          key={s.i}
          className="burst-spark"
          style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component: DecoctionUI
// ============================================================================

/**
 * 煎药小游戏主组件
 *
 * Props-driven design:
 * - herbs: from DecoctionScene via props
 * - targetFormula: from DecoctionScene via props
 * - completedVials: from DecoctionScene via props
 * - callbacks: bridge events to DecoctionManager via props
 */
export function DecoctionUI(props: DecoctionUIProps): React.ReactElement {
  // State management
  const [_frame] = useState('default');
  const [progress, setProgress] = useState(0);
  const [state, setStateVal] = useState<'idle' | 'selecting' | 'brewing' | 'done'>('selecting');

  // Use props for data (from DecoctionScene)
  const herbs = props.herbs;
  const target = props.targetFormula;
  const initialVials = props.completedVials;

  // Internal state for UI interaction
  const [inPot, setInPot] = useState<HerbPixelData[]>([]);
  const [bursts, setBursts] = useState<BurstData[]>([]);
  const [potShake, setPotShake] = useState<'ok' | 'bad' | null>(null);
  const [finishedVials, setFinishedVials] = useState<(VialData | null)[]>(initialVials);
  const [dragging, setDragging] = useState<HerbPixelData | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState<TrailData[]>([]);
  const [splashes, setSplashes] = useState<SplashData[]>([]);

  // ============================================================================
  // Bridge Event Listeners (Phaser → React)
  // ============================================================================

  useEffect(() => {
    const handleHerbResult = (e: CustomEvent<HerbResultData>) => {
      const { success } = e.detail;
      if (!success) {
        // Show bad feedback
        setPotShake('bad');
        setTimeout(() => setPotShake(null), 600);
      }
    };

    const handleScoreResult = (e: CustomEvent<ScoreResultData>) => {
      const { passed, prescriptionName } = e.detail;
      if (passed) {
        // Add new vial
        const colors = inPot.map(h => h.pal[Object.keys(h.pal)[1]] || '#8a5028');
        const mix = mixColors(colors);
        const vial: VialData = {
          name: prescriptionName || target.name,
          color: `rgb(${mix.r},${mix.g},${mix.b})`
        };
        setFinishedVials(vs => {
          const copy = [...vs];
          const emptyIdx = copy.findIndex(v => v === null);
          if (emptyIdx >= 0) copy[emptyIdx] = vial;
          return copy;
        });
      }
    };

    const handleStateUpdate = (e: CustomEvent<StateUpdateData>) => {
      const { phase, progress: newProgress } = e.detail;
      // Map 'complete' to 'done' for internal state
      setStateVal(phase === 'complete' ? 'done' : phase);
      setProgress(newProgress);
    };

    window.addEventListener(DECOCTION_EVENTS.HERB_RESULT, handleHerbResult as EventListener);
    window.addEventListener(DECOCTION_EVENTS.SCORE_RESULT, handleScoreResult as EventListener);
    window.addEventListener(DECOCTION_EVENTS.STATE_UPDATE, handleStateUpdate as EventListener);

    return () => {
      window.removeEventListener(DECOCTION_EVENTS.HERB_RESULT, handleHerbResult as EventListener);
      window.removeEventListener(DECOCTION_EVENTS.SCORE_RESULT, handleScoreResult as EventListener);
      window.removeEventListener(DECOCTION_EVENTS.STATE_UPDATE, handleStateUpdate as EventListener);
    };
  }, [inPot, target]);

  // ============================================================================
  // Brewing Progress Animation
  // ============================================================================

  useEffect(() => {
    if (state !== 'brewing') return;
    const t = setInterval(() => {
      setProgress(p => {
        if (inPot.length === 0) return Math.max(0, p - 0.5);
        const np = p + 0.8;
        if (np >= 100) return 100;
        return np;
      });
    }, 200);
    return () => clearInterval(t);
  }, [state, inPot.length]);

  // ============================================================================
  // Drag Handlers
  // ============================================================================

  const handleDragStart = useCallback((e: React.DragEvent, herb: HerbPixelData) => {
    setDragging(herb);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    e.dataTransfer.setDragImage(img, 0, 0);

    // Bridge to Phaser
    bridgeToPhaser(DECOCTION_EVENTS.HERB_DRAG_START, { herbId: herb.id });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDragPos({ x: 0, y: 0 });
  }, []);

  // Track drag position for ghost element
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: DragEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
      if (Math.random() < 0.45) {
        const id = Math.random();
        setTrails(t => [...t.slice(-18), {
          id,
          x: e.clientX + (Math.random() - 0.5) * 14,
          y: e.clientY + (Math.random() - 0.5) * 14
        }]);
        setTimeout(() => setTrails(t => t.filter(x => x.id !== id)), 600);
      }
    };
    window.addEventListener('dragover', onMove);
    return () => window.removeEventListener('dragover', onMove);
  }, [dragging]);

  // ============================================================================
  // Pot Drop Handler
  // ============================================================================

  const handlePotDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const isCorrect = target.correct && target.correct.includes(dragging.id);
    const alreadyIn = inPot.some(h => h.id === dragging.id);

    // Wrong: not in recipe OR already added OR pot full
    if (!isCorrect || alreadyIn || inPot.length >= target.count) {
      // BAD burst — red sparks + smoke puff + shake
      const id = Math.random();
      setBursts(b => [...b, { id, kind: 'bad', x: sx, y: sy }]);
      setTimeout(() => setBursts(b => b.filter(x => x.id !== id)), 1100);
      setPotShake('bad');
      setTimeout(() => setPotShake(null), 600);
      setDragging(null);

      // Call props callback and bridge to Phaser (wrong herb)
      props.onHerbDrop(dragging.id);
      bridgeToPhaser(DECOCTION_EVENTS.HERB_DROP, {
        herbId: dragging.id,
        success: false
      });
      return;
    }

    // CORRECT burst — golden radiant sparks + ring
    const id = Math.random();
    setBursts(b => [...b, { id, kind: 'ok', x: sx, y: sy }]);
    setTimeout(() => setBursts(b => b.filter(x => x.id !== id)), 1400);
    setPotShake('ok');
    setTimeout(() => setPotShake(null), 500);

    // Splash droplets
    const splashSet = [...Array(8)].map(() => ({
      id: Math.random(),
      x: sx,
      y: sy,
      dx: (Math.random() - 0.5) * 40,
      dy: -20 - Math.random() * 30
    }));
    setSplashes(s => [...s, ...splashSet]);
    setTimeout(() => setSplashes(s => s.filter(x => !splashSet.find(y => y.id === x.id))), 900);

    setInPot(p => [...p, dragging]);
    setDragging(null);

    // Call props callback and bridge to Phaser (correct herb)
    props.onHerbDrop(dragging.id);
    bridgeToPhaser(DECOCTION_EVENTS.HERB_DROP, {
      herbId: dragging.id,
      success: true
    });
  }, [dragging, target, inPot, props]);

  // ============================================================================
  // Brew/Complete Handler
  // ============================================================================

  const brew = useCallback(() => {
    if (inPot.length === 0) return;

    // Start brewing process - show progress bar animation
    setStateVal('brewing');
    setProgress(0);

    // Bridge to Phaser - brewing started
    bridgeToPhaser(DECOCTION_EVENTS.STATE_UPDATE, {
      phase: 'brewing',
      progress: 0
    });
  }, [inPot]);

  // Auto-complete when progress reaches 100
  useEffect(() => {
    if (state !== 'brewing') return;
    if (progress >= 100) {
      // Brewing complete
      setStateVal('done');

      // Create vial from current herbs
      const colors = inPot.map(h => h.pal[Object.keys(h.pal)[1]] || '#8a5028');
      const mix = mixColors(colors);
      const vial: VialData = {
        name: target.name,
        color: `rgb(${mix.r},${mix.g},${mix.b})`
      };

      setFinishedVials(vs => {
        const copy = [...vs];
        const emptyIdx = copy.findIndex(v => v === null);
        if (emptyIdx >= 0) copy[emptyIdx] = vial;
        return copy;
      });

      // Call onComplete callback from props to get score result
      const scoreResult = props.onComplete(inPot.map(h => h.id), 'martial');

      // Bridge to Phaser (complete)
      bridgeToPhaser(DECOCTION_EVENTS.COMPLETE, {
        herbs: inPot.map(h => h.id),
        fireType: 'martial',
        scoreResult
      });

      // Bridge state update
      bridgeToPhaser(DECOCTION_EVENTS.STATE_UPDATE, {
        phase: 'done',
        progress: 100
      });

      // Reset after animation delay
      setTimeout(() => {
        setInPot([]);
        setProgress(0);
        setStateVal('selecting');
      }, 2600);
    }
  }, [state, progress, inPot, target, props]);

  // ============================================================================
  // Derived Values
  // ============================================================================

  const finished = state === 'done';
  const progressLabel = progress < 33
    ? '武火起'
    : progress < 75
      ? '文火煨'
      : progress >= 100
        ? '已煎成'
        : '将成';

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* 遮罩层 - 让弹窗看起来像弹窗而非全屏 */}
      <div className="decoction-backdrop" onClick={() => props.onClose()} />

      <div className={`scroll-modal variant-${_frame}`}>
        <div className="roller top" />
        <div className="roller bottom" />
        <div className="roller-cap left" />
        <div className="roller-cap right" />

        <div className="paper">
          <div className="seal tl">
            <span className="s1">杏</span>
            <span className="s2">林</span>
          </div>
          <div className="seal br small">
            煎<br />煮
          </div>

          <div className="title-bar">
            <div className="deco" />
            <div className="ch">煎 药</div>
            <div className="sub">壬寅春</div>
            <div className="deco" />
          </div>

          <button className="close-btn" onClick={() => props.onClose()}>×</button>

          <div className="content">
            <div className="region region-stove">
              <div className="region-label">丹灶</div>

              <TargetScroll formula={target} filled={inPot.length} />

              <div className="cook-hud">
                <div className="hud-label">煎药</div>
                <div className="heat-bar">
                  <div className="heat-fill" style={{ width: `${progress}%` }} />
                  <div className="heat-zone" style={{ left: '33%' }} />
                  <div className="heat-zone" style={{ left: '75%' }} />
                  <div className="heat-ticks">
                    {[...Array(10)].map((_, i) => <span key={i} />)}
                  </div>
                </div>
                <div className="hud-label">{progressLabel}</div>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handlePotDrop}
                style={{ position: 'absolute', inset: 0 }}
              >
                <StoveScene
                  inPot={inPot}
                  finished={finished}
                  showSteam={progress > 10}
                  shake={potShake}
                />
              </div>

              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {splashes.map(s => (
                  <div
                    key={s.id}
                    className="splash"
                    style={{
                      left: s.x,
                      top: s.y,
                      '--sx': `${s.dx}px`,
                      '--sy': `${s.dy}px`
                    } as React.CSSProperties}
                  />
                ))}
                {bursts.map(b => (
                  <DropBurst key={b.id} kind={b.kind} x={b.x} y={b.y} />
                ))}
              </div>

              <div className="formula-slots two-rows">
                {[...Array(target.count)].map((_, i) => {
                  const h = inPot[i];
                  return (
                    <div key={i} className={`slot ${h ? 'filled' : ''}`}>
                      {h
                        ? <span className="slot-name">{h.name}</span>
                        : <span className="slot-plus">+</span>
                      }
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="region region-bag">
              <div className="bag-header">
                <div className="bag-title">药 柜</div>
                <div className="bag-count">{herbs.length} 味 · 下拉取药</div>
              </div>
              <div className="bag-grid">
                {herbs.map(h => (
                  <HerbTag
                    key={h.id}
                    herb={h}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    dragging={dragging?.id === h.id}
                  />
                ))}
              </div>
            </div>

            <div className="region region-vials">
              <button
                className="brew-btn"
                onClick={brew}
                disabled={!inPot.length || state === 'brewing'}
              >
                {state === 'brewing'
                  ? '煎煮中...'
                  : finished
                    ? '煎成'
                    : '起 锅'}
              </button>
              <div className="vials-area">
                <div className="vials-header">
                  <div className="vials-title">药 剂</div>
                  <div className="vials-hint">
                    已成 {finishedVials.filter(v => v).length} 方 · 入杏林柜
                  </div>
                </div>
                <div className="vials-shelf">
                  {finishedVials.map((v, i) => (
                    <Vial
                      key={i}
                      formula={v}
                      empty={!v}
                      glow={finished && v !== null && i === (() => {
                        // ES2020-compatible findLastIndex
                        for (let j = finishedVials.length - 1; j >= 0; j--) {
                          if (finishedVials[j] !== null) return j;
                        }
                        return -1;
                      })()}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag ghost element */}
      {dragging && (
        <div className="drag-ghost" style={{ left: dragPos.x, top: dragPos.y }}>
          <div className="tag-plank" style={{ transform: 'scale(1.1)' }}>
            <div className="herb-icon">
              {(() => {
                const { style, innerStyle } = pixelSprite(dragging.grid, dragging.pal, 3);
                return (
                  <div style={style}>
                    <div style={innerStyle} />
                  </div>
                );
              })()}
            </div>
            <div className="tag-name">{dragging.name}</div>
          </div>
        </div>
      )}

      {/* Trail particles */}
      {trails.map(t => (
        <div key={t.id} className="drag-trail" style={{ left: t.x, top: t.y }} />
      ))}
    </>
  );
}

export default DecoctionUI;