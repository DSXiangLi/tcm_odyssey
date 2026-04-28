// src/ui/html/data/diagnosis-cases.ts
/**
 * 诊断游戏病案库数据
 *
 * 来源: docs/ui/诊断游戏/case-data.js + 扩展
 * 创建日期: 2026-04-28
 * 病案数量: 10个（外感类内科疾病）
 */

// ============ 类型定义 ============

export interface DiagnosisCase {
  id: string;
  category: string;           // 病案分类
  patient: {
    name: string;
    age: number;
    gender: '男' | '女';
    occupation: string;
    chief: string;             // 主诉
    portrait_desc: string;     // 面容描述
    intro_brief: string;       // 案前引子（不透露病机）
    intro_meta: string[];      // 元信息标签
  };
  tongue: {
    image_caption?: string;    // 舌象图片描述
    correct: {
      color: string;           // 舌色
      coating: string;         // 舌苔
      shape: string;           // 舌型
      moisture: string;        // 润燥
    }
  };
  pulse: {
    classical: string;         // 经典脉象描述
    plain: string;             // 通俗脉象描述
    correct: {
      position: string;        // 脉位
      quality: string;         // 脉势
    }
  };
  wenzhen: {
    suggested_questions: string[];
    dialog_tree: Record<string, string>;
    clues: { id: string; label: string; found_by: string[] }[];
  };
  bianzheng: {
    options: { id: string; label: string; correct: boolean }[];
  };
  fang: {
    options: {
      id: string;
      name: string;
      correct: boolean;
      source: string;
      composition: string;
      function: string;
      indication: string;
      note: string;
    }[];
  };
}

// ============ 病案数据 ============

export const DIAGNOSIS_CASES: DiagnosisCase[] = [
  // ========== 病案 1: 湿阻中焦（原设计稿示例）==========
  {
    id: 'case-001',
    category: '湿阻类',
    patient: {
      name: '李秀梅',
      age: 35,
      gender: '女',
      occupation: '茶商',
      chief: '脘腹胀满、食欲不振半月余',
      portrait_desc: '面色萎黄，神疲懒言，倚坐于椅，眉宇微蹙',
      intro_brief: '近半月来，常觉身倦体重，食饮不思，腹中胀闷难解。今值梅雨连绵，病情似又添几分。',
      intro_meta: ['居 · 江南水乡', '业 · 茶 商', '时 · 长夏梅雨', '初 诊'],
    },
    tongue: {
      image_caption: '舌体胖大，边有齿痕；苔白厚而腻，水滑',
      correct: {
        color: '淡白',
        coating: '白腻',
        shape: '胖大有齿痕',
        moisture: '水滑'
      }
    },
    pulse: {
      classical: '指下举之不足，按之有余；如绵裹砂，软滑而迟。三部俱见，关部尤甚。',
      plain: '脉来缓慢柔软，按之略有力，如棉裹细沙之感，关部最为明显。',
      correct: {
        position: '关',
        quality: '濡缓'
      }
    },
    wenzhen: {
      suggested_questions: [
        '近日饮食如何？',
        '大小便情况怎样？',
        '是否觉得身体困重？',
        '口中有无异味？',
        '胸腹是否胀闷？',
        '近来情志如何？',
        '是否容易出汗？',
        '睡眠质量如何？'
      ],
      dialog_tree: {
        '近日饮食如何？': '近日全无胃口，吃几口便觉脘腹胀满，闻到油腻味更觉恶心。',
        '大小便情况怎样？': '大便溏薄不成形，一日两三次，黏腻不爽。小便倒是不多。',
        '是否觉得身体困重？': '正是！整日身重如裹，四肢沉沉的，懒得动弹，头也像蒙了块布。',
        '口中有无异味？': '口中黏腻发甜，不想喝水，偶尔泛恶。',
        '胸腹是否胀闷？': '胸口闷闷的，胃脘部胀满，按之不痛但觉堵塞。',
        '近来情志如何？': '梅雨时节生意清淡，心中烦闷，但还谈不上抑郁。',
        '是否容易出汗？': '不大出汗，皮肤倒是有些黏腻感。',
        '睡眠质量如何？': '夜里能睡，但起床后仍觉疲倦，越睡越乏。'
      },
      clues: [
        { id: 'c1', label: '脘腹胀满、纳呆', found_by: ['近日饮食如何？', '胸腹是否胀闷？'] },
        { id: 'c2', label: '便溏黏腻不爽', found_by: ['大小便情况怎样？'] },
        { id: 'c3', label: '身重困倦、头蒙', found_by: ['是否觉得身体困重？'] },
        { id: 'c4', label: '口黏不渴', found_by: ['口中有无异味？'] },
        { id: 'c5', label: '梅雨季节、外湿引动', found_by: ['近来情志如何？', '是否容易出汗？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '湿阻中焦（寒湿困脾）', correct: true },
        { id: 'b2', label: '脾胃湿热', correct: false },
        { id: 'b3', label: '肝郁脾虚', correct: false },
        { id: 'b4', label: '脾肾阳虚', correct: false },
        { id: 'b5', label: '食滞胃脘', correct: false },
        { id: 'b6', label: '痰饮内停', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '藿香正气散',
          correct: true,
          source: '《太平惠民和剂局方》',
          composition: '藿香三钱、紫苏一钱、白芷一钱、大腹皮一钱、茯苓一钱、白术二钱、陈皮一钱、半夏曲二钱、厚朴一钱、桔梗一钱、甘草一钱、生姜三片、大枣一枚。',
          function: '解表化湿，理气和中。',
          indication: '外感风寒，内伤湿滞证。恶寒发热，头痛，胸膈满闷，脘腹疼痛，恶心呕吐，肠鸣泄泻，舌苔白腻。',
          note: '为治外感风寒、内伤湿滞之要方，尤宜于夏月乘凉饮冷之疾。'
        },
        {
          id: 'f2',
          name: '平胃散',
          correct: true,
          source: '《简要济众方》',
          composition: '苍术五钱、厚朴三钱、陈皮三钱、甘草一钱、生姜二片、大枣二枚。',
          function: '燥湿运脾，行气和胃。',
          indication: '湿滞脾胃证。脘腹胀满，不思饮食，口淡无味，恶心呕吐，嗳气吞酸，肢体沉重，怠惰嗜卧，常多自利，舌苔白腻而厚。',
          note: '为治湿滞脾胃之基础方，后世化湿和胃方多由此化裁。'
        },
        {
          id: 'f3',
          name: '六君子汤',
          correct: false,
          source: '《医学正传》',
          composition: '人参、白术、茯苓、甘草、陈皮、半夏。',
          function: '益气健脾，燥湿化痰。',
          indication: '脾胃气虚兼痰湿证。食少便溏，胸脘痞闷，呕逆等。',
          note: '偏补气，本案湿邪偏盛而气虚未显，非首选。'
        },
        {
          id: 'f4',
          name: '半夏泻心汤',
          correct: false,
          source: '《伤寒论》',
          composition: '半夏、黄芩、干姜、人参、炙甘草、黄连、大枣。',
          function: '寒热平调，消痞散结。',
          indication: '寒热错杂之痞证。心下痞，但满而不痛，呕吐，肠鸣下利。',
          note: '主治寒热错杂痞证，本案纯寒湿无热象。'
        },
        {
          id: 'f5',
          name: '三仁汤',
          correct: false,
          source: '《温病条辨》',
          composition: '杏仁、白蔻仁、薏苡仁、半夏、厚朴、通草、滑石、竹叶。',
          function: '宣畅气机，清利湿热。',
          indication: '湿温初起及暑温夹湿之湿重于热证。',
          note: '主治湿温（湿热），本案为寒湿，性质相反。'
        },
        {
          id: 'f6',
          name: '附子理中丸',
          correct: false,
          source: '《阎氏小儿方论》',
          composition: '附子、人参、干姜、炙甘草、白术。',
          function: '温阳祛寒，益气健脾。',
          indication: '脾胃虚寒重证，或脾肾阳虚证。',
          note: '偏温补脾肾阳，本案以湿邪困脾为主，未至阳虚。'
        }
      ]
    }
  },

  // ========== 病案 2: 风寒感冒 ==========
  {
    id: 'case-002',
    category: '感冒类',
    patient: {
      name: '张大山',
      age: 42,
      gender: '男',
      occupation: '农夫',
      chief: '恶寒发热、头痛身痛两天',
      portrait_desc: '面色苍白，裹衣缩颈，时有寒战，鼻塞声重',
      intro_brief: '前日田间劳作，天寒未加衣，晚间即觉恶寒头痛，今晨发热身痛，鼻塞流清涕。',
      intro_meta: ['居 · 北方山村', '业 · 农 夫', '时 · 冬月严寒', '初 诊'],
    },
    tongue: {
      image_caption: '舌淡红，苔薄白而润',
      correct: {
        color: '淡红',
        coating: '薄白',
        shape: '正常',
        moisture: '润'
      }
    },
    pulse: {
      classical: '脉浮紧，按之减弱，如按琴弦。',
      plain: '脉浮于表，按之紧如琴弦，搏指有力。',
      correct: {
        position: '浮',
        quality: '紧'
      }
    },
    wenzhen: {
      suggested_questions: [
        '恶寒发热情况如何？',
        '头痛身痛部位？',
        '有无鼻塞流涕？',
        '咳嗽情况如何？',
        '口渴与否？',
        '小便情况？'
      ],
      dialog_tree: {
        '恶寒发热情况如何？': '恶寒重发热轻，裹紧衣被仍觉冷，发热不高，约37度多。',
        '头痛身痛部位？': '头痛在后项部，牵扯到脊背，浑身酸痛，像被打了一顿。',
        '有无鼻塞流涕？': '鼻塞声重，流清鼻涕，喷嚏不断。',
        '咳嗽情况如何？': '偶有咳嗽，咳白稀痰，不甚剧烈。',
        '口渴与否？': '不渴，想喝热汤暖身。',
        '小便情况？': '小便清长，颜色淡。'
      },
      clues: [
        { id: 'c1', label: '恶寒重发热轻', found_by: ['恶寒发热情况如何？'] },
        { id: 'c2', label: '头项强痛、身痛', found_by: ['头痛身痛部位？'] },
        { id: 'c3', label: '鼻塞流清涕', found_by: ['有无鼻塞流涕？'] },
        { id: 'c4', label: '咳白稀痰', found_by: ['咳嗽情况如何？'] },
        { id: 'c5', label: '无汗、不渴', found_by: ['口渴与否？', '小便情况？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '风寒感冒', correct: true },
        { id: 'b2', label: '风热感冒', correct: false },
        { id: 'b3', label: '暑湿感冒', correct: false },
        { id: 'b4', label: '气虚感冒', correct: false },
        { id: 'b5', label: '阳虚感冒', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '荆防败毒散',
          correct: true,
          source: '《摄生众妙方》',
          composition: '荆芥、防风、羌活、独活、柴胡、前胡、川芎、枳壳、茯苓、甘草。',
          function: '疏风解表，败毒消肿。',
          indication: '风寒感冒。恶寒发热，头痛身痛，鼻塞流涕，咳嗽痰白。',
          note: '为风寒感冒常用方，发汗解表力强。'
        },
        {
          id: 'f2',
          name: '麻黄汤',
          correct: true,
          source: '《伤寒论》',
          composition: '麻黄三钱、桂枝二钱、杏仁二钱、甘草一钱。',
          function: '发汗解表，宣肺平喘。',
          indication: '外感风寒表实证。恶寒发热，头身疼痛，无汗而喘，脉浮紧。',
          note: '发汗力峻，宜于风寒表实无汗者。'
        },
        {
          id: 'f3',
          name: '银翘散',
          correct: false,
          source: '《温病条辨》',
          composition: '银花、连翘、荆芥、豆豉、薄荷、牛蒡子、桔梗、甘草。',
          function: '辛凉透表，清热解毒。',
          indication: '风热感冒。发热重恶寒轻，头痛咽痛，咳嗽痰黄。',
          note: '主治风热，本案为风寒，药性相反。'
        },
        {
          id: 'f4',
          name: '参苏饮',
          correct: false,
          source: '《太平惠民和剂局方》',
          composition: '人参、苏叶、葛根、前胡、半夏、茯苓、陈皮、甘草、桔梗、枳壳、木香。',
          function: '益气解表，理气化痰。',
          indication: '气虚外感风寒。恶寒发热，头痛鼻塞，咳嗽痰白，倦怠乏力。',
          note: '主治气虚感冒，本案无气虚表现。'
        },
        {
          id: 'f5',
          name: '桂枝汤',
          correct: false,
          source: '《伤寒论》',
          composition: '桂枝三钱、芍药三钱、甘草二钱、生姜三片、大枣三枚。',
          function: '解肌发表，调和营卫。',
          indication: '外感风寒表虚证。发热恶风，汗出头痛，脉浮缓。',
          note: '主治表虚有汗者，本案无汗脉紧属表实。'
        }
      ]
    }
  },

  // ========== 病案 3: 风热感冒 ==========
  {
    id: 'case-003',
    category: '感冒类',
    patient: {
      name: '王淑芬',
      age: 28,
      gender: '女',
      occupation: '裁缝',
      chief: '发热咽痛、咳嗽三天',
      portrait_desc: '面红目赤，咽部红肿，咳嗽声频，痰黄黏稠',
      intro_brief: '三日前外出购物，天气炎热，归家后即觉咽干发热，次日热势加重，咳嗽咽痛明显。',
      intro_meta: ['居 · 南方城镇', '业 · 裁 缝', '时 · 初夏时节', '初 诊'],
    },
    tongue: {
      image_caption: '舌红，苔薄黄',
      correct: {
        color: '红',
        coating: '薄黄',
        shape: '正常',
        moisture: '干'
      }
    },
    pulse: {
      classical: '脉浮数，按之有力。',
      plain: '脉浮于表，搏指快速有力，一分钟约一百至。',
      correct: {
        position: '浮',
        quality: '数'
      }
    },
    wenzhen: {
      suggested_questions: [
        '发热恶寒情况？',
        '咽痛程度？',
        '咳嗽痰色？',
        '口渴与否？',
        '有无汗出？',
        '小便颜色？'
      ],
      dialog_tree: {
        '发热恶寒情况？': '发热重，恶寒轻，一阵阵发热，出汗后热稍减。',
        '咽痛程度？': '咽痛明显，吞咽时更痛，嗓子干热。',
        '咳嗽痰色？': '咳嗽频繁，痰黄黏稠，咳出不爽。',
        '口渴与否？': '口渴想喝冷水。',
        '有无汗出？': '有汗，出汗后身热稍退，但一会儿又热。',
        '小便颜色？': '小便短赤，颜色深。'
      },
      clues: [
        { id: 'c1', label: '发热重恶寒轻', found_by: ['发热恶寒情况？'] },
        { id: 'c2', label: '咽痛红肿', found_by: ['咽痛程度？'] },
        { id: 'c3', label: '咳嗽痰黄', found_by: ['咳嗽痰色？'] },
        { id: 'c4', label: '口渴喜冷饮', found_by: ['口渴与否？'] },
        { id: 'c5', label: '有汗小便短赤', found_by: ['有无汗出？', '小便颜色？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '风热感冒', correct: true },
        { id: 'b2', label: '风寒感冒', correct: false },
        { id: 'b3', label: '暑湿感冒', correct: false },
        { id: 'b4', label: '阴虚感冒', correct: false },
        { id: 'b5', label: '痰热感冒', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '银翘散',
          correct: true,
          source: '《温病条辨》',
          composition: '银花三钱、连翘三钱、荆芥二钱、豆豉二钱、薄荷一钱、牛蒡子二钱、桔梗二钱、甘草一钱。',
          function: '辛凉透表，清热解毒。',
          indication: '风热感冒。发热重恶寒轻，头痛咽痛，咳嗽痰黄，口渴。',
          note: '为风热感冒首选方，清热解表力强。'
        },
        {
          id: 'f2',
          name: '桑菊饮',
          correct: true,
          source: '《温病条辨》',
          composition: '桑叶三钱、菊花二钱、杏仁二钱、连翘二钱、薄荷一钱、桔梗二钱、甘草一钱、芦根二钱。',
          function: '疏风清热，宣肺止咳。',
          indication: '风热咳嗽。咳嗽为主，发热不重，咽干口渴。',
          note: '主治风热犯肺咳嗽，本案咳嗽明显可用。'
        },
        {
          id: 'f3',
          name: '荆防败毒散',
          correct: false,
          source: '《摄生众妙方》',
          composition: '荆芥、防风、羌活、独活、柴胡、前胡、川芎、枳壳、茯苓、甘草。',
          function: '疏风解表，败毒消肿。',
          indication: '风寒感冒。恶寒发热，头痛身痛，鼻塞流涕。',
          note: '主治风寒，本案为风热，药性相反。'
        },
        {
          id: 'f4',
          name: '麻杏石甘汤',
          correct: false,
          source: '《伤寒论》',
          composition: '麻黄、杏仁、石膏、甘草。',
          function: '辛凉疏表，清肺平喘。',
          indication: '外感风邪，邪热壅肺证。发热喘咳，口渴汗出。',
          note: '主治邪热壅肺喘咳，本案未见喘息。'
        },
        {
          id: 'f5',
          name: '加减葳蕤汤',
          correct: false,
          source: '《通俗伤寒论》',
          composition: '葳蕤、白薇、豆豉、薄荷、桔梗、葱白、甘草。',
          function: '滋阴解表。',
          indication: '阴虚感冒。头痛身热，微恶风寒，咳嗽痰少，口干咽燥。',
          note: '主治阴虚感冒，本案无阴虚表现。'
        }
      ]
    }
  },

  // ========== 病案 4: 暑湿感冒 ==========
  {
    id: 'case-004',
    category: '感冒类',
    patient: {
      name: '陈小明',
      age: 19,
      gender: '男',
      occupation: '书生',
      chief: '身热汗出、头昏胸闷两天',
      portrait_desc: '面色潮红，汗出黏腻，神情倦怠，时有恶心',
      intro_brief: '盛夏读书，贪凉饮冷，昨日突觉头昏身热，汗出不解，胸中闷塞，恶心欲吐。',
      intro_meta: ['居 · 江南书院', '业 · 书 生', '时 · 盛夏酷暑', '初 诊'],
    },
    tongue: {
      image_caption: '舌红，苔黄腻',
      correct: {
        color: '红',
        coating: '黄腻',
        shape: '正常',
        moisture: '润'
      }
    },
    pulse: {
      classical: '脉濡数，按之软滑。',
      plain: '脉来濡软而数，按之如棉裹沙，搏指快速。',
      correct: {
        position: '浮',
        quality: '濡数'
      }
    },
    wenzhen: {
      suggested_questions: [
        '身热汗出情况？',
        '头昏程度？',
        '胸闷恶心？',
        '口渴情况？',
        '小便大便？',
        '饮食情况？'
      ],
      dialog_tree: {
        '身热汗出情况？': '身热汗出，汗出黏腻，但热不退，反觉更闷。',
        '头昏程度？': '头昏沉重，像蒙了湿布，转动不灵。',
        '胸闷恶心？': '胸中闷塞，有时恶心想吐，尤其是闻到油腻味。',
        '口渴情况？': '口渴但不想多喝水，喝了反觉胃不舒服。',
        '小便大便？': '小便短赤，大便黏滞不爽。',
        '饮食情况？': '胃口不好，吃不下东西。'
      },
      clues: [
        { id: 'c1', label: '身热汗出不解', found_by: ['身热汗出情况？'] },
        { id: 'c2', label: '头昏重如裹', found_by: ['头昏程度？'] },
        { id: 'c3', label: '胸闷恶心', found_by: ['胸闷恶心？'] },
        { id: 'c4', label: '口渴不欲饮', found_by: ['口渴情况？'] },
        { id: 'c5', label: '小便短赤大便黏', found_by: ['小便大便？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '暑湿感冒', correct: true },
        { id: 'b2', label: '风热感冒', correct: false },
        { id: 'b3', label: '风寒感冒', correct: false },
        { id: 'b4', label: '湿热中阻', correct: false },
        { id: 'b5', label: '痰热内扰', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '新加香薷饮',
          correct: true,
          source: '《温病条辨》',
          composition: '香薷二钱、银花三钱、鲜扁豆花三钱、连翘二钱、厚朴二钱。',
          function: '祛暑解表，清热化湿。',
          indication: '暑湿感冒。发热汗出不解，头昏重，胸闷恶心，口渴不欲饮。',
          note: '为暑湿感冒首选方，祛暑化湿力佳。'
        },
        {
          id: 'f2',
          name: '藿香正气散',
          correct: true,
          source: '《太平惠民和剂局方》',
          composition: '藿香、紫苏、白芷、大腹皮、茯苓、白术、陈皮、半夏曲、厚朴、桔梗、甘草。',
          function: '解表化湿，理气和中。',
          indication: '外感风寒，内伤湿滞。恶寒发热，头痛胸闷，恶心呕吐。',
          note: '亦可治暑湿内伤，化湿理气力强。'
        },
        {
          id: 'f3',
          name: '银翘散',
          correct: false,
          source: '《温病条辨》',
          composition: '银花、连翘、荆芥、豆豉、薄荷、牛蒡子、桔梗、甘草。',
          function: '辛凉透表，清热解毒。',
          indication: '风热感冒。发热咽痛，咳嗽痰黄。',
          note: '主治风热纯热证，本案暑湿夹杂，湿邪明显。'
        },
        {
          id: 'f4',
          name: '三仁汤',
          correct: false,
          source: '《温病条辨》',
          composition: '杏仁、白蔻仁、薏苡仁、半夏、厚朴、通草、滑石、竹叶。',
          function: '宣畅气机，清利湿热。',
          indication: '湿温初起。头痛恶寒，身重疼痛，面色淡黄，胸闷不饥。',
          note: '主治湿温湿热，本案有暑邪外感。'
        },
        {
          id: 'f5',
          name: '清暑益气汤',
          correct: false,
          source: '《温热经纬》',
          composition: '西洋参、石斛、麦冬、黄连、竹叶、荷梗、知母、甘草、粳米。',
          function: '清暑益气，养阴生津。',
          indication: '暑热伤气耗阴。身热汗多，口渴心烦，体倦少气。',
          note: '主治暑热气阴两伤，本案湿邪偏重。'
        }
      ]
    }
  },

  // ========== 病案 5: 风寒咳嗽 ==========
  {
    id: 'case-005',
    category: '咳嗽类',
    patient: {
      name: '赵老汉',
      age: 58,
      gender: '男',
      occupation: '木匠',
      chief: '咳嗽痰白、恶寒一周',
      portrait_desc: '面色微白，咳嗽声频，痰白稀薄，裹衣畏寒',
      intro_brief: '一周前受凉后咳嗽不止，痰白稀薄，恶寒微热，鼻塞流清涕，头项强痛。',
      intro_meta: ['居 · 北方小镇', '业 · 木 匠', '时 · 冬月寒风', '初 诊'],
    },
    tongue: {
      image_caption: '舌淡红，苔薄白',
      correct: {
        color: '淡红',
        coating: '薄白',
        shape: '正常',
        moisture: '润'
      }
    },
    pulse: {
      classical: '脉浮紧，按之弦急。',
      plain: '脉浮紧，按之如按琴弦，搏指有力。',
      correct: {
        position: '浮',
        quality: '紧'
      }
    },
    wenzhen: {
      suggested_questions: [
        '咳嗽时间特点？',
        '痰色痰量？',
        '恶寒发热？',
        '有无汗出？',
        '鼻塞流涕？',
        '口渴与否？'
      ],
      dialog_tree: {
        '咳嗽时间特点？': '咳嗽频繁，夜间更重，遇冷加重。',
        '痰色痰量？': '痰白稀薄，容易咳出，量中等。',
        '恶寒发热？': '恶寒明显，发热不高，裹衣仍觉冷。',
        '有无汗出？': '无汗，皮肤干。',
        '鼻塞流涕？': '鼻塞，流清涕，打喷嚏。',
        '口渴与否？': '不渴，想喝热汤。'
      },
      clues: [
        { id: 'c1', label: '咳嗽遇冷加重', found_by: ['咳嗽时间特点？'] },
        { id: 'c2', label: '痰白稀薄', found_by: ['痰色痰量？'] },
        { id: 'c3', label: '恶寒无汗', found_by: ['恶寒发热？', '有无汗出？'] },
        { id: 'c4', label: '鼻塞流清涕', found_by: ['鼻塞流涕？'] },
        { id: 'c5', label: '不渴喜热饮', found_by: ['口渴与否？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '风寒咳嗽', correct: true },
        { id: 'b2', label: '风热咳嗽', correct: false },
        { id: 'b3', label: '痰湿咳嗽', correct: false },
        { id: 'b4', label: '燥热咳嗽', correct: false },
        { id: 'b5', label: '阴虚咳嗽', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '止嗽散',
          correct: true,
          source: '《医学心悟》',
          composition: '紫苑、百部、桔梗、荆芥、白前、陈皮、甘草。',
          function: '止咳化痰，疏风解表。',
          indication: '风寒咳嗽。咳嗽咽痒，痰白稀薄，鼻塞流涕。',
          note: '为风寒咳嗽常用方，止咳力强而性温和。'
        },
        {
          id: 'f2',
          name: '三拗汤',
          correct: true,
          source: '《太平惠民和剂局方》',
          composition: '麻黄、杏仁、甘草。',
          function: '宣肺解表，止咳平喘。',
          indication: '风寒咳嗽。咳嗽气喘，恶寒无汗，痰白稀薄。',
          note: '主治风寒犯肺咳嗽喘息，发汗力较强。'
        },
        {
          id: 'f3',
          name: '桑菊饮',
          correct: false,
          source: '《温病条辨》',
          composition: '桑叶、菊花、杏仁、连翘、薄荷、桔梗、甘草、芦根。',
          function: '疏风清热，宣肺止咳。',
          indication: '风热咳嗽。咳嗽痰黄，发热咽痛，口渴。',
          note: '主治风热咳嗽，本案为风寒，药性相反。'
        },
        {
          id: 'f4',
          name: '二陈汤',
          correct: false,
          source: '《太平惠民和剂局方》',
          composition: '半夏、陈皮、茯苓、甘草。',
          function: '燥湿化痰，理气和中。',
          indication: '痰湿咳嗽。咳嗽痰多，痰白黏稠，胸脘痞闷。',
          note: '主治痰湿咳嗽，本案风寒外感为主。'
        },
        {
          id: 'f5',
          name: '清燥救肺汤',
          correct: false,
          source: '《医门法律》',
          composition: '桑叶、石膏、人参、甘草、胡麻仁、阿胶、麦冬、杏仁、枇杷叶。',
          function: '清燥润肺，益气养阴。',
          indication: '燥热伤肺。干咳无痰，咽干鼻燥，心烦口渴。',
          note: '主治燥热咳嗽，本案为风寒，无燥热表现。'
        }
      ]
    }
  },

  // ========== 病案 6: 风热咳嗽 ==========
  {
    id: 'case-006',
    category: '咳嗽类',
    patient: {
      name: '林小姐',
      age: 24,
      gender: '女',
      occupation: '绣娘',
      chief: '咳嗽痰黄、咽痛三天',
      portrait_desc: '面红唇干，咽部红肿，咳嗽声频，痰黄黏稠',
      intro_brief: '三日前外感风热，咳嗽频频，痰黄黏稠难咳，咽喉红肿疼痛，发热微恶风。',
      intro_meta: ['居 · 南方绣坊', '业 · 绣 娘', '时 · 春季风暖', '初 诊'],
    },
    tongue: {
      image_caption: '舌红，苔薄黄',
      correct: {
        color: '红',
        coating: '薄黄',
        shape: '正常',
        moisture: '干'
      }
    },
    pulse: {
      classical: '脉浮数，按之滑。',
      plain: '脉浮数有力，按之略滑。',
      correct: {
        position: '浮',
        quality: '数'
      }
    },
    wenzhen: {
      suggested_questions: [
        '咳嗽特点？',
        '痰色痰质？',
        '咽痛程度？',
        '发热情况？',
        '口渴与否？',
        '有无汗出？'
      ],
      dialog_tree: {
        '咳嗽特点？': '咳嗽频繁，咳声较响，咽喉痒痛。',
        '痰色痰质？': '痰黄黏稠，咳出不爽，有时带黄绿色。',
        '咽痛程度？': '咽痛明显，吞咽时更痛，嗓子干热。',
        '发热情况？': '发热不重，恶风，一阵阵发热。',
        '口渴与否？': '口渴想喝水，喜欢凉水。',
        '有无汗出？': '有汗，出汗后稍舒服。'
      },
      clues: [
        { id: 'c1', label: '咳嗽咽痒痛', found_by: ['咳嗽特点？', '咽痛程度？'] },
        { id: 'c2', label: '痰黄黏稠', found_by: ['痰色痰质？'] },
        { id: 'c3', label: '发热恶风', found_by: ['发热情况？'] },
        { id: 'c4', label: '口渴喜冷', found_by: ['口渴与否？'] },
        { id: 'c5', label: '有汗', found_by: ['有无汗出？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '风热咳嗽', correct: true },
        { id: 'b2', label: '风寒咳嗽', correct: false },
        { id: 'b3', label: '痰热咳嗽', correct: false },
        { id: 'b4', label: '燥热咳嗽', correct: false },
        { id: 'b5', label: '阴虚咳嗽', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '桑菊饮',
          correct: true,
          source: '《温病条辨》',
          composition: '桑叶三钱、菊花二钱、杏仁二钱、连翘二钱、薄荷一钱、桔梗二钱、甘草一钱、芦根二钱。',
          function: '疏风清热，宣肺止咳。',
          indication: '风热咳嗽。咳嗽痰黄，咽干口渴，发热不重。',
          note: '为风热咳嗽首选方，止咳清热力佳。'
        },
        {
          id: 'f2',
          name: '银翘散',
          correct: true,
          source: '《温病条辨》',
          composition: '银花、连翘、荆芥、豆豉、薄荷、牛蒡子、桔梗、甘草。',
          function: '辛凉透表，清热解毒。',
          indication: '风热感冒。发热咽痛，咳嗽痰黄，头痛。',
          note: '亦可治风热咳嗽，清热力较强。'
        },
        {
          id: 'f3',
          name: '止嗽散',
          correct: false,
          source: '《医学心悟》',
          composition: '紫苑、百部、桔梗、荆芥、白前、陈皮、甘草。',
          function: '止咳化痰，疏风解表。',
          indication: '风寒咳嗽。咳嗽咽痒，痰白稀薄。',
          note: '主治风寒咳嗽，本案为风热。'
        },
        {
          id: 'f4',
          name: '清气化痰丸',
          correct: false,
          source: '《医方考》',
          composition: '陈皮、杏仁、枳实、黄芩、瓜蒌、茯苓、胆南星、半夏。',
          function: '清热化痰，理气止咳。',
          indication: '痰热咳嗽。咳嗽痰黄稠，胸膈痞闷。',
          note: '主治痰热内蕴咳嗽，本案风热外感为主。'
        },
        {
          id: 'f5',
          name: '沙参麦冬汤',
          correct: false,
          source: '《温病条辨》',
          composition: '沙参、麦冬、玉竹、天花粉、扁豆、桑叶、甘草。',
          function: '甘寒生津，清养肺胃。',
          indication: '燥伤肺胃阴分。干咳少痰，咽干口渴。',
          note: '主治阴虚燥咳，本案为风热实证。'
        }
      ]
    }
  },

  // ========== 病案 7: 痰湿咳嗽 ==========
  {
    id: 'case-007',
    category: '咳嗽类',
    patient: {
      name: '周胖子',
      age: 45,
      gender: '男',
      occupation: '厨子',
      chief: '咳嗽痰多、胸闷半年',
      portrait_desc: '面色微黄，体胖痰多，咳嗽声重，痰白黏稠',
      intro_brief: '半年来咳嗽反复，痰多色白黏稠，晨起咳甚，胸脘痞闷，食后加重。',
      intro_meta: ['居 · 城中酒楼', '业 · 厨 子', '时 · 长年咳嗽', '复 诊'],
    },
    tongue: {
      image_caption: '舌淡红胖大，苔白腻',
      correct: {
        color: '淡红',
        coating: '白腻',
        shape: '胖大',
        moisture: '润'
      }
    },
    pulse: {
      classical: '脉滑，按之濡。',
      plain: '脉来圆滑流利，按之濡软。',
      correct: {
        position: '滑',
        quality: '濡'
      }
    },
    wenzhen: {
      suggested_questions: [
        '咳嗽时间特点？',
        '痰量痰色？',
        '胸闷情况？',
        '饮食情况？',
        '大便情况？',
        '体质情况？'
      ],
      dialog_tree: {
        '咳嗽时间特点？': '晨起咳甚，痰咳出后才舒服，一天反复咳嗽。',
        '痰量痰色？': '痰多，白黏稠，有时咳出一整口。',
        '胸闷情况？': '胸脘痞闷，尤其是吃油腻后。',
        '饮食情况？': '胃口还行，但吃油腻加重咳嗽。',
        '大便情况？': '大便黏滞不爽。',
        '体质情况？': '体型偏胖，平时痰多。'
      },
      clues: [
        { id: 'c1', label: '晨起咳甚痰多', found_by: ['咳嗽时间特点？', '痰量痰色？'] },
        { id: 'c2', label: '痰白黏稠', found_by: ['痰量痰色？'] },
        { id: 'c3', label: '胸脘痞闷', found_by: ['胸闷情况？'] },
        { id: 'c4', label: '食油腻加重', found_by: ['饮食情况？'] },
        { id: 'c5', label: '体胖痰湿体质', found_by: ['体质情况？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '痰湿咳嗽', correct: true },
        { id: 'b2', label: '痰热咳嗽', correct: false },
        { id: 'b3', label: '风寒咳嗽', correct: false },
        { id: 'b4', label: '肺脾气虚', correct: false },
        { id: 'b5', label: '饮停胸胁', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '二陈汤',
          correct: true,
          source: '《太平惠民和剂局方》',
          composition: '半夏三钱、陈皮二钱、茯苓三钱、甘草一钱。',
          function: '燥湿化痰，理气和中。',
          indication: '痰湿咳嗽。咳嗽痰多，痰白黏稠，胸脘痞闷。',
          note: '为痰湿咳嗽基础方，燥湿化痰力强。'
        },
        {
          id: 'f2',
          name: '三子养亲汤',
          correct: true,
          source: '《韩氏医通》',
          composition: '紫苏子、白芥子、莱菔子。',
          function: '降气快膈，化痰消食。',
          indication: '痰壅气滞。咳嗽痰多，胸脘痞闷，食少难消。',
          note: '主治痰食互结，化痰降气力强。'
        },
        {
          id: 'f3',
          name: '清气化痰丸',
          correct: false,
          source: '《医方考》',
          composition: '陈皮、杏仁、枳实、黄芩、瓜蒌、茯苓、胆南星、半夏。',
          function: '清热化痰，理气止咳。',
          indication: '痰热咳嗽。咳嗽痰黄稠，胸膈痞闷。',
          note: '主治痰热咳嗽，本案痰白属痰湿。'
        },
        {
          id: 'f4',
          name: '六君子汤',
          correct: false,
          source: '《医学正传》',
          composition: '人参、白术、茯苓、甘草、陈皮、半夏。',
          function: '益气健脾，燥湿化痰。',
          indication: '脾虚痰湿。咳嗽痰多，食少便溏，倦怠乏力。',
          note: '主治脾虚生痰，本案未见明显气虚。'
        },
        {
          id: 'f5',
          name: '小青龙汤',
          correct: false,
          source: '《伤寒论》',
          composition: '麻黄、桂枝、干姜、细辛、五味子、半夏、芍药、甘草。',
          function: '解表散寒，温肺化饮。',
          indication: '外寒内饮。恶寒发热，咳嗽痰多清稀，喘息。',
          note: '主治外感风寒内停水饮，本案无外感。'
        }
      ]
    }
  },

  // ========== 病案 8: 外感风寒兼内伤湿滞 ==========
  {
    id: 'case-008',
    category: '外感兼内伤类',
    patient: {
      name: '孙掌柜',
      age: 38,
      gender: '男',
      occupation: '酒楼掌柜',
      chief: '恶寒发热、脘腹胀痛两天',
      portrait_desc: '面色苍白裹衣畏寒，脘腹胀满，时有恶心',
      intro_brief: '前日外出应酬饮酒，归途遇雨受凉，次日恶寒发热，脘腹胀痛，恶心呕吐。',
      intro_meta: ['居 · 城中酒楼', '业 · 掌 柜', '时 · 秋雨时节', '初 诊'],
    },
    tongue: {
      image_caption: '舌淡红，苔白腻',
      correct: {
        color: '淡红',
        coating: '白腻',
        shape: '正常',
        moisture: '润'
      }
    },
    pulse: {
      classical: '脉浮紧，按之濡滑。',
      plain: '脉浮紧表寒，按之濡滑内湿。',
      correct: {
        position: '浮',
        quality: '紧'
      }
    },
    wenzhen: {
      suggested_questions: [
        '恶寒发热情况？',
        '脘腹胀痛？',
        '恶心呕吐？',
        '有无汗出？',
        '饮食饮酒？',
        '大便情况？'
      ],
      dialog_tree: {
        '恶寒发热情况？': '恶寒明显，发热不高，裹衣仍觉冷，无汗。',
        '脘腹胀痛？': '脘腹胀满疼痛，按之痛甚。',
        '恶心呕吐？': '恶心明显，呕吐两次，吐出物酸臭。',
        '有无汗出？': '无汗，皮肤干冷。',
        '饮食饮酒？': '前日饮酒较多，吃了油腻食物。',
        '大便情况？': '昨日未大便，今日大便溏薄。'
      },
      clues: [
        { id: 'c1', label: '恶寒无汗表寒', found_by: ['恶寒发热情况？', '有无汗出？'] },
        { id: 'c2', label: '脘腹胀痛', found_by: ['脘腹胀痛？'] },
        { id: 'c3', label: '恶心呕吐', found_by: ['恶心呕吐？'] },
        { id: 'c4', label: '饮酒伤湿', found_by: ['饮食饮酒？'] },
        { id: 'c5', label: '外寒内湿', found_by: ['恶寒发热情况？', '饮食饮酒？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '外感风寒兼内伤湿滞', correct: true },
        { id: 'b2', label: '风寒感冒', correct: false },
        { id: 'b3', label: '湿阻中焦', correct: false },
        { id: 'b4', label: '食滞胃脘', correct: false },
        { id: 'b5', label: '寒湿困脾', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '藿香正气散',
          correct: true,
          source: '《太平惠民和剂局方》',
          composition: '藿香三钱、紫苏一钱、白芷一钱、大腹皮一钱、茯苓一钱、白术二钱、陈皮一钱、半夏曲二钱、厚朴一钱、桔梗一钱、甘草一钱、生姜三片、大枣一枚。',
          function: '解表化湿，理气和中。',
          indication: '外感风寒，内伤湿滞。恶寒发热，头痛胸闷，恶心呕吐，脘腹胀痛。',
          note: '为外寒内湿首选方，表里双解。'
        },
        {
          id: 'f2',
          name: '荆防败毒散合平胃散',
          correct: true,
          source: '合方',
          composition: '荆芥、防风、羌活、独活、柴胡、前胡、苍术、厚朴、陈皮、甘草。',
          function: '疏风解表，燥湿和胃。',
          indication: '外感风寒，内有湿滞。恶寒发热，脘腹胀满。',
          note: '亦可表里双解，化湿力强。'
        },
        {
          id: 'f3',
          name: '麻黄汤',
          correct: false,
          source: '《伤寒论》',
          composition: '麻黄、桂枝、杏仁、甘草。',
          function: '发汗解表，宣肺平喘。',
          indication: '风寒表实。恶寒发热，无汗喘咳。',
          note: '纯治表寒，本案有内湿。'
        },
        {
          id: 'f4',
          name: '保和丸',
          correct: false,
          source: '《丹溪心法》',
          composition: '山楂、神曲、莱菔子、半夏、陈皮、茯苓、连翘。',
          function: '消食导滞，和胃化湿。',
          indication: '食滞胃脘。脘腹胀满，嗳腐吞酸，厌食呕恶。',
          note: '纯治内伤食滞，本案有外感风寒。'
        },
        {
          id: 'f5',
          name: '平胃散',
          correct: false,
          source: '《简要济众方》',
          composition: '苍术、厚朴、陈皮、甘草。',
          function: '燥湿运脾，行气和胃。',
          indication: '湿滞脾胃。脘腹胀满，不思饮食。',
          note: '纯治内湿，本案有外感风寒。'
        }
      ]
    }
  },

  // ========== 病案 9: 风寒袭肺 ==========
  {
    id: 'case-009',
    category: '风寒犯肺类',
    patient: {
      name: '吴渔夫',
      age: 52,
      gender: '男',
      occupation: '渔夫',
      chief: '咳嗽喘促、恶寒无汗三天',
      portrait_desc: '面色苍白，咳嗽气喘，喉中有痰鸣音，裹衣畏寒',
      intro_brief: '三日前江上捕鱼，风雨骤至，归家后咳嗽喘促，喉中痰鸣，恶寒无汗。',
      intro_meta: ['居 · 江边渔村', '业 · 渔 夫', '时 · 冬月风雨', '初 诊'],
    },
    tongue: {
      image_caption: '舌淡，苔白滑',
      correct: {
        color: '淡',
        coating: '白滑',
        shape: '正常',
        moisture: '水滑'
      }
    },
    pulse: {
      classical: '脉浮紧，按之弦急。',
      plain: '脉浮紧有力，按之弦急。',
      correct: {
        position: '浮',
        quality: '紧'
      }
    },
    wenzhen: {
      suggested_questions: [
        '咳嗽喘促程度？',
        '痰鸣音情况？',
        '恶寒发热？',
        '有无汗出？',
        '痰色痰量？',
        '口渴与否？'
      ],
      dialog_tree: {
        '咳嗽喘促程度？': '咳嗽频繁，喘促气急，呼吸困难。',
        '痰鸣音情况？': '喉中有痰鸣音，像水鸡叫声。',
        '恶寒发热？': '恶寒明显，发热不高，裹紧衣被仍冷。',
        '有无汗出？': '无汗，皮肤干冷。',
        '痰色痰量？': '痰多，白稀如水，容易咳出。',
        '口渴与否？': '不渴，想喝热汤暖身。'
      },
      clues: [
        { id: 'c1', label: '咳嗽喘促', found_by: ['咳嗽喘促程度？'] },
        { id: 'c2', label: '喉中痰鸣', found_by: ['痰鸣音情况？'] },
        { id: 'c3', label: '恶寒无汗', found_by: ['恶寒发热？', '有无汗出？'] },
        { id: 'c4', label: '痰白稀如水', found_by: ['痰色痰量？'] },
        { id: 'c5', label: '外寒内饮', found_by: ['恶寒发热？', '痰色痰量？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '风寒袭肺（外寒内饮）', correct: true },
        { id: 'b2', label: '风寒咳嗽', correct: false },
        { id: 'b3', label: '痰湿咳嗽', correct: false },
        { id: 'b4', label: '寒饮停肺', correct: false },
        { id: 'b5', label: '肺肾阳虚喘', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '小青龙汤',
          correct: true,
          source: '《伤寒论》',
          composition: '麻黄三钱、桂枝二钱、干姜二钱、细辛一钱、五味子一钱、半夏三钱、芍药二钱、甘草一钱。',
          function: '解表散寒，温肺化饮。',
          indication: '外寒内饮。恶寒发热，咳嗽喘促，喉中痰鸣，痰白清稀。',
          note: '为外寒内饮首选方，表里双解。'
        },
        {
          id: 'f2',
          name: '射干麻黄汤',
          correct: true,
          source: '《金匮要略》',
          composition: '射干、麻黄、生姜、细辛、紫苑、款冬花、五味子、半夏、大枣。',
          function: '宣肺祛痰，下气止咳。',
          indication: '寒饮郁肺。咳嗽气急，喉中痰鸣，痰白清稀。',
          note: '主治寒饮停肺咳嗽喘息。'
        },
        {
          id: 'f3',
          name: '三拗汤',
          correct: false,
          source: '《太平惠民和剂局方》',
          composition: '麻黄、杏仁、甘草。',
          function: '宣肺解表，止咳平喘。',
          indication: '风寒犯肺咳嗽喘息。',
          note: '主治风寒咳嗽，本案内有寒饮。'
        },
        {
          id: 'f4',
          name: '苏子降气汤',
          correct: false,
          source: '《太平惠民和剂局方》',
          composition: '苏子、半夏、前胡、厚朴、橘皮、当归、肉桂、甘草。',
          function: '降气平喘，化痰温肺。',
          indication: '上实下虚喘咳。咳嗽喘促，痰多胸闷。',
          note: '主治肺实肾虚喘，本案无下虚。'
        },
        {
          id: 'f5',
          name: '麻杏石甘汤',
          correct: false,
          source: '《伤寒论》',
          composition: '麻黄、杏仁、石膏、甘草。',
          function: '辛凉疏表，清肺平喘。',
          indication: '邪热壅肺喘咳。发热喘咳，口渴汗出。',
          note: '主治邪热壅肺，本案为寒饮。'
        }
      ]
    }
  },

  // ========== 病案 10: 风热犯肺 ==========
  {
    id: 'case-010',
    category: '风热犯肺类',
    patient: {
      name: '郑商人',
      age: 33,
      gender: '男',
      occupation: '丝绸商人',
      chief: '发热咳嗽、胸痛两天',
      portrait_desc: '面红目赤，咳嗽胸痛，痰黄带血丝，发热口渴',
      intro_brief: '两日前外出经商途中受风热，发热咳嗽，胸痛明显，痰黄带血丝，口渴咽干。',
      intro_meta: ['居 · 江南商镇', '业 · 丝绸商', '时 · 春季风暖', '初 诊'],
    },
    tongue: {
      image_caption: '舌红，苔黄',
      correct: {
        color: '红',
        coating: '黄',
        shape: '正常',
        moisture: '干'
      }
    },
    pulse: {
      classical: '脉浮数，按之滑。',
      plain: '脉浮数有力，按之略滑。',
      correct: {
        position: '浮',
        quality: '数'
      }
    },
    wenzhen: {
      suggested_questions: [
        '发热情况？',
        '咳嗽胸痛？',
        '痰色痰质？',
        '咽部情况？',
        '口渴与否？',
        '有无汗出？'
      ],
      dialog_tree: {
        '发热情况？': '发热较高，一阵阵发热，有汗但热不退。',
        '咳嗽胸痛？': '咳嗽频繁，胸痛明显，咳时更痛。',
        '痰色痰质？': '痰黄黏稠，有时带血丝。',
        '咽部情况？': '咽干咽痛，嗓子红肿。',
        '口渴与否？': '口渴明显，想喝冷水。',
        '有无汗出？': '有汗，出汗后热稍减。'
      },
      clues: [
        { id: 'c1', label: '发热有汗', found_by: ['发热情况？', '有无汗出？'] },
        { id: 'c2', label: '咳嗽胸痛', found_by: ['咳嗽胸痛？'] },
        { id: 'c3', label: '痰黄带血丝', found_by: ['痰色痰质？'] },
        { id: 'c4', label: '咽干咽痛', found_by: ['咽部情况？'] },
        { id: 'c5', label: '口渴喜冷', found_by: ['口渴与否？'] }
      ]
    },
    bianzheng: {
      options: [
        { id: 'b1', label: '风热犯肺', correct: true },
        { id: 'b2', label: '风热咳嗽', correct: false },
        { id: 'b3', label: '痰热咳嗽', correct: false },
        { id: 'b4', label: '燥热伤肺', correct: false },
        { id: 'b5', label: '热伤肺络', correct: false }
      ]
    },
    fang: {
      options: [
        {
          id: 'f1',
          name: '麻杏石甘汤',
          correct: true,
          source: '《伤寒论》',
          composition: '麻黄二钱、杏仁二钱、石膏六钱、甘草一钱。',
          function: '辛凉疏表，清肺平喘。',
          indication: '邪热壅肺。发热咳嗽，胸痛喘息，口渴汗出。',
          note: '为风热犯肺首选方，清肺力强。'
        },
        {
          id: 'f2',
          name: '银翘散',
          correct: true,
          source: '《温病条辨》',
          composition: '银花、连翘、荆芥、豆豉、薄荷、牛蒡子、桔梗、甘草。',
          function: '辛凉透表，清热解毒。',
          indication: '风热感冒。发热咽痛，咳嗽痰黄。',
          note: '亦可治风热犯肺轻证。'
        },
        {
          id: 'f3',
          name: '止嗽散',
          correct: false,
          source: '《医学心悟》',
          composition: '紫苑、百部、桔梗、荆芥、白前、陈皮、甘草。',
          function: '止咳化痰，疏风解表。',
          indication: '风寒咳嗽。咳嗽咽痒，痰白稀薄。',
          note: '主治风寒咳嗽，本案为风热。'
        },
        {
          id: 'f4',
          name: '桑菊饮',
          correct: false,
          source: '《温病条辨》',
          composition: '桑叶、菊花、杏仁、连翘、薄荷、桔梗、甘草、芦根。',
          function: '疏风清热，宣肺止咳。',
          indication: '风热咳嗽。咳嗽痰黄，咽干口渴。',
          note: '主治风热咳嗽轻证，本案热重胸痛。'
        },
        {
          id: 'f5',
          name: '清燥救肺汤',
          correct: false,
          source: '《医门法律》',
          composition: '桑叶、石膏、人参、甘草、胡麻仁、阿胶、麦冬、杏仁、枇杷叶。',
          function: '清燥润肺，益气养阴。',
          indication: '燥热伤肺。干咳无痰，咽干鼻燥。',
          note: '主治燥热伤肺阴分，本案为风热实证。'
        }
      ]
    }
  }
];

// ============ 导出辅助函数 ============

/**
 * 根据 ID 获取病案
 */
export function getCaseById(id: string): DiagnosisCase | undefined {
  return DIAGNOSIS_CASES.find(c => c.id === id);
}

/**
 * 获取所有病案分类
 */
export function getCaseCategories(): string[] {
  const categories = new Set<string>();
  DIAGNOSIS_CASES.forEach(c => categories.add(c.category));
  return Array.from(categories);
}

/**
 * 按分类获取病案列表
 */
export function getCasesByCategory(category: string): DiagnosisCase[] {
  return DIAGNOSIS_CASES.filter(c => c.category === category);
}