// 主应用：tab 导航 + 状态管理 + 各诊断阶段串联

const { useState, useEffect } = React;

const STAGES = [
  { id: 'tongue',    cn: '舌诊', en: 'TONGUE',     num: '壹' },
  { id: 'pulse',     cn: '脉诊', en: 'PULSE',      num: '贰' },
  { id: 'wenzhen',   cn: '问诊', en: 'INQUIRY',    num: '叁' },
  { id: 'bianzheng', cn: '辩证', en: 'DIAGNOSIS',  num: '肆' },
  { id: 'xuanfang',  cn: '选方', en: 'PRESCRIBE',  num: '伍' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "default",
  "fontFamily": "serif",
  "showHints": true,
  "anim": "on"
}/*EDITMODE-END*/;

function App() {
  const [stage, setStage] = useState('tongue');
  const [tweaks, setTweaks] = useTweaks(TWEAK_DEFAULTS);

  const [tongueData, setTongueData] = useState({});
  const [pulseData, setPulseData] = useState({});
  const [wenzhenData, setWenzhenData] = useState({});
  const [bianzhengData, setBianzhengData] = useState({});
  const [xuanfangData, setXuanfangData] = useState({});

  // 完成度判定
  const tongueDone = !!(tongueData.color && tongueData.coating && tongueData.shape && tongueData.moisture);
  const pulseDone = !!(pulseData.position && pulseData.quality);
  const wenzhenDone = (wenzhenData.clues || []).length >= 3;
  const bianzhengDone = !!((bianzhengData.selected || []).length > 0 && (bianzhengData.reasoning || '').length >= 10);
  const xuanfangDone = !!((xuanfangData.selected || []).length > 0);

  const stageDone = { tongue: tongueDone, pulse: pulseDone, wenzhen: wenzhenDone, bianzheng: bianzhengDone, xuanfang: xuanfangDone };

  // 主题切换
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    document.documentElement.setAttribute('data-fontfamily', tweaks.fontFamily);
    document.documentElement.setAttribute('data-anim', tweaks.anim);
  }, [tweaks]);

  // 当前 stage 索引
  const idx = STAGES.findIndex(s => s.id === stage);
  const goNext = () => idx < STAGES.length - 1 && setStage(STAGES[idx+1].id);
  const goPrev = () => idx > 0 && setStage(STAGES[idx-1].id);

  // 病例
  const C = window.CASE_DATA;

  // 辩证阶段汇总
  const summary = {
    tongue: tongueDone ? tongueData : null,
    pulse: pulseDone ? pulseData : null,
    clueLabels: (wenzhenData.clues || []).map(cid =>
      C.wenzhen.clues.find(c => c.id === cid)?.label).filter(Boolean)
  };

  let body = null;
  if (stage === 'tongue') {
    body = <TongueDiagnosis data={tongueData} onChange={setTongueData} />;
  } else if (stage === 'pulse') {
    body = <PulseDiagnosis data={pulseData} onChange={setPulseData}
                           classicalText={C.pulse.classical} plainText={C.pulse.plain} />;
  } else if (stage === 'wenzhen') {
    body = <WenZhen data={wenzhenData} onChange={setWenzhenData}
                    caseData={{...C.wenzhen, ...C.patient}}
                    showHints={tweaks.showHints} />;
  } else if (stage === 'bianzheng') {
    body = <BianZheng data={bianzhengData} onChange={setBianzhengData}
                      summary={summary} options={C.bianzheng.options} />;
  } else if (stage === 'xuanfang') {
    body = <XuanFang data={xuanfangData} onChange={setXuanfangData}
                     options={C.fang.options} />;
  }

  const stageMeta = STAGES.find(s => s.id === stage);

  return (
    <div className="app paper-bg">
      {/* 左侧导航 */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-cn">悬壶</div>
          <div className="brand-en">Diagnose · 中医诊室</div>
        </div>
        <ul className="nav-list">
          {STAGES.map((s, i) => (
            <li key={s.id}
                className={'nav-item' + (s.id === stage ? ' active' : '') + (stageDone[s.id] ? ' done' : '')}
                onClick={() => setStage(s.id)}>
              <span className="nav-num"><span className="nav-num-text">{s.num}</span></span>
              <span>
                <span className="nav-label-cn">{s.cn}</span>
                <span className="nav-label-en">{s.en}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="nav-meta">
          初诊病案<br/>
          {C.patient.name} · {C.patient.gender}<br/>
          年 {C.patient.age} · {C.patient.occupation}
        </div>
      </aside>

      {/* 主内容 */}
      <main className="main">
        {/* 顶部 */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">{stageMeta.en} · 第 {idx+1} 诊 / 共 {STAGES.length}</div>
            <h1 className="page-title">{stageMeta.cn}</h1>
            <div className="page-sub">{stageDescription(stage)}</div>
          </div>
          <div className="patient-pill">
            <span className="seal">案</span>
            <span>{C.patient.name} · {C.patient.gender} {C.patient.age} · 主诉「{C.patient.chief}」</span>
          </div>
        </div>

        {/* 内容 */}
        <div className="page-body" style={{ position: 'relative' }}>
          {body}
        </div>

        {/* 底部 */}
        <div className="action-bar">
          <button className="btn btn-ghost" onClick={goPrev} disabled={idx === 0}>
            ← 返回上一诊
          </button>
          <div style={{
            fontSize: 11, color: 'var(--ink-soft)', letterSpacing: 3,
            fontFamily: 'var(--font-fangsong)'
          }}>
            {STAGES.map((s, i) => (
              <span key={s.id} style={{
                color: i === idx ? 'var(--accent)' : (stageDone[s.id] ? 'var(--ink)' : 'var(--ink-faint)'),
                fontWeight: i === idx ? 700 : 400
              }}>
                {s.cn}{i < STAGES.length-1 ? ' › ' : ''}
              </span>
            ))}
          </div>
          {idx < STAGES.length - 1 ? (
            <button className="btn btn-primary" onClick={goNext} disabled={!stageDone[stage]}>
              {stageDone[stage] ? '进入下一诊 →' : '完成本诊后继续'}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={!xuanfangDone}>
              呈递医案 ✓
            </button>
          )}
        </div>
      </main>

      {/* Tweaks */}
      <TweaksPanel>
        <TweakRadio label="主色调" value={tweaks.theme}
                    onChange={v => setTweaks({theme: v})}
                    options={[
                      { value: 'default', label: '赭石（朱砂）' },
                      { value: 'mogreen', label: '墨绿（松柏）' },
                      { value: 'blue',    label: '藏青（远山）' }
                    ]} />
        <TweakRadio label="字体" value={tweaks.fontFamily}
                    onChange={v => setTweaks({fontFamily: v})}
                    options={[
                      { value: 'serif',     label: '思源宋体' },
                      { value: 'kai',       label: '楷体' },
                      { value: 'fangsong',  label: '仿宋' }
                    ]} />
        <TweakToggle label="问诊提示（推荐提问）" value={tweaks.showHints}
                     onChange={v => setTweaks({showHints: v})} />
        <TweakRadio label="动画强度" value={tweaks.anim}
                    onChange={v => setTweaks({anim: v})}
                    options={[
                      { value: 'on',  label: '正常' },
                      { value: 'off', label: '减弱（无障碍）' }
                    ]} />
      </TweaksPanel>
    </div>
  );
}

function stageDescription(s) {
  switch(s) {
    case 'tongue': return '望诊之要 · 观舌察脏腑寒热虚实';
    case 'pulse': return '切诊之妙 · 三指按候寸关尺';
    case 'wenzhen': return '问诊之详 · 详询起居方知病机';
    case 'bianzheng': return '四诊合参 · 辩明证型立法度';
    case 'xuanfang': return '理法方药 · 因证立方拟主治';
    default: return '';
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
