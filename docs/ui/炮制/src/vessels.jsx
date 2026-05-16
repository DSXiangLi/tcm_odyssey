/* ──────────────────────────────────────────────────────────────
 * vessels.jsx — Vessel rack on left
 * ────────────────────────────────────────────────────────────── */

function VesselRack({ onPick, activeVessel, currentVessel }) {
  const { VESSELS } = window.PaozhiData;
  return (
    <div style={{
      position: "relative",
      display: "flex", flexDirection: "column", gap: 4,
      padding: "12px 6px 16px",
      background:
        "linear-gradient(180deg, rgba(110,74,34,.22) 0%, rgba(110,74,34,.10) 100%)",
      border: "1px solid var(--frame)",
      borderRadius: 2,
      boxShadow: "inset 0 0 0 1px rgba(255,235,200,.25), 0 4px 10px rgba(40,25,10,.18)",
    }}>
      {/* Header */}
      <div style={{
        textAlign: "center",
        marginBottom: 6, paddingBottom: 8,
        borderBottom: "1px solid var(--frame-soft)",
      }}>
        <div className="f-han" style={{ fontSize: 18, color: "var(--ink)",
          letterSpacing: ".4em", paddingLeft: ".4em",
          textShadow: "0 1px 0 rgba(255,255,255,.4)" }}>器 皿</div>
        <div style={{ fontSize: 8, color: "var(--ink-faint)", letterSpacing: ".25em",
          fontFamily: "Noto Sans SC,sans-serif", marginTop: 2 }}>VESSELS</div>
      </div>

      {VESSELS.map(v => {
        const active = activeVessel === v.id;
        const recommended = currentVessel === v.id;
        return (
          <button key={v.id}
            onClick={() => onPick(v.id)}
            title={v.hint}
            style={{
              appearance: "none", border: 0, padding: "4px 2px",
              background: active
                ? "linear-gradient(180deg, var(--paper) 0%, var(--paper-warm) 100%)"
                : recommended ? "rgba(185,52,28,.06)" : "transparent",
              borderRadius: 2,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              cursor: "pointer", color: "var(--ink)",
              outline: active ? "1.5px solid var(--vermilion)"
                : recommended ? "1px dashed rgba(185,52,28,.5)"
                : "1px solid transparent",
              outlineOffset: -1,
              position: "relative",
              transition: "all .2s",
              boxShadow: active ? "0 2px 6px rgba(60,30,10,.18), inset 0 0 0 1px rgba(255,255,255,.4)" : "none",
            }}
          >
            {recommended && !active && (
              <div style={{
                position: "absolute", top: 2, right: 2,
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--vermilion)",
                boxShadow: "0 0 6px rgba(185,52,28,.7)",
              }}/>
            )}
            <VesselSvg vessel={v.id} size={50} />
            <span className="f-han" style={{ fontSize: 12, lineHeight: 1.1,
              color: active ? "var(--vermilion)" : "var(--ink)" }}>{v.name}</span>
          </button>
        );
      })}
    </div>
  );
}

window.VesselRack = VesselRack;
