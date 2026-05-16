/* ──────────────────────────────────────────────────────────────
 * scroll.jsx — Floating top quest scroll + right-side scroll panel
 * ────────────────────────────────────────────────────────────── */

function QuestScroll({ recipe, scoreLabel }) {
  if (!recipe) return null;
  const { PROCESSING_TYPES } = window.PaozhiData;
  const type = PROCESSING_TYPES[recipe.type];
  return (
    <div style={{
      position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
      zIndex: 50, pointerEvents: "auto",
      animation: "scroll-unfurl .9s cubic-bezier(.2,.8,.3,1.1)",
      transformOrigin: "top",
    }}>
      <ScrollFrame>
        <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "10px 16px" }}>
          {/* Left seal — refined with double ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, #d54a30, #b9341c 60%, #8b2412)",
              color: "#f4e9d2", display: "grid", placeItems: "center",
              fontFamily: "Ma Shan Zheng,serif", fontSize: 26,
              boxShadow: "0 3px 8px rgba(60,20,10,.4), inset 0 0 12px rgba(255,200,170,.25), inset 0 -2px 4px rgba(60,10,0,.4)",
              border: "2px solid var(--vermilion-deep)",
            }}>
              <span style={{ transform: "rotate(-3deg)" }}>炮</span>
            </div>
            {/* corner ticks */}
            <div style={{ position: "absolute", inset: -3, borderRadius: "50%",
              border: "1px dashed rgba(139,36,18,.35)" }}/>
          </div>

          {/* Title block */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ fontSize: 10, letterSpacing: ".5em", color: "var(--ink-faint)",
              fontFamily: "Noto Sans SC,sans-serif", paddingLeft: ".5em" }}>
              今 日 炮 制
            </div>
            <div className="f-han" style={{
              fontSize: 46, color: "var(--ink)", lineHeight: 1, letterSpacing: ".15em",
              textShadow: "0 1px 0 rgba(255,255,255,.4)",
              paddingLeft: ".15em",
            }}>
              {recipe.out}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)",
              fontFamily: "Noto Serif SC,serif", marginTop: 3,
              fontStyle: "italic", letterSpacing: ".05em" }}>
              {recipe.benefit}
            </div>
          </div>

          {/* Right column: method tag */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "4px 16px",
            borderLeft: "1px solid var(--frame-soft)",
            position: "relative",
            minWidth: 92,
          }}>
            <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: ".25em",
              fontFamily: "Noto Sans SC,sans-serif" }}>{type.cat}</div>
            <div className="f-han" style={{ fontSize: 32, color: "var(--vermilion)", lineHeight: 1,
              textShadow: "0 1px 0 rgba(255,255,255,.3)" }}>{type.name}</div>
            <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 4,
              letterSpacing: ".15em", fontFamily: "Noto Sans SC,sans-serif" }}>{scoreLabel}</div>
          </div>
        </div>
      </ScrollFrame>
    </div>
  );
}

function ScrollFrame({ children }) {
  return (
    <div style={{ position: "relative", filter: "drop-shadow(0 10px 18px rgba(40,25,10,.4))" }}>
      <ScrollRod side="left" />
      <div style={{
        background:
          "linear-gradient(180deg, var(--paper-dark) 0%, var(--paper) 14%, var(--paper-warm) 50%, var(--paper) 86%, var(--paper-dark) 100%)",
        borderTop: "1px solid var(--frame)",
        borderBottom: "1px solid var(--frame)",
        padding: "4px 38px",
        position: "relative",
        margin: "0 24px",
      }}>
        {/* edge shadows */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(90deg, rgba(60,40,20,.22), transparent 6%, transparent 94%, rgba(60,40,20,.22))" }} />
        {/* paper grain inside scroll */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: .35,
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.18  0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          mixBlendMode: "multiply",
        }} />
        {children}
      </div>
      <ScrollRod side="right" />
    </div>
  );
}

function ScrollRod({ side }) {
  const isLeft = side === "left";
  return (
    <div style={{
      position: "absolute", top: -8, [isLeft ? "left" : "right"]: 0,
      width: 28, height: "calc(100% + 16px)",
      background: "linear-gradient(180deg, #8a5a2a 0%, #4a2810 30%, #6e4a22 50%, #4a2810 70%, #8a5a2a 100%)",
      borderRadius: 14,
      boxShadow: "inset 1px 0 0 rgba(255,210,160,.25), inset -1px 0 0 rgba(0,0,0,.4), 0 3px 6px rgba(0,0,0,.35)",
    }}>
      {/* End caps */}
      {["top","bot"].map(p => (
        <div key={p} style={{
          position: "absolute", [p === "top" ? "top" : "bottom"]: -6,
          left: -4, right: -4, height: 14,
          background: "radial-gradient(ellipse at 50% 40%, #d9b56a 0%, #b8893a 50%, #6e4a22 100%)",
          borderRadius: "50%",
          border: "1px solid #3a2010",
          boxShadow: "0 2px 4px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,230,180,.4)",
        }}>
          <div style={{ position: "absolute", inset: 2, borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(60,30,10,.4) 100%)" }}/>
        </div>
      ))}
    </div>
  );
}

// ── Right side vertical scroll panel with tabs ──
function SideScroll({ tab, onTabChange, herbs, ingredients, currentRecipe, onDragStartItem }) {
  const tabs = [
    { id: "herbs", label: "药 材", count: herbs.length },
    { id: "adj",   label: "辅 料", count: ingredients.length },
  ];
  const items = tab === "herbs" ? herbs : ingredients;
  const kind = tab === "herbs" ? "herb" : "ing";
  const data = window.PaozhiData;
  const expected = currentRecipe ? (
    tab === "herbs" ? [currentRecipe.herb] : currentRecipe.adjuvants
  ) : [];

  return (
    <div style={{
      position: "relative",
      height: "100%",
      display: "flex", flexDirection: "column",
      filter: "drop-shadow(-6px 4px 14px rgba(40,25,10,.32))",
    }}>
      {/* top rod */}
      <SideRod horiz="top" />

      {/* Body */}
      <div style={{
        flex: 1,
        background:
          "linear-gradient(90deg, var(--paper-dark) 0%, var(--paper) 8%, var(--paper-warm) 50%, var(--paper) 92%, var(--paper-dark) 100%)",
        borderLeft: "1px solid var(--frame)",
        borderRight: "1px solid var(--frame)",
        position: "relative",
        margin: "20px 0",
        display: "flex", flexDirection: "column",
        minHeight: 0,
      }}>
        {/* paper grain */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: .35,
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.18  0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          mixBlendMode: "multiply",
        }}/>
        {/* edge shadows */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(60,40,20,.18), transparent 5%, transparent 95%, rgba(60,40,20,.18))" }}/>

        {/* Header / tabs */}
        <div style={{ position: "relative", padding: "14px 16px 8px", textAlign: "center",
          borderBottom: "1px solid var(--frame-soft)" }}>
          <div className="f-han" style={{ fontSize: 19, color: "var(--ink)", letterSpacing: ".35em",
            paddingLeft: ".35em", textShadow: "0 1px 0 rgba(255,255,255,.4)" }}>
            药 笼
          </div>
          <div style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: ".3em",
            fontFamily: "Noto Sans SC,sans-serif", marginTop: 1 }}>
            HERBARIUM
          </div>
        </div>

        {/* Tab strip */}
        <div style={{ position: "relative", display: "flex", padding: "10px 12px 4px", gap: 6 }}>
          {tabs.map(tb => {
            const active = tab === tb.id;
            return (
              <button key={tb.id} onClick={() => onTabChange(tb.id)} style={{
                flex: 1,
                appearance: "none", border: 0,
                background: active
                  ? "linear-gradient(180deg, rgba(185,52,28,.92), rgba(139,36,18,.92))"
                  : "rgba(255,255,255,.45)",
                color: active ? "#f4e9d2" : "var(--ink-soft)",
                padding: "7px 4px",
                borderRadius: 2,
                cursor: "pointer",
                fontFamily: "Ma Shan Zheng,serif",
                fontSize: 16, letterSpacing: ".25em", paddingLeft: ".25em",
                position: "relative",
                boxShadow: active
                  ? "0 2px 4px rgba(60,20,10,.35), inset 0 -1px 0 rgba(0,0,0,.2)"
                  : "inset 0 0 0 1px var(--frame-soft)",
                transition: "all .2s",
              }}>
                {tb.label}
                <span style={{ display: "block", fontSize: 9, letterSpacing: ".15em",
                  fontFamily: "Noto Sans SC,sans-serif", marginTop: 1,
                  opacity: active ? .85 : .55 }}>
                  {tb.count} 味
                </span>
              </button>
            );
          })}
        </div>

        {/* Items grid */}
        <div style={{ position: "relative", flex: 1, padding: "8px 12px 14px",
          overflowY: "auto", minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {items.map(id => (
              <ScrollDragItem key={id} kind={kind} id={id}
                highlighted={expected.includes(id)}
                onDragStart={onDragStartItem} />
            ))}
          </div>
        </div>

        {/* Footer pseudo-text */}
        <div style={{ position: "relative", padding: "6px 16px",
          borderTop: "1px dashed var(--frame-soft)",
          fontSize: 10, color: "var(--ink-faint)",
          fontFamily: "Noto Serif SC,serif", textAlign: "center", letterSpacing: ".15em" }}>
          ｜ 拖 拽 入 工 坊 ｜
        </div>
      </div>

      <SideRod horiz="bot" />
    </div>
  );
}

function SideRod({ horiz }) {
  return (
    <div style={{
      position: "relative", height: 28,
      [horiz === "top" ? "marginBottom" : "marginTop"]: -8,
      zIndex: 2,
      background: "linear-gradient(90deg, #4a2810 0%, #8a5a2a 8%, #4a2810 18%, #8a5a2a 50%, #4a2810 82%, #8a5a2a 92%, #4a2810 100%)",
      borderRadius: 14,
      boxShadow: "inset 0 1px 0 rgba(255,210,160,.25), inset 0 -1px 0 rgba(0,0,0,.4), 0 3px 5px rgba(0,0,0,.3)",
    }}>
      {/* End caps */}
      {["l","r"].map(s => (
        <div key={s} style={{
          position: "absolute", [s === "l" ? "left" : "right"]: -6,
          top: -3, bottom: -3, width: 14,
          background: "radial-gradient(ellipse at 40% 50%, #d9b56a 0%, #b8893a 50%, #6e4a22 100%)",
          borderRadius: "50%",
          border: "1px solid #3a2010",
          boxShadow: "0 2px 4px rgba(0,0,0,.4)",
        }}/>
      ))}
    </div>
  );
}

function ScrollDragItem({ kind, id, highlighted, onDragStart }) {
  const { HERBS, INGREDIENTS } = window.PaozhiData;
  const data = kind === "herb" ? HERBS[id] : INGREDIENTS[id];
  const handleDown = (e) => {
    e.preventDefault();
    onDragStart({ kind, id, startX: e.clientX, startY: e.clientY });
  };
  return (
    <div
      onMouseDown={handleDown}
      onTouchStart={(e) => {
        const t = e.touches[0];
        onDragStart({ kind, id, startX: t.clientX, startY: t.clientY });
      }}
      style={{
        height: 78, padding: "4px 4px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        background: highlighted
          ? "linear-gradient(180deg, rgba(185,52,28,.10), rgba(185,52,28,.04))"
          : "linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.25))",
        border: highlighted ? "1px solid var(--vermilion)" : "1px solid var(--frame-soft)",
        borderRadius: 2,
        cursor: "grab",
        position: "relative",
        boxShadow: highlighted
          ? "0 0 0 2px rgba(185,52,28,.15), inset 0 0 0 1px rgba(255,255,255,.35)"
          : "inset 0 0 0 1px rgba(255,255,255,.25), 0 1px 2px rgba(60,40,20,.06)",
        transition: "transform .15s ease",
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      {highlighted && (
        <div style={{
          position: "absolute", top: 2, right: 2,
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--vermilion)",
          boxShadow: "0 0 6px rgba(185,52,28,.6)",
        }}/>
      )}
      <div style={{ pointerEvents: "none", flex: 1, display: "grid", placeItems: "center" }}>
        {kind === "herb"
          ? <HerbSvg herb={id} size={42} />
          : <IngredientIcon ing={id} size={36} />}
      </div>
      <div className="f-han" style={{ fontSize: 12, color: "var(--ink)",
        lineHeight: 1, letterSpacing: ".05em" }}>
        {data.name}
      </div>
    </div>
  );
}

window.QuestScroll = QuestScroll;
window.SideScroll = SideScroll;
