// rich-text.jsx — 富文本教学标记组件
// 共享给所有对话框变体使用

// 教学数据库（demo）
const TCM_DATA = {
  herb: {
    '甘草': { pinyin: 'gāncǎo', tag: '药材', meta: { '性味': '甘，平', '归经': '心、肺、脾、胃经' }, body: '补脾益气，清热解毒，祛痰止咳，调和诸药。为方中"国老"。' },
    '生姜': { pinyin: 'shēngjiāng', tag: '药材', meta: { '性味': '辛，微温', '归经': '肺、脾、胃经' }, body: '发汗解表，温中止呕，温肺止咳。常用于外感风寒。' },
    '黄芪': { pinyin: 'huángqí', tag: '药材', meta: { '性味': '甘，微温', '归经': '脾、肺经' }, body: '补气升阳，固表止汗，利水消肿，托毒生肌。' },
    '当归': { pinyin: 'dāngguī', tag: '药材', meta: { '性味': '甘、辛，温', '归经': '肝、心、脾经' }, body: '补血活血，调经止痛，润肠通便。妇科要药。' },
    '陈皮': { pinyin: 'chénpí', tag: '药材', meta: { '性味': '辛、苦，温', '归经': '脾、肺经' }, body: '理气健脾，燥湿化痰。年久者良，故曰陈皮。' },
  },
  acupoint: {
    '足三里': { pinyin: 'Zúsānlǐ', tag: '穴位 · 足阳明胃经', meta: { '定位': '犊鼻下三寸', '主治': '胃痛、呕吐、泄泻' }, body: '"肚腹三里留"，强壮要穴，常灸之可保健长寿。' },
    '合谷': { pinyin: 'Hégǔ', tag: '穴位 · 手阳明大肠经', meta: { '定位': '手背第一二掌骨间', '主治': '头痛、牙痛、面瘫' }, body: '"面口合谷收"，四总穴之一。孕妇慎用。' },
    '太冲': { pinyin: 'Tàichōng', tag: '穴位 · 足厥阴肝经', meta: { '定位': '足背一二跖骨结合部前凹陷', '主治': '头痛、眩晕、目赤' }, body: '肝经原穴，疏肝解郁。与合谷合称"四关穴"。' },
    '内关': { pinyin: 'Nèiguān', tag: '穴位 · 手厥阴心包经', meta: { '定位': '腕横纹上二寸', '主治': '心痛、胸闷、恶心' }, body: '八脉交会穴，通阴维。晕车晕船按之即效。' },
  },
  classic: {
    '上工治未病': { pinyin: '《黄帝内经》', tag: '古文引用', meta: { '出处': '《素问·四气调神大论》' }, body: '高明的医者治疗"未发之病"——重在预防，于未病之时调摄，胜于既病之后施药。' },
    '七情和合': { pinyin: 'qīqínghéhé', tag: '中药配伍', meta: { '出处': '《神农本草经》' }, body: '单行、相须、相使、相畏、相杀、相恶、相反——配伍用药之七种关系。' },
    '阴阳者，天地之道也': { pinyin: '', tag: '古文引用', meta: { '出处': '《素问·阴阳应象大论》' }, body: '阴阳是天地万物的根本规律，是变化的源头，是生杀的本始，是神明的归藏。' },
  },
  symptom: {
    '气虚': { pinyin: 'qìxū', tag: '证候', meta: { '常见症': '乏力、气短、自汗', '舌脉': '舌淡，脉虚弱' }, body: '元气不足，脏腑机能减退。常见于久病、劳倦、年老体衰之人。' },
    '湿热': { pinyin: 'shīrè', tag: '证候', meta: { '常见症': '身热不扬、口苦、苔黄腻', '舌脉': '脉濡数' }, body: '湿邪与热邪结合。"湿性黏滞"，故病程缠绵难愈。' },
    '风寒': { pinyin: 'fēnghán', tag: '外邪', meta: { '常见症': '恶寒重、发热轻、无汗', '舌脉': '苔薄白，脉浮紧' }, body: '风寒之邪侵袭肌表，腠理闭塞。治宜辛温解表。' },
  },
};

// 单个标记片段
function TCMTerm({ kind, term, children }) {
  const data = TCM_DATA[kind]?.[term];
  if (!data) return <span>{children || term}</span>;

  const className = `tcm-${kind}`;
  const accentColor = {
    herb: 'var(--herb)',
    acupoint: 'var(--acupoint)',
    classic: 'var(--classic)',
    symptom: 'var(--symptom)',
  }[kind];

  return (
    <span className={className}>
      {children || term}
      <span className="tcm-tooltip" style={{ borderTopColor: accentColor }}>
        <div className="tcm-tt-title">
          <span>{term}</span>
          {data.pinyin && <span className="tcm-tt-pinyin">{data.pinyin}</span>}
        </div>
        <div style={{ fontSize: '10px', color: accentColor, letterSpacing: '0.1em', marginBottom: '6px' }}>
          {data.tag}
        </div>
        <div className="tcm-tt-divider" />
        {Object.entries(data.meta || {}).map(([k, v]) => (
          <div className="tcm-tt-row" key={k}>
            <span>{k}</span>
            <span style={{ color: 'var(--ink)' }}>{v}</span>
          </div>
        ))}
        {data.body && (
          <>
            <div className="tcm-tt-divider" />
            <div className="tcm-tt-body">{data.body}</div>
          </>
        )}
      </span>
    </span>
  );
}

// 富文本渲染器：接受标记数组
// segments: [{type: 'text'|'herb'|'acupoint'|'classic'|'symptom'|'em'|'br', content: string}]
function RichText({ segments }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <React.Fragment key={i}>{seg.content}</React.Fragment>;
        if (seg.type === 'br') return <br key={i} />;
        if (seg.type === 'em') return <em key={i} style={{ color: 'var(--ink)', fontWeight: 600, fontStyle: 'normal' }}>{seg.content}</em>;
        return <TCMTerm key={i} kind={seg.type} term={seg.content} />;
      })}
    </>
  );
}

// 简易解析器：用 [[kind:term]] 标记
// 例：'外感[[symptom:风寒]]，可用[[herb:生姜]]发表'
function parseRich(str) {
  const out = [];
  const re = /\[\[(\w+):([^\]]+)\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out.push({ type: 'text', content: str.slice(last, m.index) });
    out.push({ type: m[1], content: m[2] });
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push({ type: 'text', content: str.slice(last) });
  return out;
}

Object.assign(window, { TCMTerm, RichText, parseRich, TCM_DATA });
