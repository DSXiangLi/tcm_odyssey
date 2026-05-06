# 病案集与炮制游戏HTML嵌入实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将病案集和炮制两个HTML小游戏嵌入到Phaser主游戏，采用与现有煎药/诊断/背包一致的React DOM直接挂载模式。

**Architecture:** 创建独立的entry文件、事件桥接、Phaser场景，透明背景覆盖层模式，CustomEvent通信。

**Tech Stack:** React 18, TypeScript, Phaser 3, CSS

---

## 文件结构

### 病案集

```
src/ui/html/
├── casebook-entry.tsx           # mount/unmount函数
├── CasebookUI.tsx               # 主React组件
├── casebook.css                 # 样式(透明背景)
└── bridge/
    └── casebook-events.ts       # 事件定义

src/scenes/
└── CasebookScene.ts             # Phaser场景

src/data/
└── casebook-data.ts             # 病案数据(从cases.js迁移)
```

### 炮制

```
src/ui/html/
├── paozhi-entry.tsx             # mount/unmount函数
├── paozhi.css                   # 全局样式
└── paozhi/
    ├── PaozhiUI.tsx             # 主组件
    ├── atoms.tsx                # 基础组件
    ├── vessels.tsx              # 器皿架
    ├── inventory.tsx            # 药材库
    ├── animations.tsx           # 炮制动画
    └── scroll.tsx               # 任务卷轴

src/ui/html/bridge/
└── paozhi-events.ts             # 事件定义

src/scenes/
└── PaozhiScene.ts               # Phaser场景

src/data/
└── paozhi-data.ts               # 炮制数据(从data.jsx迁移)
```

---

## Task 1: 病案集事件定义

**Files:**
- Create: `src/ui/html/bridge/casebook-events.ts`

- [ ] **Step 1: 创建事件常量文件**

```typescript
// src/ui/html/bridge/casebook-events.ts
/**
 * 病案集 UI 桥接事件常量
 *
 * React UI ↔ Phaser CasebookScene 双向通信
 */

export const CASEBOOK_EVENTS = {
  // React → Phaser
  START_CASE: 'casebook:start_case',    // 开案问诊
  REPLAY_CASE: 'casebook:replay_case',  // 重新参详
  CLOSE: 'casebook:close',              // 关闭病案集

  // Phaser → React
  RESULT: 'casebook:result',            // 诊断结果返回
  STATE_UPDATE: 'casebook:state:update', // 更新状态
};
```

- [ ] **Step 2: 提交**

```bash
git add src/ui/html/bridge/casebook-events.ts
git commit -m "feat(casebook): add bridge event constants"
```

---

## Task 2: 病案集数据迁移

**Files:**
- Create: `src/data/casebook-data.ts`

- [ ] **Step 1: 创建TypeScript数据文件**

```typescript
// src/data/casebook-data.ts
/**
 * 病案数据 - 从 docs/ui/病案集/data/cases.js 迁移
 * 6类 × 10例，每类解锁前2例
 */

export interface CaseData {
  id: string;
  title: string;
  patient: string;
  unlocked: boolean;
  chief?: string;
  history?: string;
  tongue?: string;
  pulse?: string;
  summary?: string;
  syndrome?: string;
  formula?: string;
  score?: string;
  stamp?: string;
  comment?: string;
}

export interface CategoryData {
  id: string;
  name: string;
  subtitle: string;
}

export interface CasebookData {
  categories: CategoryData[];
  cases: Record<string, CaseData[]>;
}

export const MEDICAL_CASES: CasebookData = {
  categories: [
    { id: 'fei', name: '肺系', subtitle: '咳喘鼻喉之疾' },
    { id: 'xin', name: '心系', subtitle: '神志血脉之疾' },
    { id: 'piwei', name: '脾胃', subtitle: '运化纳谷之疾' },
    { id: 'gandan', name: '肝胆', subtitle: '疏泄藏血之疾' },
    { id: 'shen', name: '肾系', subtitle: '水液藏精之疾' },
    { id: 'qixue', name: '气血津液', subtitle: '荣卫流注之疾' },
  ],
  cases: {
    fei: [
      { id: 'fei-01', title: '风寒咳嗽', patient: '李某，男，三十有二，木匠', unlocked: true,
        chief: '咳嗽五日，痰白清稀，鼻塞流涕。',
        history: '患者于五日前晨起赴乡间作工，途遇朔风冷雨，归家后即觉头身困重，喷嚏频作，鼻流清涕。次日晨起咳嗽频作，咳声重浊，痰白清稀，量多易咯。伴恶寒微热，无汗，头痛连项，肢节酸楚，胸闷不舒，不思饮食。曾自服姜汤未效，咳嗽日渐加重，夜不能安。',
        tongue: '舌淡红，苔薄白而润。',
        pulse: '脉浮紧，寸部尤显。',
        summary: '冬月感寒，咳声重浊，痰白清稀，鼻塞流涕，恶寒微热。',
        syndrome: '风寒袭肺', formula: '三拗汤合止嗽散', score: '优', stamp: '妙手',
        comment: '辨证清晰，宣肺散寒得当。三拗合止嗽，一散一润，深谙肺为娇脏之理。麻黄杏仁宣降并施，紫菀百部润肺止咳，佐以荆芥透邪外出，配伍井然。' },
      { id: 'fei-02', title: '风热咳嗽', patient: '王某，女，二十有八，绣娘', unlocked: true,
        chief: '咳嗽五日，痰黄黏稠，咽痛口干。',
        history: '春末天气乍暖，患者因室内闷热而开窗纳凉，复又外出沽酒，归来即觉咽喉微痛。次日咳嗽渐作，痰色黄稠，咯之不畅，伴咽痛口干，欲饮冷水。身热微汗，头胀目赤，鼻流浊涕。胸中烦闷，夜寐不安，小便短黄，大便略干。',
        tongue: '舌尖红，苔薄黄。',
        pulse: '脉浮数。',
        summary: '春末咳嗽五日，痰黄黏稠，咽痛口干，身热微汗。',
        syndrome: '风热犯肺', formula: '桑菊饮', score: '良', stamp: '中工',
        comment: '辨证准确，桑菊饮轻清宣透，惟剂量稍轻，可加芦根、浙贝增效。风热在表当辛凉解肌，既不可过用辛温，亦不可骤投苦寒，分寸拿捏需更精到。' },
      { id: 'fei-03', title: '燥邪伤肺', patient: '陈某，男，四十', unlocked: false },
      { id: 'fei-04', title: '痰湿蕴肺', patient: '赵某，女，五十有五', unlocked: false },
      { id: 'fei-05', title: '肺阴亏耗', patient: '林某，男，六十', unlocked: false },
      { id: 'fei-06', title: '哮病·寒哮', patient: '周某，男，三十有八', unlocked: false },
      { id: 'fei-07', title: '哮病·热哮', patient: '吴某，女，四十有二', unlocked: false },
      { id: 'fei-08', title: '喘证·实喘', patient: '郑某，男，四十有五', unlocked: false },
      { id: 'fei-09', title: '肺痈', patient: '孙某，男，三十有六', unlocked: false },
      { id: 'fei-10', title: '肺痨', patient: '冯某，女，二十有四', unlocked: false },
    ],
    xin: [
      { id: 'xin-01', title: '心悸·心虚胆怯', patient: '张某，女，三十有五，商贾之妻', unlocked: true,
        chief: '惊悸不宁两月，遇事善惊。',
        history: '患者两月前夜行小巷，忽闻犬吠，惊惧之下心跳骤剧，自此每遇响动则心悸如鼓，胸中惕惕。日间善惊易恐，坐卧不安，闻声辄惊。夜寐不实，少寐多梦，梦中多惊恐之境，醒后心慌汗出。伴神疲乏力，气短懒言，食欲尚可，二便如常。',
        tongue: '舌淡苔薄白。',
        pulse: '脉细弦而动数。',
        summary: '惊悸不宁，善惊易恐，坐卧不安，少寐多梦，舌淡苔薄。',
        syndrome: '心虚胆怯', formula: '安神定志丸', score: '优', stamp: '妙手',
        comment: '心胆同治，茯神远志安神，龙齿石菖蒲定志，切中病机。心虚胆怯之证，须审其虚实兼夹，本案纯虚无实，方证相应，故收效迅捷。' },
      { id: 'xin-02', title: '不寐·心脾两虚', patient: '黄某，女，四十有八，绣坊管事', unlocked: true,
        chief: '夜不成寐月余，多梦易醒。',
        history: '患者操劳家中诸事，又主管绣坊事务，思虑过度。月余前因丧母悲恸过度，自此夜不能寐，初则入睡困难，渐至彻夜难眠，偶有浅睡亦多梦易醒。日间神疲倦怠，头晕目眩，食少纳呆，食后腹胀。面色萎黄无华，唇甲色淡，月事量少色淡。',
        tongue: '舌淡，苔薄白。',
        pulse: '脉细弱无力。',
        summary: '夜不成寐月余，多梦易醒，神疲食少，面色萎黄。',
        syndrome: '心脾两虚', formula: '归脾汤', score: '良', stamp: '中工',
        comment: '归脾汤补益心脾，方证相合。可佐酸枣仁、夜交藤增其安神之效。气血既虚，神无所主，治当益气补血、健脾养心，本方主之颇宜。' },
      { id: 'xin-03', title: '胸痹·心血瘀阻', patient: '何某，男，五十有八', unlocked: false },
      { id: 'xin-04', title: '胸痹·痰浊闭阻', patient: '罗某，男，六十有二', unlocked: false },
      { id: 'xin-05', title: '心悸·心阳不振', patient: '梁某，男，五十', unlocked: false },
      { id: 'xin-06', title: '不寐·肝郁化火', patient: '宋某，女，四十', unlocked: false },
      { id: 'xin-07', title: '癫证·痰气郁结', patient: '谢某，男，三十有二', unlocked: false },
      { id: 'xin-08', title: '狂证·痰火扰神', patient: '韩某，男，二十有八', unlocked: false },
      { id: 'xin-09', title: '痫病·风痰闭阻', patient: '唐某，女，二十有六', unlocked: false },
      { id: 'xin-10', title: '健忘·心肾不交', patient: '冯某，男，五十有五', unlocked: false },
    ],
    piwei: [
      { id: 'piwei-01', title: '胃痛·寒邪客胃', patient: '徐某，男，二十有六，脚夫', unlocked: true,
        chief: '胃脘冷痛三日，得温则减。',
        history: '三日前患者送货途中口渴难耐，连饮冰镇酸梅汤数碗，复食生冷瓜果，归家后即觉胃脘冷痛，痛势急迫，绵绵不止。痛时喜按喜温，得热饮或热敷则痛减，遇寒或食冷则痛甚。伴恶心欲呕，口淡不渴，喜热饮，食欲不振。手足不温，倦怠少力，小便清长，大便溏薄。',
        tongue: '舌淡，苔白润。',
        pulse: '脉弦紧。',
        summary: '暴饮冷食后胃脘冷痛，得温则减，喜热饮，舌淡苔白。',
        syndrome: '寒邪客胃', formula: '良附丸', score: '优', stamp: '妙手',
        comment: '高良姜温胃散寒，香附理气止痛，简方而中的，深得仲景之旨。寒凝气滞，温通并施，二味成方，用之得当则效如桴鼓。' },
      { id: 'piwei-02', title: '泄泻·脾胃虚弱', patient: '朱某，女，四十有三，茶寮主妇', unlocked: true,
        chief: '大便溏薄三月，食后即泻。',
        history: '患者素体脾胃虚弱，三月前因连日操劳茶寮生意，饮食失节，渐起便溏。初则大便日二三行，质稀不成形；近月加重，每食油腻或稍多即腹中作响，少顷即泻。泻物完谷不化，无臭秽。伴脘腹胀满，食少纳呆，神疲乏力，气短懒言，面色萎黄少华。形体渐瘦，四肢不温。',
        tongue: '舌淡胖，边有齿痕，苔白滑。',
        pulse: '脉细弱。',
        summary: '大便溏薄三月，食后即泻，神疲乏力，面色萎黄。',
        syndrome: '脾虚湿困', formula: '参苓白术散', score: '良', stamp: '中工',
        comment: '健脾化湿之法不差，参苓白术散温和适宜。若加木香理气更佳。脾虚生湿，湿盛濡泻，治当补中带消，本方甘平和缓，最合"虚人大补反不胜补"之旨。' },
      { id: 'piwei-03', title: '胃痛·肝气犯胃', patient: '魏某，男，三十有八', unlocked: false },
      { id: 'piwei-04', title: '痞满·湿热中阻', patient: '萧某，女，三十有五', unlocked: false },
      { id: 'piwei-05', title: '呕吐·痰饮内停', patient: '潘某，女，四十有八', unlocked: false },
      { id: 'piwei-06', title: '呃逆·胃火上逆', patient: '汪某，男，五十', unlocked: false },
      { id: 'piwei-07', title: '腹痛·中虚脏寒', patient: '田某，男，六十', unlocked: false },
      { id: 'piwei-08', title: '便秘·阴津亏虚', patient: '范某，女，七十', unlocked: false },
      { id: 'piwei-09', title: '痢疾·湿热痢', patient: '石某，男，二十有八', unlocked: false },
      { id: 'piwei-10', title: '噎膈·痰气交阻', patient: '姚某，男，六十有八', unlocked: false },
    ],
    gandan: [
      { id: 'gandan-01', title: '胁痛·肝郁气滞', patient: '袁某，女，三十有二，闺秀', unlocked: true,
        chief: '两胁胀痛半年，情志不畅则甚。',
        history: '患者半载前因家中变故，心绪抑郁，自此两胁胀痛时作。痛无定处，胀甚于痛，每遇情志不畅、忧思恼怒则疼痛加剧，得嗳气或矢气则稍舒。胸闷不舒，善太息，时觉咽中如有物梗，吞之不下，吐之不出。月事先后无定，经行乳房胀痛，经色暗红有块。食欲欠佳，夜寐不安。',
        tongue: '舌淡红，苔薄白。',
        pulse: '脉弦。',
        summary: '两胁胀痛半年，情志不畅则加重，胸闷善太息。',
        syndrome: '肝郁气滞', formula: '柴胡疏肝散', score: '优', stamp: '妙手',
        comment: '柴胡疏肝散疏肝理气，方证契合。情志为病，当兼安神宽怀。本案兼有梅核气之征，可佐半夏厚朴汤之意，则更尽善矣。' },
      { id: 'gandan-02', title: '黄疸·阳黄', patient: '邓某，男，四十，渔人', unlocked: true,
        chief: '身目俱黄一旬，色泽鲜明。',
        history: '患者素喜饮酒嗜食肥甘，又长年风餐露宿。十日前先觉身困乏力，食欲减退，恶心欲呕。三日后家人发现其目睛发黄，继而周身皮肤俱黄，色如橘皮，鲜明光亮。伴发热口渴，欲饮冷水，胸脘痞满，腹部胀痛，按之不舒。小便短赤，色如浓茶；大便秘结，三四日一行。',
        tongue: '舌红，苔黄腻。',
        pulse: '脉弦数。',
        summary: '身目俱黄，色泽鲜明，发热口渴，小便短赤，舌红苔黄腻。',
        syndrome: '湿热熏蒸', formula: '茵陈蒿汤', score: '良', stamp: '中工',
        comment: '茵陈蒿汤为阳黄正治。可酌加金钱草、虎杖以助利胆退黄。湿热并重，茵陈清热利湿、栀子通利三焦、大黄泻热逐瘀，三味协同，使邪有出路。' },
      { id: 'gandan-03', title: '眩晕·肝阳上亢', patient: '杜某，男，五十有六', unlocked: false },
      { id: 'gandan-04', title: '头痛·肝火上炎', patient: '尹某，女，四十有二', unlocked: false },
      { id: 'gandan-05', title: '中风·风痰阻络', patient: '柯某，男，六十有五', unlocked: false },
      { id: 'gandan-06', title: '鼓胀·气滞湿阻', patient: '左某，男，五十有八', unlocked: false },
      { id: 'gandan-07', title: '积聚·气滞血瘀', patient: '雷某，女，五十', unlocked: false },
      { id: 'gandan-08', title: '疟疾·正疟', patient: '蓝某，男，三十', unlocked: false },
      { id: 'gandan-09', title: '颤证·肝风内动', patient: '钟某，男，七十', unlocked: false },
      { id: 'gandan-10', title: '郁证·肝郁化火', patient: '段某，女，三十有八', unlocked: false },
    ],
    shen: [
      { id: 'shen-01', title: '水肿·肾阳衰微', patient: '苗某，男，五十有五，盐工', unlocked: true,
        chief: '面浮足肿三月，腰以下尤甚。',
        history: '患者长年劳作于盐田，涉水冒寒，又素嗜咸食。三月前先觉双足踝部微肿，朝起稍轻，午后渐重。月余后肿势上延至膝，按之凹陷不起，状如泥淖，久按方复。继而面目浮肿，腰腹胀满，腰膝冷痛如带冰雪，畏寒肢冷，四肢不温。神疲蜷卧，懒言少动，纳食不馨。小便短少，日不及一斤；大便溏薄。',
        tongue: '舌淡胖，边有齿痕，苔白滑。',
        pulse: '脉沉迟无力，尺部尤甚。',
        summary: '面浮足肿，腰以下尤甚，按之凹陷不起，腰膝冷痛，畏寒肢冷。',
        syndrome: '肾阳衰微', formula: '真武汤合济生肾气丸', score: '优', stamp: '妙手',
        comment: '温阳利水，标本兼治。真武主温化，肾气丸固本，配伍精当。肾阳衰微则水泛为肿，非温煦不能化气行水，附桂同用，相得益彰。' },
      { id: 'shen-02', title: '腰痛·肾阴亏虚', patient: '葛某，男，四十有八，私塾先生', unlocked: true,
        chief: '腰膝酸软隐痛半年，劳则加剧。',
        history: '患者年逾不惑，因屡试不第，长夜苦读，又素体阴亏。半载前渐觉腰膝酸软，隐隐作痛，绵绵不止。劳累或久立则痛甚，卧床稍可缓解。伴五心烦热，午后潮热，夜间盗汗。头晕耳鸣，目眩眼花，咽干口燥而不欲多饮。形体消瘦，颧红唇赤，遗精频作，小便短黄。',
        tongue: '舌红少苔，质干。',
        pulse: '脉细数。',
        summary: '腰膝酸软隐痛，劳则加剧，五心烦热，舌红少苔。',
        syndrome: '肾阴亏虚', formula: '左归丸', score: '良', stamp: '中工',
        comment: '滋阴补肾得法。可加杜仲、续断引药入腰，更合病位。左归纯补真阴，不杂阳药，最宜阴虚而无火证者，本案稍兼虚火，可佐知母黄柏。' },
      { id: 'shen-03', title: '淋证·热淋', patient: '邵某，女，三十', unlocked: false },
      { id: 'shen-04', title: '癃闭·肾阳衰惫', patient: '万某，男，七十有二', unlocked: false },
      { id: 'shen-05', title: '阳痿·命门火衰', patient: '蒋某，男，四十', unlocked: false },
      { id: 'shen-06', title: '遗精·相火妄动', patient: '钱某，男，二十有四', unlocked: false },
      { id: 'shen-07', title: '消渴·下消', patient: '彭某，男，五十有八', unlocked: false },
      { id: 'shen-08', title: '关格·脾肾阳衰', patient: '余某，男，六十有六', unlocked: false },
      { id: 'shen-09', title: '尿血·下焦湿热', patient: '殷某，女，四十有五', unlocked: false },
      { id: 'shen-10', title: '虚劳·肾精亏虚', patient: '苏某，男，六十', unlocked: false },
    ],
    qixue: [
      { id: 'qixue-01', title: '汗证·气虚自汗', patient: '马某，女，五十，乳娘', unlocked: true,
        chief: '日间汗出过多半年，动则尤甚。',
        history: '患者半载前大病初愈，自此常觉汗出涔涔。无论寒暑，日间不动即微汗津津，稍事活动则大汗淋漓，浸湿衣襟。汗出后身觉清冷，畏风怕冷，需厚衣加身。伴神疲乏力，气短懒言，声低气怯，食少纳差。面色㿠白无华，唇甲色淡。每遇时令变更则易感冒，每月必发数次，缠绵难愈。',
        tongue: '舌淡苔薄白。',
        pulse: '脉细弱。',
        summary: '日间汗出过多，动则尤甚，神疲乏力，气短懒言，易感冒。',
        syndrome: '肺卫不固', formula: '玉屏风散', score: '优', stamp: '妙手',
        comment: '玉屏风散益气固表，三药相伍，补中有疏，深得"治未病"之精髓。黄芪走表实卫，白术健脾培土，防风走表祛风，配伍精妙。' },
      { id: 'qixue-02', title: '血证·便血', patient: '武某，男，四十有五，酒坊师傅', unlocked: true,
        chief: '便下鲜血半月，先血后便。',
        history: '患者素嗜辛辣醇酒，又久坐少动。半月前忽觉便后纸上带血，初以为痔，未予重视。数日后血量渐多，每便必下鲜血，先血后便，血色鲜红，量约半盏，滴沥不止。伴肛门灼热下坠，便后疼痛。口苦口干，欲饮冷水。腹部隐痛，矢气频作。小便短黄。',
        tongue: '舌红，苔黄腻。',
        pulse: '脉滑数。',
        summary: '便下鲜血半月，先血后便，伴肛门灼热，舌红苔黄。',
        syndrome: '肠道湿热', formula: '地榆散合槐角丸', score: '良', stamp: '中工',
        comment: '清化湿热、凉血止血，方证相符。可加白头翁助清下焦湿热。湿热蕴结大肠，灼伤肠络则血溢，治法层次清楚，惟用药稍欠峻猛。' },
      { id: 'qixue-03', title: '内伤发热·阴虚发热', patient: '常某，女，三十有六', unlocked: false },
      { id: 'qixue-04', title: '虚劳·气血两虚', patient: '贺某，男，五十有八', unlocked: false },
      { id: 'qixue-05', title: '血证·咳血', patient: '熊某，男，四十', unlocked: false },
      { id: 'qixue-06', title: '血证·吐血', patient: '康某，男，五十有二', unlocked: false },
      { id: 'qixue-07', title: '消渴·上消', patient: '毛某，女，五十有五', unlocked: false },
      { id: 'qixue-08', title: '癌病·气血亏虚', patient: '史某，男，六十有八', unlocked: false },
      { id: 'qixue-09', title: '厥证·气厥', patient: '顾某，女，三十', unlocked: false },
      { id: 'qixue-10', title: '痰饮·悬饮', patient: '侯某，男，五十有六', unlocked: false },
    ],
  }
};

export default MEDICAL_CASES;
```

- [ ] **Step 2: 提交**

```bash
git add src/data/casebook-data.ts
git commit -m "feat(casebook): add medical cases data (TS migration)"
```

---

## Task 3: 病案集CSS迁移

**Files:**
- Create: `src/ui/html/casebook.css`

- [ ] **Step 1: 复制CSS文件**

从 `docs/ui/病案集/styles.css` 复制到 `src/ui/html/casebook.css`，添加透明背景嵌入关键样式：

在文件末尾添加：

```css
/* ============================================================
   透明背景嵌入关键样式
   ============================================================ */

/* 容器 - 固定定位，覆盖全屏，z-index高于Phaser */
#casebook-react-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

/* 背景层 - 透明以显示底层Phaser游戏 */
.desk {
  background: transparent;
}

/* 确保书本内容可交互 */
.book {
  pointer-events: auto;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/ui/html/casebook.css
git commit -m "feat(casebook): add CSS styles with transparent backdrop"
```

---

## Task 4: 病案集React组件迁移

**Files:**
- Create: `src/ui/html/CasebookUI.tsx`

- [ ] **Step 1: 创建主React组件**

从 `docs/ui/病案集/app.jsx` 迁移，移除ReactDOM.render调用，改为接收props：

```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add src/ui/html/CasebookUI.tsx
git commit -m "feat(casebook): add main React UI component"
```

---

## Task 5: 病案集Entry文件

**Files:**
- Create: `src/ui/html/casebook-entry.tsx`

- [ ] **Step 1: 创建mount/unmount函数**

```typescript
// src/ui/html/casebook-entry.tsx
/**
 * 病案集 UI React 入口
 *
 * 提供 mountCasebookUI 函数供 Phaser CasebookScene 调用
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import CasebookUI from './CasebookUI';
import { CASEBOOK_EVENTS } from './bridge/casebook-events';

export interface CasebookUIProps {
  onClose: () => void;
  initialCaseId?: string;
  progress: Record<string, string[]>;
}

/**
 * 挂载病案集 UI 到指定容器
 */
export function mountCasebookUI(
  container: HTMLElement,
  props: CasebookUIProps
): Root {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <CasebookUI {...props} />
    </React.StrictMode>
  );
  return root;
}

/**
 * 卸载病案集 UI
 */
export function unmountCasebookUI(root: Root): void {
  root.unmount();
}

// 导出事件常量
export { CASEBOOK_EVENTS } from './bridge/casebook-events';
```

- [ ] **Step 2: 提交**

```bash
git add src/ui/html/casebook-entry.tsx
git commit -m "feat(casebook): add entry mount/unmount functions"
```

---

## Task 6: 病案集Phaser场景

**Files:**
- Create: `src/scenes/CasebookScene.ts`
- Modify: `src/data/constants.ts` (添加CASEBOOK场景常量)

- [ ] **Step 1: 添加场景常量**

编辑 `src/data/constants.ts`，在SCENES对象中添加：

```typescript
// 在 DIAGNOSIS 之后添加
  CASEBOOK: 'CasebookScene',
```

- [ ] **Step 2: 创建CasebookScene**

```typescript
// src/scenes/CasebookScene.ts
/**
 * 病案集场景
 *
 * Phase 2.5 病案集 HTML 嵌入
 *
 * 功能:
 * - 集成 React CasebookUI
 * - 病案查看与选择
 * - 触发诊断游戏
 * - 诊断结果回写
 */

import Phaser from 'phaser';
import type { Root } from 'react-dom/client';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { mountCasebookUI, unmountCasebookUI, CASEBOOK_EVENTS } from '../ui/html/casebook-entry';
import { DIAGNOSIS_EVENTS } from '../ui/html/bridge/diagnosis-events';

export interface CasebookSceneConfig {
  caseId?: string;
}

export class CasebookScene extends Phaser.Scene {
  private eventBus!: EventBus;

  // React UI
  private reactRoot: Root | null = null;
  private domContainer: HTMLElement | null = null;

  // 事件监听器引用
  private boundStartCaseHandler: EventListener | null = null;
  private boundReplayCaseHandler: EventListener | null = null;
  private boundCloseHandler: EventListener | null = null;
  private boundDiagnosisCompleteHandler: EventListener | null = null;

  // 数据
  private initialCaseId: string | null = null;

  constructor() {
    super({ key: SCENES.CASEBOOK });
  }

  init(data: CasebookSceneConfig): void {
    this.initialCaseId = data.caseId || null;
  }

  create(): void {
    this.eventBus = EventBus.getInstance();
    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.CASEBOOK });

    // 创建 React UI
    this.createReactUI();

    // 设置事件监听
    this.setupEventListeners();

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.CASEBOOK });
  }

  private createReactUI(): void {
    // 创建 DOM 容器
    this.domContainer = document.createElement('div');
    this.domContainer.id = 'casebook-react-root';
    document.body.appendChild(this.domContainer);

    // 加载病案进度
    const progress = this.registry.get('casebook_progress') || {};

    // 挂载 React UI
    this.reactRoot = mountCasebookUI(this.domContainer, {
      onClose: () => this.closeScene(),
      initialCaseId: this.initialCaseId || undefined,
      progress,
    });
  }

  private setupEventListeners(): void {
    // START_CASE → 启动诊断
    this.boundStartCaseHandler = ((e: CustomEvent) => {
      const { caseId } = e.detail;
      this.launchDiagnosis(caseId);
    }) as EventListener;
    window.addEventListener(CASEBOOK_EVENTS.START_CASE, this.boundStartCaseHandler);

    // REPLAY_CASE → 启动诊断
    this.boundReplayCaseHandler = ((e: CustomEvent) => {
      const { caseId } = e.detail;
      this.launchDiagnosis(caseId);
    }) as EventListener;
    window.addEventListener(CASEBOOK_EVENTS.REPLAY_CASE, this.boundReplayCaseHandler);

    // CLOSE → 关闭场景
    this.boundCloseHandler = (() => {
      this.closeScene();
    }) as EventListener;
    window.addEventListener(CASEBOOK_EVENTS.CLOSE, this.boundCloseHandler);

    // DIAGNOSIS_COMPLETE → 更新进度
    this.boundDiagnosisCompleteHandler = ((e: CustomEvent) => {
      const { caseId, score, syndrome, formula } = e.detail;
      this.handleDiagnosisComplete(caseId, score, syndrome, formula);
    }) as EventListener;
    window.addEventListener(DIAGNOSIS_EVENTS.COMPLETE, this.boundDiagnosisCompleteHandler);
  }

  private launchDiagnosis(caseId: string): void {
    // 先关闭病案集
    this.cleanupReactUI();

    // 启动诊断场景
    this.scene.launch(SCENES.DIAGNOSIS, { caseId });
  }

  private handleDiagnosisComplete(
    caseId: string,
    score: string,
    syndrome: string,
    formula: string
  ): void {
    // 更新注册表中的进度
    const progress = this.registry.get('casebook_progress') || {};
    const categoryId = caseId.split('-')[0];

    if (!progress[categoryId]) {
      progress[categoryId] = [];
    }
    if (!progress[categoryId].includes(caseId)) {
      progress[categoryId].push(caseId);
    }
    this.registry.set('casebook_progress', progress);

    // 发送结果回病案集UI
    window.dispatchEvent(new CustomEvent(CASEBOOK_EVENTS.RESULT, {
      detail: { caseId, score, syndrome, formula }
    }));

    // 停止诊断场景，重新启动病案集
    this.scene.stop(SCENES.DIAGNOSIS);
    this.scene.launch(SCENES.CASEBOOK, { caseId });
  }

  private closeScene(): void {
    this.cleanupReactUI();
    this.scene.stop();
  }

  private cleanupReactUI(): void {
    if (this.reactRoot) {
      unmountCasebookUI(this.reactRoot);
      this.reactRoot = null;
    }
    if (this.domContainer) {
      this.domContainer.remove();
      this.domContainer = null;
    }

    // 移除事件监听
    if (this.boundStartCaseHandler) {
      window.removeEventListener(CASEBOOK_EVENTS.START_CASE, this.boundStartCaseHandler);
      this.boundStartCaseHandler = null;
    }
    if (this.boundReplayCaseHandler) {
      window.removeEventListener(CASEBOOK_EVENTS.REPLAY_CASE, this.boundReplayCaseHandler);
      this.boundReplayCaseHandler = null;
    }
    if (this.boundCloseHandler) {
      window.removeEventListener(CASEBOOK_EVENTS.CLOSE, this.boundCloseHandler);
      this.boundCloseHandler = null;
    }
    if (this.boundDiagnosisCompleteHandler) {
      window.removeEventListener(DIAGNOSIS_EVENTS.COMPLETE, this.boundDiagnosisCompleteHandler);
      this.boundDiagnosisCompleteHandler = null;
    }
  }

  shutdown(): void {
    this.cleanupReactUI();
    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.CASEBOOK });
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/data/constants.ts src/scenes/CasebookScene.ts
git commit -m "feat(casebook): add Phaser scene and constants"
```

---

## Task 7: ClinicScene集成病案集触发

**Files:**
- Modify: `src/scenes/ClinicScene.ts`

- [ ] **Step 1: 导入场景和事件**

在文件顶部添加导入：

```typescript
import { SCENES } from '../data/constants';
import { CASEBOOK_EVENTS } from '../ui/html/bridge/casebook-events';
```

- [ ] **Step 2: 添加C键触发**

在 `create()` 方法中添加：

```typescript
// C键触发病案集
this.input.keyboard.on('keydown-C', () => {
  if (this.isTransitioning) return;
  this.isTransitioning = true;
  this.scene.launch(SCENES.CASEBOOK, {});
});
```

- [ ] **Step 3: 提交**

```bash
git add src/scenes/ClinicScene.ts
git commit -m "feat(casebook): add C key trigger in ClinicScene"
```

---

## Task 8: 注册病案集场景

**Files:**
- Modify: `src/main.ts` 或场景注册文件

- [ ] **Step 1: 导入并注册场景**

在场景注册位置添加：

```typescript
import { CasebookScene } from './scenes/CasebookScene';

// 在场景列表中添加
new CasebookScene(),
```

- [ ] **Step 2: 提交**

```bash
git add src/main.ts
git commit -m "feat(casebook): register CasebookScene in game config"
```

---

## Task 9-15: 炮制游戏实施（类似模式）

炮制游戏的实施流程与病案集类似，包括：
- Task 9: 炮制事件定义 (`paozhi-events.ts`)
- Task 10: 炮制数据迁移 (`paozhi-data.ts`)
- Task 11: 炮制CSS迁移 (`paozhi.css`)
- Task 12: 炮制React组件迁移 (`PaozhiUI.tsx` 及子组件)
- Task 13: 炮制Entry文件 (`paozhi-entry.tsx`)
- Task 14: 炮制Phaser场景 (`PaozhiScene.ts`)
- Task 15: GardenScene集成P键触发

由于篇幅限制，炮制游戏的详细步骤与病案集模式相同，可按相同流程实施。

---

## Task 16: E2E测试

**Files:**
- Create: `tests/e2e/casebook-flow.spec.ts`

- [ ] **Step 1: 创建病案集E2E测试**

```typescript
// tests/e2e/casebook-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('病案集流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
  });

  test('C键打开病案集', async ({ page }) => {
    // 进入诊所场景
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);

    // 按C键
    await page.keyboard.press('C');

    // 验证病案集UI出现
    await expect(page.locator('#casebook-react-root')).toBeVisible();
    await expect(page.locator('.book')).toBeVisible();
  });

  test('点击病案触发诊断', async ({ page }) => {
    // 打开病案集
    await page.keyboard.press('C');
    await page.waitForTimeout(500);

    // 点击第一个病案
    await page.locator('.case-card.unlocked').first().click();
    await page.waitForTimeout(700);

    // 验证进入详情
    await expect(page.locator('.detail-title')).toBeVisible();

    // 点击开案问诊
    await page.locator('.start-btn').click();

    // 验证诊断场景启动
    await page.waitForTimeout(1000);
    await expect(page.locator('#diagnosis-react-root')).toBeVisible();
  });
});
```

- [ ] **Step 2: 提交**

```bash
git add tests/e2e/casebook-flow.spec.ts
git commit -m "test(casebook): add E2E test for casebook flow"
```

---

## 验收标准

- [ ] 病案集可从诊所C键打开
- [ ] 病案集点击"开案问诊"触发诊断
- [ ] 诊断完成后病案解锁状态更新
- [ ] 炮制可从药园P键打开
- [ ] 炮制完成后炮制品添加到背包
- [ ] 背包正确显示炮制品品质
- [ ] E2E测试全部通过
- [ ] 无内存泄漏（React正确卸载）