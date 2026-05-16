/* ──────────────────────────────────────────────────────────────
 * inventory.jsx — Result modal + bottom horizontal 药库 shelf
 * ────────────────────────────────────────────────────────────── */

function ResultModal({ result, onContinue }) {
  if (!result) return null;
  const { recipe, quality } = result;
  const grade = quality >= 0.85 ? "上品" : quality >= 0.6 ? "中品" : "下品";
  const gradeColor = grade === "上品" ? "var(--vermilion)" : grade === "中品" ? "var(--gold)" : "var(--ink-faint)";

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "rgba(20,12,4,.6)",
      backdropFilter: "blur(6px)",
      display: "grid", placeItems: "center",
      animation: "fade-in .4s",
    }}>
      <div style={{
        width: 480, padding: 40,
        background: "linear-gradient(180deg, var(--paper) 0%, var(--paper-warm) 50%, var(--paper-dark) 100%)",
        border: "1px solid var(--bronze)",
        borderRadius: 3,
        boxShadow:
          "0 30px 80px rgba(0,0,0,.55)," +
          "inset 0 0 0 1px rgba(255,255,255,.4)," +
          "inset 0 0 0 6px var(--paper)," +
          "inset 0 0 0 7px var(--vermilion)",
        textAlign: "center",
        position: "relative",
      }}>
        {/* corner ornaments */}
        {["tl","tr","bl","br"].map(c => (
          <div key={c} style={{
            position: "absolute", width: 18, height: 18,
            borderColor: "var(--vermilion)", borderStyle: "solid", borderWidth: 0,
            ...(c.includes("t") ? {top: 14} : {bottom: 14}),
            ...(c.includes("l") ? {left: 14, borderLeftWidth: 2} : {right: 14, borderRightWidth: 2}),
            ...(c.includes("t") ? {borderTopWidth: 2} : {borderBottomWidth: 2}),
          }}/>
        ))}

        <div style={{ fontSize: 10, letterSpacing: ".5em", color: "var(--ink-faint)",
          fontFamily: "Noto Sans SC,sans-serif", marginBottom: 14, paddingLeft: ".5em" }}>
          炮 制 既 成
        </div>

        <div className="f-han" style={{ fontSize: 60, color: "var(--ink)", letterSpacing: ".12em",
          paddingLeft: ".12em", lineHeight: 1.1,
          textShadow: "0 1px 0 rgba(255,255,255,.5)" }}>
          {recipe.out}
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "22px 0 18px" }}>
          <div style={{ width: 110, height: 110, display: "grid", placeItems: "center",
            background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,.5), transparent 65%), rgba(244,233,210,.5)",
            border: "1px solid var(--frame)", borderRadius: 3,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.3), 0 2px 4px rgba(0,0,0,.1)" }}>
            <HerbSvg herb={recipe.herb} size={80} progress={1} />
          </div>
        </div>

        <div className="f-han" style={{ fontSize: 24, color: gradeColor, letterSpacing: ".4em",
          marginBottom: 10, paddingLeft: ".4em" }}>{grade}</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 28,
          fontFamily: "Noto Serif SC,serif", fontStyle: "italic", letterSpacing: ".05em" }}>
          《 {recipe.benefit} 》
        </div>

        <button onClick={onContinue} style={{
          appearance: "none", border: 0,
          background: "linear-gradient(180deg, #c8442a, #b9341c 70%, #8b2412)",
          color: "#f4e9d2",
          padding: "11px 44px", borderRadius: 2, cursor: "pointer",
          fontFamily: "Ma Shan Zheng,serif", fontSize: 18, letterSpacing: ".35em",
          paddingLeft: "calc(44px + .35em)",
          boxShadow: "0 4px 10px rgba(60,20,10,.4), inset 0 -1px 0 rgba(0,0,0,.25), inset 0 1px 0 rgba(255,200,170,.3)",
        }}>入 库</button>
      </div>
    </div>
  );
}

// Bottom horizontal 药库 shelf — wood shelf with bottle/sample slots
function BottomShelf({ collected, onPickQuest, currentQuest }) {
  const { RECIPES } = window.PaozhiData;
  const collectedIds = new Set(collected.map(c => c.recipeId));
  return (
    <div style={{
      position: "relative",
      padding: "10px 16px 14px",
      background:
        "linear-gradient(180deg, #6e4a22 0%, #5a3a18 50%, #3a2010 100%)",
      borderTop: "2px solid #2a1408",
      boxShadow: "inset 0 6px 12px rgba(0,0,0,.4), 0 -2px 6px rgba(0,0,0,.2)",
    }}>
      {/* Header strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 4px 8px", borderBottom: "1px solid rgba(255,200,150,.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="f-han" style={{ fontSize: 20, color: "#f4e9d2", letterSpacing: ".4em",
            paddingLeft: ".4em", textShadow: "0 1px 2px rgba(0,0,0,.5)" }}>
            药 库
          </div>
          <div style={{ fontSize: 9, color: "rgba(244,233,210,.6)", letterSpacing: ".3em",
            fontFamily: "Noto Sans SC,sans-serif" }}>APOTHECARY</div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(244,233,210,.7)",
          fontFamily: "Noto Sans SC,sans-serif", letterSpacing: ".2em" }}>
          已 成 <span style={{ color: "#e8b860", fontSize: 14, fontWeight: 600 }}>{collectedIds.size}</span> / {RECIPES.length}
        </div>
      </div>

      {/* Shelf grid */}
      <div style={{ display: "flex", gap: 8, paddingTop: 12, overflowX: "auto" }}>
        {RECIPES.map(r => {
          const got = collectedIds.has(r.id);
          const cur = currentQuest && currentQuest.id === r.id;
          return (
            <DrawerSlot key={r.id} recipe={r} got={got} cur={cur}
              onClick={() => !got && onPickQuest(r.id)} />
          );
        })}
      </div>
    </div>
  );
}

function DrawerSlot({ recipe, got, cur, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        flex: "0 0 110px", height: 116, padding: 0,
        appearance: "none", border: 0,
        background: got
          ? "linear-gradient(180deg, #f4e9d2 0%, #ecdfc0 60%, #d9c69a 100%)"
          : "linear-gradient(180deg, #4a3220 0%, #3a2010 100%)",
        borderRadius: 2,
        cursor: got ? "default" : "pointer",
        position: "relative",
        outline: cur ? "1.5px solid #e8b860" : "1px solid rgba(0,0,0,.4)",
        outlineOffset: -1,
        boxShadow:
          got
            ? "inset 0 0 0 1px rgba(255,255,255,.35), inset 0 -2px 4px rgba(110,74,34,.2), 0 2px 4px rgba(0,0,0,.4)"
            : "inset 0 4px 6px rgba(0,0,0,.4), inset 0 0 0 1px rgba(255,255,255,.04)",
        color: got ? "var(--ink)" : "rgba(244,233,210,.45)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
      }}>
      {/* drawer handle ring */}
      {!got && (
        <div style={{ width: 14, height: 14, borderRadius: "50%",
          border: "1.5px solid rgba(232,184,96,.6)",
          background: "radial-gradient(circle, rgba(232,184,96,.2), transparent 70%)" }}/>
      )}
      {got && (
        <div style={{ filter: "drop-shadow(0 1px 1px rgba(60,40,20,.18))" }}>
          <HerbSvg herb={recipe.herb} size={44} progress={1} />
        </div>
      )}
      <div className="f-han" style={{ fontSize: got ? 13 : 11, lineHeight: 1.1,
        letterSpacing: ".06em", color: got ? "var(--ink)" : "rgba(244,233,210,.6)" }}>
        {got ? recipe.out : "—  ?  —"}
      </div>
      {got && (
        <div style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: ".15em",
          fontFamily: "Noto Sans SC,sans-serif" }}>
          {window.PaozhiData.PROCESSING_TYPES[recipe.type].name}
        </div>
      )}
      {cur && !got && (
        <div style={{ position: "absolute", top: 4, right: 4,
          fontSize: 9, color: "#e8b860", letterSpacing: ".15em",
          fontFamily: "Noto Sans SC,sans-serif" }}>● 当前</div>
      )}
      {/* nameplate strip at bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        background: got ? "rgba(110,74,34,.4)" : "rgba(0,0,0,.4)",
      }}/>
    </button>
  );
}

window.ResultModal = ResultModal;
window.BottomShelf = BottomShelf;
