// 门厅页面：NPC 浮窗 + 病案弹窗
// 独立页面入口，"开始诊断"跳转到诊断页

const { useState, useEffect } = React;

function ClinicEntry() {
  // 'idle' → 等待玩家点击门铃
  // 'chat-open' → 阿青对话浮窗
  // 'intro-open' → 病案弹窗
  const [phase, setPhase] = useState('idle');
  const [npcLineIdx, setNpcLineIdx] = useState(0);

  const C = window.CASE_DATA;
  const lines = C.patient.npc_lines || [];

  const onStartCase = () => {
    // 跳转到诊断页（保留 query 参数以便扩展）
    window.location.href = '中医诊断游戏.html?case=' + encodeURIComponent(C.patient.name);
  };

  return (
    <div className="entry-stage">
      {/* 背景：诊室场景 */}
      <ClinicScene />

      {/* 顶部品牌 */}
      <div className="entry-brand">
        <div className="entry-brand-cn">悬 壶</div>
        <div className="entry-brand-sub">诊 室 · 门 厅</div>
      </div>

      {/* 中央提示 */}
      <div className="entry-hint">
        <div style={{
          fontFamily: 'var(--font-kai)', fontSize: 22,
          letterSpacing: 8, color: 'var(--paper)',
          marginBottom: 8, fontWeight: 500
        }}>晨光熹微 · 药香满室</div>
        <div style={{
          fontSize: 13, color: 'var(--paper-deep)',
          fontFamily: 'var(--font-fangsong)', letterSpacing: 4,
          opacity: 0.85
        }}>—— 药童阿青候于门外 · 似有要事相告 ——</div>
        <div style={{
          marginTop: 24,
          fontSize: 11, color: 'var(--paper-deep)',
          letterSpacing: 6, opacity: 0.6,
          fontFamily: 'var(--font-fangsong)'
        }}>
          {phase === 'idle' && '⤓  点击右下角「徒」字门铃以听报  ⤓'}
        </div>
      </div>

      {/* NPC 门铃常驻 */}
      <NpcDoorbell
        onOpen={() => setPhase('chat-open')}
        hasNotice={phase === 'idle'} />

      {phase === 'chat-open' && (
        <NpcChat
          lines={lines}
          lineIdx={npcLineIdx}
          onAdvance={() => setNpcLineIdx(i => Math.min(i+1, lines.length - 1))}
          onClose={() => setPhase('idle')}
          onAcceptCase={() => setPhase('intro-open')} />
      )}

      {phase === 'intro-open' && (
        <CaseIntroModal
          patient={C.patient}
          onStart={onStartCase}
          onClose={() => setPhase('chat-open')} />
      )}
    </div>
  );
}

// 简单的诊室门厅场景（水墨横屏背景）
const ClinicScene = () => (
  <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
       style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3a2f24" />
        <stop offset="50%" stopColor="#2a241d" />
        <stop offset="100%" stopColor="#1a1410" />
      </linearGradient>
      <linearGradient id="lampGlow" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#f4d88a" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#f4d88a" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f4ead5" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#f4ead5" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* 背景 */}
    <rect width="1440" height="900" fill="url(#skyGrad)" />

    {/* 远山轮廓 */}
    <path d="M 0 480 L 200 380 L 380 440 L 560 360 L 760 420 L 940 360 L 1140 410 L 1440 380 L 1440 600 L 0 600 Z"
          fill="#1a1410" opacity="0.6" />
    <path d="M 0 540 L 240 460 L 480 510 L 720 440 L 960 500 L 1200 450 L 1440 490 L 1440 700 L 0 700 Z"
          fill="#0e0a07" opacity="0.7" />

    {/* 月光晕 */}
    <circle cx="1200" cy="200" r="240" fill="url(#moonGlow)" />
    <circle cx="1200" cy="200" r="36" fill="#f4ead5" opacity="0.5" />

    {/* 屋檐 - 左侧 */}
    <g>
      {/* 屋顶斜面 */}
      <path d="M -50 280 L 380 200 L 540 240 L 540 380 L -50 380 Z"
            fill="#1a0e08" />
      {/* 瓦楞 */}
      {Array.from({length: 18}).map((_, i) => (
        <line key={i}
              x1={-50 + i*32} y1={280 + i*4}
              x2={520 + i*1} y2={240 + i*8}
              stroke="#2a1a0e" strokeWidth="0.8" opacity="0.6" />
      ))}
      {/* 飞檐翘角 */}
      <path d="M 540 240 Q 580 230 600 250 Q 590 260 560 258 Z"
            fill="#1a0e08" />
      {/* 檐下立柱 */}
      <rect x="60" y="380" width="14" height="520" fill="#2a1a0e" />
      <rect x="380" y="380" width="14" height="520" fill="#2a1a0e" />
      {/* 牌匾 */}
      <rect x="120" y="300" width="240" height="60" fill="#1a0e08" stroke="#8a5a2e" strokeWidth="2" />
      <text x="240" y="340" textAnchor="middle"
            fontFamily="var(--font-kai)" fontSize="32"
            fill="#b08d3f" letterSpacing="12">悬壶济世</text>
      {/* 灯笼 */}
      <ellipse cx="100" cy="430" rx="22" ry="32" fill="#a8442a" />
      <ellipse cx="100" cy="430" rx="22" ry="32" fill="url(#lampGlow)" />
      <rect x="96" y="395" width="8" height="10" fill="#2a1a0e" />
      <rect x="84" y="463" width="32" height="6" fill="#b08d3f" />
      <text x="100" y="436" textAnchor="middle"
            fontFamily="var(--font-kai)" fontSize="20"
            fill="#f4d88a" letterSpacing="0">医</text>

      <ellipse cx="420" cy="430" rx="22" ry="32" fill="#a8442a" />
      <ellipse cx="420" cy="430" rx="22" ry="32" fill="url(#lampGlow)" />
      <rect x="416" y="395" width="8" height="10" fill="#2a1a0e" />
      <rect x="404" y="463" width="32" height="6" fill="#b08d3f" />
      <text x="420" y="436" textAnchor="middle"
            fontFamily="var(--font-kai)" fontSize="20"
            fill="#f4d88a" letterSpacing="0">药</text>
    </g>

    {/* 右侧屋檐（对称缩略） */}
    <g>
      <path d="M 1490 280 L 1060 200 L 900 240 L 900 380 L 1490 380 Z"
            fill="#1a0e08" />
      <rect x="1380" y="380" width="14" height="520" fill="#2a1a0e" />
      <rect x="1060" y="380" width="14" height="520" fill="#2a1a0e" />
    </g>

    {/* 中央 - 远景门廊 */}
    <g>
      <rect x="540" y="380" width="360" height="520" fill="#0a0604" opacity="0.85" />
      <rect x="540" y="380" width="360" height="6" fill="#3a2a1c" />
      {/* 门 - 里面有暖光 */}
      <rect x="640" y="500" width="160" height="320" fill="#3a2a1c" />
      <rect x="650" y="510" width="60" height="300" fill="#7a5a2e" opacity="0.4" />
      <rect x="730" y="510" width="60" height="300" fill="#7a5a2e" opacity="0.4" />
      <rect x="640" y="500" width="160" height="320" fill="url(#lampGlow)" opacity="0.8" />
      {/* 门环 */}
      <circle cx="700" cy="660" r="6" fill="#b08d3f" />
      <circle cx="740" cy="660" r="6" fill="#b08d3f" />
    </g>

    {/* 地砖 */}
    <rect x="0" y="800" width="1440" height="100" fill="#0a0604" />
    {Array.from({length: 12}).map((_, i) => (
      <line key={i}
            x1={120 * i} y1="800"
            x2={120 * i} y2="900"
            stroke="#2a1a0e" strokeWidth="1" opacity="0.5" />
    ))}

    {/* 飘落的细微落叶/烟 */}
    {Array.from({length: 14}).map((_, i) => (
      <circle key={i}
              cx={Math.random() * 1440}
              cy={Math.random() * 700}
              r={0.8 + Math.random() * 1.2}
              fill="#f4ead5" opacity={0.15 + Math.random() * 0.2}>
        <animate attributeName="cy"
                 values={`${Math.random()*200};${800 + Math.random()*100}`}
                 dur={`${10 + Math.random()*8}s`}
                 repeatCount="indefinite" />
      </circle>
    ))}

    {/* 地面雾气 */}
    <ellipse cx="720" cy="800" rx="600" ry="40" fill="#f4ead5" opacity="0.06" />
  </svg>
);

ReactDOM.createRoot(document.getElementById('root')).render(<ClinicEntry />);
