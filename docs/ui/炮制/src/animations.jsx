/* ──────────────────────────────────────────────────────────────
 * animations.jsx — Per-method processing animations
 * Drives the workbench center stage. Each method has its own:
 *  - vessel
 *  - interaction (rhythm tap, hold-charge, wrap, wait)
 *  - visual signature (smoke, steam, sparks, bubbles, glow, etc)
 * ────────────────────────────────────────────────────────────── */

// === Workbench: shows active vessel + herb-in-vessel + interaction overlay ===
function Workbench({ session, onProgress, onComplete, onAbort }) {
  // session = { vessel, herb, adjuvants:[], type, progress 0..1, charge 0..1, taps, status }
  if (!session) return <EmptyBench />;

  const { PROCESSING_TYPES } = window.PaozhiData;
  const type = PROCESSING_TYPES[session.type];

  return (
    <div style={{
      flex: 1, position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {/* Background table surface */}
      <TableSurface />

      {/* Center stage by type */}
      <div style={{ position: "relative", width: 480, height: 360, display: "grid", placeItems: "center" }}>
        {session.type === "qie"    && <QieStage    session={session} onProgress={onProgress} onComplete={onComplete} />}
        {session.type === "pao"    && <PaoStage    session={session} onProgress={onProgress} onComplete={onComplete} />}
        {session.type === "chao"   && <ChaoStage   session={session} onProgress={onProgress} onComplete={onComplete} kind="chao" />}
        {session.type === "zhi"    && <ChaoStage   session={session} onProgress={onProgress} onComplete={onComplete} kind="zhi" />}
        {session.type === "duan"   && <DuanStage   session={session} onProgress={onProgress} onComplete={onComplete} />}
        {session.type === "wei"    && <WeiStage    session={session} onProgress={onProgress} onComplete={onComplete} />}
        {session.type === "zheng"  && <ZhengStage  session={session} onProgress={onProgress} onComplete={onComplete} />}
        {session.type === "zhu"    && <ZhuStage    session={session} onProgress={onProgress} onComplete={onComplete} />}
        {session.type === "cui"    && <CuiStage    session={session} onProgress={onProgress} onComplete={onComplete} />}
        {session.type === "fajiao" && <FaJiaoStage session={session} onProgress={onProgress} onComplete={onComplete} />}
      </div>

      {/* Hint label */}
      <div style={{
        position: "absolute", top: 12, left: 12,
        padding: "6px 12px",
        fontSize: 12, color: "var(--ink-soft)",
        background: "rgba(244,233,210,.7)", borderRadius: 3,
        border: "1px solid var(--frame)",
        fontFamily: "Noto Sans SC,sans-serif",
        backdropFilter: "blur(4px)",
      }}>
        <span className="f-han" style={{ fontSize: 16, marginRight: 8, color: "var(--vermilion)" }}>{type.name}</span>
        {hintText(type.action, session.type)}
      </div>

      {/* Progress bar */}
      <ProgressBar progress={session.progress} status={session.status} />

      {/* Abort */}
      <button onClick={onAbort} style={{
        position: "absolute", top: 12, right: 12,
        appearance: "none", border: "1px solid var(--frame)",
        background: "rgba(244,233,210,.7)", color: "var(--ink-soft)",
        padding: "4px 10px", borderRadius: 3, cursor: "pointer",
        fontFamily: "Noto Sans SC,sans-serif", fontSize: 11,
      }}>放弃</button>
    </div>
  );
}

function hintText(action, type) {
  if (type === "qie")    return "节奏点击 · 落刀切片";
  if (type === "pao")    return "长按浸润 · 待药材吸足水";
  if (type === "chao")   return "节奏翻炒 · 火候要稳";
  if (type === "zhi")    return "辅料拌匀 · 节奏翻炒";
  if (type === "duan")   return "长按蓄火 · 烧至通赤";
  if (type === "wei")    return "湿纸包裹 · 灰火慢煨";
  if (type === "zheng")  return "蒸气升腾 · 长按守火";
  if (type === "zhu")    return "煮沸三遍 · 长按守候";
  if (type === "cui")    return "煅红投醋 · 一击淬之";
  if (type === "fajiao") return "封瓮静候 · 曲菌发力";
  return "";
}

function EmptyBench() {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--ink-faint)", textAlign: "center" }}>
      <div>
        <div className="f-han" style={{ fontSize: 28, marginBottom: 8, color: "var(--ink-soft)" }}>炮 制 工 坊</div>
        <div style={{ fontSize: 13, lineHeight: 1.8, fontFamily: "Noto Serif SC,serif" }}>
          ① 自下方拖拽生药材至工作台<br/>
          ② 拖拽辅料配伍 &nbsp; ③ 自左侧选取相应器皿<br/>
          ④ 依方炮制，得地道饮片
        </div>
      </div>
    </div>
  );
}

function TableSurface() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background:
        "radial-gradient(ellipse at 50% 90%, rgba(110,74,34,.18) 0%, transparent 60%)," +
        "linear-gradient(180deg, transparent 60%, rgba(110,74,34,.12) 100%)",
      pointerEvents: "none",
    }} />
  );
}

function ProgressBar({ progress, status }) {
  const pct = Math.round(progress * 100);
  return (
    <div style={{
      position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
      width: 320, display: "flex", flexDirection: "column", gap: 4, alignItems: "center",
    }}>
      <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: ".2em", fontFamily: "Noto Sans SC,sans-serif" }}>
        {status === "ok" ? "火候适中" : status === "warn" ? "火候偏旺" : status === "burn" ? "已焦" : "炮 制 进 度"}
      </div>
      <div style={{ width: "100%", height: 6, background: "rgba(40,25,10,.18)", borderRadius: 3, overflow: "hidden", border: "1px solid var(--frame)" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: status === "burn" ? "#3a1a08" : status === "warn" ? "#e8804a" : "linear-gradient(90deg, var(--gold), var(--vermilion))",
          transition: "width .25s, background .3s",
        }} />
      </div>
    </div>
  );
}

// ───────────────────────── 切制 (Qie) — Cutting ─────────────────────────
function QieStage({ session, onProgress, onComplete }) {
  const [flash, setFlash] = React.useState(0);
  const slices = Math.min(8, Math.floor(session.progress * 8));

  const tap = () => {
    if (session.progress >= 1) return;
    setFlash(f => f + 1);
    onProgress(Math.min(1, session.progress + 0.14), "ok", { sliced: true });
    if (session.progress + 0.14 >= 1) setTimeout(() => onComplete(), 350);
  };

  return (
    <div style={{ position: "relative", width: 480, height: 360, cursor: "pointer" }} onClick={tap}>
      <div style={{ position: "absolute", left: 60, top: 100 }}>
        <VesselSvg vessel="board" size={360} />
      </div>
      {/* Whole herb fading as slices grow */}
      <div style={{ position: "absolute", left: 200, top: 160, opacity: 1 - session.progress * 0.7 }}>
        <HerbSvg herb={session.herb} size={84} />
      </div>
      {/* Slices appearing */}
      {[...Array(slices)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: 100 + (i % 4) * 56 + (i >= 4 ? 28 : 0),
          top: 240 + Math.floor(i / 4) * 26,
          animation: "fade-in .3s",
        }}>
          <svg width={42} height={18} viewBox="0 0 42 18">
            <ellipse cx="21" cy="9" rx="20" ry="7" fill={window.PaozhiData.HERBS[session.herb].raw} stroke="#6a4828" strokeWidth=".6" />
            <ellipse cx="21" cy="8" rx="18" ry="5" fill={window.shade(window.PaozhiData.HERBS[session.herb].raw, .15)} opacity=".6" />
          </svg>
        </div>
      ))}
      {/* Knife flash */}
      <div key={"k"+flash} style={{
        position: "absolute", left: 220, top: 130,
        animation: "slice-flash .35s ease-out",
        transformOrigin: "center",
        pointerEvents: "none",
      }}>
        <svg width={120} height={60} viewBox="0 0 120 60">
          <path d="M10 40 L 100 12 L 110 18 L 18 50 Z" fill="#c8c4be" stroke="#3a3028" strokeWidth="1" />
          <rect x="0" y="36" width="22" height="14" rx="2" fill="#3a2010" />
          <path d="M10 40 L 100 12" stroke="#fff" strokeWidth="1" opacity=".7" />
        </svg>
      </div>
      {/* dust puffs on tap */}
      {flash > 0 && <div key={"d"+flash} style={{ position: "absolute", left: 180, top: 180, animation: "fade-in .5s" }}>
        <Particles kind="dust" count={6} w={120} h={60} />
      </div>}
    </div>
  );
}

// ───────────────────────── 浸泡 (Pao) — Soaking ─────────────────────────
function PaoStage({ session, onProgress, onComplete }) {
  const holdRef = React.useRef(false);
  React.useEffect(() => {
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (holdRef.current && session.progress < 1) {
        const np = Math.min(1, session.progress + dt * 0.22);
        onProgress(np, "ok");
        if (np >= 1) { setTimeout(onComplete, 400); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [session.progress]);

  return (
    <div style={{ position: "relative", width: 480, height: 360 }}
      onMouseDown={() => holdRef.current = true}
      onMouseUp={() => holdRef.current = false}
      onMouseLeave={() => holdRef.current = false}
      onTouchStart={() => holdRef.current = true}
      onTouchEnd={() => holdRef.current = false}
    >
      <div style={{ position: "absolute", left: 140, top: 80 }}>
        <VesselSvg vessel="basin" size={200} />
      </div>
      {/* Submerged herb — bobs slightly */}
      <div style={{ position: "absolute", left: 220, top: 140,
        animation: "pulse-soft 3s ease-in-out infinite",
        opacity: 0.95, filter: `saturate(${1 - session.progress * 0.4}) brightness(${1 - session.progress * 0.15})` }}>
        <HerbSvg herb={session.herb} size={56} progress={session.progress * 0.3} />
      </div>
      {/* Bubbles */}
      <div style={{ position: "absolute", left: 160, top: 100, width: 180, height: 80 }}>
        <Particles kind="bubble" count={8} w={180} h={60} />
      </div>
      {/* Hint */}
      <div style={{ position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
        fontSize: 11, color: "var(--ink-faint)", fontFamily: "Noto Sans SC,sans-serif" }}>
        {holdRef.current ? "浸润中…" : "按住盆 · 浸润药材"}
      </div>
    </div>
  );
}

// ───────────────────────── 炒 / 炙 (Chao / Zhi) — Frying ─────────────────────────
// HIGH-FIDELITY animation: rhythm tap, herbs tumble, color progression, smoke
function ChaoStage({ session, onProgress, onComplete, kind }) {
  const [tumble, setTumble] = React.useState(0);
  const [tapCount, setTapCount] = React.useState(0);
  const [lastTap, setLastTap] = React.useState(0);

  const onStir = () => {
    if (session.progress >= 1) return;
    const now = performance.now();
    const dt = now - lastTap;
    setLastTap(now);
    setTumble(t => t + 1);
    setTapCount(c => c + 1);

    // good rhythm = 350-700ms between taps
    let inc = 0.085;
    let status = "ok";
    if (dt < 220) { inc = 0.04; status = "warn"; }      // too fast → not enough heat exposure
    else if (dt > 1500) { inc = 0.04; status = "warn"; } // too slow → burning risk

    const np = Math.min(1, session.progress + inc);
    if (np > 0.95) status = "ok";
    onProgress(np, status, { stirred: true });
    if (np >= 1) setTimeout(onComplete, 450);
  };

  const isZhi = kind === "zhi";
  const adj = session.adjuvants[0] || "jiu";
  const adjColor = window.PaozhiData.INGREDIENTS[adj]?.color || "#a3522a";

  return (
    <div style={{ position: "relative", width: 480, height: 360, cursor: "pointer" }} onClick={onStir}>
      {/* fire underneath */}
      <FireGlow intensity={Math.min(1, 0.5 + tapCount * 0.05)} />

      <div style={{ position: "absolute", left: 140, top: 90 }}>
        <VesselSvg vessel="wok" size={200} hot={true} />
      </div>

      {/* liquid coating shimmer for 炙 */}
      {isZhi && (
        <div style={{
          position: "absolute", left: 175, top: 145, width: 130, height: 24,
          background: `radial-gradient(ellipse, ${adjColor}aa 0%, ${adjColor}33 60%, transparent 100%)`,
          borderRadius: "50%", filter: "blur(2px)",
          animation: "pulse-soft 1.4s ease-in-out infinite",
        }} />
      )}

      {/* Tumbling herbs in wok (3 pieces) */}
      {[
        { x: 200, y: 140, d: 0 },
        { x: 230, y: 150, d: 0.3 },
        { x: 260, y: 138, d: 0.6 },
      ].map((p, i) => (
        <div key={i+"-"+tumble} style={{
          position: "absolute", left: p.x, top: p.y,
          animation: `herb-tumble ${0.5 + p.d * 0.2}s ease-out`,
          animationFillMode: "both",
        }}>
          <HerbSvg herb={session.herb} size={36} progress={session.progress} />
        </div>
      ))}

      {/* Smoke */}
      <div style={{ position: "absolute", left: 150, top: 60, width: 180, height: 100, pointerEvents: "none" }}>
        <Particles kind="smoke" count={8 + Math.floor(session.progress * 8)} w={180} h={100} />
      </div>

      {/* sparks at high progress */}
      {session.progress > 0.6 && (
        <div style={{ position: "absolute", left: 170, top: 130, width: 140, height: 40, pointerEvents: "none" }}>
          <Particles kind="spark" count={4} w={140} h={40} />
        </div>
      )}

      {/* Spatula icon hint */}
      <div style={{ position: "absolute", right: 60, top: 130, opacity: .55,
        animation: "shake-tiny .5s ease-in-out infinite" }}>
        <svg width={80} height={120} viewBox="0 0 80 120">
          <rect x="34" y="10" width="6" height="80" fill="#5a3a20" rx="2" />
          <ellipse cx="37" cy="100" rx="22" ry="14" fill="#8a6038" stroke="#3a2010" strokeWidth="1" />
        </svg>
      </div>

      {/* tap rings */}
      <RippleAt key={tumble} x={240} y={170} />
    </div>
  );
}

function FireGlow({ intensity = 0.7 }) {
  return (
    <div style={{
      position: "absolute", left: 100, bottom: 60, width: 280, height: 80,
      background: `radial-gradient(ellipse, rgba(255,170,40,${intensity*.7}) 0%, rgba(255,80,30,${intensity*.4}) 40%, transparent 75%)`,
      filter: "blur(8px)",
      animation: "pulse-soft 1.2s ease-in-out infinite",
      pointerEvents: "none",
    }}>
      {/* flame tongues */}
      {[...Array(7)].map((_,i)=>(
        <div key={i} style={{
          position:"absolute", left: 30 + i*32, bottom: 10,
          width: 12, height: 30 + (i%3)*8, borderRadius: "50% 50% 30% 30%",
          background: "linear-gradient(180deg, #ffe080, #ff6020 60%, #b9341c)",
          filter: "blur(1.5px)", opacity: .8,
          animation: `pulse-soft ${0.4 + (i%3)*0.15}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function RippleAt({ x, y }) {
  return (
    <div style={{
      position: "absolute", left: x - 30, top: y - 30, width: 60, height: 60,
      borderRadius: "50%", border: "2px solid rgba(255,200,80,.8)",
      animation: "ripple .6s ease-out forwards",
      pointerEvents: "none",
    }}>
      <style>{`@keyframes ripple { 0%{transform:scale(.3);opacity:1;} 100%{transform:scale(2);opacity:0;} }`}</style>
    </div>
  );
}

// ───────────────────────── 煅 (Duan) — Calcining ─────────────────────────
// HIGH-FIDELITY: long-press hold-charge with intense glow, herb turns calcined-white
function DuanStage({ session, onProgress, onComplete }) {
  const holdRef = React.useRef(false);
  const [held, setHeld] = React.useState(false);
  React.useEffect(() => {
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (holdRef.current && session.progress < 1) {
        const np = Math.min(1, session.progress + dt * 0.18);
        const status = np > 0.95 ? "warn" : "ok";
        onProgress(np, status);
        if (np >= 1) { setTimeout(onComplete, 600); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [session.progress]);

  const heat = session.progress;

  return (
    <div style={{ position: "relative", width: 480, height: 360 }}
      onMouseDown={() => { holdRef.current = true; setHeld(true); }}
      onMouseUp={() => { holdRef.current = false; setHeld(false); }}
      onMouseLeave={() => { holdRef.current = false; setHeld(false); }}
      onTouchStart={() => { holdRef.current = true; setHeld(true); }}
      onTouchEnd={() => { holdRef.current = false; setHeld(false); }}
    >
      {/* huge bellows-driven fire */}
      <div style={{
        position: "absolute", left: 60, bottom: 40, width: 360, height: 130,
        background: `radial-gradient(ellipse, rgba(255,${200-heat*60},${60+heat*40},${.5+heat*.4}) 0%, rgba(255,80,20,${.4+heat*.3}) 40%, transparent 70%)`,
        filter: "blur(6px)",
        animation: held ? "pulse-soft .5s ease-in-out infinite" : "pulse-soft 1.4s ease-in-out infinite",
      }} />

      <div style={{ position: "absolute", left: 140, top: 60,
        filter: heat > 0.3 ? `drop-shadow(0 0 ${20+heat*40}px rgba(255,${180-heat*60},${40+heat*40},${.6+heat*.4}))` : "none",
      }}>
        <VesselSvg vessel="crucible" size={200} hot={heat > 0.2} />
      </div>

      {/* Herb inside (only briefly visible, then engulfed in white-hot glow) */}
      <div style={{ position: "absolute", left: 215, top: 110,
        opacity: 1 - Math.max(0, heat - 0.4) * 1.5,
      }}>
        <HerbSvg herb={session.herb} size={48} progress={Math.min(1, heat * 1.5)} />
      </div>

      {/* white-hot glow at peak */}
      {heat > 0.4 && (
        <div style={{
          position: "absolute", left: 200, top: 100, width: 80, height: 50,
          background: "radial-gradient(ellipse, #ffffff 0%, #ffe080 30%, #ff6020 60%, transparent 90%)",
          filter: "blur(4px)", borderRadius: "50%",
          opacity: (heat - 0.4) * 1.6,
          animation: "pulse-soft .4s ease-in-out infinite",
        }}/>
      )}

      {/* Calcined result emerging at very end */}
      {heat > 0.85 && (
        <div style={{ position: "absolute", left: 215, top: 110,
          animation: "float-up .5s",
          opacity: (heat - 0.85) * 6.5,
        }}>
          <HerbSvg herb={session.herb} size={48} progress={1} />
        </div>
      )}

      {/* heavy smoke + sparks */}
      <div style={{ position: "absolute", left: 130, top: 0, width: 220, height: 100, pointerEvents: "none" }}>
        <Particles kind="smoke" count={10} w={220} h={100} />
      </div>
      <div style={{ position: "absolute", left: 150, top: 50, width: 180, height: 70, pointerEvents: "none" }}>
        <Particles kind="spark" count={Math.floor(4 + heat * 10)} w={180} h={70} />
      </div>

      {/* hold indicator */}
      <div style={{ position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
        fontSize: 11, color: held ? "var(--vermilion)" : "var(--ink-faint)",
        fontFamily: "Noto Sans SC,sans-serif", letterSpacing: ".2em",
      }}>
        {held ? "● 鼓风蓄火" : "○ 长按以鼓风"}
      </div>
    </div>
  );
}

// ───────────────────────── 煨 (Wei) — Wrap & ash-bake ─────────────────────────
function WeiStage({ session, onProgress, onComplete }) {
  const [wrapped, setWrapped] = React.useState(false);
  const [stage, setStage] = React.useState("wrap"); // wrap → bury → bake

  // After wrap, auto progress
  React.useEffect(() => {
    if (stage !== "bake") return;
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (session.progress < 1) {
        const np = Math.min(1, session.progress + dt * 0.18);
        onProgress(np, "ok");
        if (np >= 1) { setTimeout(onComplete, 500); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, session.progress]);

  const handleWrap = () => {
    setWrapped(true);
    setTimeout(() => setStage("bake"), 600);
  };

  return (
    <div style={{ position: "relative", width: 480, height: 360 }}>
      <div style={{ position: "absolute", left: 140, top: 90 }}>
        <VesselSvg vessel="ash" size={200} hot={stage === "bake"} />
      </div>

      {/* Herb — pre-wrap floating above */}
      {!wrapped && (
        <div style={{ position: "absolute", left: 220, top: 60, animation: "float-up .4s" }}>
          <HerbSvg herb={session.herb} size={48} progress={0} />
        </div>
      )}

      {/* Wrapped packet */}
      {wrapped && (
        <div style={{
          position: "absolute", left: 215, top: stage === "bake" ? 130 : 60,
          transition: "top .8s cubic-bezier(.4,0,.6,1)",
          animation: "fade-in .5s",
        }}>
          <svg width={56} height={56} viewBox="0 0 56 56">
            <path d="M8 14 L 28 6 L 48 14 L 50 42 L 28 52 L 6 42 Z"
              fill="#e8dcc4" stroke="#6e4a22" strokeWidth="1" />
            <path d="M8 14 L 28 22 L 48 14 M 28 22 L 28 52" stroke="#6e4a22" strokeWidth=".7" fill="none"/>
            <path d="M14 30 Q 28 26, 42 30" stroke="#b9341c" strokeWidth="1.5" opacity=".7" fill="none"/>
            {stage === "bake" && (
              <ellipse cx="28" cy="40" rx="14" ry="3" fill="#3a1a08" opacity={Math.min(.7, session.progress)}>
                <animate attributeName="rx" values="12;16;12" dur="2s" repeatCount="indefinite"/>
              </ellipse>
            )}
          </svg>
        </div>
      )}

      {/* Smoke when baking */}
      {stage === "bake" && (
        <div style={{ position: "absolute", left: 150, top: 80, width: 180, height: 80, pointerEvents: "none" }}>
          <Particles kind="smoke" count={6} w={180} h={80} />
        </div>
      )}

      {/* Wrap button */}
      {!wrapped && (
        <button onClick={handleWrap} style={{
          position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
          appearance: "none", border: "1px solid var(--vermilion)",
          background: "var(--vermilion)", color: "#f4e9d2",
          padding: "8px 22px", borderRadius: 3, cursor: "pointer",
          fontFamily: "Ma Shan Zheng,serif", fontSize: 16, letterSpacing: ".15em",
        }}>湿纸包裹</button>
      )}
    </div>
  );
}

// ───────────────────────── 蒸 (Zheng) — Steaming ─────────────────────────
function ZhengStage({ session, onProgress, onComplete }) {
  const holdRef = React.useRef(false);
  React.useEffect(() => {
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (holdRef.current && session.progress < 1) {
        const np = Math.min(1, session.progress + dt * 0.14);
        onProgress(np, "ok");
        if (np >= 1) { setTimeout(onComplete, 600); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [session.progress]);
  const cycles = Math.floor(session.progress * 9); // 九蒸九晒

  return (
    <div style={{ position: "relative", width: 480, height: 360 }}
      onMouseDown={() => holdRef.current = true}
      onMouseUp={() => holdRef.current = false}
      onMouseLeave={() => holdRef.current = false}
      onTouchStart={() => holdRef.current = true}
      onTouchEnd={() => holdRef.current = false}
    >
      <FireGlow intensity={0.6} />
      <div style={{ position: "absolute", left: 140, top: 60 }}>
        <VesselSvg vessel="steamer" size={200} hot={true} />
      </div>
      {/* Steam — heavy */}
      <div style={{ position: "absolute", left: 130, top: -20, width: 220, height: 100, pointerEvents: "none" }}>
        <Particles kind="steam" count={14} w={220} h={100} />
      </div>
      {/* Cycle counter */}
      <div style={{ position: "absolute", top: 150, right: 60, textAlign: "center" }}>
        <div className="f-han" style={{ fontSize: 38, color: "var(--vermilion)", lineHeight: 1 }}>{cycles}</div>
        <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: ".2em" }}>蒸</div>
        <div className="f-han" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>九蒸九晒</div>
      </div>
      {/* Color preview through lid (hint) */}
      <div style={{ position: "absolute", left: 220, top: 120, opacity: .6, filter: "blur(1px)" }}>
        <HerbSvg herb={session.herb} size={40} progress={session.progress} />
      </div>
    </div>
  );
}

// ───────────────────────── 煮 (Zhu) — Boiling ─────────────────────────
function ZhuStage({ session, onProgress, onComplete }) {
  const holdRef = React.useRef(false);
  React.useEffect(() => {
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (holdRef.current && session.progress < 1) {
        const np = Math.min(1, session.progress + dt * 0.16);
        onProgress(np, "ok");
        if (np >= 1) { setTimeout(onComplete, 500); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [session.progress]);

  return (
    <div style={{ position: "relative", width: 480, height: 360 }}
      onMouseDown={() => holdRef.current = true}
      onMouseUp={() => holdRef.current = false}
      onMouseLeave={() => holdRef.current = false}
      onTouchStart={() => holdRef.current = true}
      onTouchEnd={() => holdRef.current = false}
    >
      <FireGlow intensity={0.55} />
      <div style={{ position: "absolute", left: 140, top: 90 }}>
        <VesselSvg vessel="pot" size={200} hot={true} />
      </div>
      {/* Boiling bubbles inside */}
      <div style={{ position: "absolute", left: 165, top: 130, width: 150, height: 30, pointerEvents: "none" }}>
        <Particles kind="bubble" count={12} w={150} h={30} />
      </div>
      {/* Steam */}
      <div style={{ position: "absolute", left: 150, top: 0, width: 180, height: 100, pointerEvents: "none" }}>
        <Particles kind="steam" count={8} w={180} h={100} />
      </div>
      {/* Herb peeking */}
      <div style={{ position: "absolute", left: 215, top: 145, opacity: .7,
        animation: "pulse-soft 2s ease-in-out infinite" }}>
        <HerbSvg herb={session.herb} size={36} progress={session.progress} />
      </div>
    </div>
  );
}

// ───────────────────────── 淬 (Cui) — Quenching ─────────────────────────
function CuiStage({ session, onProgress, onComplete }) {
  const [stage, setStage] = React.useState("heat"); // heat → quench → done
  const holdRef = React.useRef(false);
  const [heat, setHeat] = React.useState(0);
  const [burst, setBurst] = React.useState(0);

  React.useEffect(() => {
    if (stage !== "heat") return;
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (holdRef.current) {
        setHeat(h => Math.min(1, h + dt * 0.4));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  const handleQuench = () => {
    if (heat < 0.7) return;
    setStage("quench");
    setBurst(b => b + 1);
    onProgress(0.5, "ok");
    setTimeout(() => {
      onProgress(1, "ok");
      setTimeout(onComplete, 800);
    }, 900);
  };

  return (
    <div style={{ position: "relative", width: 480, height: 360 }}>
      {stage === "heat" && (
        <div onMouseDown={()=>holdRef.current=true} onMouseUp={()=>holdRef.current=false}
          onMouseLeave={()=>holdRef.current=false} onTouchStart={()=>holdRef.current=true}
          onTouchEnd={()=>holdRef.current=false}
          style={{ position: "absolute", inset: 0 }}>
          <FireGlow intensity={0.5 + heat * 0.5}/>
          <div style={{ position: "absolute", left: 140, top: 60,
            filter: heat > 0.3 ? `drop-shadow(0 0 ${heat*30}px rgba(255,${200-heat*100},${40+heat*40},.8))` : "none" }}>
            <VesselSvg vessel="crucible" size={200} hot={heat > 0.2} />
          </div>
          <div style={{ position: "absolute", left: 215, top: 110, opacity: 1-heat*0.5 }}>
            <HerbSvg herb={session.herb} size={48} progress={heat * 0.7} />
          </div>
          {/* heat bar */}
          <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
            width: 280, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: ".2em",
              fontFamily: "Noto Sans SC,sans-serif", marginBottom: 4 }}>
              {heat < 0.7 ? "长按鼓风 · 烧至通赤" : "● 已通赤！点投醋淬之"}
            </div>
            <div style={{ height: 8, background: "rgba(40,25,10,.18)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${heat*100}%`,
                background: "linear-gradient(90deg, #ffae40, #ff4a1a, #fff080)",
                transition: "width .15s" }}/>
            </div>
          </div>
          {heat >= 0.7 && (
            <button onClick={handleQuench} style={{
              position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
              appearance: "none", border: 0,
              background: "var(--vermilion)", color: "#f4e9d2",
              padding: "10px 28px", borderRadius: 3, cursor: "pointer",
              fontFamily: "Ma Shan Zheng,serif", fontSize: 18, letterSpacing: ".2em",
              animation: "pulse-soft 1s ease-in-out infinite",
            }}>投 醋 淬 之</button>
          )}
        </div>
      )}
      {stage === "quench" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", left: 140, top: 60,
            filter: "drop-shadow(0 0 24px rgba(255,200,80,.6))" }}>
            <VesselSvg vessel="crucible" size={200} hot={true} />
          </div>
          {/* huge steam burst */}
          <div style={{ position: "absolute", left: 100, top: -40, width: 280, height: 200, pointerEvents: "none" }}>
            <Particles kind="steam" count={28} w={280} h={200} />
          </div>
          <div style={{ position: "absolute", left: 130, top: 20, width: 220, height: 100, pointerEvents: "none" }}>
            <Particles kind="spark" count={20} w={220} h={100} />
          </div>
          {/* sizzle ring */}
          <div key={burst} style={{
            position: "absolute", left: 240 - 60, top: 160 - 60, width: 120, height: 120,
            borderRadius: "50%", border: "3px solid rgba(255,200,100,.8)",
            animation: "ripple 1s ease-out forwards",
          }}/>
          <div style={{ position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)",
            fontFamily: "Ma Shan Zheng,serif", fontSize: 22, color: "var(--vermilion)",
            animation: "float-up .6s", letterSpacing: ".3em",
          }}>嗤 ——</div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 发酵 (Fa Jiao) — Fermenting ─────────────────────────
function FaJiaoStage({ session, onProgress, onComplete }) {
  const [sealed, setSealed] = React.useState(false);
  React.useEffect(() => {
    if (!sealed) return;
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (session.progress < 1) {
        const np = Math.min(1, session.progress + dt * 0.13);
        onProgress(np, "ok");
        if (np >= 1) { setTimeout(onComplete, 600); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sealed, session.progress]);

  return (
    <div style={{ position: "relative", width: 480, height: 360 }}>
      <div style={{ position: "absolute", left: 140, top: 60 }}>
        <VesselSvg vessel="jar" size={200} />
      </div>
      {/* Bubbles inside (faint) */}
      {sealed && (
        <div style={{ position: "absolute", left: 175, top: 120, width: 130, height: 80, pointerEvents: "none", opacity: .6 }}>
          <Particles kind="bubble" count={6} w={130} h={80} />
        </div>
      )}
      {/* moon/sun cycle */}
      {sealed && (
        <div style={{ position: "absolute", top: 20, right: 60, textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, ${session.progress > 0.5 ? "#ffe080" : "#bdd9e4"}, ${session.progress > 0.5 ? "#d97842" : "#5a7a8a"})`,
            boxShadow: `0 0 24px ${session.progress > 0.5 ? "rgba(255,200,80,.5)" : "rgba(180,200,220,.4)"}`,
            margin: "0 auto",
            animation: "pulse-soft 2s ease-in-out infinite",
          }}/>
          <div className="f-han" style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}>
            {session.progress > 0.5 ? "日 出" : "月 沉"}
          </div>
          <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 2, letterSpacing: ".2em" }}>
            {Math.ceil((1 - session.progress) * 7)} 日
          </div>
        </div>
      )}
      {!sealed && (
        <button onClick={() => setSealed(true)} style={{
          position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
          appearance: "none", border: 0,
          background: "var(--vermilion)", color: "#f4e9d2",
          padding: "8px 22px", borderRadius: 3, cursor: "pointer",
          fontFamily: "Ma Shan Zheng,serif", fontSize: 16, letterSpacing: ".15em",
        }}>封 瓮 发 酵</button>
      )}
    </div>
  );
}

Object.assign(window, { Workbench });
