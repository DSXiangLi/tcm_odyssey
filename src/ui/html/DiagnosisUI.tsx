// src/ui/html/DiagnosisUI.tsx
/**
 * 诊断游戏主应用
 *
 * 来源: docs/ui/诊断游戏/app.jsx + 5个stage-*文件 - 直接迁移合并
 * 创建日期: 2026-04-28
 * 功能: 5阶段Tab导航 + 状态管理 + 各诊断阶段串联
 */

import React, { useState, useEffect, useRef } from 'react';
import './diagnosis.css';  // 关键：导入CSS样式
import { DiagnosisCase } from './data/diagnosis-cases';
import { TongueImage, PatientPortrait, Seal } from './components/DiagnosisAssets';

// ============ 类型定义 ============

interface TongueData {
  color?: string;
  coating?: string;
  shape?: string;
  moisture?: string;
  notes?: string;
}

interface PulseData {
  position?: string;
  quality?: string;
  notes?: string;
}

interface WenZhenData {
  messages?: Array<{ from: string; text: string }>;
  asked?: string[];
  clues?: string[];
  draft?: string;
}

interface BianZhengData {
  selected?: string[];
  custom?: string;
  reasoning?: string;
}

interface XuanFangData {
  selected?: string[];
  custom?: string;
}

interface DiagnosisUIProps {
  caseData: DiagnosisCase;
  onComplete?: (result: DiagnosisResult) => void;
  onClose?: () => void;
}

interface DiagnosisResult {
  caseId: string;
  patient: {
    name: string;
    age: number;
    gender: string;
    chief: string;
  };
  diagnosis: {
    tongue: TongueData;
    pulse: PulseData;
    symptoms: string[];
    syndrome: string[];
    prescription: string[];
  };
}

interface StageInfo {
  id: string;
  cn: string;
  en: string;
  num: string;
}

// ============ 常量定义 ============

const STAGES: StageInfo[] = [
  { id: 'tongue', cn: '舌诊', en: 'TONGUE', num: '壹' },
  { id: 'pulse', cn: '脉诊', en: 'PULSE', num: '贰' },
  { id: 'wenzhen', cn: '问诊', en: 'INQUIRY', num: '叁' },
  { id: 'bianzheng', cn: '辨证', en: 'DIAGNOSIS', num: '肆' },
  { id: 'xuanfang', cn: '选方', en: 'PRESCRIBE', num: '伍' },
];

// ============ 主应用组件 ============

export const DiagnosisUI: React.FC<DiagnosisUIProps> = ({ caseData, onComplete, onClose }) => {
  const [stage, setStage] = useState<string>('tongue');

  const [tongueData, setTongueData] = useState<TongueData>({});
  const [pulseData, setPulseData] = useState<PulseData>({});
  const [wenzhenData, setWenzhenData] = useState<WenZhenData>({});
  const [bianzhengData, setBianZhengData] = useState<BianZhengData>({});
  const [xuanfangData, setXuanFangData] = useState<XuanFangData>({});

  // 完成度判定
  const tongueDone = !!(tongueData.color && tongueData.coating && tongueData.shape && tongueData.moisture);
  const pulseDone = !!(pulseData.position && pulseData.quality);
  const wenzhenDone = (wenzhenData.clues || []).length >= 3;
  const bianzhengDone = !!((bianzhengData.selected || []).length > 0 && (bianzhengData.reasoning || '').length >= 10);
  const xuanfangDone = !!((xuanfangData.selected || []).length > 0);

  const stageDone: Record<string, boolean> = {
    tongue: tongueDone,
    pulse: pulseDone,
    wenzhen: wenzhenDone,
    bianzheng: bianzhengDone,
    xuanfang: xuanfangDone
  };

  // 当前 stage 索引
  const idx = STAGES.findIndex(s => s.id === stage);
  const goNext = () => idx < STAGES.length - 1 && setStage(STAGES[idx + 1].id);
  const goPrev = () => idx > 0 && setStage(STAGES[idx - 1].id);

  // 辨证阶段汇总
  const summary = {
    tongue: tongueDone ? tongueData : null,
    pulse: pulseDone ? pulseData : null,
    clueLabels: (wenzhenData.clues || []).map(cid =>
      caseData.wenzhen.clues.find(c => c.id === cid)?.label).filter(Boolean) as string[]
  };

  // 渲染各阶段内容
  let body: React.ReactNode = null;
  if (stage === 'tongue') {
    body = <TongueDiagnosis data={tongueData} onChange={setTongueData} />;
  } else if (stage === 'pulse') {
    body = <PulseDiagnosis
      data={pulseData}
      onChange={setPulseData}
      classicalText={caseData.pulse.classical}
      plainText={caseData.pulse.plain}
    />;
  } else if (stage === 'wenzhen') {
    body = <WenZhen
      data={wenzhenData}
      onChange={setWenzhenData}
      caseData={{ ...caseData.wenzhen, ...caseData.patient }}
      showHints={true}
    />;
  } else if (stage === 'bianzheng') {
    body = <BianZheng
      data={bianzhengData}
      onChange={setBianZhengData}
      summary={summary}
      options={caseData.bianzheng.options}
    />;
  } else if (stage === 'xuanfang') {
    body = <XuanFang
      data={xuanfangData}
      onChange={setXuanFangData}
      options={caseData.fang.options}
    />;
  }

  const stageMeta = STAGES.find(s => s.id === stage);

  // 呈递医案处理
  const handleComplete = () => {
    if (onComplete && xuanfangDone) {
      const result: DiagnosisResult = {
        caseId: caseData.id,
        patient: {
          name: caseData.patient.name,
          age: caseData.patient.age,
          gender: caseData.patient.gender,
          chief: caseData.patient.chief
        },
        diagnosis: {
          tongue: tongueData,
          pulse: pulseData,
          symptoms: summary.clueLabels,
          syndrome: bianzhengData.selected || [],
          prescription: xuanfangData.selected || []
        }
      };
      onComplete(result);
    }
  };

  return (
    <>
      {/* 背景层 - 与煎药游戏一致 */}
      <div className="diagnosis-backdrop" />
      {/* 主弹窗 */}
      <div className="app paper-bg">
        {/* 左侧导航 */}
        <aside className="sidebar">
        <div className="brand">
          <div className="brand-cn">悬壶</div>
          <div className="brand-en">Diagnose · 中医诊室</div>
        </div>
        <ul className="nav-list">
          {STAGES.map((s) => (
            <li
              key={s.id}
              className={'nav-item' + (s.id === stage ? ' active' : '') + (stageDone[s.id] ? ' done' : '')}
              onClick={() => setStage(s.id)}
            >
              <span className="nav-num"><span className="nav-num-text">{s.num}</span></span>
              <span>
                <span className="nav-label-cn">{s.cn}</span>
                <span className="nav-label-en">{s.en}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="nav-meta">
          初诊病案<br />
          {caseData.patient.name} · {caseData.patient.gender}<br />
          年 {caseData.patient.age} · {caseData.patient.occupation}
        </div>
      </aside>

      {/* 主内容 */}
      <main className="main">
        {/* 顶部 */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">{stageMeta?.en} · 第 {idx + 1} 诊 / 共 {STAGES.length}</div>
            <h1 className="page-title">{stageMeta?.cn}</h1>
            <div className="page-sub">{stageDescription(stage)}</div>
          </div>
          <div className="patient-pill">
            <span className="seal">案</span>
            <span>{caseData.patient.name} · {caseData.patient.gender} {caseData.patient.age} · 主诉「{caseData.patient.chief}」</span>
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
                {s.cn}{i < STAGES.length - 1 ? ' › ' : ''}
              </span>
            ))}
          </div>
          {idx < STAGES.length - 1 ? (
            <button className="btn btn-primary" onClick={goNext} disabled={!stageDone[stage]}>
              {stageDone[stage] ? '进入下一诊 →' : '完成本诊后继续'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleComplete} disabled={!xuanfangDone}>
              呈递医案 ✓
            </button>
          )}
        </div>
      </main>

      {/* 关闭按钮 */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'var(--ink)',
            border: '1px solid var(--paper-deep)',
            color: 'var(--paper)',
            padding: '8px 16px',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'var(--font-kai)',
            letterSpacing: 2,
            borderRadius: 2,
            zIndex: 10
          }}
        >
          退出诊断
        </button>
      )}
      </div>
    </>
  );
};

// ============ 阶段描述 ============

function stageDescription(s: string): string {
  switch (s) {
    case 'tongue': return '望诊之要 · 观舌察脏腑寒热虚实';
    case 'pulse': return '切诊之妙 · 三指按候寸关尺';
    case 'wenzhen': return '问诊之详 · 详询起居方知病机';
    case 'bianzheng': return '四诊合参 · 辨明证型立法度';
    case 'xuanfang': return '理法方药 · 因证立方拟主治';
    default: return '';
  }
}

// ============ 舌诊组件 ============

interface TongueDiagnosisProps {
  data: TongueData;
  onChange: (data: TongueData) => void;
}

const TongueDiagnosis: React.FC<TongueDiagnosisProps> = ({ data, onChange }) => {
  const [zoom, setZoom] = useState(false);

  const groups = [
    { key: 'color', label: '舌色', options: ['淡红', '淡白', '红', '绛', '紫暗', '青紫'] },
    { key: 'coating', label: '舌苔', options: ['薄白', '白腻', '白厚', '黄腻', '黄燥', '灰黑', '剥脱', '少苔'] },
    { key: 'shape', label: '舌形', options: ['正常', '胖大有齿痕', '瘦薄', '裂纹', '芒刺', '舌尖红'] },
    { key: 'moisture', label: '润燥', options: ['润', '燥', '水滑', '少津'] }
  ];

  const set = (k: string, v: string) => onChange({ ...data, [k]: v });

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 32, height: '100%' }}>
      {/* 左：舌象 */}
      <div>
        <div className="field-label">舌象（点击放大）</div>
        <div
          onClick={() => setZoom(true)}
          style={{
            background: '#1a0e0a',
            border: '1px solid var(--paper-deep)',
            padding: 28,
            cursor: 'zoom-in',
            position: 'relative',
            display: 'flex', justifyContent: 'center'
          }}
        >
          <TongueImage size={320} />
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(241,230,204,0.85)',
            color: 'var(--ink)',
            padding: '4px 10px',
            fontSize: 11, letterSpacing: 2,
            fontFamily: 'var(--font-fangsong)'
          }}>⊕ 放大查看</div>
        </div>
        <div style={{
          marginTop: 14,
          padding: '12px 16px',
          background: 'rgba(168,68,42,0.06)',
          border: '1px solid var(--paper-deep)',
          borderLeft: '3px solid var(--accent)',
          fontFamily: 'var(--font-kai)',
          fontSize: 14,
          color: 'var(--ink-2)',
          letterSpacing: 1.5,
          lineHeight: 1.7
        }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: 3, marginBottom: 6 }}>师 训</div>
          望舌须明窗、伸舌自然、毋使久伸。先观舌质，次察舌苔。
        </div>
      </div>

      {/* 右：选项 */}
      <div style={{ overflowY: 'auto', paddingRight: 8 }}>
        {groups.map(g => (
          <div key={g.key} style={{ marginBottom: 22 }}>
            <h3 className="section-title">{g.label}</h3>
            <div className="chip-group">
              {g.options.map(opt => (
                <button
                  key={opt}
                  className={'chip' + (data[g.key as keyof TongueData] === opt ? ' selected accent' : '')}
                  onClick={() => set(g.key, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 28 }}>
          <h3 className="section-title">补充观察</h3>
          <textarea
            className="textarea"
            rows={3}
            placeholder="可记录其它细节，如：舌下络脉、动态等……"
            value={data.notes || ''}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
      </div>

      {/* 放大模态框 */}
      {zoom && (
        <div
          onClick={() => setZoom(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(20,12,8,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, cursor: 'zoom-out'
          }}
        >
          <div style={{
            background: '#1a0e0a',
            padding: 40,
            border: '2px solid var(--paper-deep)',
            position: 'relative'
          }}>
            <TongueImage size={520} />
            <div style={{
              position: 'absolute', bottom: -40, left: 0, right: 0,
              textAlign: 'center', color: 'var(--paper-deep)',
              fontFamily: 'var(--font-kai)', fontSize: 14, letterSpacing: 4
            }}>
              点击任意处关闭 · ESC
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ 脉诊组件 ============

interface PulseDiagnosisProps {
  data: PulseData;
  onChange: (data: PulseData) => void;
  classicalText: string;
  plainText: string;
}

const PulseDiagnosis: React.FC<PulseDiagnosisProps> = ({ data, onChange, classicalText, plainText }) => {
  const [activeFinger, setActiveFinger] = useState<string>('关');
  const [showPlain, setShowPlain] = useState(false);

  const positions = ['寸', '关', '尺'];
  const qualities = ['浮紧', '沉细', '弦数', '濡缓', '滑实', '虚弱', '洪大', '迟缓'];

  const set = (k: string, v: string) => onChange({ ...data, [k]: v });

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
          {/* 手腕示意 SVG */}
          <svg viewBox="0 0 600 280" width="520" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="armSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e8c8a0" />
                <stop offset="100%" stopColor="#c89870" />
              </linearGradient>
            </defs>
            {/* 手臂 */}
            <path d="M 0 120 Q 100 80 220 95 L 220 185 Q 100 200 0 160 Z" fill="url(#armSkin)" opacity="0.85" />
            {/* 手掌 */}
            <path d="M 220 95 Q 380 70 460 100 Q 540 130 560 175 Q 530 215 460 215 Q 380 200 220 185 Z" fill="url(#armSkin)" opacity="0.9" />
            {/* 拇指 */}
            <path d="M 540 130 Q 580 90 575 60 Q 545 70 535 105 Z" fill="url(#armSkin)" />
            {/* 腕横纹 */}
            <path d="M 218 95 Q 222 140 218 185" stroke="#a07050" strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M 230 100 Q 234 140 230 180" stroke="#a07050" strokeWidth="0.8" fill="none" opacity="0.4" />

            {/* 三个脉位 - 寸关尺 */}
            {positions.map((pos, i) => {
              const cx = 290 + i * 55;
              const cy = 140;
              const isActive = activeFinger === pos;
              const isCorrect = data.position === pos;
              return (
                <g key={pos} onClick={() => { setActiveFinger(pos); set('position', pos); }} style={{ cursor: 'pointer' }}>
                  {/* 脉动光晕 */}
                  <circle cx={cx} cy={cy} r="34" fill={isCorrect ? '#a8442a' : '#c97557'} opacity="0.15">
                    <animate attributeName="r" values="28;42;28" dur="0.9s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.25;0.05;0.25" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r="22" fill={isCorrect ? '#a8442a' : '#c97557'} opacity="0.35">
                    <animate attributeName="r" values="18;26;18" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                  {/* 中心点 */}
                  <circle cx={cx} cy={cy} r="10" fill={isActive ? '#f1e6cc' : '#8a6f3e'} stroke={isActive ? '#a8442a' : 'transparent'} strokeWidth="2" />
                  {/* 指印 */}
                  {isActive && (
                    <ellipse cx={cx} cy={cy - 30} rx="18" ry="22" fill="#e8c8a0" stroke="#a07050" strokeWidth="1" opacity="0.8" />
                  )}
                  {/* 标签 */}
                  <text x={cx} y={cy + 60} textAnchor="middle" fontFamily="var(--font-kai)" fontSize="20" fill={isActive ? '#f1e6cc' : '#c8a878'} letterSpacing="2">
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
              <line x1="0" y1="30" x2="500" y2="30" stroke="#5a4a3a" strokeWidth="0.5" strokeDasharray="2 4" />
              <path d="M 0 30 Q 25 22 50 30 Q 75 38 100 30 Q 125 20 150 30 Q 175 38 200 30 Q 225 22 250 30 Q 275 38 300 30 Q 325 20 350 30 Q 375 38 400 30 Q 425 22 450 30 Q 475 38 500 30" fill="none" stroke="url(#waveGrad)" strokeWidth="2">
                <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="2s" repeatCount="indefinite" />
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
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowPlain(!showPlain)}>
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
              <button key={p} className={'chip' + (data.position === p ? ' selected accent' : '')} onClick={() => set('position', p)}>{p}部</button>
            ))}
          </div>
        </div>

        {/* 脉势选择 */}
        <div>
          <h3 className="section-title">脉象（脉势）</h3>
          <div className="chip-group">
            {qualities.map(q => (
              <button key={q} className={'chip' + (data.quality === q ? ' selected accent' : '')} onClick={() => set('quality', q)}>{q}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <textarea className="textarea" rows={3} placeholder="补充：脉象其它特点……" value={data.notes || ''} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>
    </div>
  );
};

// ============ 问诊组件 ============

interface WenZhenProps {
  data: WenZhenData;
  onChange: (data: WenZhenData) => void;
  caseData: {
    suggested_questions: string[];
    dialog_tree: Record<string, string>;
    clues: { id: string; label: string; found_by: string[] }[];
    name: string;
    gender: string;
    age: number;
    occupation: string;
    portrait_desc: string;
  };
  showHints: boolean;
}

const WenZhen: React.FC<WenZhenProps> = ({ data, onChange, caseData, showHints }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dialogScrollRef = useRef<HTMLDivElement>(null);

  const messages = data.messages || [{ from: 'system', text: `${caseData.name}缓步入诊室，倚坐于诊椅。` }];
  const askedQs = data.asked || [];

  useEffect(() => {
    if (dialogScrollRef.current) {
      dialogScrollRef.current.scrollTop = dialogScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const askQuestion = (q: string) => {
    if (askedQs.includes(q)) return;
    const reply = caseData.dialog_tree[q] || '（患者沉默不语，或您可以换种问法。）';

    const newClues = [...(data.clues || [])];
    caseData.clues.forEach(c => {
      if (c.found_by.includes(q) && !newClues.includes(c.id)) {
        newClues.push(c.id);
      }
    });

    onChange({
      ...data,
      messages: [...messages, { from: 'doctor', text: q }, { from: 'patient', text: reply }],
      asked: [...askedQs, q],
      clues: newClues
    });
  };

  const sendCustom = () => {
    const v = (data.draft || '').trim();
    if (!v) return;
    const match = caseData.suggested_questions.find(q =>
      q.replace(/[？?]/g, '').split('').some(ch => v.includes(ch)) && v.length >= 3
    );
    const reply = match ? caseData.dialog_tree[match] : '（患者听罢，似有些疑惑：「先生，可否换种问法？」）';
    const newClues = [...(data.clues || [])];
    if (match) {
      caseData.clues.forEach(c => {
        if (c.found_by.includes(match!) && !newClues.includes(c.id)) newClues.push(c.id);
      });
    }
    onChange({
      ...data,
      messages: [...messages, { from: 'doctor', text: v }, { from: 'patient', text: reply }],
      draft: '',
      clues: newClues
    });
  };

  const collectedClues = data.clues || [];

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, height: '100%' }}>
      {/* 左：患者立绘 */}
      <div style={{
        background: 'linear-gradient(180deg, #d8c89c 0%, #c4b388 100%)',
        border: '1px solid var(--paper-deep)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '14px 18px', background: 'rgba(42,36,29,0.85)', color: 'var(--paper)' }}>
          <div style={{ fontFamily: 'var(--font-kai)', fontSize: 18, letterSpacing: 4 }}>{caseData.name}</div>
          <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7, marginTop: 2 }}>
            {caseData.gender} · {caseData.age}岁 · {caseData.occupation}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <PatientPortrait height={520} />
        </div>
        <div style={{
          padding: '10px 16px',
          background: 'rgba(42,36,29,0.7)',
          color: 'var(--paper-deep)',
          fontFamily: 'var(--font-fangsong)',
          fontSize: 12, letterSpacing: 1.5,
          borderTop: '1px solid rgba(241,230,204,0.2)'
        }}>
          神态：{caseData.portrait_desc}
        </div>
      </div>

      {/* 右：对话区 */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}>问 答</h3>
          <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12, letterSpacing: 2 }} onClick={() => setDrawerOpen(!drawerOpen)}>
            线索册 {collectedClues.length}/{caseData.clues.length}
          </button>
        </div>

        {/* 对话流 */}
        <div ref={dialogScrollRef} style={{
          flex: 1,
          background: 'var(--paper-2)',
          border: '1px solid var(--paper-deep)',
          padding: 18,
          overflowY: 'auto',
          marginBottom: 12,
          display: 'flex', flexDirection: 'column', gap: 10
        }}>
          {messages.map((m, i) => {
            if (m.from === 'system') return (
              <div key={i} style={{
                textAlign: 'center', fontSize: 12,
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-fangsong)',
                letterSpacing: 2,
                padding: '6px 0',
                fontStyle: 'italic'
              }}>— {m.text} —</div>
            );
            const isDoctor = m.from === 'doctor';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isDoctor ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '76%',
                  padding: '10px 14px',
                  background: isDoctor ? 'var(--ink)' : 'var(--paper)',
                  color: isDoctor ? 'var(--paper)' : 'var(--ink)',
                  border: '1px solid ' + (isDoctor ? 'var(--ink)' : 'var(--paper-deep)'),
                  fontFamily: 'var(--font-serif)',
                  fontSize: 14, lineHeight: 1.6,
                  letterSpacing: 1
                }}>
                  <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 2, marginBottom: 4, fontFamily: 'var(--font-fangsong)' }}>
                    {isDoctor ? '医' : '患'}
                  </div>
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* 输入区 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            className="text-input"
            placeholder="请输入问诊内容……"
            value={data.draft || ''}
            onChange={e => onChange({ ...data, draft: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && sendCustom()}
          />
          <button className="btn btn-primary" onClick={sendCustom}>发问</button>
        </div>

        {/* 推荐提问 */}
        {showHints && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', marginBottom: 8, fontFamily: 'var(--font-fangsong)' }}>
              建议提问 · 师承提示
            </div>
            <div className="chip-group">
              {caseData.suggested_questions.map(q => (
                <button
                  key={q}
                  className={'chip' + (askedQs.includes(q) ? ' selected' : '')}
                  style={askedQs.includes(q) ? { opacity: 0.45 } : {}}
                  onClick={() => askQuestion(q)}
                  disabled={askedQs.includes(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 线索抽屉 */}
        {drawerOpen && (
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 320,
            background: 'var(--paper)',
            borderLeft: '2px solid var(--ink)',
            boxShadow: '-12px 0 30px rgba(0,0,0,0.15)',
            padding: 24,
            overflowY: 'auto',
            zIndex: 50
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 className="section-title" style={{ margin: 0 }}>线索册</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDrawerOpen(false)}>×</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', letterSpacing: 2, marginBottom: 16, fontFamily: 'var(--font-fangsong)' }}>
              核心线索 {collectedClues.length} / {caseData.clues.length}
            </div>
            {caseData.clues.map(c => {
              const got = collectedClues.includes(c.id);
              return (
                <label key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  marginBottom: 8,
                  background: got ? 'rgba(168,68,42,0.08)' : 'transparent',
                  border: '1px solid ' + (got ? 'var(--accent)' : 'var(--paper-deep)'),
                  cursor: 'default'
                }}>
                  <span style={{
                    width: 18, height: 18,
                    border: '1.5px solid ' + (got ? 'var(--accent)' : 'var(--ink-soft)'),
                    background: got ? 'var(--accent)' : 'transparent',
                    color: 'var(--paper)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12
                  }}>{got && '✓'}</span>
                  <span style={{ fontSize: 13, color: got ? 'var(--ink)' : 'var(--ink-faint)', letterSpacing: 1 }}>
                    {got ? c.label : '？？？'}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============ 辨证组件 ============

interface BianZhengProps {
  data: BianZhengData;
  onChange: (data: BianZhengData) => void;
  summary: {
    tongue: TongueData | null;
    pulse: PulseData | null;
    clueLabels: string[];
  };
  options: { id: string; label: string; correct: boolean }[];
}

const BianZheng: React.FC<BianZhengProps> = ({ data, onChange, summary, options }) => {
  const set = (k: string, v: string | string[]) => onChange({ ...data, [k]: v });
  const selected = data.selected || [];

  const toggle = (id: string) => {
    set('selected', selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 28, height: '100%' }}>
      {/* 左：四诊汇总 */}
      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <h3 className="section-title">四诊合参</h3>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
          {/* 望（舌） */}
          <SummaryBlock title="望诊 · 舌象">
            {summary.tongue ? (
              <div style={{ lineHeight: 1.9 }}>
                舌色：<b>{summary.tongue.color || '—'}</b>　舌苔：<b>{summary.tongue.coating || '—'}</b><br />
                舌形：<b>{summary.tongue.shape || '—'}</b>　润燥：<b>{summary.tongue.moisture || '—'}</b>
                {summary.tongue.notes && <div style={{ marginTop: 6, color: 'var(--ink-soft)' }}>注：{summary.tongue.notes}</div>}
              </div>
            ) : <em style={{ color: 'var(--ink-faint)' }}>尚未填写</em>}
          </SummaryBlock>

          {/* 切（脉） */}
          <SummaryBlock title="切诊 · 脉象">
            {summary.pulse ? (
              <div style={{ lineHeight: 1.9 }}>
                脉位：<b>{summary.pulse.position || '—'}部</b>　脉势：<b>{summary.pulse.quality || '—'}</b>
                {summary.pulse.notes && <div style={{ marginTop: 6, color: 'var(--ink-soft)' }}>注：{summary.pulse.notes}</div>}
              </div>
            ) : <em style={{ color: 'var(--ink-faint)' }}>尚未填写</em>}
          </SummaryBlock>

          {/* 问 */}
          <SummaryBlock title="问诊 · 收集症状">
            {summary.clueLabels && summary.clueLabels.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                {summary.clueLabels.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            ) : <em style={{ color: 'var(--ink-faint)' }}>未收集到线索</em>}
          </SummaryBlock>
        </div>
      </div>

      {/* 右：辨证选择 */}
      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <h3 className="section-title">辨证 · 拟定证型（可多选）</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {options.map(opt => {
            const sel = selected.includes(opt.id);
            return (
              <div key={opt.id} onClick={() => toggle(opt.id)} style={{
                padding: '14px 16px',
                background: sel ? 'var(--ink)' : 'var(--paper)',
                color: sel ? 'var(--paper)' : 'var(--ink)',
                border: '1px solid ' + (sel ? 'var(--ink)' : 'var(--paper-deep)'),
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                fontFamily: 'var(--font-kai)', fontSize: 15, letterSpacing: 2
              }}>
                <span style={{
                  width: 18, height: 18,
                  border: '1.5px solid ' + (sel ? 'var(--paper)' : 'var(--ink-soft)'),
                  background: sel ? 'var(--accent)' : 'transparent',
                  color: 'var(--paper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0
                }}>{sel && '✓'}</span>
                {opt.label}
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: 18 }}>
          <div className="field-label">其它证型（自行填写）</div>
          <input className="text-input" placeholder="如：肝气犯胃、湿热蕴脾……" value={data.custom || ''} onChange={e => set('custom', e.target.value)} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="field-label">辨证依据 · 论述（必填）</div>
          <textarea
            className="textarea"
            style={{ flex: 1, minHeight: 140 }}
            placeholder="请结合舌、脉、症，论述您的辨证思路。\n例：患者苔白厚腻、脉濡缓、便溏、身重困倦、口黏不渴，乃湿邪困遏中焦之征……"
            value={data.reasoning || ''}
            onChange={e => set('reasoning', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

// 汇总块组件
const SummaryBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{
    background: 'var(--paper-2)',
    border: '1px solid var(--paper-deep)',
    padding: '14px 16px',
    marginBottom: 12,
    fontSize: 13,
    color: 'var(--ink-2)',
    fontFamily: 'var(--font-fangsong)'
  }}>
    <div style={{
      fontFamily: 'var(--font-kai)',
      fontSize: 13,
      color: 'var(--accent)',
      letterSpacing: 3,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: '1px solid var(--paper-deep)'
    }}>{title}</div>
    {children}
  </div>
);

// ============ 选方组件 ============

interface FangOption {
  id: string;
  name: string;
  correct: boolean;
  source: string;
  composition: string;
  function: string;
  indication: string;
  note: string;
}

interface XuanFangProps {
  data: XuanFangData;
  onChange: (data: XuanFangData) => void;
  options: FangOption[];
}

const XuanFang: React.FC<XuanFangProps> = ({ data, onChange, options }) => {
  const [scrollFang, setScrollFang] = useState<FangOption | null>(null);
  const selected = data.selected || [];
  const set = (k: string, v: string | string[]) => onChange({ ...data, [k]: v });
  const toggle = (id: string) => set('selected', selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 className="section-title">选方 · 拟定主方（可多选）</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
        {options.map(opt => {
          const sel = selected.includes(opt.id);
          return (
            <div key={opt.id} style={{
              padding: '16px 18px',
              background: sel ? 'rgba(168,68,42,0.08)' : 'var(--paper)',
              border: '1px solid ' + (sel ? 'var(--accent)' : 'var(--paper-deep)'),
              borderLeft: '3px solid ' + (sel ? 'var(--accent)' : 'var(--paper-deep)'),
              position: 'relative'
            }}>
              <div onClick={() => toggle(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                <span style={{
                  width: 18, height: 18,
                  border: '1.5px solid ' + (sel ? 'var(--accent)' : 'var(--ink-soft)'),
                  background: sel ? 'var(--accent)' : 'transparent',
                  color: 'var(--paper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0
                }}>{sel && '✓'}</span>
                <span style={{ fontFamily: 'var(--font-kai)', fontSize: 17, color: 'var(--ink)', letterSpacing: 3 }}>{opt.name}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--font-fangsong)', letterSpacing: 1, marginBottom: 10 }}>
                出自 {opt.source}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12, letterSpacing: 2 }} onClick={() => setScrollFang(opt)}>
                  展卷·详情
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="field-label">其它方剂（自行填写）</div>
        <input className="text-input" placeholder="如：胃苓汤、香砂六君子汤……" value={data.custom || ''} onChange={e => set('custom', e.target.value)} />
      </div>

      <div style={{
        marginTop: 'auto',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: 'var(--paper-2)',
        border: '1px dashed var(--ink-faint)'
      }}>
        <button className="btn btn-ghost" disabled style={{ cursor: 'not-allowed' }}>
          🔒 方剂加减
        </button>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-fangsong)', letterSpacing: 1 }}>
          完成本案后解锁 · 可对所选方剂进行君臣佐使加减化裁
        </span>
      </div>

      {scrollFang && <ScrollCard fang={scrollFang} onClose={() => setScrollFang(null)} />}
    </div>
  );
};

// 卷轴详情卡组件
interface ScrollCardProps {
  fang: FangOption;
  onClose: () => void;
}

const ScrollCard: React.FC<ScrollCardProps> = ({ fang, onClose }) => {
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(20,12,8,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      cursor: 'zoom-out'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: opened ? 820 : 80,
        height: 540,
        transition: 'width 0.7s cubic-bezier(.6,.05,.3,1)',
        display: 'flex',
        alignItems: 'stretch',
        cursor: 'default'
      }}>
        {/* 左轴杆 */}
        <div style={{
          width: 28, flexShrink: 0,
          background: 'linear-gradient(90deg, #5a3a1c, #8a5a2e, #5a3a1c)',
          borderRadius: '4px 0 0 4px',
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: -6, left: -2, right: -2, height: 14, background: 'radial-gradient(ellipse, #b08d3f, #6a5022)', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: -6, left: -2, right: -2, height: 14, background: 'radial-gradient(ellipse, #b08d3f, #6a5022)', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
        </div>

        {/* 卷面 */}
        <div className="paper-bg" style={{
          flex: 1,
          background: '#ede0c0',
          padding: opened ? '36px 40px' : 0,
          overflow: 'hidden',
          opacity: opened ? 1 : 0,
          transition: 'opacity 0.4s 0.4s',
          position: 'relative',
          boxShadow: 'inset 0 0 60px rgba(120,80,30,0.2)'
        }}>
          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: 18, position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-kai)', fontSize: 32, color: 'var(--ink)', letterSpacing: 12, fontWeight: 500 }}>{fang.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', letterSpacing: 4, marginTop: 6, fontFamily: 'var(--font-fangsong)' }}>{fang.source}</div>
            <div style={{ marginTop: 10, height: 1, background: 'var(--ink-faint)', position: 'relative' }}>
              <span style={{
                position: 'absolute', top: -6, left: '50%',
                transform: 'translateX(-50%)',
                background: '#ede0c0', padding: '0 14px',
                color: 'var(--accent)', fontSize: 12,
                fontFamily: 'var(--font-kai)', letterSpacing: 2
              }}>◇</span>
            </div>
          </div>

          <FangSection title="配 伍" body={fang.composition} />
          <FangSection title="功 效" body={fang.function} />
          <FangSection title="主 治" body={fang.indication} />
          <FangSection title="按 语" body={fang.note} italic />

          {/* 印章 */}
          <div style={{ position: 'absolute', bottom: 20, right: 30 }}>
            <Seal text={fang.correct ? '正方' : '备参'} size={48} color={fang.correct ? 'var(--seal)' : 'var(--ink-soft)'} />
          </div>

          {/* 关闭按钮 */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 16,
            background: 'transparent', border: 'none',
            color: 'var(--ink-soft)', fontSize: 22,
            cursor: 'pointer', fontFamily: 'serif'
          }}>×</button>
        </div>

        {/* 右轴杆 */}
        <div style={{
          width: 28, flexShrink: 0,
          background: 'linear-gradient(90deg, #5a3a1c, #8a5a2e, #5a3a1c)',
          borderRadius: '0 4px 4px 0',
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: -6, left: -2, right: -2, height: 14, background: 'radial-gradient(ellipse, #b08d3f, #6a5022)', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: -6, left: -2, right: -2, height: 14, background: 'radial-gradient(ellipse, #b08d3f, #6a5022)', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
        </div>
      </div>
    </div>
  );
};

// 方剂详情节组件
const FangSection: React.FC<{ title: string; body: string; italic?: boolean }> = ({ title, body, italic }) => (
  <div style={{ marginBottom: 14, display: 'flex', gap: 16 }}>
    <div style={{
      width: 56, flexShrink: 0,
      fontFamily: 'var(--font-kai)',
      fontSize: 15, color: 'var(--accent)',
      letterSpacing: 4, paddingTop: 2,
      borderRight: '1px solid var(--paper-deep)',
      textAlign: 'center'
    }}>{title}</div>
    <div style={{
      flex: 1,
      fontFamily: italic ? 'var(--font-kai)' : 'var(--font-fangsong)',
      fontSize: 14, lineHeight: 1.8,
      color: italic ? 'var(--ink-soft)' : 'var(--ink-2)',
      letterSpacing: 1,
      fontStyle: italic ? 'italic' : 'normal'
    }}>{body}</div>
  </div>
);

// ============ 导出 ============

export type {
  DiagnosisUIProps,
  DiagnosisResult,
  TongueData,
  PulseData,
  WenZhenData,
  BianZhengData,
  XuanFangData
};