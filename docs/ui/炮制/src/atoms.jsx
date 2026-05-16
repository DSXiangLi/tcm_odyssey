/* ──────────────────────────────────────────────────────────────
 * atoms.jsx — Reusable SVG drawings for herbs, vessels, ingredients
 * ────────────────────────────────────────────────────────────── */

// === Herb SVGs — drawn parametrically with state-driven color ===
function HerbSvg({ herb, progress = 0, size = 64, scattered = false }) {
  const { HERBS } = window.PaozhiData;
  const h = HERBS[herb] || HERBS.danggui;
  // Interpolate raw → done color by progress (0..1)
  const c = lerpColor(h.raw, h.done, progress);
  const charred = progress > 0.92;
  const cChar = charred ? lerpColor(c, "#1a0a05", (progress - 0.92) * 12) : c;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: "visible" }}>
      {renderHerbShape(h.form, cChar, h, scattered)}
    </svg>
  );
}

function renderHerbShape(form, color, h, scattered) {
  const dark = shade(color, -0.35);
  const light = shade(color, 0.18);
  switch (form) {
    case "root":
      return (
        <g>
          <path d={`M16 8 C 22 14, 18 22, 22 32 C 26 42, 20 52, 28 58 C 32 60, 36 56, 38 50
                    C 40 42, 44 36, 46 28 C 48 20, 44 12, 36 10 C 28 8, 22 6, 16 8 Z`}
                fill={color} stroke={dark} strokeWidth="0.8" />
          <path d="M22 18 Q 28 22, 34 20 M 26 32 Q 32 36, 40 32 M 24 44 Q 30 48, 36 46"
                stroke={dark} strokeWidth="0.6" fill="none" opacity=".55" />
          <path d="M30 6 Q 26 2, 22 4 M 38 10 Q 42 6, 46 8" stroke={dark} strokeWidth="1" fill="none" opacity=".6" />
        </g>
      );
    case "tuber":
      return (
        <g>
          <ellipse cx="32" cy="34" rx="20" ry="22" fill={color} stroke={dark} strokeWidth="0.8" />
          <ellipse cx="26" cy="28" rx="6" ry="4" fill={light} opacity=".5" />
          <circle cx="38" cy="42" r="1.5" fill={dark} opacity=".4" />
          <circle cx="22" cy="44" r="1" fill={dark} opacity=".4" />
        </g>
      );
    case "shell":
      return (
        <g>
          <path d={`M8 32 Q 12 12, 32 10 Q 52 12, 56 32 Q 54 50, 32 54 Q 10 50, 8 32 Z`}
                fill={color} stroke={dark} strokeWidth="0.8" />
          <path d="M14 30 Q 20 18, 32 16 M 18 36 Q 26 24, 36 22 M 22 42 Q 30 32, 42 30 M 28 48 Q 36 40, 46 38"
                stroke={dark} strokeWidth="0.5" fill="none" opacity=".6" />
        </g>
      );
    case "stone":
      return (
        <g>
          <path d="M14 20 L 28 8 L 50 14 L 56 36 L 44 56 L 18 52 L 8 36 Z"
                fill={color} stroke={dark} strokeWidth="0.8" />
          <path d="M26 14 L 38 22 L 30 36 Z" fill={light} opacity=".4" />
          <path d="M40 30 L 50 32 L 46 44 Z" fill={dark} opacity=".25" />
        </g>
      );
    case "slice":
      return (
        <g>
          <ellipse cx="32" cy="32" rx="22" ry="8" fill={color} stroke={dark} strokeWidth="0.8" />
          <ellipse cx="32" cy="30" rx="22" ry="8" fill="none" stroke={dark} strokeWidth="0.5" opacity=".5" />
          <ellipse cx="32" cy="30" rx="14" ry="4" fill={light} opacity=".4" />
        </g>
      );
    case "block":
      return (
        <g>
          <rect x="10" y="14" width="44" height="38" rx="2" fill={color} stroke={dark} strokeWidth="0.8" />
          <path d="M10 22 L 54 22 M 10 32 L 54 32 M 10 42 L 54 42" stroke={dark} strokeWidth="0.4" opacity=".4" />
        </g>
      );
    default:
      return <circle cx="32" cy="32" r="22" fill={color} stroke={dark} strokeWidth="0.8" />;
  }
}

// === Color helpers ===
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex([r, g, b]) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function lerpColor(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const ra = hexToRgb(a), rb = hexToRgb(b);
  return rgbToHex([ra[0] + (rb[0] - ra[0]) * t, ra[1] + (rb[1] - ra[1]) * t, ra[2] + (rb[2] - ra[2]) * t]);
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  if (amt > 0) return rgbToHex([r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt]);
  return rgbToHex([r * (1 + amt), g * (1 + amt), b * (1 + amt)]);
}

// === Ingredient bottle / packet ===
function IngredientIcon({ ing, size = 56 }) {
  const { INGREDIENTS } = window.PaozhiData;
  const I = INGREDIENTS[ing] || INGREDIENTS.shui;
  if (I.icon === "liquid") {
    return (
      <svg width={size} height={size * 1.2} viewBox="0 0 56 68">
        {/* clay bottle */}
        <path d="M22 8 L 34 8 L 34 14 L 38 18 L 38 58 Q 38 64, 32 64 L 24 64 Q 18 64, 18 58 L 18 18 L 22 14 Z"
              fill="#8a5a2a" stroke="#3a2010" strokeWidth="1" />
        <path d="M22 8 L 34 8 L 34 14 L 22 14 Z" fill="#3a2010" />
        <ellipse cx="28" cy="40" rx="8" ry="3" fill={I.color} opacity=".85" />
        <rect x="22" y="44" width="12" height="14" fill={I.color} opacity=".25" />
        <text x="28" y="36" fontSize="8" fill="#f4e9d2" fontFamily="Ma Shan Zheng,serif" textAnchor="middle">{I.name[0]}</text>
      </svg>
    );
  }
  if (I.icon === "powder") {
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        {/* paper packet */}
        <path d="M8 12 L 48 12 L 44 48 L 12 48 Z" fill="#e8dcc4" stroke="#6e4a22" strokeWidth="1" />
        <path d="M8 12 L 28 22 L 48 12" stroke="#6e4a22" strokeWidth="1" fill="none" />
        <circle cx="20" cy="34" r="1.5" fill={I.color} />
        <circle cx="28" cy="38" r="1.2" fill={I.color} />
        <circle cx="34" cy="32" r="1.5" fill={I.color} />
        <circle cx="24" cy="40" r="1" fill={I.color} />
        <text x="28" y="30" fontSize="9" fill="#6e4a22" fontFamily="Ma Shan Zheng,serif" textAnchor="middle">{I.name}</text>
      </svg>
    );
  }
  // paper
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <path d="M10 8 L 46 8 L 46 48 L 10 48 Z" fill="#f4e9d2" stroke="#8a6638" strokeWidth="1" />
      <path d="M14 14 L 42 14 M 14 20 L 42 20 M 14 26 L 38 26" stroke="#8a6638" strokeWidth="0.5" opacity=".5" />
    </svg>
  );
}

// === Vessel SVGs (large, for workstation) ===
function VesselSvg({ vessel, size = 200, hot = false, contents = null }) {
  const W = size, H = size;
  switch (vessel) {
    case "wok": return <Wok w={W} h={H} hot={hot} />;
    case "crucible": return <Crucible w={W} h={H} hot={hot} />;
    case "basin": return <Basin w={W} h={H} />;
    case "board": return <Board w={W} h={H} />;
    case "ash": return <Ash w={W} h={H} hot={hot} />;
    case "steamer": return <Steamer w={W} h={H} hot={hot} />;
    case "pot": return <Pot w={W} h={H} hot={hot} />;
    case "jar": return <Jar w={W} h={H} />;
    default: return null;
  }
}

function Wok({ w, h, hot }) {
  return (
    <svg width={w} height={h} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      {/* heat glow */}
      {hot && <ellipse cx="100" cy="160" rx="80" ry="14" fill="url(#wokGlow)" opacity=".7">
        <animate attributeName="opacity" values=".5;.85;.5" dur="1.6s" repeatCount="indefinite" />
      </ellipse>}
      <defs>
        <radialGradient id="wokGlow"><stop offset="0%" stopColor="#ff6a1a" stopOpacity=".9"/><stop offset="100%" stopColor="#b9341c" stopOpacity="0"/></radialGradient>
        <linearGradient id="wokBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a4830"/><stop offset="50%" stopColor="#2a1a10"/><stop offset="100%" stopColor="#1a0e08"/>
        </linearGradient>
        <radialGradient id="wokInner" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#3a2818"/><stop offset="100%" stopColor="#0e0604"/>
        </radialGradient>
      </defs>
      {/* outer rim */}
      <ellipse cx="100" cy="80" rx="92" ry="22" fill="#1a0e08" />
      <ellipse cx="100" cy="78" rx="92" ry="22" fill="url(#wokBody)" />
      {/* bowl */}
      <path d="M8 80 Q 100 200, 192 80 Q 100 110, 8 80 Z" fill="url(#wokBody)" />
      {/* inner */}
      <ellipse cx="100" cy="80" rx="86" ry="18" fill="url(#wokInner)" />
      {/* highlight */}
      <ellipse cx="80" cy="75" rx="32" ry="4" fill="#8a6038" opacity=".4" />
      {/* handles */}
      <circle cx="6" cy="78" r="6" fill="#3a2818" stroke="#1a0e08" />
      <circle cx="194" cy="78" r="6" fill="#3a2818" stroke="#1a0e08" />
    </svg>
  );
}

function Crucible({ w, h, hot }) {
  const heat = hot ? 1 : 0;
  const bodyColor = lerpColor("#3a2818", "#ff4a1a", heat);
  return (
    <svg width={w} height={h} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="crucGlow"><stop offset="0%" stopColor="#fff080" stopOpacity=".9"/><stop offset="60%" stopColor="#ff4a1a" stopOpacity=".5"/><stop offset="100%" stopColor="#b9341c" stopOpacity="0"/></radialGradient>
        <linearGradient id="crucBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(bodyColor,.2)}/><stop offset="100%" stopColor={shade(bodyColor,-.4)}/>
        </linearGradient>
      </defs>
      {hot && <ellipse cx="100" cy="120" rx="100" ry="50" fill="url(#crucGlow)">
        <animate attributeName="opacity" values=".7;1;.7" dur="1.2s" repeatCount="indefinite" />
      </ellipse>}
      {/* tripod legs */}
      <path d="M40 180 L 60 130 L 50 180 Z" fill={shade(bodyColor,-.4)} />
      <path d="M160 180 L 140 130 L 150 180 Z" fill={shade(bodyColor,-.4)} />
      <path d="M100 190 L 100 130 L 110 190 Z" fill={shade(bodyColor,-.5)} />
      {/* body */}
      <path d="M40 60 L 50 140 Q 100 160, 150 140 L 160 60 Q 100 80, 40 60 Z" fill="url(#crucBody)" stroke="#1a0e08" strokeWidth="1.5" />
      {/* rim */}
      <ellipse cx="100" cy="60" rx="60" ry="10" fill={shade(bodyColor,-.3)} />
      <ellipse cx="100" cy="60" rx="60" ry="10" fill="none" stroke="#1a0e08" strokeWidth="1.5" />
      <ellipse cx="100" cy="58" rx="56" ry="8" fill={hot ? "#ffae40" : "#1a0e08"}>
        {hot && <animate attributeName="fill" values="#ffae40;#ff6020;#ffae40" dur="1.5s" repeatCount="indefinite"/>}
      </ellipse>
    </svg>
  );
}

function Basin({ w, h }) {
  return (
    <svg width={w} height={h} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="basinBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8825a"/><stop offset="100%" stopColor="#5a3a20"/>
        </linearGradient>
        <radialGradient id="water" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#bdd9e4"/><stop offset="100%" stopColor="#5a8a9a"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="90" rx="92" ry="22" fill="#5a3a20" />
      <ellipse cx="100" cy="88" rx="92" ry="22" fill="url(#basinBody)" />
      <path d="M14 90 Q 100 180, 186 90 Q 100 115, 14 90 Z" fill="url(#basinBody)" />
      <ellipse cx="100" cy="90" rx="86" ry="18" fill="url(#water)">
        <animate attributeName="ry" values="18;19;18" dur="3s" repeatCount="indefinite" />
      </ellipse>
      {/* ripples */}
      <ellipse cx="100" cy="90" rx="50" ry="10" fill="none" stroke="#fff" strokeWidth="0.8" opacity=".3">
        <animate attributeName="rx" values="20;70;20" dur="3.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".5;0;.5" dur="3.5s" repeatCount="indefinite"/>
      </ellipse>
    </svg>
  );
}

function Board({ w, h }) {
  return (
    <svg width={w} height={h} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="boardBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a878"/><stop offset="100%" stopColor="#8a6638"/>
        </linearGradient>
      </defs>
      {/* board */}
      <rect x="20" y="80" width="160" height="80" rx="4" fill="url(#boardBody)" stroke="#3a2010" strokeWidth="1.5" />
      {/* wood grain */}
      <path d="M25 95 Q 100 92, 175 96 M 25 110 Q 100 108, 175 112 M 25 130 Q 100 128, 175 132 M 25 145 Q 100 143, 175 147"
            stroke="#6a4828" strokeWidth="0.6" fill="none" opacity=".5" />
      {/* knife rest */}
      <rect x="20" y="155" width="160" height="6" fill="#5a3a20" />
    </svg>
  );
}

function Ash({ w, h, hot }) {
  return (
    <svg width={w} height={h} viewBox="0 0 200 200">
      <defs>
        <radialGradient id="ashGlow"><stop offset="0%" stopColor="#ff8a30" stopOpacity=".7"/><stop offset="100%" stopColor="#b9341c" stopOpacity="0"/></radialGradient>
      </defs>
      {hot && <ellipse cx="100" cy="130" rx="80" ry="20" fill="url(#ashGlow)">
        <animate attributeName="opacity" values=".5;.9;.5" dur="2s" repeatCount="indefinite"/>
      </ellipse>}
      {/* basin */}
      <ellipse cx="100" cy="100" rx="92" ry="20" fill="#3a2010" />
      <path d="M14 100 Q 100 180, 186 100 L 180 110 Q 100 175, 20 110 Z" fill="#5a3a20" />
      {/* ash */}
      <ellipse cx="100" cy="100" rx="86" ry="16" fill="#a89888" />
      {/* glowing embers */}
      {hot && [...Array(8)].map((_, i) => {
        const x = 40 + (i * 18);
        const y = 96 + (i % 3) * 4;
        return <circle key={i} cx={x} cy={y} r="2" fill="#ff6020" opacity=".8">
          <animate attributeName="opacity" values=".4;1;.4" dur={`${1+i*0.2}s`} repeatCount="indefinite"/>
        </circle>;
      })}
    </svg>
  );
}

function Steamer({ w, h, hot }) {
  return (
    <svg width={w} height={h} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="stmBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a87848"/><stop offset="100%" stopColor="#5a3a18"/>
        </linearGradient>
      </defs>
      {/* base pot */}
      <ellipse cx="100" cy="170" rx="80" ry="14" fill="#3a2010"/>
      <path d="M30 110 L 30 170 Q 100 184, 170 170 L 170 110 Q 100 124, 30 110 Z" fill="url(#stmBody)" stroke="#3a2010"/>
      {/* steamer body */}
      <ellipse cx="100" cy="100" rx="82" ry="14" fill="#3a2010"/>
      <path d="M18 60 L 22 104 Q 100 118, 178 104 L 182 60 Q 100 76, 18 60 Z" fill="url(#stmBody)" stroke="#3a2010" strokeWidth="1.2"/>
      {/* lid */}
      <path d="M22 60 Q 100 40, 178 60 Q 178 50, 100 32 Q 22 50, 22 60 Z" fill="#6a4828" stroke="#3a2010" strokeWidth="1.2"/>
      <ellipse cx="100" cy="34" rx="14" ry="4" fill="#3a2010"/>
      <rect x="94" y="26" width="12" height="10" rx="2" fill="#5a3a20"/>
      {/* steam vents */}
      {hot && [...Array(5)].map((_, i) => (
        <circle key={i} cx={50 + i*25} cy={50} r="2" fill="#3a2010" opacity=".5"/>
      ))}
    </svg>
  );
}

function Pot({ w, h, hot }) {
  return (
    <svg width={w} height={h} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="potBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8784a"/><stop offset="100%" stopColor="#5a3818"/>
        </linearGradient>
        <radialGradient id="potLiquid" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#c9a063"/><stop offset="100%" stopColor="#6a4020"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="80" rx="86" ry="16" fill="#3a2010"/>
      <path d="M14 80 Q 14 170, 100 178 Q 186 170, 186 80 Q 100 96, 14 80 Z" fill="url(#potBody)" stroke="#3a2010" strokeWidth="1.2"/>
      <ellipse cx="100" cy="80" rx="80" ry="13" fill="url(#potLiquid)">
        {hot && <animate attributeName="ry" values="13;14;13" dur="1.2s" repeatCount="indefinite"/>}
      </ellipse>
      {/* spout */}
      <path d="M180 80 Q 196 78, 200 70 Q 198 84, 184 88 Z" fill="url(#potBody)" stroke="#3a2010"/>
      {/* handles */}
      <ellipse cx="14" cy="100" rx="6" ry="14" fill="none" stroke="#3a2010" strokeWidth="3"/>
    </svg>
  );
}

function Jar({ w, h }) {
  return (
    <svg width={w} height={h} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="jarBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6038"/><stop offset="50%" stopColor="#5a3818"/><stop offset="100%" stopColor="#3a2010"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="40" rx="40" ry="8" fill="#2a1408"/>
      <path d="M60 40 L 40 80 Q 30 130, 50 170 Q 100 184, 150 170 Q 170 130, 160 80 L 140 40 Q 100 50, 60 40 Z"
            fill="url(#jarBody)" stroke="#1a0a04" strokeWidth="1.5"/>
      {/* lid (paper seal) */}
      <ellipse cx="100" cy="38" rx="42" ry="6" fill="#e8dcc4" stroke="#8a6038"/>
      <path d="M70 36 L 130 36" stroke="#b9341c" strokeWidth="3" opacity=".7"/>
      <text x="100" y="40" fontSize="8" fill="#b9341c" fontFamily="Ma Shan Zheng,serif" textAnchor="middle" opacity=".8">封</text>
      {/* shine */}
      <ellipse cx="78" cy="100" rx="6" ry="30" fill="#fff" opacity=".15"/>
    </svg>
  );
}

// === Particle component for effects ===
function Particles({ kind, count = 12, w = 200, h = 200, ...rest }) {
  const items = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    i, x: 20 + Math.random() * (w - 40), delay: Math.random() * 2, dur: 1.5 + Math.random() * 2,
    size: 2 + Math.random() * 3, drift: -10 + Math.random() * 20,
  })), [count, w, h]);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      {items.map(p => <Particle key={p.i} kind={kind} {...p} h={h} {...rest} />)}
    </div>
  );
}

function Particle({ kind, x, h, delay, dur, size, drift }) {
  const colors = {
    smoke: "rgba(180,160,140,.45)",
    steam: "rgba(255,255,255,.55)",
    spark: "#ffae40",
    bubble: "rgba(220,200,150,.6)",
    dust: "rgba(180,140,80,.4)",
  };
  const c = colors[kind] || "rgba(255,255,255,.5)";
  const isSpark = kind === "spark";
  return (
    <div style={{
      position: "absolute", left: x, bottom: 30,
      width: size, height: size, borderRadius: "50%",
      background: c,
      filter: isSpark ? "blur(0.5px)" : "blur(2px)",
      boxShadow: isSpark ? `0 0 ${size*3}px ${size}px rgba(255,140,40,.6)` : "none",
      animation: `pt-rise ${dur}s ${delay}s ease-out infinite`,
      "--drift": `${drift}px`, "--rise": `${h - 30}px`,
    }} />
  );
}

// inject particle keyframes once
(function injectAnims(){
  if (document.getElementById("__paozhi_anims")) return;
  const s = document.createElement("style");
  s.id = "__paozhi_anims";
  s.textContent = `
    @keyframes pt-rise {
      0% { transform: translate(0,0) scale(.4); opacity: 0; }
      15% { opacity: 1; }
      100% { transform: translate(var(--drift), calc(-1 * var(--rise))) scale(1.6); opacity: 0; }
    }
    @keyframes pulse-soft { 0%,100% { transform: scale(1);} 50% { transform: scale(1.04);} }
    @keyframes shake-tiny { 0%,100% { transform: translate(0,0) rotate(0);} 25%{transform:translate(-1px,1px) rotate(-.4deg);} 75%{transform:translate(1px,-1px) rotate(.4deg);} }
    @keyframes float-up { 0% { transform: translateY(8px); opacity: 0;} 100% { transform: translateY(0); opacity: 1;} }
    @keyframes glow-pulse { 0%,100% { filter: drop-shadow(0 0 8px rgba(255,140,40,.4));} 50% { filter: drop-shadow(0 0 24px rgba(255,200,80,.85));} }
    @keyframes scroll-unfurl { 0% { transform: scaleY(0); opacity: 0;} 100% { transform: scaleY(1); opacity: 1;} }
    @keyframes herb-tumble {
      0% { transform: translateY(0) rotate(0deg);}
      50% { transform: translateY(-8px) rotate(180deg);}
      100% { transform: translateY(0) rotate(360deg);}
    }
    @keyframes fade-in { from { opacity: 0; transform: translateY(6px);} to {opacity: 1; transform: translateY(0);} }
    @keyframes slice-flash { 0% { transform: translateX(-40px) rotate(-30deg); opacity: 0;} 30%{opacity:1;} 100% { transform: translateX(40px) rotate(15deg); opacity: 0;} }
  `;
  document.head.appendChild(s);
})();

Object.assign(window, { HerbSvg, IngredientIcon, VesselSvg, Particles, lerpColor, shade });
