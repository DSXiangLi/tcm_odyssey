const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = JSON.parse(
  document.getElementById('tweak-defaults').textContent
    .replace(/\/\*EDITMODE-BEGIN\*\//,'')
    .replace(/\/\*EDITMODE-END\*\//,'')
);

// Target formulas — shown to player as goal, without exposing exact herbs
const FORMULAS = [
  { name:'四君子汤', hint:'补气健脾 · 4味', count:4,
    correct:['renshen','baizhu','fuling','gancao'] },
  { name:'桂枝汤',   hint:'解表和营 · 5味', count:5,
    correct:['rougui','baishao','shengjiang','dazao','gancao'] },
  { name:'六味地黄', hint:'滋阴补肾 · 6味', count:6,
    correct:['shudi','gouqi','fuling','chenpi','baishao','juhua'] },
  { name:'银翘散',   hint:'辛凉解表 · 4味', count:4,
    correct:['jinyinhua','bohe','juhua','gancao'] },
  { name:'逍遥散',   hint:'疏肝解郁 · 5味', count:5,
    correct:['danggui','baishao','baizhu','fuling','gancao'] },
];

function mixColors(colors) {
  if (!colors.length) return { r:90, g:60, b:30 };
  let r=0,g=0,b=0;
  colors.forEach(c=>{
    const m = c.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if(!m) return;
    r += parseInt(m[1],16); g += parseInt(m[2],16); b += parseInt(m[3],16);
  });
  const n = colors.length;
  return { r: r/n|0, g: g/n|0, b: b/n|0 };
}

function Steam() {
  return (
    <div className="steam">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`steam-puff s${i}`} style={{'--dx': `${(i%2?-1:1)*(8+i*3)}px`}} />
      ))}
    </div>
  );
}

function PotArea({ inPot, finished }) {
  const accentColors = inPot.map(h=>h.pal[Object.keys(h.pal)[1]]||'#8a5028');
  const mix = mixColors(accentColors);
  const liquidColor = `rgb(${mix.r},${mix.g},${mix.b})`;
  return (
    <div className="pot-wrap">
      <div className="pot-body" style={{
        boxShadow: finished
          ? 'inset 4px 4px 0 rgba(255,220,140,.5), inset -4px -4px 0 rgba(0,0,0,.5), 0 0 20px rgba(255,210,74,.6)'
          : undefined
      }}/>
      <div className="pot-rim"/>
      <div className="pot-liquid" style={{
        background: `radial-gradient(ellipse at 50% 50%, ${liquidColor} 0%, rgba(58,26,10,.9) 100%)`
      }}/>
      <div className="pot-handle l"/>
      <div className="pot-handle r"/>
      {inPot.slice(0,4).map((h,i)=>(
        <div key={i} style={{
          position:'absolute', left:`${16+i*12}%`, top:`24%`,
          width:6,height:6,
          background: h.pal[Object.keys(h.pal)[1]]||'#8a5028',
          border:'1px solid #2a1408',
          animation:'liquidRipple 2s ease-in-out infinite',
          animationDelay:`${i*.2}s`
        }}/>
      ))}
    </div>
  );
}

function StoveScene({ inPot, finished, showSteam, shake }) {
  return (
    <div className={`stove-area ${shake?`shake-${shake}`:''}`}>
      <div className="pixel-canvas">
        <div className="floor"/>
        <div className="stove-shadow"/>
        <div className="stove-body"/>
        <div className="stove-top"/>
        <div className="fire-hole">
          {[1,2,3,4].map(i=><div key={i} className={`flame f${i}`}/>)}
          {[...Array(6)].map((_,i)=>(
            <div key={i} className="ember-spark" style={{
              left:`${10+i*14}%`,
              '--drift':`${(i%2?-1:1)*(10+i*4)}px`,
              animationDelay:`${i*.35}s`
            }}/>
          ))}
        </div>
        <PotArea inPot={inPot} finished={finished}/>
        <div className="ladle">
          <div className="ladle-stick"/>
          <div className="ladle-scoop"/>
        </div>
        {showSteam && <Steam/>}
      </div>
      {finished && <div className="gold-burst" style={{'--x':'50%','--y':'55%'}}/>}
    </div>
  );
}

function HerbTag({ herb, onDragStart, onDragEnd, dragging }) {
  return (
    <div className={`tag ${dragging?'dragging':''}`}
      draggable onDragStart={(e)=>onDragStart(e, herb)} onDragEnd={onDragEnd}>
      <div className="tag-string"/>
      <div className="tag-plank">
        <div className="herb-icon">{window.pixelSprite(herb.grid, herb.pal, 3)}</div>
        <div className="tag-name">{herb.name}</div>
        <div className="tag-prop">{herb.prop}</div>
      </div>
      <div className="tag-count">×{herb.count}</div>
    </div>
  );
}

function Vial({ formula, empty, glow }) {
  if (empty) {
    return (
      <div className="vial vial-empty">
        <div className="vial-cap"/>
        <div className="vial-body"/>
      </div>
    );
  }
  const accent = formula?.color || '#6a9c7e';
  return (
    <div className={`vial ${glow?'gold-glow':''}`}>
      <div className="vial-cap"/>
      <div className="vial-neck"/>
      <div className="vial-body">
        <div className="vial-liquid" style={{
          height:'70%',
          background:`linear-gradient(180deg, ${accent}cc 0%, ${accent} 100%)`
        }}/>
      </div>
      <div className="vial-label">{formula?.name || '药'}</div>
    </div>
  );
}

function TargetScroll({ formula, progress, filled }) {
  return (
    <div className="target-scroll">
      <div className="rod"/>
      <div className="parchment">
        <div className="tgt-label">今 日 医 嘱</div>
        <div className="tgt-name">{formula.name}</div>
        <div className="tgt-clue">{formula.hint}</div>
        <div className="tgt-progress">
          {[...Array(formula.count)].map((_,i)=>(
            <div key={i} className={`tgt-dot ${i<filled?'on':''}`}/>
          ))}
        </div>
      </div>
      <div className="rod"/>
    </div>
  );
}

function DropBurst({ kind, x, y }) {
  // kind: 'ok' => golden radiant burst + ring + 中文印章
  //       'bad' => crimson X + smoke + red sparks
  const rays = [...Array(12)].map((_,i)=>({i, a: i*30}));
  const sparks = [...Array(10)].map((_,i)=>({
    i,
    dx: Math.cos(i*0.628)*(30+Math.random()*30),
    dy: Math.sin(i*0.628)*(30+Math.random()*30) - 20,
  }));
  return (
    <div className={`drop-burst burst-${kind}`} style={{left:x, top:y}}>
      <div className="burst-ring"/>
      <div className="burst-ring burst-ring-2"/>
      {kind==='ok' && rays.map(r=>(
        <div key={r.i} className="burst-ray" style={{transform:`rotate(${r.a}deg) translateY(-8px)`}}/>
      ))}
      {kind==='ok' && <div className="burst-stamp">合</div>}
      {kind==='bad' && <div className="burst-cross"><span/><span/></div>}
      {kind==='bad' && <div className="burst-smoke"/>}
      {sparks.map(s=>(
        <div key={s.i} className="burst-spark"
          style={{'--dx':`${s.dx}px`, '--dy':`${s.dy}px`}}/>
      ))}
    </div>
  );
}

function App() {
  const [frame, setFrame] = useState(TWEAK_DEFAULTS.frame);
  const [progress, setProgress] = useState(0);
  const [state, setStateVal] = useState(TWEAK_DEFAULTS.state);
  const [herbs] = useState(window.HERBS);
  const [target, setTarget] = useState(FORMULAS[0]);
  const [inPot, setInPot] = useState([]);
  const [bursts, setBursts] = useState([]); // {id, kind:'ok'|'bad', x, y}
  const [potShake, setPotShake] = useState(null); // 'ok' | 'bad' | null
  const [finishedVials, setFinishedVials] = useState([
    {name:'四君子汤', color:'#c89550'},
    {name:'银翘散',   color:'#6a8c78'},
    null, null, null,
  ]);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({x:0,y:0});
  const [trails, setTrails] = useState([]);
  const [splashes, setSplashes] = useState([]);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const potRef = useRef(null);

  useEffect(()=>{
    const listener = (e)=>{
      if(!e.data || typeof e.data!=='object') return;
      if(e.data.type==='__activate_edit_mode') setTweaksOpen(true);
      if(e.data.type==='__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', listener);
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
    return ()=>window.removeEventListener('message', listener);
  },[]);

  useEffect(()=>{
    document.getElementById('tweaks').classList.toggle('active', tweaksOpen);
  },[tweaksOpen]);

  useEffect(()=>{
    const frameSel = document.getElementById('tw-frame');
    const heatSlider = document.getElementById('tw-heat');
    const stateSel = document.getElementById('tw-state');
    const heatVal = document.getElementById('heat-val');
    frameSel.value = frame;
    heatSlider.value = progress;
    stateSel.value = state;
    heatVal.textContent = progress;
    const fh = ()=>{ setFrame(frameSel.value); persist({frame: frameSel.value}); };
    const hh = ()=>{ setProgress(+heatSlider.value); heatVal.textContent = heatSlider.value; persist({heat: +heatSlider.value}); };
    const sh = ()=>{ setStateVal(stateSel.value); persist({state: stateSel.value}); };
    frameSel.addEventListener('change', fh);
    heatSlider.addEventListener('input', hh);
    stateSel.addEventListener('change', sh);
    return ()=>{
      frameSel.removeEventListener('change', fh);
      heatSlider.removeEventListener('input', hh);
      stateSel.removeEventListener('change', sh);
    };
  },[tweaksOpen, frame, progress, state]);

  function persist(edits){ window.parent.postMessage({type:'__edit_mode_set_keys', edits},'*'); }

  // brewing progress bar
  useEffect(()=>{
    if(state!=='brewing') return;
    const t = setInterval(()=>{
      setProgress(p => {
        if (inPot.length === 0) return Math.max(0, p - 0.5);
        const np = p + 0.8;
        if(np >= 100) return 100;
        return np;
      });
    }, 200);
    return ()=>clearInterval(t);
  },[state, inPot.length]);

  const handleDragStart = (e, herb) => {
    setDragging(herb);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    e.dataTransfer.setDragImage(img,0,0);
  };
  const handleDragEnd = ()=>{ setDragging(null); setDragPos({x:0,y:0}); };

  useEffect(()=>{
    if(!dragging) return;
    const onMove = (e)=>{
      setDragPos({x:e.clientX, y:e.clientY});
      if(Math.random()<.45){
        const id = Math.random();
        setTrails(t=>[...t.slice(-18), {id, x:e.clientX+(Math.random()-.5)*14, y:e.clientY+(Math.random()-.5)*14}]);
        setTimeout(()=>setTrails(t=>t.filter(x=>x.id!==id)), 600);
      }
    };
    window.addEventListener('dragover', onMove);
    return ()=>window.removeEventListener('dragover', onMove);
  },[dragging]);

  const handlePotDrop = (e)=>{
    e.preventDefault();
    if(!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const isCorrect = target.correct && target.correct.includes(dragging.id);
    const alreadyIn = inPot.some(h=>h.id===dragging.id);
    // wrong: not in recipe OR already added
    if(!isCorrect || alreadyIn || inPot.length >= target.count){
      // BAD burst — red sparks + smoke puff + shake
      const id = Math.random();
      setBursts(b=>[...b, {id, kind:'bad', x:sx, y:sy}]);
      setTimeout(()=>setBursts(b=>b.filter(x=>x.id!==id)), 1100);
      setPotShake('bad');
      setTimeout(()=>setPotShake(null), 600);
      setDragging(null);
      return;
    }
    // CORRECT burst — golden radiant sparks + ring
    const id = Math.random();
    setBursts(b=>[...b, {id, kind:'ok', x:sx, y:sy}]);
    setTimeout(()=>setBursts(b=>b.filter(x=>x.id!==id)), 1400);
    setPotShake('ok');
    setTimeout(()=>setPotShake(null), 500);
    // splash droplets
    const splashSet = [...Array(8)].map(()=>({
      id: Math.random(), x:sx, y:sy,
      dx:(Math.random()-.5)*40, dy:-20-Math.random()*30
    }));
    setSplashes(s=>[...s, ...splashSet]);
    setTimeout(()=>setSplashes(s=>s.filter(x=>!splashSet.find(y=>y.id===x.id))), 900);
    setInPot(p=>[...p, dragging]);
    setDragging(null);
  };

  const brew = ()=>{
    if(inPot.length===0) return;
    setStateVal('done');
    const colors = inPot.map(h=>h.pal[Object.keys(h.pal)[1]]||'#8a5028');
    const mix = mixColors(colors);
    const vial = { name: target.name, color: `rgb(${mix.r},${mix.g},${mix.b})` };
    setFinishedVials(vs=>{
      const copy = [...vs];
      const emptyIdx = copy.findIndex(v=>v===null);
      if(emptyIdx>=0) copy[emptyIdx] = vial;
      return copy;
    });
    setTimeout(()=>{
      setInPot([]);
      setProgress(0);
      setTarget(FORMULAS[Math.floor(Math.random()*FORMULAS.length)]);
      setStateVal('brewing');
    }, 2600);
  };

  const finished = state==='done';
  const canBrew = inPot.length === target.count && progress >= 100;
  const progressLabel = progress<33 ? '武火起' : progress<75 ? '文火煨' : progress>=100 ? '已煎成' : '将成';

  return (
    <>
      <div className={`scroll-modal variant-${frame}`}>
        <div className="roller top"/>
        <div className="roller bottom"/>
        <div className="roller-cap left"/>
        <div className="roller-cap right"/>

        <div className="paper">
          <div className="seal tl"><span className="s1">杏</span><span className="s2">林</span></div>
          <div className="seal br small">煎<br/>煮</div>

          <div className="title-bar">
            <div className="deco"/>
            <div className="ch">煎 药</div>
            <div className="sub">壬寅春</div>
            <div className="deco"/>
          </div>

          <button className="close-btn">×</button>

          <div className="content">
            <div className="region region-stove">
              <div className="region-label">丹灶</div>

              <TargetScroll formula={target} progress={progress} filled={inPot.length}/>

              <div className="cook-hud">
                <div className="hud-label">煎药</div>
                <div className="heat-bar">
                  <div className="heat-fill" style={{width:`${progress}%`}}/>
                  <div className="heat-zone" style={{left:'33%'}}/>
                  <div className="heat-zone" style={{left:'75%'}}/>
                  <div className="heat-ticks">
                    {[...Array(10)].map((_,i)=><span key={i}/>)}
                  </div>
                </div>
                <div className="hud-label">{progressLabel}</div>
              </div>

              <div onDragOver={(e)=>e.preventDefault()} onDrop={handlePotDrop} style={{position:'absolute',inset:0}}>
                <StoveScene inPot={inPot} finished={finished} showSteam={progress>10} shake={potShake}/>
              </div>

              <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
                {splashes.map(s=>(
                  <div key={s.id} className="splash" style={{
                    left:s.x, top:s.y, '--sx':`${s.dx}px`, '--sy':`${s.dy}px`
                  }}/>
                ))}
                {bursts.map(b=>(
                  <DropBurst key={b.id} kind={b.kind} x={b.x} y={b.y}/>
                ))}
              </div>

              <div className="formula-slots two-rows">
                {[...Array(target.count)].map((_,i)=>{
                  const h = inPot[i];
                  return (
                    <div key={i} className={`slot ${h?'filled':''}`}>
                      {h ? <span className="slot-name">{h.name}</span> : <span className="slot-plus">+</span>}
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
                {herbs.map(h=>(
                  <HerbTag key={h.id} herb={h}
                    onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                    dragging={dragging?.id===h.id}/>
                ))}
              </div>
            </div>

            <div className="region region-vials">
              <button className="brew-btn" onClick={brew} disabled={!inPot.length}>
                {finished ? '煎成' : '起 锅'}
              </button>
              <div className="vials-area">
                <div className="vials-header">
                  <div className="vials-title">药 剂</div>
                  <div className="vials-hint">已成 {finishedVials.filter(v=>v).length} 方 · 入杏林柜</div>
                </div>
                <div className="vials-shelf">
                  {finishedVials.map((v,i)=>(
                    <Vial key={i} formula={v} empty={!v}
                      glow={finished && v && i===finishedVials.findLastIndex(x=>x)}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dragging && (
        <div className="drag-ghost" style={{left:dragPos.x, top:dragPos.y}}>
          <div className="tag-plank" style={{transform:'scale(1.1)'}}>
            <div className="herb-icon">{window.pixelSprite(dragging.grid, dragging.pal, 3)}</div>
            <div className="tag-name">{dragging.name}</div>
          </div>
        </div>
      )}

      {trails.map(t=>(
        <div key={t.id} className="drag-trail" style={{left:t.x, top:t.y}}/>
      ))}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
