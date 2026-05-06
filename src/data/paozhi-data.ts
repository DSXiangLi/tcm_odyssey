// src/data/paozhi-data.ts
/**
 * 炮制游戏数据定义
 *
 * 包含：炮制方法、器具、辅料、药材、配方
 */

// === 炮制方法接口 ===
export interface ProcessingType {
  id: string;
  name: string;
  cat: string;       // 分类：修制/水制/火制/水火共制/其他制法
  desc: string;
  vessel: string;    // 对应器具
  action: string;    // 操作类型：rhythm/hold/wrap/tap/wait
  color: string;
}

// === 器具接口 ===
export interface Vessel {
  id: string;
  name: string;
  hint: string;
  supports: string[];  // 支持的炮制方法
  icon: string;
}

// === 辅料接口 ===
export interface Ingredient {
  id: string;
  name: string;
  color: string;
  icon: string;        // liquid/powder/paper
}

// === 药材接口 ===
export interface Herb {
  id: string;
  name: string;
  raw: string;         // 生药材颜色
  done: string;        // 炮制后颜色
  form: string;        // 形态：root/tuber/shell/stone/slice/block
  desc: string;
}

// === 配方接口 ===
export interface Recipe {
  id: string;
  herb: string;
  type: string;
  adjuvants: string[];
  out: string;         // 炮制产物名称
  benefit: string;
}

// === 炮制数据集合 ===
export const PROCESSING_TYPES: Record<string, ProcessingType> = {
  qie:    { id: "qie",    name: "切制",   cat: "修制",       desc: "刀切药材为饮片",     vessel: "board",   action: "rhythm",   color: "#8a6638" },
  pao:    { id: "pao",    name: "浸泡",   cat: "水制",       desc: "清水浸润，去其燥",   vessel: "basin",   action: "hold",     color: "#5a8a9a" },
  chao:   { id: "chao",   name: "清炒",   cat: "火制",       desc: "干锅翻炒至焦香",     vessel: "wok",     action: "rhythm",   color: "#b9341c" },
  zhi:    { id: "zhi",    name: "酒炙",   cat: "火制",       desc: "辅料拌炒，入味增效", vessel: "wok",     action: "rhythm",   color: "#d97842" },
  duan:   { id: "duan",   name: "煅",     cat: "火制",       desc: "猛火烧赤，质地酥脆", vessel: "crucible",action: "hold",     color: "#e85a3a" },
  wei:    { id: "wei",    name: "煨",     cat: "火制",       desc: "湿纸包裹，灰火慢烘", vessel: "ash",     action: "wrap",     color: "#8a6638" },
  zheng:  { id: "zheng",  name: "蒸",     cat: "水火共制",   desc: "甑中蒸透，九蒸九晒", vessel: "steamer", action: "hold",     color: "#5a8a64" },
  zhu:    { id: "zhu",    name: "煮",     cat: "水火共制",   desc: "辅料同煮，去毒增效", vessel: "pot",     action: "hold",     color: "#3a6a8a" },
  cui:    { id: "cui",    name: "淬",     cat: "水火共制",   desc: "煅红投液，激裂酥脆", vessel: "crucible",action: "tap",      color: "#e85a3a" },
  fajiao: { id: "fajiao", name: "发酵",   cat: "其他制法",   desc: "曲菌发酵，化生新性", vessel: "jar",     action: "wait",     color: "#8a6638" },
};

export const VESSELS: Vessel[] = [
  { id: "board",    name: "切药板",  hint: "刀与砧板",       supports: ["qie"],          icon: "board" },
  { id: "basin",    name: "陶盆",    hint: "盛水浸药",       supports: ["pao"],          icon: "basin" },
  { id: "wok",      name: "铁锅",    hint: "火制·炒炙",      supports: ["chao", "zhi"],  icon: "wok" },
  { id: "crucible", name: "坩埚",    hint: "煅·淬",          supports: ["duan", "cui"],  icon: "crucible" },
  { id: "ash",      name: "炭灰盆",  hint: "煨制",           supports: ["wei"],          icon: "ash" },
  { id: "steamer",  name: "陶甑",    hint: "蒸制",           supports: ["zheng"],        icon: "steamer" },
  { id: "pot",      name: "砂锅",    hint: "煮制",           supports: ["zhu"],          icon: "pot" },
  { id: "jar",      name: "瓦瓮",    hint: "发酵",           supports: ["fajiao"],       icon: "jar" },
];

export const INGREDIENTS: Record<string, Ingredient> = {
  jiu:    { id: "jiu",    name: "黄酒",   color: "#a3522a", icon: "liquid" },
  cu:     { id: "cu",     name: "米醋",   color: "#7a3a1a", icon: "liquid" },
  feng:   { id: "feng",   name: "蜂蜜",   color: "#d9a850", icon: "liquid" },
  jiang:  { id: "jiang",  name: "姜汁",   color: "#c89548", icon: "liquid" },
  yan:    { id: "yan",    name: "盐水",   color: "#d8e0e8", icon: "liquid" },
  fu:     { id: "fu",     name: "麦麸",   color: "#c9a063", icon: "powder" },
  tu:     { id: "tu",     name: "灶心土", color: "#8a5a2a", icon: "powder" },
  shui:   { id: "shui",   name: "清水",   color: "#9ec5d4", icon: "liquid" },
  zhi:    { id: "zhi",    name: "纸",     color: "#e8dcc4", icon: "paper" },
  qu:     { id: "qu",     name: "酒曲",   color: "#c9b86a", icon: "powder" },
};

export const HERBS: Record<string, Herb> = {
  danggui:  { id: "danggui",  name: "当归",   raw: "#d9b070", done: "#8a4a28", form: "root",     desc: "补血活血" },
  banxia:   { id: "banxia",   name: "半夏",   raw: "#e8dcc4", done: "#c9a063", form: "tuber",    desc: "燥湿化痰" },
  dihuang:  { id: "dihuang",  name: "地黄",   raw: "#c8a878", done: "#1a0e08", form: "root",     desc: "滋阴补血" },
  muli:     { id: "muli",     name: "牡蛎",   raw: "#d8d0bc", done: "#f0e8d4", form: "shell",    desc: "重镇安神" },
  zishihu:  { id: "zishihu",  name: "紫石英", raw: "#9a6aa8", done: "#6a4a78", form: "stone",    desc: "镇心定惊" },
  ganjiang: { id: "ganjiang", name: "干姜",   raw: "#e0c890", done: "#8a5a28", form: "root",     desc: "温中回阳" },
  huangqi:  { id: "huangqi",  name: "黄芪",   raw: "#e8d090", done: "#c8924a", form: "slice",    desc: "补气固表" },
  dahuang:  { id: "dahuang",  name: "大黄",   raw: "#c89858", done: "#6a3818", form: "root",     desc: "泻热通便" },
  shanyao:  { id: "shanyao",  name: "山药",   raw: "#f0e8d0", done: "#d8c08a", form: "slice",    desc: "补脾养胃" },
  shenqu:   { id: "shenqu",   name: "神曲",   raw: "#c9b86a", done: "#8a6a28", form: "block",    desc: "消食和胃" },
};

export const RECIPES: Recipe[] = [
  { id: "r1",  herb: "danggui",  type: "zhi",    adjuvants: ["jiu"],         out: "酒当归", benefit: "活血通经，破血力增" },
  { id: "r2",  herb: "banxia",   type: "zhu",    adjuvants: ["jiang", "shui"], out: "姜半夏", benefit: "降逆止呕，毒减效增" },
  { id: "r3",  herb: "dihuang",  type: "zheng",  adjuvants: ["jiu"],         out: "熟地黄", benefit: "九蒸九晒，滋阴补血" },
  { id: "r4",  herb: "muli",     type: "duan",   adjuvants: [],              out: "煅牡蛎", benefit: "收敛固涩，制酸止痛" },
  { id: "r5",  herb: "zishihu",  type: "cui",    adjuvants: ["cu"],          out: "醋淬紫石英", benefit: "酥脆易煎，平肝镇惊" },
  { id: "r6",  herb: "ganjiang", type: "chao",   adjuvants: [],              out: "炮姜",   benefit: "温经止血，守而不走" },
  { id: "r7",  herb: "huangqi",  type: "zhi",    adjuvants: ["feng"],        out: "蜜炙黄芪", benefit: "补中益气更甚" },
  { id: "r8",  herb: "dahuang",  type: "zhi",    adjuvants: ["jiu"],         out: "酒大黄", benefit: "缓泻清上焦热" },
  { id: "r9",  herb: "shanyao",  type: "qie",    adjuvants: [],              out: "山药片", benefit: "切制饮片，便于煎服" },
  { id: "r10", herb: "shenqu",   type: "fajiao", adjuvants: ["qu"],          out: "六神曲", benefit: "曲发酵成，消食和胃" },
];

// === 辅助查询函数 ===

/**
 * 根据配方ID查找配方
 */
export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id);
}

/**
 * 根据药材和方法查找配方
 */
export function getRecipeByHerbAndType(herbId: string, typeId: string): Recipe | undefined {
  return RECIPES.find(r => r.herb === herbId && r.type === typeId);
}

/**
 * 获取器具支持的炮制方法
 */
export function getVesselById(id: string): Vessel | undefined {
  return VESSELS.find(v => v.id === id);
}

/**
 * 检查配方是否匹配辅料
 */
export function checkRecipeAdjuvants(recipe: Recipe, selectedAdjuvants: string[]): boolean {
  if (recipe.adjuvants.length === 0 && selectedAdjuvants.length === 0) return true;
  if (recipe.adjuvants.length !== selectedAdjuvants.length) return false;
  return recipe.adjuvants.every(adj => selectedAdjuvants.includes(adj));
}