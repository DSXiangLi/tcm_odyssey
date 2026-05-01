// 共享 SVG 资产 + 通用小组件
// （舌象、患者立绘、印章、装饰）

const TongueImage = ({ size = 280 }) => (
  <svg viewBox="0 0 320 360" width={size} height={size * 360/320}
       style={{ display: 'block' }}>
    <defs>
      <radialGradient id="tongueBody" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stopColor="#f4d4ce" />
        <stop offset="60%" stopColor="#e8b9b1" />
        <stop offset="100%" stopColor="#c89187" />
      </radialGradient>
      <radialGradient id="coatingFog" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#fbf5e8" stopOpacity="0.92" />
        <stop offset="60%" stopColor="#f0e7d2" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#e0d4b8" stopOpacity="0.4" />
      </radialGradient>
      <radialGradient id="moistShine" cx="40%" cy="25%" r="30%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id="softBlur"><feGaussianBlur stdDeviation="2" /></filter>
    </defs>

    {/* 口腔阴影 */}
    <ellipse cx="160" cy="180" rx="135" ry="160"
             fill="#3d1a18" opacity="0.6" />

    {/* 舌体 - 胖大 */}
    <path d="M 60 130
             Q 60 80 160 75
             Q 260 80 260 130
             Q 270 230 230 295
             Q 200 330 160 332
             Q 120 330 90 295
             Q 50 230 60 130 Z"
          fill="url(#tongueBody)" />

    {/* 齿痕 - 边缘的锯齿 */}
    {[0,1,2,3,4].map(i => (
      <ellipse key={'l'+i} cx={62 + i*2} cy={150 + i*30} rx="6" ry="4"
               fill="#c08378" opacity="0.7" />
    ))}
    {[0,1,2,3,4].map(i => (
      <ellipse key={'r'+i} cx={258 - i*2} cy={150 + i*30} rx="6" ry="4"
               fill="#c08378" opacity="0.7" />
    ))}

    {/* 白厚腻苔 */}
    <path d="M 80 125
             Q 80 90 160 88
             Q 240 90 240 125
             Q 248 220 215 280
             Q 190 312 160 314
             Q 130 312 105 280
             Q 72 220 80 125 Z"
          fill="url(#coatingFog)" filter="url(#softBlur)" />

    {/* 苔的颗粒纹理 */}
    {Array.from({length: 60}).map((_,i) => {
      const x = 90 + Math.random()*140;
      const y = 100 + Math.random()*200;
      return <circle key={i} cx={x} cy={y} r={1.5+Math.random()*1.5}
                     fill="#fbf6e6" opacity={0.5+Math.random()*0.4} />;
    })}

    {/* 中线 */}
    <path d="M 160 110 Q 158 200 160 290"
          stroke="#a8746a" strokeWidth="1" fill="none" opacity="0.5" />

    {/* 水滑高光 */}
    <ellipse cx="135" cy="160" rx="35" ry="22"
             fill="url(#moistShine)" />
    <ellipse cx="200" cy="190" rx="18" ry="10"
             fill="url(#moistShine)" opacity="0.7" />

    {/* 轻微暗影 */}
    <ellipse cx="160" cy="320" rx="80" ry="8" fill="#000" opacity="0.15" />
  </svg>
);

// 患者立绘：写实国风 - 茶商妇人
const PatientPortrait = ({ height = 560 }) => (
  <svg viewBox="0 0 360 720" height={height} style={{ display: 'block' }}>
    <defs>
      <linearGradient id="robeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#5a6b58" />
        <stop offset="100%" stopColor="#3a4a3a" />
      </linearGradient>
      <linearGradient id="innerRobe" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#c9a974" />
        <stop offset="100%" stopColor="#8a6f3e" />
      </linearGradient>
      <radialGradient id="faceGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#e8d3a8" />
        <stop offset="100%" stopColor="#c9a877" />
      </radialGradient>
      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1a1410" />
        <stop offset="100%" stopColor="#2d2118" />
      </linearGradient>
      <radialGradient id="bgHalo" cx="50%" cy="35%" r="45%">
        <stop offset="0%" stopColor="#f4ead5" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#f4ead5" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* 背景光晕 */}
    <rect x="0" y="0" width="360" height="720" fill="url(#bgHalo)" />

    {/* 椅背 - 暗示坐姿 */}
    <rect x="40" y="380" width="280" height="340" fill="#3a2a1c" opacity="0.25" />
    <rect x="40" y="380" width="280" height="6" fill="#5a3e26" opacity="0.4" />

    {/* 外袍 */}
    <path d="M 60 340
             Q 80 300 130 285
             L 230 285
             Q 280 300 300 340
             L 320 720
             L 40 720 Z"
          fill="url(#robeGrad)" />

    {/* 内衬 - V领 */}
    <path d="M 145 290
             L 180 380
             L 215 290
             L 225 320
             L 180 420
             L 135 320 Z"
          fill="url(#innerRobe)" />

    {/* 衣领花纹 - 简单的回纹 */}
    <path d="M 140 295 L 220 295" stroke="#8a6f3e" strokeWidth="1.5" opacity="0.6" />
    <path d="M 138 305 L 222 305" stroke="#8a6f3e" strokeWidth="1" opacity="0.4" />

    {/* 腰带 */}
    <rect x="100" y="480" width="160" height="22" fill="#8a4a30" />
    <rect x="100" y="478" width="160" height="3" fill="#b06548" />
    {/* 腰带挂件 */}
    <circle cx="180" cy="514" r="6" fill="#b08d3f" />
    <line x1="180" y1="502" x2="180" y2="540" stroke="#b08d3f" strokeWidth="1.5" />

    {/* 手 - 交叠在身前 */}
    <ellipse cx="155" cy="540" rx="22" ry="14" fill="#d8b885" />
    <ellipse cx="200" cy="535" rx="22" ry="14" fill="#d8b885" />
    <path d="M 145 545 Q 180 555 215 540"
          stroke="#a88555" strokeWidth="1" fill="none" opacity="0.6" />

    {/* 脖子 */}
    <rect x="160" y="245" width="40" height="50" fill="#c9a877" />
    <ellipse cx="180" cy="290" rx="22" ry="6" fill="#a8845a" opacity="0.4" />

    {/* 头发 - 后侧 */}
    <path d="M 110 180
             Q 100 230 115 280
             L 155 280
             L 155 200 Z"
          fill="url(#hairGrad)" />
    <path d="M 250 180
             Q 260 230 245 280
             L 205 280
             L 205 200 Z"
          fill="url(#hairGrad)" />

    {/* 脸 */}
    <ellipse cx="180" cy="200" rx="60" ry="72" fill="url(#faceGrad)" />

    {/* 头发 - 前侧、发髻 */}
    <path d="M 120 165
             Q 130 110 180 105
             Q 230 110 240 165
             Q 240 145 215 138
             Q 180 130 145 138
             Q 120 145 120 165 Z"
          fill="url(#hairGrad)" />
    {/* 发髻 */}
    <ellipse cx="180" cy="105" rx="35" ry="22" fill="url(#hairGrad)" />
    <ellipse cx="180" cy="100" rx="28" ry="14" fill="#0e0a07" opacity="0.5" />
    {/* 发饰 */}
    <circle cx="180" cy="98" r="5" fill="#b08d3f" />
    <circle cx="180" cy="98" r="2" fill="#7a5a2a" />

    {/* 鬓发 */}
    <path d="M 122 175 Q 118 220 130 245" stroke="#1a1410" strokeWidth="3" fill="none" />
    <path d="M 238 175 Q 242 220 230 245" stroke="#1a1410" strokeWidth="3" fill="none" />

    {/* 眉 - 微蹙 */}
    <path d="M 148 188 Q 158 184 168 190" stroke="#2a1a0e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M 192 190 Q 202 184 212 188" stroke="#2a1a0e" strokeWidth="2.5" fill="none" strokeLinecap="round" />

    {/* 眼睛 - 微闭、疲倦 */}
    <path d="M 148 205 Q 158 212 168 205" stroke="#1a1006" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M 192 205 Q 202 212 212 205" stroke="#1a1006" strokeWidth="1.8" fill="none" strokeLinecap="round" />

    {/* 鼻 */}
    <path d="M 180 215 Q 178 230 175 240 Q 178 244 184 244 Q 188 240 184 235"
          stroke="#a8845a" strokeWidth="1" fill="none" />

    {/* 嘴 - 抿着 */}
    <path d="M 170 256 Q 180 258 190 256" stroke="#8a3a26" strokeWidth="1.8" fill="none" strokeLinecap="round" />

    {/* 面色萎黄 - 加一点偏黄阴影 */}
    <ellipse cx="155" cy="225" rx="14" ry="8" fill="#b08540" opacity="0.18" />
    <ellipse cx="205" cy="225" rx="14" ry="8" fill="#b08540" opacity="0.18" />

    {/* 眼下青 - 神疲 */}
    <ellipse cx="158" cy="218" rx="10" ry="3" fill="#5a4a3a" opacity="0.18" />
    <ellipse cx="202" cy="218" rx="10" ry="3" fill="#5a4a3a" opacity="0.18" />
  </svg>
);

// 印章
const Seal = ({ text = '杏林', size = 56, color }) => (
  <div className="seal-stamp" style={{
    width: size, height: size,
    fontSize: size/4, background: color || 'var(--seal)'
  }}>
    {text.split('').map((c, i) => <span key={i}>{c}</span>)}
  </div>
);

Object.assign(window, { TongueImage, PatientPortrait, Seal });
