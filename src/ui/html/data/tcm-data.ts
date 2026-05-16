/**
 * 中医教学数据库
 * 用于富文本标记 [[herb:黄芪]] 等
 */

export interface TCMEntry {
  pinyin: string;
  tag: string;
  meta: Record<string, string>;
  body: string;
}

export interface TCMData {
  herb: Record<string, TCMEntry>;
  acupoint: Record<string, TCMEntry>;
  classic: Record<string, TCMEntry>;
  symptom: Record<string, TCMEntry>;
}

export const TCM_DATA: TCMData = {
  herb: {
    '甘草': {
      pinyin: 'gāncǎo',
      tag: '药材',
      meta: { '性味': '甘，平', '归经': '心、肺、脾、胃经' },
      body: '补脾益气，清热解毒，祛痰止咳，调和诸药。为方中"国老"。'
    },
    '黄芪': {
      pinyin: 'huángqí',
      tag: '药材',
      meta: { '性味': '甘，微温', '归经': '脾、肺经' },
      body: '补气升阳，固表止汗，利水消肿，托毒生肌。'
    },
    '当归': {
      pinyin: 'dāngguī',
      tag: '药材',
      meta: { '性味': '甘、辛，温', '归经': '肝、心、脾经' },
      body: '补血活血，调经止痛，润肠通便。妇科要药。'
    },
    '陈皮': {
      pinyin: 'chénpí',
      tag: '药材',
      meta: { '性味': '辛、苦，温', '归经': '脾、肺经' },
      body: '理气健脾，燥湿化痰。年久者良，故曰陈皮。'
    },
    '生姜': {
      pinyin: 'shēngjiāng',
      tag: '药材',
      meta: { '性味': '辛，微温', '归经': '肺、脾、胃经' },
      body: '发汗解表，温中止呕，温肺止咳。常用于外感风寒。'
    },
  },
  acupoint: {
    '足三里': {
      pinyin: 'Zúsānlǐ',
      tag: '穴位 · 足阳明胃经',
      meta: { '定位': '犊鼻下三寸', '主治': '胃痛、呕吐、泄泻' },
      body: '"肚腹三里留"，强壮要穴，常灸之可保健长寿。'
    },
    '合谷': {
      pinyin: 'Hégǔ',
      tag: '穴位 · 手阳明大肠经',
      meta: { '定位': '手背第一二掌骨间', '主治': '头痛、牙痛、面瘫' },
      body: '"面口合谷收"，四总穴之一。孕妇慎用。'
    },
    '内关': {
      pinyin: 'Nèiguān',
      tag: '穴位 · 手厥阴心包经',
      meta: { '定位': '腕横纹上二寸', '主治': '心痛、胸闷、恶心' },
      body: '八脉交会穴，通阴维。晕车晕船按之即效。'
    },
  },
  classic: {
    '上工治未病': {
      pinyin: '',
      tag: '古文引用',
      meta: { '出处': '《素问·四气调神大论》' },
      body: '高明的医者治疗"未发之病"——重在预防，于未病之时调摄。'
    },
    '阴阳者，天地之道也': {
      pinyin: '',
      tag: '古文引用',
      meta: { '出处': '《素问·阴阳应象大论》' },
      body: '阴阳是天地万物的根本规律，是变化的源头，是生杀的本始。'
    },
  },
  symptom: {
    '气虚': {
      pinyin: 'qìxū',
      tag: '证候',
      meta: { '常见症': '乏力、气短、自汗', '舌脉': '舌淡，脉虚弱' },
      body: '元气不足，脏腑机能减退。常见于久病、劳倦、年老体衰之人。'
    },
    '湿热': {
      pinyin: 'shīrè',
      tag: '证候',
      meta: { '常见症': '身热不扬、口苦、苔黄腻', '舌脉': '脉濡数' },
      body: '湿邪与热邪结合。"湿性黏滞"，故病程缠绵难愈。'
    },
    '风寒': {
      pinyin: 'fēngán',
      tag: '外邪',
      meta: { '常见症': '恶寒重、发热轻、无汗', '舌脉': '苔薄白，脉浮紧' },
      body: '风寒之邪侵袭肌表，腠理闭塞。治宜辛温解表。'
    },
  },
};

export type TCMKind = keyof TCMData;