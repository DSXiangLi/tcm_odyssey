// src/ui/html/CasebookUI.tsx
/**
 * 病案集 UI 组件
 * 从 docs/ui/病案集/app.jsx 迁移
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MEDICAL_CASES, CaseData } from '../../data/casebook-data';
import { CASEBOOK_EVENTS } from './bridge/casebook-events';
import './casebook.css';

interface CasebookUIProps {
  onClose: () => void;
  initialCaseId?: string;
  progress: Record<string, string[]>;
}

// SVG 滤镜组件
function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="sealRough">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="2.4" />
        </filter>
        <filter id="inkBleed">
          <feGaussianBlur stdDeviation="0.4" />
          <feTurbulence type="fractalNoise" baseFrequency="2" numOctaves="2" />
          <feDisplacementMap in="SourceGraphic" scale="0.8" />
        </filter>
      </defs>
    </svg>
  );
}

// 印章组件
function Seal({ text, size = 'lg' }: { text: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: { w: 56, fs: 22, br: 2 },
    md: { w: 80, fs: 28, br: 3 },
    lg: { w: 110, fs: 38, br: 4 },
  };
  const s = sizeMap[size];
  const chars = text.split('');
  return (
    <div
      style={{
        width: s.w,
        height: s.w,
        background: 'var(--vermillion-2)',
        color: '#f5e8c8',
        display: 'grid',
        gridTemplateColumns: chars.length === 1 ? '1fr' : '1fr 1fr',
        gridTemplateRows: chars.length <= 2 ? '1fr' : '1fr 1fr',
        placeItems: 'center',
        fontFamily: 'var(--font-brush)',
        fontSize: s.fs,
        lineHeight: 1,
        border: `${s.br}px solid var(--vermillion-3)`,
        transform: 'rotate(-5deg)',
        filter: 'url(#sealRough)',
        flexShrink: 0,
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.4), 2px 4px 8px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      {chars.map((c, i) => <span key={i}>{c}</span>)}
    </div>
  );
}

// 左页：目录
function CategoryPage({
  activeCat,
  setActiveCat,
  totalUnlocked,
  totalCount,
  casesData
}: {
  activeCat: string;
  setActiveCat: (id: string) => void;
  totalUnlocked: number;
  totalCount: number;
  casesData: Record<string, CaseData[]>;
}) {
  return (
    <div className="page-inner">
      <div className="cover-title">
        <div className="seal-mini" aria-hidden="true">
          <span>病</span><span>案</span><span>医</span><span>录</span>
        </div>
        <div className="main">病案集</div>
        <div className="sub">岐黄之术 · 内科要览</div>
      </div>

      <div className="category-list">
        {MEDICAL_CASES.categories.map((cat, i) => {
          const list = casesData[cat.id];
          const unlocked = list.filter(c => c.unlocked).length;
          const numerals = ['壹', '贰', '叁', '肆', '伍', '陆'];
          return (
            <div
              key={cat.id}
              className={`category-item ${activeCat === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              <div className="cat-num">{numerals[i]}</div>
              <div className="cat-name">
                <div className="name">{cat.name}</div>
                <div className="desc">{cat.subtitle}</div>
              </div>
              <div className="cat-progress">
                <span className="num">{unlocked}</span>
                <span>/</span>
                <span>{list.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="total-progress">
        <div className="tp-row">
          <div className="tp-label">总览进度</div>
          <div className="tp-num">
            {totalUnlocked}<span className="total"> / {totalCount}</span>
          </div>
        </div>
        <div className="tp-bar">
          <div
            className="tp-bar-fill"
            style={{ width: `${(totalUnlocked / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="page-num left">─ 一 ─</div>
    </div>
  );
}

// 右页：病案网格
function CaseGridPage({
  activeCat,
  casesData,
  onSelectCase
}: {
  activeCat: string;
  casesData: Record<string, CaseData[]>;
  onSelectCase: (c: CaseData) => void;
}) {
  const cat = MEDICAL_CASES.categories.find(c => c.id === activeCat);
  const list = casesData[activeCat];
  const numerals = ['一','二','三','四','五','六','七','八','九','十'];

  return (
    <div className="page-inner fade-in" key={activeCat}>
      <div className="right-header">
        <div className="cat-title">{cat?.name}</div>
        <div className="cat-sub">{cat?.subtitle}</div>
      </div>

      <div className="case-grid">
        {list.map((c, idx) => (
          <div
            key={c.id}
            className={`case-card ${c.unlocked ? 'unlocked' : 'locked'}`}
            onClick={() => onSelectCase(c)}
          >
            <div className="num">第{numerals[idx]}案</div>
            <div>
              <div className="title">{c.title}</div>
              <div className="patient">{c.patient}</div>
            </div>
            {c.unlocked
              ? <div className="stamp-corner">{c.stamp || '已断'}</div>
              : <div className="lock-icon">○ 待断</div>
            }
          </div>
        ))}
      </div>

      <div className="page-num right">─ 二 ─</div>
    </div>
  );
}

// 详情·左
function DetailLeft({ caseData, onBack }: { caseData: CaseData; onBack: () => void }) {
  return (
    <div className="page-inner detail-scroll fade-in">
      <div className="detail-back" onClick={onBack}>
        ◁ 返回病案目录
      </div>

      <div className="detail-title">
        <div className="case-name">{caseData.title}</div>
        <div className="case-id">案号 {caseData.id.toUpperCase()}</div>
      </div>

      <div className="section">
        <div className="section-label">患者</div>
        <div className="patient-card">{caseData.patient}</div>
      </div>

      {caseData.unlocked ? (
        <>
          <div className="section">
            <div className="section-label">主诉</div>
            <div className="section-body chief">{caseData.chief}</div>
          </div>

          <div className="section">
            <div className="section-label">现病史</div>
            <div className="section-body">{caseData.history}</div>
          </div>

          <div className="section tongue-pulse">
            <div className="tp-block">
              <div className="tp-key">舌 象</div>
              <div className="tp-val">{caseData.tongue}</div>
            </div>
            <div className="tp-block">
              <div className="tp-key">脉 象</div>
              <div className="tp-val">{caseData.pulse}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="section">
          <div className="section-label">病案概述</div>
          <div className="section-body">
            {caseData.summary || '此案患者初来求诊，详情尚未参详。望、闻、问、切之四诊，待先生开案问诊后方可知晓。'}
          </div>
        </div>
      )}

      <div className="page-num left">─ 〇 ─</div>
    </div>
  );
}

// 详情·右：未解锁
function DetailRightLocked({ caseData, onStart }: { caseData: CaseData; onStart: () => void }) {
  return (
    <div className="page-inner detail-scroll fade-in">
      <div className="locked-state">
        <div className="big-q">？</div>
        <div className="locked-row">
          <div className="locked-pill">
            <div className="pl-key">辨 证</div>
            <div className="pl-val">未 知</div>
          </div>
          <div className="locked-pill">
            <div className="pl-key">方 剂</div>
            <div className="pl-val">未 知</div>
          </div>
        </div>
        <div className="hint">— 此案尚未参详 —</div>
        <button className="start-btn" onClick={onStart}>开 案 问 诊</button>
      </div>
      <div className="page-num right">─ 〇 ─</div>
    </div>
  );
}

// 详情·右：已解锁
function DetailRightUnlocked({ caseData, onReplay }: { caseData: CaseData; onReplay: () => void }) {
  return (
    <div className="page-inner detail-scroll fade-in">
      <div className="unlock-row">
        <div className="ur-label">辨证</div>
        <div className="ur-content">{caseData.syndrome}</div>
      </div>

      <div className="unlock-row">
        <div className="ur-label">方剂</div>
        <div className="ur-content formula">{caseData.formula}</div>
      </div>

      <div className="score-block">
        <Seal text={caseData.stamp || '已断'} size="lg" />
        <div className="score-meta">
          <div className="score-label">医评</div>
          <div className="score-value">{caseData.score}</div>
        </div>
      </div>

      <div className="comment-block">
        <div className="comment-label">先生点评</div>
        <div className="comment-body">{caseData.comment}</div>
      </div>

      <button className="replay-btn" onClick={onReplay}>重 新 参 详</button>

      <div className="page-num right">─ 〇 ─</div>
    </div>
  );
}

// Toast组件
function Toast({ text, show }: { text: string; show: boolean }) {
  return <div className={`toast ${show ? 'show' : ''}`}>{text}</div>;
}

// 主组件
export default function CasebookUI({ onClose, initialCaseId, progress }: CasebookUIProps) {
  const [casesData, setCasesData] = useState<Record<string, CaseData[]>>(() => {
    // 根据progress更新解锁状态
    const data = { ...MEDICAL_CASES.cases };
    Object.entries(progress).forEach(([catId, caseIds]) => {
      if (data[catId]) {
        data[catId] = data[catId].map(c => ({
          ...c,
          unlocked: caseIds.includes(c.id) || c.unlocked
        }));
      }
    });
    return data;
  });
  const [activeCat, setActiveCat] = useState('fei');
  const [view, setView] = useState<'list' | 'detail'>(initialCaseId ? 'detail' : 'list');
  const [activeCase, setActiveCase] = useState<CaseData | null>(() => {
    if (initialCaseId) {
      for (const list of Object.values(casesData)) {
        const found = list.find(c => c.id === initialCaseId);
        if (found) return found;
      }
    }
    return null;
  });
  const [flipDir, setFlipDir] = useState<'forward' | 'backward' | null>(null);
  const [toast, setToast] = useState({ show: false, text: '' });

  // 进度统计
  const { totalUnlocked, totalCount } = useMemo(() => {
    let u = 0, t = 0;
    Object.values(casesData).forEach(list => {
      t += list.length;
      u += list.filter(c => c.unlocked).length;
    });
    return { totalUnlocked: u, totalCount: t };
  }, [casesData]);

  // 监听诊断结果
  useEffect(() => {
    const handleResult = ((e: CustomEvent) => {
      const { caseId, score, syndrome, formula } = e.detail;
      // 更新解锁状态
      setCasesData(prev => {
        const updated = { ...prev };
        for (const catId of Object.keys(updated)) {
          updated[catId] = updated[catId].map(c => {
            if (c.id === caseId) {
              return {
                ...c,
                unlocked: true,
                score: score,
                syndrome: syndrome,
                formula: formula,
                stamp: score === '优' ? '妙手' : '中工'
              };
            }
            return c;
          });
        }
        return updated;
      });
    }) as EventListener;

    window.addEventListener(CASEBOOK_EVENTS.RESULT, handleResult);
    return () => window.removeEventListener(CASEBOOK_EVENTS.RESULT, handleResult);
  }, []);

  const openCase = (c: CaseData) => {
    setFlipDir('forward');
    setTimeout(() => {
      setActiveCase(c);
      setView('detail');
      setFlipDir(null);
    }, 650);
  };

  const closeCase = () => {
    setFlipDir('backward');
    setTimeout(() => {
      setView('list');
      setActiveCase(null);
      setFlipDir(null);
    }, 650);
  };

  const switchCat = (id: string) => {
    if (view === 'detail') return;
    setActiveCat(id);
  };

  const showToast = (text: string) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text }), 1500);
  };

  const handleStart = () => {
    if (activeCase) {
      window.dispatchEvent(new CustomEvent(CASEBOOK_EVENTS.START_CASE, {
        detail: { caseId: activeCase.id }
      }));
    }
  };

  const handleReplay = () => {
    if (activeCase) {
      window.dispatchEvent(new CustomEvent(CASEBOOK_EVENTS.REPLAY_CASE, {
        detail: { caseId: activeCase.id }
      }));
    }
  };

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent(CASEBOOK_EVENTS.CLOSE));
    onClose();
  };

  return (
    <>
      <SvgDefs />
      <div className="desk">
        <div className={`book ${flipDir ? 'flipping' : ''}`}>
          {/* 左页 */}
          <div className="page left">
            <div className="frame" />
            {view === 'list' ? (
              <CategoryPage
                activeCat={activeCat}
                setActiveCat={switchCat}
                totalUnlocked={totalUnlocked}
                totalCount={totalCount}
                casesData={casesData}
              />
            ) : (
              activeCase && <DetailLeft caseData={activeCase} onBack={closeCase} />
            )}
          </div>

          {/* 右页 */}
          <div className="page right">
            <div className="frame" />
            {view === 'list' ? (
              <CaseGridPage
                activeCat={activeCat}
                casesData={casesData}
                onSelectCase={openCase}
              />
            ) : (
              activeCase && (activeCase.unlocked
                ? <DetailRightUnlocked caseData={activeCase} onReplay={handleReplay} />
                : <DetailRightLocked caseData={activeCase} onStart={handleStart} />)
            )}
          </div>

          {/* 翻页遮罩 */}
          {flipDir === 'forward' && (
            <div className="flip-overlay from-right">
              <div className="frame" />
              <CaseGridPage
                activeCat={activeCat}
                casesData={casesData}
                onSelectCase={() => {}}
              />
            </div>
          )}
          {flipDir === 'backward' && activeCase && (
            <div className="flip-overlay from-right">
              <div className="frame" />
              {activeCase.unlocked
                ? <DetailRightUnlocked caseData={activeCase} onReplay={() => {}} />
                : <DetailRightLocked caseData={activeCase} onStart={() => {}} />}
            </div>
          )}
        </div>
      </div>
      <Toast text={toast.text} show={toast.show} />
    </>
  );
}