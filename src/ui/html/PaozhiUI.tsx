// src/ui/html/PaozhiUI.tsx
/**
 * 炮制游戏 React UI
 *
 * 集成完整炮制逻辑：拖拽、器皿选择、炮制动画、结果处理
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  PROCESSING_TYPES,
  VESSELS,
  INGREDIENTS,
  HERBS,
  RECIPES,
  Herb,
  Recipe,
  checkRecipeAdjuvants,
} from '../../data/paozhi-data';
import { PAOZHI_EVENTS } from './bridge/paozhi-events';

// === Color helpers ===
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

function lerpColor(a: string, b: string, t: number): string {
  t = Math.max(0, Math.min(1, t));
  const ra = hexToRgb(a), rb = hexToRgb(b);
  return rgbToHex([
    ra[0] + (rb[0] - ra[0]) * t,
    ra[1] + (rb[1] - ra[1]) * t,
    ra[2] + (rb[2] - ra[2]) * t,
  ]);
}

function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amt > 0) {
    return rgbToHex([
      r + (255 - r) * amt,
      g + (255 - g) * amt,
      b + (255 - b) * amt,
    ]);
  }
  return rgbToHex([r * (1 + amt), g * (1 + amt), b * (1 + amt)]);
}

// Export color helpers for use in components
export { lerpColor, shade };

// === Session State Interface ===
interface SessionState {
  type: string;
  vessel: string;
  herb: string;
  adjuvants: string[];
  progress: number;
  status: 'ok' | 'warn' | 'burn';
  missteps: number;
}

interface ResultState {
  recipe: Recipe;
  quality: number;
}

interface CollectedItem {
  recipeId: string;
  quality: number;
}

interface DragState {
  kind: 'herb' | 'ing';
  id: string;
  x: number;
  y: number;
}

// === Props Interface ===
export interface PaozhiUIProps {
  onClose: () => void;
  initialRecipeId?: string;
  onComplete?: (recipeId: string, quality: number) => void;
}

// === Herb SVG Component ===
function HerbSvg({
  herb,
  progress = 0,
  size = 64,
}: {
  herb: string;
  progress?: number;
  size?: number;
}) {
  const h = HERBS[herb] || HERBS.danggui;
  const c = lerpColor(h.raw, h.done, progress);
  const charred = progress > 0.92;
  const cChar = charred ? lerpColor(c, '#1a0a05', (progress - 0.92) * 12) : c;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: 'visible' }}>
      {renderHerbShape(h.form, cChar, h)}
    </svg>
  );
}

function renderHerbShape(form: string, color: string, h: Herb): React.ReactElement {
  const dark = shade(color, -0.35);
  const light = shade(color, 0.18);

  switch (form) {
    case 'root':
      return (
        <g>
          <path
            d="M16 8 C 22 14, 18 22, 22 32 C 26 42, 20 52, 28 58 C 32 60, 36 56, 38 50 C 40 42, 44 36, 46 28 C 48 20, 44 12, 36 10 C 28 8, 22 6, 16 8 Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.8"
          />
          <path
            d="M22 18 Q 28 22, 34 20 M 26 32 Q 32 36, 40 32 M 24 44 Q 30 48, 36 46"
            stroke={dark}
            strokeWidth="0.6"
            fill="none"
            opacity=".55"
          />
        </g>
      );
    case 'tuber':
      return (
        <g>
          <ellipse cx="32" cy="34" rx="20" ry="22" fill={color} stroke={dark} strokeWidth="0.8" />
          <ellipse cx="26" cy="28" rx="6" ry="4" fill={light} opacity=".5" />
          <circle cx="38" cy="42" r="1.5" fill={dark} opacity=".4" />
        </g>
      );
    case 'shell':
      return (
        <g>
          <path
            d="M8 32 Q 12 12, 32 10 Q 52 12, 56 32 Q 54 50, 32 54 Q 10 50, 8 32 Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.8"
          />
          <path
            d="M14 30 Q 20 18, 32 16 M 18 36 Q 26 24, 36 22 M 22 42 Q 30 32, 42 30"
            stroke={dark}
            strokeWidth="0.5"
            fill="none"
            opacity=".6"
          />
        </g>
      );
    case 'stone':
      return (
        <g>
          <path
            d="M14 20 L 28 8 L 50 14 L 56 36 L 44 56 L 18 52 L 8 36 Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.8"
          />
          <path d="M26 14 L 38 22 L 30 36 Z" fill={light} opacity=".4" />
        </g>
      );
    case 'slice':
      return (
        <g>
          <ellipse cx="32" cy="32" rx="22" ry="8" fill={color} stroke={dark} strokeWidth="0.8" />
          <ellipse cx="32" cy="30" rx="14" ry="4" fill={light} opacity=".4" />
        </g>
      );
    case 'block':
      return (
        <g>
          <rect x="10" y="14" width="44" height="38" rx="2" fill={color} stroke={dark} strokeWidth="0.8" />
          <path
            d="M10 22 L 54 22 M 10 32 L 54 32 M 10 42 L 54 42"
            stroke={dark}
            strokeWidth="0.4"
            opacity=".4"
          />
        </g>
      );
    default:
      return <circle cx="32" cy="32" r="22" fill={color} stroke={dark} strokeWidth="0.8" />;
  }
}

// === Ingredient Icon Component ===
function IngredientIcon({ ing, size = 56 }: { ing: string; size?: number }) {
  const I = INGREDIENTS[ing] || INGREDIENTS.shui;

  if (I.icon === 'liquid') {
    return (
      <svg width={size} height={size * 1.2} viewBox="0 0 56 68">
        <path
          d="M22 8 L 34 8 L 34 14 L 38 18 L 38 58 Q 38 64, 32 64 L 24 64 Q 18 64, 18 58 L 18 18 L 22 14 Z"
          fill="#8a5a2a"
          stroke="#3a2010"
          strokeWidth="1"
        />
        <path d="M22 8 L 34 8 L 34 14 L 22 14 Z" fill="#3a2010" />
        <ellipse cx="28" cy="40" rx="8" ry="3" fill={I.color} opacity=".85" />
        <rect x="22" y="44" width="12" height="14" fill={I.color} opacity=".25" />
        <text
          x="28"
          y="36"
          fontSize="8"
          fill="#f4e9d2"
          fontFamily="Ma Shan Zheng,serif"
          textAnchor="middle"
        >
          {I.name[0]}
        </text>
      </svg>
    );
  }

  if (I.icon === 'powder') {
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        <path d="M8 12 L 48 12 L 44 48 L 12 48 Z" fill="#e8dcc4" stroke="#6e4a22" strokeWidth="1" />
        <path d="M8 12 L 28 22 L 48 12" stroke="#6e4a22" strokeWidth="1" fill="none" />
        <circle cx="20" cy="34" r="1.5" fill={I.color} />
        <circle cx="28" cy="38" r="1.2" fill={I.color} />
        <circle cx="34" cy="32" r="1.5" fill={I.color} />
        <text
          x="28"
          y="30"
          fontSize="9"
          fill="#6e4a22"
          fontFamily="Ma Shan Zheng,serif"
          textAnchor="middle"
        >
          {I.name}
        </text>
      </svg>
    );
  }

  // paper
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <path d="M10 8 L 46 8 L 46 48 L 10 48 Z" fill="#f4e9d2" stroke="#8a6638" strokeWidth="1" />
      <path
        d="M14 14 L 42 14 M 14 20 L 42 20 M 14 26 L 38 26"
        stroke="#8a6638"
        strokeWidth="0.5"
        opacity=".5"
      />
    </svg>
  );
}

// === Vessel SVG Components ===
function VesselSvg({
  vessel,
  size = 200,
  hot = false,
}: {
  vessel: string;
  size?: number;
  hot?: boolean;
}): React.ReactElement | null {
  switch (vessel) {
    case 'wok':
      return <Wok size={size} hot={hot} />;
    case 'crucible':
      return <Crucible size={size} hot={hot} />;
    case 'basin':
      return <Basin size={size} />;
    case 'board':
      return <Board size={size} />;
    case 'ash':
      return <Ash size={size} hot={hot} />;
    case 'steamer':
      return <Steamer size={size} hot={hot} />;
    case 'pot':
      return <Pot size={size} hot={hot} />;
    case 'jar':
      return <Jar size={size} />;
    default:
      return null;
  }
}

function Wok({ size, hot }: { size: number; hot: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
      {hot && (
        <ellipse cx="100" cy="160" rx="80" ry="14" fill="url(#wokGlow)" opacity=".7">
          <animate attributeName="opacity" values=".5;.85;.5" dur="1.6s" repeatCount="indefinite" />
        </ellipse>
      )}
      <defs>
        <radialGradient id="wokGlow">
          <stop offset="0%" stopColor="#ff6a1a" stopOpacity=".9" />
          <stop offset="100%" stopColor="#b9341c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wokBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a4830" />
          <stop offset="50%" stopColor="#2a1a10" />
          <stop offset="100%" stopColor="#1a0e08" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="80" rx="92" ry="22" fill="#1a0e08" />
      <ellipse cx="100" cy="78" rx="92" ry="22" fill="url(#wokBody)" />
      <path d="M8 80 Q 100 200, 192 80 Q 100 110, 8 80 Z" fill="url(#wokBody)" />
      <ellipse cx="80" cy="75" rx="32" ry="4" fill="#8a6038" opacity=".4" />
    </svg>
  );
}

function Crucible({ size, hot }: { size: number; hot: boolean }) {
  const heat = hot ? 1 : 0;
  const bodyColor = lerpColor('#3a2818', '#ff4a1a', heat);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="crucGlow">
          <stop offset="0%" stopColor="#fff080" stopOpacity=".9" />
          <stop offset="60%" stopColor="#ff4a1a" stopOpacity=".5" />
          <stop offset="100%" stopColor="#b9341c" stopOpacity="0" />
        </radialGradient>
      </defs>
      {hot && (
        <ellipse cx="100" cy="120" rx="100" ry="50" fill="url(#crucGlow)">
          <animate attributeName="opacity" values=".7;1;.7" dur="1.2s" repeatCount="indefinite" />
        </ellipse>
      )}
      <path d="M40 60 L 50 140 Q 100 160, 150 140 L 160 60 Q 100 80, 40 60 Z" fill={shade(bodyColor, -0.2)} stroke="#1a0e08" strokeWidth="1.5" />
      <ellipse cx="100" cy="60" rx="60" ry="10" fill={shade(bodyColor, -0.3)} />
      <ellipse cx="100" cy="58" rx="56" ry="8" fill={hot ? '#ffae40' : '#1a0e08'}>
        {hot && (
          <animate attributeName="fill" values="#ffae40;#ff6020;#ffae40" dur="1.5s" repeatCount="indefinite" />
        )}
      </ellipse>
    </svg>
  );
}

function Basin({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="basinBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8825a" />
          <stop offset="100%" stopColor="#5a3a20" />
        </linearGradient>
        <radialGradient id="water" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#bdd9e4" />
          <stop offset="100%" stopColor="#5a8a9a" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="88" rx="92" ry="22" fill="url(#basinBody)" />
      <ellipse cx="100" cy="90" rx="86" ry="18" fill="url(#water)">
        <animate attributeName="ry" values="18;19;18" dur="3s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}

function Board({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="boardBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a878" />
          <stop offset="100%" stopColor="#8a6638" />
        </linearGradient>
      </defs>
      <rect x="20" y="80" width="160" height="80" rx="4" fill="url(#boardBody)" stroke="#3a2010" strokeWidth="1.5" />
      <path
        d="M25 95 Q 100 92, 175 96 M 25 110 Q 100 108, 175 112"
        stroke="#6a4828"
        strokeWidth="0.6"
        fill="none"
        opacity=".5"
      />
    </svg>
  );
}

function Ash({ size, hot }: { size: number; hot: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id="ashGlow">
          <stop offset="0%" stopColor="#ff8a30" stopOpacity=".7" />
          <stop offset="100%" stopColor="#b9341c" stopOpacity="0" />
        </radialGradient>
      </defs>
      {hot && (
        <ellipse cx="100" cy="130" rx="80" ry="20" fill="url(#ashGlow)">
          <animate attributeName="opacity" values=".5;.9;.5" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}
      <ellipse cx="100" cy="100" rx="92" ry="20" fill="#3a2010" />
      <ellipse cx="100" cy="100" rx="86" ry="16" fill="#a89888" />
    </svg>
  );
}

function Steamer({ size, hot }: { size: number; hot: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="stmBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a87848" />
          <stop offset="100%" stopColor="#5a3a18" />
        </linearGradient>
      </defs>
      <path d="M30 110 L 30 170 Q 100 184, 170 170 L 170 110 Q 100 124, 30 110 Z" fill="url(#stmBody)" stroke="#3a2010" />
      <ellipse cx="100" cy="100" rx="82" ry="14" fill="#3a2010" />
      <path d="M18 60 L 22 104 Q 100 118, 178 104 L 182 60 Q 100 76, 18 60 Z" fill="url(#stmBody)" stroke="#3a2010" strokeWidth="1.2" />
    </svg>
  );
}

function Pot({ size, hot }: { size: number; hot: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="potBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8784a" />
          <stop offset="100%" stopColor="#5a3818" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="80" rx="86" ry="16" fill="#3a2010" />
      <path d="M14 80 Q 14 170, 100 178 Q 186 170, 186 80 Q 100 96, 14 80 Z" fill="url(#potBody)" stroke="#3a2010" strokeWidth="1.2" />
      <ellipse cx="100" cy="80" rx="80" ry="13" fill="#c9a063">
        {hot && <animate attributeName="ry" values="13;14;13" dur="1.2s" repeatCount="indefinite" />}
      </ellipse>
    </svg>
  );
}

function Jar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="jarBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6038" />
          <stop offset="50%" stopColor="#5a3818" />
          <stop offset="100%" stopColor="#3a2010" />
        </linearGradient>
      </defs>
      <path
        d="M60 40 L 40 80 Q 30 130, 50 170 Q 100 184, 150 170 Q 170 130, 160 80 L 140 40 Q 100 50, 60 40 Z"
        fill="url(#jarBody)"
        stroke="#1a0a04"
        strokeWidth="1.5"
      />
      <ellipse cx="100" cy="38" rx="42" ry="6" fill="#e8dcc4" stroke="#8a6038" />
      <text x="100" y="40" fontSize="8" fill="#b9341c" fontFamily="Ma Shan Zheng,serif" textAnchor="middle" opacity=".8">
        封
      </text>
    </svg>
  );
}

// === Particle Effect Component ===
function Particles({
  kind,
  count = 12,
  w = 200,
  h = 200,
}: {
  kind: 'smoke' | 'steam' | 'spark' | 'bubble' | 'dust';
  count?: number;
  w?: number;
  h?: number;
}) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        i,
        x: 20 + Math.random() * (w - 40),
        delay: Math.random() * 2,
        dur: 1.5 + Math.random() * 2,
        size: 2 + Math.random() * 3,
        drift: -10 + Math.random() * 20,
      })),
    [count, w, h]
  );

  const colors: Record<string, string> = {
    smoke: 'rgba(180,160,140,.45)',
    steam: 'rgba(255,255,255,.55)',
    spark: '#ffae40',
    bubble: 'rgba(220,200,150,.6)',
    dust: 'rgba(180,140,80,.4)',
  };

  const c = colors[kind] || 'rgba(255,255,255,.5)';
  const isSpark = kind === 'spark';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {items.map((p) => (
        <div
          key={p.i}
          style={{
            position: 'absolute',
            left: p.x,
            bottom: 30,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: c,
            filter: isSpark ? 'blur(0.5px)' : 'blur(2px)',
            boxShadow: isSpark ? `0 0 ${p.size * 3}px ${p.size}px rgba(255,140,40,.6)` : 'none',
            animation: `pt-rise ${p.dur}s ${p.delay}s ease-out infinite`,
            '--drift': `${p.drift}px`,
            '--rise': `${h - 30}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// === Main PaozhiUI Component ===
export default function PaozhiUI({ onClose, initialRecipeId = 'r1', onComplete }: PaozhiUIProps) {
  const [currentQuestId, setCurrentQuestId] = useState(initialRecipeId);
  const currentQuest = RECIPES.find((r) => r.id === currentQuestId);

  const [collected, setCollected] = useState<CollectedItem[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [activeVessel, setActiveVessel] = useState<string | null>(null);
  const [stagedHerb, setStagedHerb] = useState<string | null>(null);
  const [stagedAdj, setStagedAdj] = useState<string[]>([]);
  const [result, setResult] = useState<ResultState | null>(null);
  const [tab, setTab] = useState<'herbs' | 'adj'>('herbs');
  const [drag, setDrag] = useState<DragState | null>(null);

  // Drag handling
  useEffect(() => {
    if (!drag) return;

    const move = (e: MouseEvent | TouchEvent) => {
      const x = (e as MouseEvent).clientX ?? (e as TouchEvent).touches?.[0]?.clientX;
      const y = (e as MouseEvent).clientY ?? (e as TouchEvent).touches?.[0]?.clientY;
      if (x != null && y != null) {
        setDrag((d) => d ? { ...d, x, y } : d);
      }
    };

    const up = (e: MouseEvent | TouchEvent) => {
      const x = (e as MouseEvent).clientX ?? (e as TouchEvent).changedTouches?.[0]?.clientX;
      const y = (e as MouseEvent).clientY ?? (e as TouchEvent).changedTouches?.[0]?.clientY;
      const el = document.elementFromPoint(x ?? 0, y ?? 0);
      const dropZone = el?.closest('[data-drop]') as HTMLElement | null;
      if (dropZone && drag) {
        handleDrop(dropZone.dataset.drop as string, drag);
      }
      setDrag(null);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [drag]);

  const onDragStartItem = useCallback(({ kind, id, startX, startY }: { kind: 'herb' | 'ing'; id: string; startX: number; startY: number }) => {
    setDrag({ kind, id, x: startX, y: startY });
  }, []);

  const handleDrop = useCallback((zone: string, d: DragState) => {
    if (zone === 'bench') {
      if (d.kind === 'herb') {
        setStagedHerb(d.id);
      } else {
        setStagedAdj((arr) => arr.includes(d.id) ? arr : [...arr, d.id]);
      }
    }
  }, []);

  const expectedVessel = currentQuest ? PROCESSING_TYPES[currentQuest.type].vessel : null;
  const canStart = stagedHerb && activeVessel && currentQuest && expectedVessel === activeVessel;

  const startProcessing = useCallback(() => {
    if (!canStart || !currentQuest) return;
    setSession({
      type: currentQuest.type,
      vessel: activeVessel!,
      herb: stagedHerb!,
      adjuvants: stagedAdj,
      progress: 0,
      status: 'ok',
      missteps: 0,
    });
  }, [canStart, currentQuest, activeVessel, stagedHerb, stagedAdj]);

  const onProgress = useCallback((np: number, status: 'ok' | 'warn' | 'burn') => {
    setSession((s) => s ? { ...s, progress: np, status } : s);
  }, []);

  const onCompleteSession = useCallback(() => {
    setSession((s) => {
      if (!s || !currentQuest) return s;
      const matchHerb = s.herb === currentQuest.herb;
      const matchAdj = checkRecipeAdjuvants(currentQuest, s.adjuvants);
      const quality = matchHerb && matchAdj ? 0.95 : matchHerb ? 0.7 : 0.4;
      setResult({ recipe: currentQuest, quality });
      return null;
    });
  }, [currentQuest]);

  const onAbort = useCallback(() => setSession(null), []);

  const onContinue = useCallback(() => {
    if (!result) return;
    setCollected((c) => [...c, { recipeId: result.recipe.id, quality: result.quality }]);
    setResult(null);
    setStagedHerb(null);
    setStagedAdj([]);
    setActiveVessel(null);

    const done = new Set([...collected.map((c) => c.recipeId), result.recipe.id]);
    const next = RECIPES.find((r) => !done.has(r.id));
    if (next) setCurrentQuestId(next.id);

    // Dispatch completion event
    window.dispatchEvent(
      new CustomEvent(PAOZHI_EVENTS.COMPLETE, {
        detail: { recipeId: result.recipe.id, quality: result.quality },
      })
    );

    if (onComplete) {
      onComplete(result.recipe.id, result.quality);
    }
  }, [result, collected, onComplete]);

  const handleClose = useCallback(() => {
    window.dispatchEvent(new CustomEvent(PAOZHI_EVENTS.CLOSE));
    onClose();
  }, [onClose]);

  const allHerbs = Object.keys(HERBS);
  const allIngs = Object.keys(INGREDIENTS);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: '138px 1fr 240px',
        gridTemplateRows: '1fr auto',
        gridTemplateAreas: '"rack bench side" "shelf shelf shelf"',
        background:
          'radial-gradient(ellipse at 30% 15%, rgba(244,233,210,.7) 0%, transparent 50%), radial-gradient(ellipse at 70% 90%, rgba(110,74,34,.15) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, #e8dcc4 0%, #d6c098 60%, #b89970 100%)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          appearance: 'none',
          border: '1px solid var(--frame)',
          background: 'rgba(244,233,210,.7)',
          color: 'var(--ink-soft)',
          padding: '4px 10px',
          borderRadius: 3,
          cursor: 'pointer',
          fontFamily: 'Noto Sans SC,sans-serif',
          fontSize: 11,
          zIndex: 100,
        }}
      >
        关闭
      </button>

      {/* Quest scroll */}
      {currentQuest && (
        <QuestScroll
          recipe={currentQuest}
          scoreLabel={`已成 ${collected.length}/${RECIPES.length}`}
        />
      )}

      {/* Left vessel rack */}
      <div style={{ gridArea: 'rack', padding: '118px 10px 10px', overflow: 'auto' }}>
        <VesselRack
          onPick={(v: string) => setActiveVessel(v)}
          activeVessel={activeVessel}
          currentVessel={expectedVessel}
        />
      </div>

      {/* Center bench */}
      <div
        data-drop="bench"
        style={{
          gridArea: 'bench',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '118px 18px 18px',
          outline: drag ? '2px dashed var(--vermilion)' : 'none',
          outlineOffset: -10,
          transition: 'outline .2s',
        }}
      >
        {!session && (
          <BenchStaging
            stagedHerb={stagedHerb}
            stagedAdj={stagedAdj}
            activeVessel={activeVessel}
            canStart={!!canStart}
            onStart={startProcessing}
            onClearHerb={() => setStagedHerb(null)}
            onClearAdj={(i: string) => setStagedAdj((a) => a.filter((x) => x !== i))}
            onClearVessel={() => setActiveVessel(null)}
            quest={currentQuest!}
          />
        )}
        {session && (
          <Workbench
            session={session}
            onProgress={onProgress}
            onComplete={onCompleteSession}
            onAbort={onAbort}
          />
        )}
      </div>

      {/* Right side scroll */}
      <div style={{ gridArea: 'side', padding: '118px 10px 10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <SideScroll
          tab={tab}
          onTabChange={(t: 'herbs' | 'adj') => setTab(t)}
          herbs={allHerbs}
          ingredients={allIngs}
          currentRecipe={currentQuest}
          onDragStartItem={onDragStartItem}
        />
      </div>

      {/* Bottom shelf */}
      <div style={{ gridArea: 'shelf' }}>
        <BottomShelf
          collected={collected}
          currentQuest={currentQuest}
          onPickQuest={(id: string) => setCurrentQuestId(id)}
        />
      </div>

      {/* Drag preview */}
      {drag && (
        <div
          style={{
            position: 'fixed',
            left: drag.x - 30,
            top: drag.y - 30,
            zIndex: 200,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.4))',
            transform: 'scale(1.2) rotate(-3deg)',
          }}
        >
          {drag.kind === 'herb' ? <HerbSvg herb={drag.id} size={64} /> : <IngredientIcon ing={drag.id} size={56} />}
        </div>
      )}

      {/* Result modal */}
      <ResultModal result={result} onContinue={onContinue} />
    </div>
  );
}

// === Sub-components ===

function QuestScroll({ recipe, scoreLabel }: { recipe: Recipe; scoreLabel: string }) {
  const type = PROCESSING_TYPES[recipe.type];
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        pointerEvents: 'auto',
        animation: 'scroll-unfurl .9s cubic-bezier(.2,.8,.3,1.1)',
        transformOrigin: 'top',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, var(--paper-dark) 0%, var(--paper) 14%, var(--paper-warm) 50%, var(--paper) 86%, var(--paper-dark) 100%)',
          padding: '10px 16px',
          margin: '0 24px',
          border: '1px solid var(--frame)',
          borderRadius: 2,
          boxShadow: '0 10px 18px rgba(40,25,10,.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #d54a30, #b9341c 60%, #8b2412)',
              color: '#f4e9d2',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'Ma Shan Zheng,serif',
              fontSize: 26,
            }}
          >
            炮
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div className="f-han" style={{ fontSize: 46, color: 'var(--ink)', letterSpacing: '.15em', paddingLeft: '.15em' }}>
              {recipe.out}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'Noto Serif SC,serif', fontStyle: 'italic' }}>
              {recipe.benefit}
            </div>
          </div>
          <div style={{ padding: '4px 16px', borderLeft: '1px solid var(--frame-soft)' }}>
            <div className="f-han" style={{ fontSize: 32, color: 'var(--vermilion)' }}>
              {type.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '.15em' }}>{scoreLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VesselRack({
  onPick,
  activeVessel,
  currentVessel,
}: {
  onPick: (v: string) => void;
  activeVessel: string | null;
  currentVessel: string | null;
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 6px 16px',
        background: 'linear-gradient(180deg, rgba(110,74,34,.22) 0%, rgba(110,74,34,.10) 100%)',
        border: '1px solid var(--frame)',
        borderRadius: 2,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 6, paddingBottom: 8, borderBottom: '1px solid var(--frame-soft)' }}>
        <div className="f-han" style={{ fontSize: 18, color: 'var(--ink)', letterSpacing: '.4em', paddingLeft: '.4em' }}>
          器 皿
        </div>
      </div>
      {VESSELS.map((v) => {
        const active = activeVessel === v.id;
        const recommended = currentVessel === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onPick(v.id)}
            title={v.hint}
            style={{
              appearance: 'none',
              border: 0,
              padding: '4px 2px',
              background: active ? 'var(--paper)' : recommended ? 'rgba(185,52,28,.06)' : 'transparent',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              color: 'var(--ink)',
              outline: active ? '1.5px solid var(--vermilion)' : recommended ? '1px dashed rgba(185,52,28,.5)' : '1px solid transparent',
              outlineOffset: -1,
              transition: 'all .2s',
            }}
          >
            <VesselSvg vessel={v.id} size={50} />
            <span className="f-han" style={{ fontSize: 12, lineHeight: 1, color: active ? 'var(--vermilion)' : 'var(--ink)' }}>
              {v.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BenchStaging({
  stagedHerb,
  stagedAdj,
  activeVessel,
  canStart,
  onStart,
  onClearHerb,
  onClearAdj,
  onClearVessel,
  quest,
}: {
  stagedHerb: string | null;
  stagedAdj: string[];
  activeVessel: string | null;
  canStart: boolean;
  onStart: () => void;
  onClearHerb: () => void;
  onClearAdj: (i: string) => void;
  onClearVessel: () => void;
  quest: Recipe;
}) {
  const expectedHerb = quest?.herb;
  const expectedAdj = quest?.adjuvants || [];
  const expectedVessel = quest ? PROCESSING_TYPES[quest.type].vessel : null;

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="f-han" style={{ fontSize: 26, color: 'var(--ink)', letterSpacing: '.4em', paddingLeft: '.4em' }}>
          炮 制 工 坊
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <Slot
          label="药材"
          placeholder="拖入生药材"
          filled={!!stagedHerb}
          correct={stagedHerb === expectedHerb}
          onClear={onClearHerb}
        >
          {stagedHerb && <HerbSvg herb={stagedHerb} size={64} />}
        </Slot>
        <SlotConnector char="+" />
        <Slot
          label="辅料"
          placeholder={expectedAdj.length === 0 ? '（此方无需辅料）' : '拖入辅料'}
          filled={stagedAdj.length > 0 || expectedAdj.length === 0}
          correct={(expectedAdj.length === 0 && stagedAdj.length === 0) || checkRecipeAdjuvants(quest, stagedAdj)}
          onClear={undefined}
          stack
        >
          {stagedAdj.map((a) => (
            <button
              key={a}
              onClick={() => onClearAdj(a)}
              style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', padding: 2 }}
            >
              <IngredientIcon ing={a} size={36} />
            </button>
          ))}
        </Slot>
        <SlotConnector char="→" />
        <Slot
          label="器皿"
          placeholder="左侧选取"
          filled={!!activeVessel}
          correct={activeVessel === expectedVessel}
          onClear={onClearVessel}
        >
          {activeVessel && <VesselSvg vessel={activeVessel} size={76} />}
        </Slot>
      </div>

      {canStart ? (
        <button
          onClick={onStart}
          style={{
            appearance: 'none',
            border: 0,
            background: 'linear-gradient(180deg, #c8442a, #b9341c 60%, #8b2412)',
            color: '#f4e9d2',
            padding: '13px 48px',
            borderRadius: 2,
            cursor: 'pointer',
            fontFamily: 'Ma Shan Zheng,serif',
            fontSize: 24,
            letterSpacing: '.4em',
            paddingLeft: 'calc(48px + .4em)',
            animation: 'pulse-soft 1.5s ease-in-out infinite',
          }}
        >
          开 始 炮 制
        </button>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'Noto Sans SC,sans-serif', letterSpacing: '.15em' }}>
          {!stagedHerb ? '① 拖拽生药材' : !activeVessel ? '③ 选取器皿' : '请补齐方才'}
        </div>
      )}
    </div>
  );
}

function Slot({
  label,
  placeholder,
  filled,
  correct,
  onClear,
  children,
  stack,
}: {
  label: string;
  placeholder: string;
  filled: boolean;
  correct: boolean;
  onClear?: () => void;
  children?: React.ReactNode;
  stack?: boolean;
}) {
  const borderColor = filled ? (correct ? 'var(--jade)' : 'var(--vermilion)') : 'var(--frame)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative' }}>
      <div className="f-han" style={{ fontSize: 14, color: 'var(--ink-soft)', letterSpacing: '.3em', paddingLeft: '.3em' }}>
        {label}
      </div>
      <div
        style={{
          width: 116,
          height: 116,
          border: `1.5px ${filled ? 'solid' : 'dashed'} ${borderColor}`,
          background: filled
            ? correct
              ? 'linear-gradient(180deg, rgba(74,107,77,.10), rgba(74,107,77,.04))'
              : 'linear-gradient(180deg, rgba(185,52,28,.08), rgba(185,52,28,.02))'
            : 'linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,.1))',
          borderRadius: 2,
          display: 'flex',
          flexDirection: stack ? 'row' : 'column',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          position: 'relative',
          transition: 'all .25s',
        }}
      >
        {filled ? children : <span style={{ fontSize: 10, color: 'var(--ink-faint)', textAlign: 'center', padding: 6 }}>{placeholder}</span>}
        {filled && onClear && (
          <button
            onClick={onClear}
            style={{
              position: 'absolute',
              top: 3,
              right: 3,
              appearance: 'none',
              border: 0,
              background: 'rgba(185,52,28,.9)',
              color: '#f4e9d2',
              width: 18,
              height: 18,
              borderRadius: '50%',
              fontSize: 11,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function SlotConnector({ char }: { char: string }) {
  return (
    <div style={{ fontSize: 22, color: 'var(--ink-faint)', fontFamily: 'Ma Shan Zheng,serif', paddingTop: 14 }}>
      {char}
    </div>
  );
}

function SideScroll({
  tab,
  onTabChange,
  herbs,
  ingredients,
  currentRecipe,
  onDragStartItem,
}: {
  tab: 'herbs' | 'adj';
  onTabChange: (t: 'herbs' | 'adj') => void;
  herbs: string[];
  ingredients: string[];
  currentRecipe: Recipe | undefined;
  onDragStartItem: (args: { kind: 'herb' | 'ing'; id: string; startX: number; startY: number }) => void;
}) {
  const items = tab === 'herbs' ? herbs : ingredients;
  const kind = tab === 'herbs' ? 'herb' : 'ing';
  const expected = currentRecipe ? (tab === 'herbs' ? [currentRecipe.herb] : currentRecipe.adjuvants) : [];

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', padding: '14px 16px 8px', borderBottom: '1px solid var(--frame-soft)' }}>
        <div className="f-han" style={{ fontSize: 19, color: 'var(--ink)', letterSpacing: '.35em', paddingLeft: '.35em' }}>
          药 笼
        </div>
      </div>

      <div style={{ display: 'flex', padding: '10px 12px 4px', gap: 6 }}>
        {[
          { id: 'herbs', label: '药 材' },
          { id: 'adj', label: '辅 料' },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => onTabChange(tb.id as 'herbs' | 'adj')}
            style={{
              flex: 1,
              appearance: 'none',
              border: 0,
              background: tab === tb.id ? 'linear-gradient(180deg, rgba(185,52,28,.92), rgba(139,36,18,.92))' : 'rgba(255,255,255,.45)',
              color: tab === tb.id ? '#f4e9d2' : 'var(--ink-soft)',
              padding: '7px 4px',
              borderRadius: 2,
              cursor: 'pointer',
              fontFamily: 'Ma Shan Zheng,serif',
              fontSize: 16,
              letterSpacing: '.25em',
              paddingLeft: '.25em',
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '8px 12px 14px', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {items.map((id) => (
            <ScrollDragItem
              key={id}
              kind={kind}
              id={id}
              highlighted={expected.includes(id)}
              onDragStart={onDragStartItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScrollDragItem({
  kind,
  id,
  highlighted,
  onDragStart,
}: {
  kind: 'herb' | 'ing';
  id: string;
  highlighted: boolean;
  onDragStart: (args: { kind: 'herb' | 'ing'; id: string; startX: number; startY: number }) => void;
}) {
  const data = kind === 'herb' ? HERBS[id] : INGREDIENTS[id];

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = (e as React.MouseEvent).clientX ?? (e as React.TouchEvent).touches?.[0]?.clientX ?? 0;
    const clientY = (e as React.MouseEvent).clientY ?? (e as React.TouchEvent).touches?.[0]?.clientY ?? 0;
    onDragStart({ kind, id, startX: clientX, startY: clientY });
  };

  return (
    <div
      onMouseDown={handleDown}
      onTouchStart={handleDown}
      style={{
        height: 78,
        padding: '4px 4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        background: highlighted
          ? 'linear-gradient(180deg, rgba(185,52,28,.10), rgba(185,52,28,.04))'
          : 'linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.25))',
        border: highlighted ? '1px solid var(--vermilion)' : '1px solid var(--frame-soft)',
        borderRadius: 2,
        cursor: 'grab',
        transition: 'transform .15s ease',
      }}
    >
      {highlighted && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--vermilion)',
          }}
        />
      )}
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        {kind === 'herb' ? <HerbSvg herb={id} size={42} /> : <IngredientIcon ing={id} size={36} />}
      </div>
      <div className="f-han" style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1, letterSpacing: '.05em' }}>
        {data.name}
      </div>
    </div>
  );
}

function BottomShelf({
  collected,
  currentQuest,
  onPickQuest,
}: {
  collected: CollectedItem[];
  currentQuest: Recipe | undefined;
  onPickQuest: (id: string) => void;
}) {
  const collectedIds = new Set(collected.map((c) => c.recipeId));

  return (
    <div
      style={{
        position: 'relative',
        padding: '10px 16px 14px',
        background: 'linear-gradient(180deg, #6e4a22 0%, #5a3a18 50%, #3a2010 100%)',
        borderTop: '2px solid #2a1408',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px', borderBottom: '1px solid rgba(255,200,150,.18)' }}>
        <div className="f-han" style={{ fontSize: 20, color: '#f4e9d2', letterSpacing: '.4em', paddingLeft: '.4em' }}>
          药 库
        </div>
        <div style={{ fontSize: 11, color: 'rgba(244,233,210,.7)' }}>
          已 成 <span style={{ color: '#e8b860', fontSize: 14, fontWeight: 600 }}>{collectedIds.size}</span> / {RECIPES.length}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 12, overflowX: 'auto' }}>
        {RECIPES.map((r) => {
          const got = collectedIds.has(r.id);
          const cur = currentQuest?.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => !got && onPickQuest(r.id)}
              style={{
                flex: '0 0 110px',
                height: 116,
                padding: 0,
                appearance: 'none',
                border: 0,
                background: got
                  ? 'linear-gradient(180deg, #f4e9d2 0%, #ecdfc0 60%, #d9c69a 100%)'
                  : 'linear-gradient(180deg, #4a3220 0%, #3a2010 100%)',
                borderRadius: 2,
                cursor: got ? 'default' : 'pointer',
                outline: cur ? '1.5px solid #e8b860' : '1px solid rgba(0,0,0,.4)',
                outlineOffset: -1,
                color: got ? 'var(--ink)' : 'rgba(244,233,210,.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {got && <HerbSvg herb={r.herb} size={44} progress={1} />}
              <div className="f-han" style={{ fontSize: got ? 13 : 11, lineHeight: 1, letterSpacing: '.06em' }}>
                {got ? r.out : '— ? —'}
              </div>
              {cur && !got && (
                <div style={{ fontSize: 9, color: '#e8b860', letterSpacing: '.15em' }}>● 当前</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultModal({ result, onContinue }: { result: ResultState | null; onContinue: () => void }) {
  if (!result) return null;

  const { recipe, quality } = result;
  const grade = quality >= 0.85 ? '上品' : quality >= 0.6 ? '中品' : '下品';
  const gradeColor = grade === '上品' ? 'var(--vermilion)' : grade === '中品' ? 'var(--gold)' : 'var(--ink-faint)';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'rgba(20,12,4,.6)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        animation: 'fade-in .4s',
      }}
    >
      <div
        style={{
          width: 480,
          padding: 40,
          background: 'linear-gradient(180deg, var(--paper) 0%, var(--paper-warm) 50%, var(--paper-dark) 100%)',
          border: '1px solid var(--bronze)',
          borderRadius: 3,
          boxShadow: '0 30px 80px rgba(0,0,0,.55)',
          textAlign: 'center',
        }}
      >
        <div className="f-han" style={{ fontSize: 60, color: 'var(--ink)', letterSpacing: '.12em', paddingLeft: '.12em' }}>
          {recipe.out}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '22px 0 18px' }}>
          <HerbSvg herb={recipe.herb} size={80} progress={1} />
        </div>
        <div className="f-han" style={{ fontSize: 24, color: gradeColor, letterSpacing: '.4em', marginBottom: 10, paddingLeft: '.4em' }}>
          {grade}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 28, fontStyle: 'italic' }}>
          《 {recipe.benefit} 》
        </div>
        <button
          onClick={onContinue}
          style={{
            appearance: 'none',
            border: 0,
            background: 'linear-gradient(180deg, #c8442a, #b9341c 70%, #8b2412)',
            color: '#f4e9d2',
            padding: '11px 44px',
            borderRadius: 2,
            cursor: 'pointer',
            fontFamily: 'Ma Shan Zheng,serif',
            fontSize: 18,
            letterSpacing: '.35em',
            paddingLeft: 'calc(44px + .35em)',
          }}
        >
          入 库
        </button>
      </div>
    </div>
  );
}

// === Workbench Component (Simplified - just progress bar for now) ===
function Workbench({
  session,
  onProgress,
  onComplete,
  onAbort,
}: {
  session: SessionState;
  onProgress: (progress: number, status: 'ok' | 'warn' | 'burn') => void;
  onComplete: () => void;
  onAbort: () => void;
}) {
  const holdRef = useRef(false);
  const type = PROCESSING_TYPES[session.type];

  // Progress animation based on action type
  useEffect(() => {
    let raf: number;
    let last = performance.now();

    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;

      if (holdRef.current && session.progress < 1) {
        const np = Math.min(1, session.progress + dt * 0.15);
        onProgress(np, 'ok');
        if (np >= 1) {
          setTimeout(onComplete, 400);
          return;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [session.progress, onComplete, onProgress]);

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onMouseDown={() => (holdRef.current = true)}
      onMouseUp={() => (holdRef.current = false)}
      onMouseLeave={() => (holdRef.current = false)}
      onTouchStart={() => (holdRef.current = true)}
      onTouchEnd={() => (holdRef.current = false)}
    >
      {/* Vessel display */}
      <VesselSvg vessel={session.vessel} size={200} hot={type.cat.includes('火')} />

      {/* Herb inside */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', opacity: 0.7 }}>
        <HerbSvg herb={session.herb} size={56} progress={session.progress} />
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 60, width: 320 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '.2em', textAlign: 'center', marginBottom: 4 }}>
          {session.status === 'ok' ? '火候适中' : '炮制进度'}
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(40,25,10,.18)', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${session.progress * 100}%`,
              background: 'linear-gradient(90deg, var(--gold), var(--vermilion))',
              transition: 'width .25s',
            }}
          />
        </div>
      </div>

      {/* Abort button */}
      <button
        onClick={onAbort}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          appearance: 'none',
          border: '1px solid var(--frame)',
          background: 'rgba(244,233,210,.7)',
          color: 'var(--ink-soft)',
          padding: '4px 10px',
          borderRadius: 3,
          cursor: 'pointer',
          fontFamily: 'Noto Sans SC,sans-serif',
          fontSize: 11,
        }}
      >
        放弃
      </button>

      {/* Hint */}
      <div style={{ position: 'absolute', top: 12, left: 12, padding: '6px 12px', fontSize: 12, color: 'var(--ink-soft)', background: 'rgba(244,233,210,.7)', borderRadius: 3 }}>
        <span className="f-han" style={{ fontSize: 16, marginRight: 8, color: 'var(--vermilion)' }}>{type.name}</span>
        长按进行炮制
      </div>
    </div>
  );
}