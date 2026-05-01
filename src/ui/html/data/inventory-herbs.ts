// src/ui/html/data/inventory-herbs.ts
/**
 * 背包药材数据 - 迁移自 docs/ui/背包/data.js
 */

// 18功效分类
export const HERB_CATEGORIES = [
  { id: 'jiebiao',    name: '解表药',         glyph: '颩', color: '#7c8c5a' },
  { id: 'qingre',     name: '清热药',         glyph: '冫', color: '#3f7d8c' },
  { id: 'xiexia',     name: '泻下药',         glyph: '泻', color: '#6a4a8c' },
  { id: 'qufengshi',  name: '祛风湿药',       glyph: '风', color: '#8c6d3f' },
  { id: 'huashi',     name: '化湿药',         glyph: '湿', color: '#a89243' },
  { id: 'lishui',     name: '利水渗湿药',     glyph: '水', color: '#4a7d96' },
  { id: 'wenli',      name: '温里药',         glyph: '溫', color: '#a04a3c' },
  { id: 'liqi',       name: '理气药',         glyph: '氣', color: '#7a8a4a' },
  { id: 'xiaoshi',    name: '消食药',         glyph: '食', color: '#9c7c3a' },
  { id: 'quchong',    name: '驱虫药',         glyph: '蟲', color: '#6e7a4a' },
  { id: 'zhixue',     name: '止血药',         glyph: '血', color: '#8c3a3a' },
  { id: 'huoxue',     name: '活血化瘀药',     glyph: '瘀', color: '#a8453f' },
  { id: 'huatan',     name: '化痰止咳平喘药', glyph: '痰', color: '#5a6a8c' },
  { id: 'anshen',     name: '安神药',         glyph: '神', color: '#5a4a8a' },
  { id: 'pinggan',    name: '平肝息风药',     glyph: '風', color: '#3f6a5c' },
  { id: 'kaiqiao',    name: '开窍药',         glyph: '竅', color: '#8c5a4a' },
  { id: 'buxu',       name: '补虚药',         glyph: '補', color: '#a86a3a' },
  { id: 'shouse',     name: '收涩药',         glyph: '澀', color: '#7d4a6a' },
];

// 药材数据结构
export interface HerbData {
  id: string;
  name: string;
  cat: string;
  xing: string;
  wei: string;
  gui: string;
  rarity: 1|2|3|4;
  rawCount: number;
  pieceCount: number;
}

// 紧凑数据格式: [id, name, cat, xing, wei, gui, rarity, rawCount, pieceCount]
const _herbRows: [string, string, string, string, string, string, number, number, number][] = [
  // 解表药
  ['mahuang','麻黄','jiebiao','温','辛微苦','肺·膀胱',2,12,8],
  ['guizhi','桂枝','jiebiao','温','辛甘','心·肺·膀胱',1,8,15],
  ['zisuye','紫苏叶','jiebiao','温','辛','肺·脾',1,5,7],
  ['jingjie','荆芥','jiebiao','微温','辛','肺·肝',1,3,4],
  ['fangfeng','防风','jiebiao','微温','辛甘','膀胱·肝·脾',2,0,6],
  ['bohe','薄荷','jiebiao','凉','辛','肺·肝',1,14,9],
  ['juhua','菊花','jiebiao','微寒','甘苦','肺·肝',1,9,12],
  ['gegen','葛根','jiebiao','凉','甘辛','脾·胃',2,4,2],
  ['chaihu','柴胡','jiebiao','凉','苦辛','肝·胆',2,2,5],
  // 清热药
  ['shigao','石膏','qingre','大寒','甘辛','肺·胃',1,7,3],
  ['zhimu','知母','qingre','寒','苦甘','肺·胃·肾',2,5,8],
  ['huangqin','黄芩','qingre','寒','苦','肺·胆·脾',2,11,6],
  ['huanglian','黄连','qingre','寒','苦','心·脾·胃',3,3,4],
  ['huangbai','黄柏','qingre','寒','苦','肾·膀胱',2,6,2],
  ['jinyinhua','金银花','qingre','寒','甘','肺·心·胃',1,18,11],
  ['lianqiao','连翘','qingre','微寒','苦','肺·心·小肠',1,10,5],
  ['shengdi','生地黄','qingre','寒','甘苦','心·肝·肾',2,7,9],
  ['mudanpi','牡丹皮','qingre','微寒','苦辛','心·肝·肾',2,4,3],
  // 泻下药
  ['dahuang','大黄','xiexia','寒','苦','脾·胃·大肠',2,6,4],
  ['mangxiao','芒硝','xiexia','寒','咸苦','胃·大肠',2,2,1],
  ['huomaren','火麻仁','xiexia','平','甘','脾·胃·大肠',1,4,8],
  // 祛风湿药
  ['duhuo','独活','qufengshi','微温','辛苦','肝·肾·膀胱',1,5,3],
  ['qianghuo','羌活','qufengshi','温','辛苦','膀胱·肾',2,3,7],
  ['mugua','木瓜','qufengshi','温','酸','肝·脾',1,7,4],
  ['sangjisheng','桑寄生','qufengshi','平','苦甘','肝·肾',2,0,2],
  ['weilingxian','威灵仙','qufengshi','温','辛咸','膀胱',2,1,0],
  // 化湿药
  ['cangzhu','苍术','huashi','温','辛苦','脾·胃·肝',1,8,5],
  ['houpo','厚朴','huashi','温','苦辛','脾·胃·肺',2,5,2],
  ['huoxiang','藿香','huashi','微温','辛','脾·胃·肺',1,6,9],
  ['peilan','佩兰','huashi','平','辛','脾·胃·肺',1,2,3],
  // 利水渗湿药
  ['fuling','茯苓','lishui','平','甘淡','心·肺·脾·肾',1,15,12],
  ['zexie','泽泻','lishui','寒','甘淡','肾·膀胱',1,8,4],
  ['yiyiren','薏苡仁','lishui','凉','甘淡','脾·胃·肺',1,22,18],
  ['cheqianzi','车前子','lishui','寒','甘','肝·肾·肺',1,4,7],
  ['yinchen','茵陈','lishui','微寒','苦辛','脾·胃·肝·胆',2,3,1],
  // 温里药
  ['fuzi','附子','wenli','大热','辛甘','心·肾·脾',4,2,1],
  ['rougui','肉桂','wenli','大热','辛甘','肾·脾·心·肝',3,4,3],
  ['ganjiang','干姜','wenli','热','辛','脾·胃·肾',1,9,6],
  ['wuzhuyu','吴茱萸','wenli','热','辛苦','肝·脾·胃',2,3,5],
  ['huajiao','花椒','wenli','温','辛','脾·胃·肾',1,5,2],
  // 理气药
  ['chenpi','陈皮','liqi','温','辛苦','脾·肺',1,13,11],
  ['zhike','枳壳','liqi','微寒','苦辛','脾·胃',1,5,3],
  ['muxiang','木香','liqi','温','辛苦','脾·胃·大肠',1,4,7],
  ['xiangfu','香附','liqi','平','辛微苦','肝·脾·三焦',1,7,9],
  ['foushou','佛手','liqi','温','辛苦酸','肝·脾·肺',2,2,0],
  // 消食药
  ['shanzha','山楂','xiaoshi','微温','酸甘','脾·胃·肝',1,11,6],
  ['maiya','麦芽','xiaoshi','平','甘','脾·胃',1,8,4],
  ['jineijin','鸡内金','xiaoshi','平','甘','脾·胃·小肠',2,3,2],
  ['shenqu','神曲','xiaoshi','温','甘辛','脾·胃',1,6,5],
  // 驱虫药
  ['shijunzi','使君子','quchong','温','甘','脾·胃',2,2,1],
  ['binglang','槟榔','quchong','温','苦辛','胃·大肠',2,0,3],
  ['kulianpi','苦楝皮','quchong','寒','苦','肝·脾·胃',2,1,0],
  // 止血药
  ['sanqi','三七','zhixue','温','甘微苦','肝·胃',3,1,2],
  ['baiji','白及','zhixue','微寒','苦甘涩','肺·肝·胃',2,4,2],
  ['aiye','艾叶','zhixue','温','辛苦','肝·脾·肾',1,9,7],
  ['xianhecao','仙鹤草','zhixue','平','苦涩','心·肝',1,3,1],
  // 活血化瘀药
  ['chuanxiong','川芎','huoxue','温','辛','肝·胆·心包',2,6,4],
  ['danshen','丹参','huoxue','微寒','苦','心·肝',2,8,11],
  ['honghua','红花','huoxue','温','辛','心·肝',2,3,2],
  ['taoren','桃仁','huoxue','平','苦甘','心·肝·大肠',1,5,3],
  ['yimu','益母草','huoxue','微寒','苦辛','肝·心·膀胱',1,7,5],
  // 化痰止咳平喘药
  ['banxia','半夏','huatan','温','辛','脾·胃·肺',2,4,9],
  ['jiegeng','桔梗','huatan','平','苦辛','肺',1,6,5],
  ['xingren','杏仁','huatan','微温','苦','肺·大肠',1,8,7],
  ['beimu','贝母','huatan','寒','苦甘','肺·心',3,2,3],
  ['kuandonghua','款冬花','huatan','温','辛微苦','肺',2,1,0],
  // 安神药
  ['suanzaoren','酸枣仁','anshen','平','甘酸','肝·胆·心',2,5,3],
  ['baiziren','柏子仁','anshen','平','甘','心·肾·大肠',1,4,2],
  ['yuanzhi','远志','anshen','温','辛苦','心·肾·肺',2,2,1],
  ['hehuanpi','合欢皮','anshen','平','甘','心·肝·肺',1,3,0],
  // 平肝息风药
  ['tianma','天麻','pinggan','平','甘','肝',3,1,4],
  ['gouteng','钩藤','pinggan','凉','甘','肝·心包',2,3,2],
  ['shijueming','石决明','pinggan','寒','咸','肝',2,2,1],
  ['baijili','白蒺藜','pinggan','微温','辛苦','肝',1,4,0],
  // 开窍药
  ['shexiang','麝香','kaiqiao','温','辛','心·脾',4,0,1],
  ['shichangpu','石菖蒲','kaiqiao','温','辛苦','心·胃',2,2,1],
  ['bingpian','冰片','kaiqiao','微寒','辛苦','心·脾·肺',3,1,2],
  // 补虚药
  ['renshen','人参','buxu','微温','甘微苦','心·脾·肺',4,1,2],
  ['huangqi','黄芪','buxu','微温','甘','脾·肺',2,9,7],
  ['baizhu','白术','buxu','温','苦甘','脾·胃',1,7,5],
  ['gancao','甘草','buxu','平','甘','心·肺·脾·胃',1,18,22],
  ['danggui','当归','buxu','温','甘辛','肝·心·脾',2,5,8],
  ['shudihuang','熟地黄','buxu','微温','甘','肝·肾',2,4,6],
  ['gouqi','枸杞子','buxu','平','甘','肝·肾·肺',1,11,9],
  ['lurong','鹿茸','buxu','温','甘咸','肝·肾',4,1,0],
  ['ejiao','阿胶','buxu','平','甘','肺·肝·肾',3,2,3],
  // 收涩药
  ['wuweizi','五味子','shouse','温','酸甘','肺·心·肾',2,4,3],
  ['shanzhuyu','山茱萸','shouse','微温','酸涩','肝·肾',2,3,2],
  ['wumei','乌梅','shouse','平','酸涩','肝·脾·肺·大肠',1,5,4],
  ['lianzi','莲子','shouse','平','甘涩','脾·肾·心',1,7,5],
];

// 转换为完整对象
export const HERBS: HerbData[] = _herbRows.map(r => ({
  id: r[0], name: r[1], cat: r[2], xing: r[3], wei: r[4], gui: r[5],
  rarity: r[6] as 1|2|3|4, rawCount: r[7], pieceCount: r[8]
}));

// 图片路径映射 (25张现有药材图片)
export const HERB_IMAGES: Record<string, string> = {
  mahuang: '/assets/herbs/mahuang.png',
  guizhi: '/assets/herbs/guizhi.png',
  shengjiang: '/assets/herbs/shengjiang.png',
  zisuye: '/assets/herbs/zisuye.png',
  baizhi: '/assets/herbs/baizhi.png',
  cangerzi: '/assets/herbs/cangerzi.png',
  xixin: '/assets/herbs/xixin.png',
  xinyi: '/assets/herbs/xinyi.png',
  bohe: '/assets/herbs/bohe.png',
  chantui: '/assets/herbs/chantui.png',
  congbai: '/assets/herbs/congbai.png',
  niubangzi: '/assets/herbs/niubangzi.png',
  chaihu: '/assets/herbs/chaihu.png',
  juhua: '/assets/herbs/juhua.png',
  manjingzi: '/assets/herbs/manjingzi.png',
  sangye: '/assets/herbs/sangye.png',
  douchi: '/assets/herbs/douchi.png',
  gegen: '/assets/herbs/gegen.png',
  jianghuang: '/assets/herbs/jianghuang.png',
  shengma: '/assets/herbs/shengma.png',
  fangfeng: '/assets/herbs/fangfeng.png',
  jingjie: '/assets/herbs/jingjie.png',
  qianghuo: '/assets/herbs/qianghuo.png',
  xiangru: '/assets/herbs/xiangru.png',
};

// 方剂数据结构
export interface FormulaData {
  id: string;
  name: string;
  class: string;
  source: string;
  rarity: number;
  count: number;
  composition: string[];
  effect: string;
  indication: string;
}

export const FORMULAS: FormulaData[] = [
  { id: 'guizhitang', name: '桂枝汤', class: '解表剂', source: '《伤寒论》', rarity: 2, count: 3,
    composition: ['桂枝','芍药','甘草','生姜','大枣'],
    effect: '解肌发表，调和营卫', indication: '外感风寒表虚证' },
  { id: 'mahuangtang', name: '麻黄汤', class: '解表剂', source: '《伤寒论》', rarity: 2, count: 2,
    composition: ['麻黄','桂枝','杏仁','甘草'],
    effect: '发汗解表，宣肺平喘', indication: '外感风寒表实证' },
  { id: 'baihutang', name: '白虎汤', class: '清热剂', source: '《伤寒论》', rarity: 3, count: 1,
    composition: ['石膏','知母','甘草','粳米'],
    effect: '清热生津', indication: '阳明气分热盛证' },
  { id: 'xiaochaihutang', name: '小柴胡汤', class: '和解剂', source: '《伤寒论》', rarity: 2, count: 2,
    composition: ['柴胡','黄芩','人参','半夏','甘草','生姜','大枣'],
    effect: '和解少阳', indication: '伤寒少阳证' },
  { id: 'sijunzitang', name: '四君子汤', class: '补益剂', source: '《太平惠民和剂局方》', rarity: 2, count: 4,
    composition: ['人参','白术','茯苓','甘草'],
    effect: '益气健脾', indication: '脾胃气虚证' },
  { id: 'siwutang', name: '四物汤', class: '补益剂', source: '《太平惠民和剂局方》', rarity: 2, count: 3,
    composition: ['熟地黄','当归','白芍','川芎'],
    effect: '补血和血', indication: '营血虚滞证' },
  { id: 'liuwei', name: '六味地黄丸', class: '补益剂', source: '《小儿药证直诀》', rarity: 3, count: 2,
    composition: ['熟地黄','山茱萸','山药','泽泻','牡丹皮','茯苓'],
    effect: '滋补肾阴', indication: '肾阴亏损' },
  { id: 'xiaoyaosan', name: '逍遥散', class: '和解剂', source: '《太平惠民和剂局方》', rarity: 2, count: 2,
    composition: ['柴胡','当归','白芍','白术','茯苓','甘草','生姜','薄荷'],
    effect: '疏肝解郁，养血健脾', indication: '肝郁血虚脾弱证' },
  { id: 'wulingsan', name: '五苓散', class: '祛湿剂', source: '《伤寒论》', rarity: 2, count: 2,
    composition: ['茯苓','猪苓','泽泻','白术','桂枝'],
    effect: '利水渗湿，温阳化气', indication: '蓄水证' },
  { id: 'banxiaxiexin', name: '半夏泻心汤', class: '和解剂', source: '《伤寒论》', rarity: 2, count: 1,
    composition: ['半夏','黄芩','干姜','人参','黄连','大枣','甘草'],
    effect: '寒热平调，消痞散结', indication: '寒热错杂之痞证' },
  { id: 'buzhongyiqi', name: '补中益气汤', class: '补益剂', source: '《脾胃论》', rarity: 3, count: 1,
    composition: ['黄芪','人参','白术','甘草','当归','陈皮','升麻','柴胡'],
    effect: '补中益气，升阳举陷', indication: '脾虚气陷证' },
  { id: 'wendantang', name: '温胆汤', class: '祛痰剂', source: '《三因极一病证方论》', rarity: 2, count: 0,
    composition: ['半夏','陈皮','茯苓','甘草','枳实','竹茹','生姜','大枣'],
    effect: '理气化痰，和胃利胆', indication: '胆胃不和，痰热内扰' },
];

// 工具数据结构
export interface ToolData {
  id: string;
  name: string;
  tier: number;
  count: number;
  desc: string;
}

export const TOOLS: ToolData[] = [
  { id: 'yaonian', name: '药碾', tier: 2, count: 1, desc: '用以碾压药材成粉。可加工根茎类。' },
  { id: 'yaochu', name: '药杵臼', tier: 1, count: 1, desc: '捣碎草本与种子。' },
  { id: 'yaobang', name: '戥子', tier: 2, count: 1, desc: '精细称量，每钱不差。' },
  { id: 'yaoshai', name: '药筛', tier: 1, count: 2, desc: '分离药粉粗细。' },
  { id: 'yaoguan', name: '陶罐', tier: 1, count: 4, desc: '煎药、储药两用。' },
  { id: 'tongding', name: '铜鼎', tier: 3, count: 1, desc: '炮制丹药所需，火候稳定。' },
  { id: 'qiezhe', name: '切药刀', tier: 2, count: 1, desc: '切片、切段，刃薄如纸。' },
  { id: 'paozhihu', name: '炮制壶', tier: 3, count: 0, desc: '需特殊机缘获得。' },
  { id: 'jiucao', name: '酒曲', tier: 2, count: 3, desc: '酒制药材，引药入肝。' },
  { id: 'mizhi', name: '蜂蜜', tier: 1, count: 5, desc: '蜜炙药材，益气补中。' },
  { id: 'yan', name: '青盐', tier: 1, count: 2, desc: '盐炙药材，引药入肾。' },
  { id: 'cu', name: '米醋', tier: 1, count: 3, desc: '醋炙药材，引药入肝。' },
];

// 图书数据结构
export interface BookData {
  id: string;
  name: string;
  dynasty: string;
  tier: number;
  owned: boolean;
  progress: number;
  desc: string;
}

export const BOOKS: BookData[] = [
  { id: 'huangdineijing', name: '黄帝内经', dynasty: '先秦', tier: 4, owned: true, progress: 78,
    desc: '中医理论奠基之作。素问、灵枢两部，论阴阳五行、脏腑经络。' },
  { id: 'shanghanlun', name: '伤寒论', dynasty: '东汉·张仲景', tier: 4, owned: true, progress: 100,
    desc: '六经辨证之祖。' },
  { id: 'jinguiyaolue', name: '金匮要略', dynasty: '东汉·张仲景', tier: 4, owned: true, progress: 42,
    desc: '杂病论治，方剂之祖。' },
  { id: 'shennongbencao', name: '神农本草经', dynasty: '汉', tier: 4, owned: true, progress: 65,
    desc: '现存最早药物学专著。载药365种。' },
  { id: 'bencaogangmu', name: '本草纲目', dynasty: '明·李时珍', tier: 4, owned: true, progress: 23,
    desc: '集本草学之大成。载药1892种。' },
  { id: 'qianjinfang', name: '千金方', dynasty: '唐·孙思邈', tier: 3, owned: true, progress: 51,
    desc: '"人命至重，有贵千金"。' },
  { id: 'wenbingtiaobian', name: '温病条辨', dynasty: '清·吴鞠通', tier: 3, owned: true, progress: 8,
    desc: '温病学集大成。三焦辨证。' },
  { id: 'pijinglun', name: '脾胃论', dynasty: '金·李东垣', tier: 3, owned: true, progress: 0,
    desc: '"内伤脾胃，百病由生"。' },
  { id: 'taipinghuiminhejijufang', name: '太平惠民和剂局方', dynasty: '宋', tier: 3, owned: true, progress: 36,
    desc: '官修方书，载方788首。' },
  { id: 'leigongpaozhilun', name: '雷公炮炙论', dynasty: '南北朝·雷敩', tier: 3, owned: false,
    desc: '炮制学专著。需于药铺老者处求得。' },
  { id: 'jingyuequanshu', name: '景岳全书', dynasty: '明·张景岳', tier: 3, owned: false,
    desc: '阴阳水火并重之论。' },
  { id: 'yixuezhongzhongcanxilu', name: '医学衷中参西录', dynasty: '清末·张锡纯', tier: 2, owned: false,
    desc: '中西汇通。需更高声望解锁。' },
];

// 扇形导航配置
export const FAN_ITEMS = [
  { id: 'piece', name: '药材饮片', sub: 'PROCESSED', glyph: '飲', desc: '炮制后的中药饮片' },
  { id: 'raw',   name: '原始药材', sub: 'RAW',       glyph: '原', desc: '采集的原始药材' },
  { id: 'formula', name: '方剂',   sub: 'FORMULAE',  glyph: '方', desc: '配伍而成的经典方剂' },
  { id: 'tool',  name: '工具',     sub: 'IMPLEMENTS',glyph: '器', desc: '炮制和加工的器具' },
  { id: 'book',  name: '图书馆',   sub: 'LIBRARY',   glyph: '冊', desc: '医家典籍藏书' },
];

// 稀有度颜色映射
export const RARITY_COLORS: Record<number, string> = {
  1: '#4a3826',  // 常见 - 墨褐
  2: '#5a6a8c',  // 精良 - 靛蓝
  3: '#6a3d8c',  // 珍贵 - 紫
  4: '#b58a3a',  // 稀世 - 金
};