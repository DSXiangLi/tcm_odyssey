// 脉诊页面
const PulseDiagnosis = ({ data, onChange, classicalText, plainText }) => {
  const [activeFinger, setActiveFinger] = React.useState('关');
  const [showPlain, setShowPlain] = React.useState(false);

  const positions = ['寸', '关', '尺'];
  const qualities = ['浮紧', '沉细', '弦数', '濡缓', '滑实', '虚弱', '洪大', '迟缓'];

  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, height: '100%' }}>
      {/* 左：脉动可视 */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="field-label">手腕脉位 · 三指按候</div>
        <div style={{
          flex: 1,
          background: 'linear-gradient(180deg, #2a1f15, #1a1208)',
          border: '1px solid var(--paper-deep)',
          padding: 32,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative'
        }}>
          {/* 手腕示意 */}
          <svg viewBox="0 0 600 280" width="520" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="armSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e8c8a0" />
                <stop offset="100%" stopColor="#c89870" />
              </linearGradient>
            </defs>
            {/* 手臂 */}
            <path d="M 0 120 Q 100 80 220 95 L 220 185 Q 100 200 0 160 Z"
                  fill="url(#armSkin)" opacity="0.85" />
            {/* 手掌 */}
            <path d="M 220 95
                     Q 380 70 460 100
                     Q 540 130 560 175
                     Q 530 215 460 215
                     Q 380 200 220 185 Z"
                  fill="url(#armSkin)" opacity="0.9" />
            {/* 拇指 */}
            <path d="M 540 130 Q 580 90 575 60 Q 545 70 535 105 Z"
                  fill="url(#armSkin)" />
            {/* 腕横纹 */}
            <path d="M 218 95 Q 222 140 218 185"
                  stroke="#a07050" strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M 230 100 Q 234 140 230 180"
                  stroke="#a07050" strokeWidth="0.8" fill="none" opacity="0.4" />

            {/* 三个脉位 - 寸关尺 */}
            {positions.map((pos, i) => {
              const cx = 290 + i * 55;
              const cy = 140;
              const isActive = activeFinger === pos;
              const isCorrect = data.position === pos;
              return (
                <g key={pos} onClick={() => { setActiveFinger(pos); set('position', pos); }}
                   style={{ cursor: 'pointer' }}>
                  {/* 脉动光晕 */}
                  <circle cx={cx} cy={cy} r="34"
                          fill={isCorrect ? '#a8442a' : '#c97557'}
                          opacity="0.15">
                    <animate attributeName="r" values="28;42;28" dur="0.9s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.25;0.05;0.25" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r="22"
                          fill={isCorrect ? '#a8442a' : '#c97557'}
                          opacity="0.35">
                    <animate attributeName="r" values="18;26;18" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                  {/* 中心点 */}
                  <circle cx={cx} cy={cy} r="10"
                          fill={isActive ? '#f1e6cc' : '#8a6f3e'}
                          stroke={isActive ? '#a8442a' : 'transparent'}
                          strokeWidth="2" />
                  {/* 指印 */}
                  {isActive && (
                    <ellipse cx={cx} cy={cy - 30} rx="18" ry="22"
                             fill="#e8c8a0" stroke="#a07050" strokeWidth="1" opacity="0.8" />
                  )}
                  {/* 标签 */}
                  <text x={cx} y={cy + 60} textAnchor="middle"
                        fontFamily="var(--font-kai)" fontSize="20"
                        fill={isActive ? '#f1e6cc' : '#c8a878'}
                        letterSpacing="2">
                    {pos}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 脉象波形 */}
          <div style={{
            marginTop: 20, width: '100%',
            background: 'rgba(241,230,204,0.05)',
            border: '1px solid rgba(241,230,204,0.15)',
            padding: '14px 18px'
          }}>
            <div style={{
              fontSize: 11, letterSpacing: 3, color: '#c8a878',
              fontFamily: 'var(--font-fangsong)', marginBottom: 8
            }}>
              {activeFinger}部脉象波形 · 实时
            </div>
            <svg viewBox="0 0 500 60" width="100%" height="60">
              <defs>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a8442a" stopOpacity="0" />
                  <stop offset="50%" stopColor="#c97557" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a8442a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* 中线 */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#5a4a3a" strokeWidth="0.5" strokeDasharray="2 4" />
              {/* 濡缓波形：低幅、平缓 */}
              <path d="M 0 30
                       Q 25 22 50 30
                       Q 75 38 100 30
                       Q 125 20 150 30
                       Q 175 38 200 30
                       Q 225 22 250 30
                       Q 275 38 300 30
                       Q 325 20 350 30
                       Q 375 38 400 30
                       Q 425 22 450 30
                       Q 475 38 500 30"
                    fill="none" stroke="url(#waveGrad)" strokeWidth="2">
                <animate attributeName="stroke-dashoffset" from="0" to="-100"
                         dur="2s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
        </div>
      </div>

      {/* 右：古文 + 选项 */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 师训古文 */}
        <div style={{
          background: 'var(--paper-2)',
          border: '1px solid var(--paper-deep)',
          padding: '20px 22px',
          marginBottom: 20,
          position: 'relative'
        }}>
          <div style={{
            fontSize: 11, letterSpacing: 4, color: 'var(--accent)',
            marginBottom: 10, display: 'flex', justifyContent: 'space-between'
          }}>
            <span>老中医诊脉录</span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setShowPlain(!showPlain)}>
              {showPlain ? '观古文' : '听白话'}
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--font-kai)',
            fontSize: showPlain ? 14 : 16,
            color: 'var(--ink)',
            letterSpacing: showPlain ? 1 : 2,
            lineHeight: 1.9,
            textIndent: showPlain ? 0 : '2em'
          }}>
            {showPlain ? plainText : classicalText}
          </div>
        </div>

        {/* 脉位选择 */}
        <div style={{ marginBottom: 22 }}>
          <h3 className="section-title">主病脉位</h3>
          <div className="chip-group">
            {positions.map(p => (
              <button key={p}
                      className={'chip' + (data.position === p ? ' selected accent' : '')}
                      onClick={() => set('position', p)}>{p}部</button>
            ))}
          </div>
        </div>

        {/* 脉势选择 */}
        <div>
          <h3 className="section-title">脉象（脉势）</h3>
          <div className="chip-group">
            {qualities.map(q => (
              <button key={q}
                      className={'chip' + (data.quality === q ? ' selected accent' : '')}
                      onClick={() => set('quality', q)}>{q}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <textarea
            className="textarea" rows="3"
            placeholder="补充：脉象其它特点……"
            value={data.notes || ''}
            onChange={e => set('notes', e.target.value)} />
        </div>
      </div>
    </div>
  );
};

window.PulseDiagnosis = PulseDiagnosis;
