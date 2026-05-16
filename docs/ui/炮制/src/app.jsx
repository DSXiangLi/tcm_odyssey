/* ──────────────────────────────────────────────────────────────
 * app.jsx — Main game shell (refined layout)
 * ────────────────────────────────────────────────────────────── */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "previewType": "none",
  "showHelpers": true
}/*EDITMODE-END*/;

const PROCESS_TYPE_KEYS = ["qie","pao","chao","zhi","duan","wei","zheng","zhu","cui","fajiao"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { RECIPES, PROCESSING_TYPES, HERBS, INGREDIENTS, VESSELS } = window.PaozhiData;

  const [currentQuestId, setCurrentQuestId] = React.useState("r1");
  const currentQuest = RECIPES.find(r => r.id === currentQuestId);

  const [collected, setCollected] = React.useState([]);
  const [session, setSession] = React.useState(null);
  const [activeVessel, setActiveVessel] = React.useState(null);
  const [stagedHerb, setStagedHerb] = React.useState(null);
  const [stagedAdj, setStagedAdj] = React.useState([]);
  const [result, setResult] = React.useState(null);
  const [tab, setTab] = React.useState("herbs");

  const [drag, setDrag] = React.useState(null);
  React.useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x != null) setDrag(d => d ? { ...d, x, y } : d);
    };
    const up = (e) => {
      const x = e.clientX ?? e.changedTouches?.[0]?.clientX;
      const y = e.clientY ?? e.changedTouches?.[0]?.clientY;
      const el = document.elementFromPoint(x, y);
      const dropZone = el?.closest("[data-drop]");
      if (dropZone) handleDrop(dropZone.dataset.drop, drag);
      setDrag(null);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [drag]);

  const onDragStartItem = ({ kind, id, startX, startY }) => {
    setDrag({ kind, id, x: startX, y: startY });
  };
  const handleDrop = (zone, d) => {
    if (zone === "bench") {
      if (d.kind === "herb") setStagedHerb(d.id);
      else setStagedAdj(arr => arr.includes(d.id) ? arr : [...arr, d.id]);
    }
  };

  const expectedVessel = currentQuest ? PROCESSING_TYPES[currentQuest.type].vessel : null;
  const canStart = stagedHerb && activeVessel && currentQuest && expectedVessel === activeVessel;
  const canStartButWrong = stagedHerb && activeVessel && !canStart;

  const startProcessing = () => {
    if (!canStart) return;
    setSession({
      type: currentQuest.type, vessel: activeVessel,
      herb: stagedHerb, adjuvants: stagedAdj,
      progress: 0, status: "ok", missteps: 0,
    });
  };

  const onProgress = (np, status) => setSession(s => s ? { ...s, progress: np, status } : s);
  const onComplete = () => {
    setSession(s => {
      if (!s) return s;
      const matchHerb = s.herb === currentQuest.herb;
      const matchAdj = currentQuest.adjuvants.every(a => s.adjuvants.includes(a)) &&
        s.adjuvants.every(a => currentQuest.adjuvants.includes(a));
      const quality = matchHerb && matchAdj ? 0.95 : matchHerb ? 0.7 : 0.4;
      setResult({ recipe: currentQuest, quality });
      return null;
    });
  };
  const onAbort = () => setSession(null);

  const onContinue = () => {
    setCollected(c => [...c, { recipeId: result.recipe.id, quality: result.quality }]);
    setResult(null);
    setStagedHerb(null); setStagedAdj([]); setActiveVessel(null);
    const done = new Set([...collected.map(c=>c.recipeId), result.recipe.id]);
    const next = RECIPES.find(r => !done.has(r.id));
    if (next) setCurrentQuestId(next.id);
  };

  React.useEffect(() => {
    if (t.previewType && t.previewType !== "none") {
      const demo = RECIPES.find(r => r.type === t.previewType) || RECIPES[0];
      setStagedHerb(demo.herb);
      setStagedAdj([...demo.adjuvants]);
      setActiveVessel(PROCESSING_TYPES[demo.type].vessel);
      setCurrentQuestId(demo.id);
      setSession({
        type: demo.type, vessel: PROCESSING_TYPES[demo.type].vessel,
        herb: demo.herb, adjuvants: [...demo.adjuvants],
        progress: 0, status: "ok", missteps: 0,
      });
    }
  }, [t.previewType]);

  const allHerbs = Object.keys(HERBS);
  const allIngs = Object.keys(INGREDIENTS);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh",
      display: "grid",
      gridTemplateColumns: "138px 1fr 240px",
      gridTemplateRows: "1fr auto",
      gridTemplateAreas: `"rack bench side" "shelf shelf shelf"`,
    }}>
      {/* TOP: floating quest scroll */}
      <QuestScroll recipe={currentQuest}
        scoreLabel={`已成 ${collected.length}/${RECIPES.length}`} />

      {/* LEFT RACK */}
      <div style={{ gridArea: "rack", padding: "118px 10px 10px", overflow: "auto" }}>
        <VesselRack onPick={(v) => setActiveVessel(v)} activeVessel={activeVessel}
          currentVessel={expectedVessel}/>
      </div>

      {/* CENTER BENCH */}
      <div data-drop="bench" data-screen-label="炮制工作台"
        style={{ gridArea: "bench", position: "relative", display: "flex", flexDirection: "column",
        padding: "118px 18px 18px",
        outline: drag ? "2px dashed var(--vermilion)" : "none",
        outlineOffset: -10, transition: "outline .2s",
      }}>
        {!session && (
          <BenchStaging
            stagedHerb={stagedHerb} stagedAdj={stagedAdj} activeVessel={activeVessel}
            canStart={canStart} canStartButWrong={canStartButWrong}
            onStart={startProcessing}
            onClearHerb={() => setStagedHerb(null)}
            onClearAdj={(i) => setStagedAdj(a => a.filter(x => x !== i))}
            onClearVessel={() => setActiveVessel(null)}
            quest={currentQuest} showHelpers={t.showHelpers}
          />
        )}
        {session && (
          <Workbench session={session} onProgress={onProgress} onComplete={onComplete} onAbort={onAbort} />
        )}
      </div>

      {/* RIGHT SIDE SCROLL */}
      <div style={{ gridArea: "side", padding: "118px 10px 10px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <SideScroll tab={tab} onTabChange={setTab}
          herbs={allHerbs} ingredients={allIngs}
          currentRecipe={currentQuest}
          onDragStartItem={onDragStartItem} />
      </div>

      {/* BOTTOM SHELF (药库) */}
      <div style={{ gridArea: "shelf" }}>
        <BottomShelf collected={collected} currentQuest={currentQuest}
          onPickQuest={(id) => setCurrentQuestId(id)} />
      </div>

      {/* Floating drag preview */}
      {drag && (
        <div style={{
          position: "fixed", left: drag.x - 30, top: drag.y - 30,
          zIndex: 200, pointerEvents: "none",
          filter: "drop-shadow(0 10px 14px rgba(0,0,0,.4))",
          transform: "scale(1.2) rotate(-3deg)",
        }}>
          {drag.kind === "herb"
            ? <HerbSvg herb={drag.id} size={64} />
            : <IngredientIcon ing={drag.id} size={56} />}
        </div>
      )}

      <ResultModal result={result} onContinue={onContinue}/>

      <TweaksPanel title="Tweaks · 调试">
        <TweakSection label="炮制类型预览" />
        <TweakSelect label="演示动画" value={t.previewType}
          options={["none", ...PROCESS_TYPE_KEYS]}
          labels={{none:"— 关闭 —", qie:"切制", pao:"浸泡", chao:"清炒", zhi:"酒炙",
            duan:"煅", wei:"煨", zheng:"蒸", zhu:"煮", cui:"淬", fajiao:"发酵"}}
          onChange={(v) => setTweak('previewType', v)} />
        <TweakSection label="辅助" />
        <TweakToggle label="显示提示" value={t.showHelpers}
          onChange={(v) => setTweak('showHelpers', v)} />
        <div style={{ fontSize: 10, color: "var(--ink-faint)", lineHeight: 1.7, paddingTop: 6 }}>
          中医核心炮制法：<br/>
          切·浸·炒·炙·煅·煨·蒸·煮·淬·发酵
        </div>
      </TweaksPanel>
    </div>
  );
}

// ───────────────────── Bench staging ─────────────────────
function BenchStaging({ stagedHerb, stagedAdj, activeVessel, canStart, canStartButWrong,
  onStart, onClearHerb, onClearAdj, onClearVessel, quest, showHelpers }) {
  const { PROCESSING_TYPES, INGREDIENTS, HERBS, VESSELS } = window.PaozhiData;
  const expectedVessel = PROCESSING_TYPES[quest.type].vessel;
  const expectedAdj = quest.adjuvants;
  const expectedHerb = quest.herb;

  return (
    <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24 }}>

      {/* Workshop sign */}
      <div style={{ textAlign: "center" }}>
        <div className="f-han" style={{ fontSize: 26, color: "var(--ink)", letterSpacing: ".4em",
          paddingLeft: ".4em", textShadow: "0 1px 0 rgba(255,255,255,.45)" }}>
          炮 制 工 坊
        </div>
        <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: ".4em",
          fontFamily: "Noto Sans SC,sans-serif", marginTop: 4, paddingLeft: ".4em" }}>
          PROCESSING WORKSHOP
        </div>
        {/* divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 }}>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, var(--frame))" }}/>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--vermilion)" }}/>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, var(--frame), transparent)" }}/>
        </div>
      </div>

      {/* 3-slot row */}
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Slot label="药材" sub="HERB" placeholder="拖入生药材"
          filled={!!stagedHerb}
          correct={stagedHerb === expectedHerb}
          onClear={onClearHerb} showHelpers={showHelpers}
          hint={showHelpers ? HERBS[expectedHerb].name : ""}
        >
          {stagedHerb && <HerbSvg herb={stagedHerb} size={64} />}
        </Slot>
        <SlotConnector char="+" />
        <Slot label="辅料" sub="ADJUVANT"
          placeholder={expectedAdj.length === 0 ? "（此方无需辅料）" : "拖入辅料"}
          filled={stagedAdj.length > 0 || expectedAdj.length === 0}
          correct={
            (expectedAdj.length === 0 && stagedAdj.length === 0) ||
            (expectedAdj.every(a => stagedAdj.includes(a)) && stagedAdj.every(a => expectedAdj.includes(a)))
          }
          showHelpers={showHelpers}
          hint={showHelpers && expectedAdj.length ? expectedAdj.map(a => INGREDIENTS[a].name).join(" · ") : ""}
          stack
        >
          {stagedAdj.map(a => (
            <button key={a} onClick={() => onClearAdj(a)} style={{
              appearance: "none", border: 0, background: "transparent", cursor: "pointer", padding: 2,
            }} title="移除">
              <IngredientIcon ing={a} size={36} />
            </button>
          ))}
        </Slot>
        <SlotConnector char="→" />
        <Slot label="器皿" sub="VESSEL" placeholder="左侧选取"
          filled={!!activeVessel}
          correct={activeVessel === expectedVessel}
          onClear={onClearVessel}
          showHelpers={showHelpers}
          hint={showHelpers ? PROCESSING_TYPES[quest.type].name + "·" + VESSELS.find(v => v.id === expectedVessel).name : ""}
        >
          {activeVessel && <VesselSvg vessel={activeVessel} size={76} />}
        </Slot>
      </div>

      {/* Recipe card */}
      {showHelpers && (
        <div style={{
          position: "relative",
          fontSize: 13, color: "var(--ink-soft)",
          fontFamily: "Noto Serif SC,serif", letterSpacing: ".08em",
          padding: "10px 26px",
          background: "linear-gradient(180deg, rgba(244,233,210,.7), rgba(217,198,154,.5))",
          border: "1px solid var(--frame-soft)",
          borderTop: "1px solid var(--gold)",
          borderBottom: "1px solid var(--gold)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.3)",
        }}>
          <span className="f-han" style={{ color: "var(--vermilion)", marginRight: 6 }}>方曰</span>
          {HERBS[expectedHerb].name}
          {expectedAdj.length > 0 && (
            <>
              <span style={{ margin: "0 .35em", color: "var(--ink-faint)" }}>配</span>
              {expectedAdj.map(a => INGREDIENTS[a].name).join("、")}
            </>
          )}
          ， 行 <b style={{ color: "var(--vermilion)" }}>{PROCESSING_TYPES[quest.type].cat}·{PROCESSING_TYPES[quest.type].name}</b> 之法。
        </div>
      )}

      {/* CTA */}
      {canStart ? (
        <button onClick={onStart} style={{
          appearance: "none", border: 0,
          background: "linear-gradient(180deg, #c8442a, #b9341c 60%, #8b2412)",
          color: "#f4e9d2",
          padding: "13px 48px", borderRadius: 2, cursor: "pointer",
          fontFamily: "Ma Shan Zheng,serif", fontSize: 24, letterSpacing: ".4em",
          paddingLeft: "calc(48px + .4em)",
          boxShadow:
            "0 6px 16px rgba(60,20,10,.45)," +
            "inset 0 -2px 0 rgba(0,0,0,.3)," +
            "inset 0 1px 0 rgba(255,200,170,.3)",
          animation: "pulse-soft 1.5s ease-in-out infinite",
        }}>开 始 炮 制</button>
      ) : canStartButWrong ? (
        <div style={{ fontSize: 12, color: "var(--vermilion)",
          fontFamily: "Noto Sans SC,sans-serif", letterSpacing: ".15em" }}>
          ⚠ 器皿不合 · 此方需用「{window.PaozhiData.VESSELS.find(v => v.id === expectedVessel).name}」
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--ink-faint)",
          fontFamily: "Noto Sans SC,sans-serif", letterSpacing: ".15em" }}>
          {!stagedHerb ? "① 自右侧药笼 拖拽生药材" :
            (expectedAdj.length > 0 && stagedAdj.length === 0) ? "② 切换辅料 拖拽配料" :
            !activeVessel ? "③ 自左侧 选取相应器皿" : "请补齐方才"}
        </div>
      )}
    </div>
  );
}

function SlotConnector({ char }) {
  return (
    <div style={{ fontSize: 22, color: "var(--ink-faint)",
      fontFamily: "Ma Shan Zheng,serif", paddingTop: 14 }}>{char}</div>
  );
}

function Slot({ label, sub, placeholder, filled, correct, onClear, children, hint, stack, showHelpers }) {
  const borderColor = filled ? (correct ? "var(--jade)" : "var(--vermilion)") : "var(--frame)";
  const bg = filled
    ? (correct ? "linear-gradient(180deg, rgba(74,107,77,.10), rgba(74,107,77,.04))" : "linear-gradient(180deg, rgba(185,52,28,.08), rgba(185,52,28,.02))")
    : "linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,.1))";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative" }}>
      <div style={{ textAlign: "center" }}>
        <div className="f-han" style={{ fontSize: 14, color: "var(--ink-soft)", letterSpacing: ".3em",
          paddingLeft: ".3em" }}>{label}</div>
        <div style={{ fontSize: 8, color: "var(--ink-faint)", letterSpacing: ".25em",
          fontFamily: "Noto Sans SC,sans-serif" }}>{sub}</div>
      </div>
      <div style={{
        width: 116, height: 116,
        border: `1.5px ${filled ? "solid" : "dashed"} ${borderColor}`,
        background: bg, borderRadius: 2,
        display: "flex", flexDirection: stack ? "row" : "column", flexWrap: "wrap",
        alignItems: "center", justifyContent: "center", gap: 4,
        position: "relative",
        boxShadow: filled
          ? "inset 0 0 0 1px rgba(255,255,255,.4), 0 2px 4px rgba(60,40,20,.08)"
          : "inset 0 0 0 1px rgba(255,255,255,.2)",
        transition: "all .25s",
      }}>
        {/* corner ticks */}
        {[["tl",2,2],["tr",2,2],["bl",2,2],["br",2,2]].map(([pos]) => (
          <div key={pos} style={{
            position: "absolute", width: 6, height: 6,
            borderColor: borderColor, borderStyle: "solid", borderWidth: 0,
            ...(pos.includes("t") ? {top: -1} : {bottom: -1}),
            ...(pos.includes("l") ? {left: -1, borderLeftWidth: 1.5} : {right: -1, borderRightWidth: 1.5}),
            ...(pos.includes("t") ? {borderTopWidth: 1.5} : {borderBottomWidth: 1.5}),
            opacity: filled ? .7 : .4,
          }}/>
        ))}
        {filled ? children :
          <span style={{ fontSize: 10, color: "var(--ink-faint)", textAlign: "center", padding: 6,
            fontFamily: "Noto Sans SC,sans-serif", letterSpacing: ".05em" }}>{placeholder}</span>
        }
        {filled && onClear && (
          <button onClick={onClear} style={{
            position: "absolute", top: 3, right: 3,
            appearance: "none", border: 0, background: "rgba(185,52,28,.9)",
            color: "#f4e9d2", width: 18, height: 18, borderRadius: "50%",
            fontSize: 11, lineHeight: 1, cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,.3)",
          }}>×</button>
        )}
      </div>
      {showHelpers && hint && (
        <div className="f-han" style={{ fontSize: 11, color: "var(--ink-faint)",
          marginTop: 1, letterSpacing: ".1em" }}>
          ⤷ {hint}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
