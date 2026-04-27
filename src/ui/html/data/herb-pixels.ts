// src/ui/html/data/herb-pixels.ts
/**
 * Pixel herb data from design mockup
 * Converted from docs/ui/煎药小游戏/herb-icons.jsx
 */

import React from 'react';
import { HerbPixelData, FormulaData } from '../types/index';

const PX = 3; // pixel size inside the tag icon

/**
 * Build a pixel sprite from a pixel map + palette.
 * Returns style objects for React rendering.
 * grid: array of strings, each char references palette key (' ' = transparent)
 */
export function pixelSprite(
  grid: string[],
  palette: Record<string, string>,
  px: number = PX
): { style: React.CSSProperties; innerStyle: React.CSSProperties } {
  const shadows: string[] = [];
  grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ' ' || !palette[ch]) return;
      shadows.push(`${x * px}px ${y * px}px 0 ${palette[ch]}`);
    });
  });
  const w = grid[0].length * px;
  const h = grid.length * px;
  return {
    style: {
      position: 'relative',
      width: w,
      height: h,
      display: 'inline-block'
    },
    innerStyle: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: px,
      height: px,
      boxShadow: shadows.join(',')
    }
  };
}

// ============================================================================
// Herb Pixel Definitions (22 herbs)
// ============================================================================

// 当归 — pink/purple root
const HERB_DANGGUI = [
  '   aa    ',
  '  abba   ',
  '  abba   ',
  '   aa    ',
  '   cc    ',
  '  cddc   ',
  ' cdeedc  ',
  'cdeeeeedc',
  ' cdeedc  ',
  '  cddc   ',
];
const PAL_DANGGUI = { a:'#6a8c78', b:'#8ab098', c:'#8a4a2a', d:'#b86a3a', e:'#d9955a' };

// 黄芪 — golden root sticks
const HERB_HUANGQI = [
  '  a      ',
  ' aba     ',
  ' abba    ',
  '  aba a  ',
  '  abaaba ',
  '   ababba',
  '   abbba ',
  '   abba  ',
  '   aba   ',
  '   ba    ',
];
const PAL_HUANGQI = { a:'#c89550', b:'#8a5a2a' };

// 人参 — ginseng with legs
const HERB_RENSHEN = [
  '   aa    ',
  '  abba   ',
  '  abba   ',
  '  abba   ',
  ' abbbba  ',
  ' abbbba  ',
  '  abba   ',
  '  a  a   ',
  ' a    a  ',
  'a      a ',
];
const PAL_RENSHEN = { a:'#3a2418', b:'#c89550' };

// 甘草 — yellow stem
const HERB_GANCAO = [
  '   a     ',
  '   aa    ',
  '  aba    ',
  '  aba    ',
  '  aba    ',
  ' abba    ',
  ' abba a  ',
  ' abbaaba ',
  ' abbbbba ',
  '  aaaaa  ',
];
const PAL_GANCAO = { a:'#8a5a2a', b:'#e8c991' };

// 枸杞 — red berries
const HERB_GOUQI = [
  '  b  b   ',
  ' bab bab ',
  ' baa baa ',
  '  b   b  ',
  '    c    ',
  '   ccc   ',
  '   bbb   ',
  '   bab   ',
  '   bab   ',
  '    b    ',
];
const PAL_GOUQI = { a:'#ffd24a', b:'#b8322c', c:'#6a8c78' };

// 菊花 — chrysanthemum
const HERB_JUHUA = [
  ' b  b  b ',
  '  bbbbb  ',
  ' bbaaabb ',
  ' baccab  ',
  ' bacccab ',
  ' bacccab ',
  ' baccabb ',
  ' bbaaabb ',
  '  bbbbb  ',
  ' b  b  b ',
];
const PAL_JUHUA = { a:'#ffd24a', b:'#e8c991', c:'#c89550' };

// 陈皮 — dried orange peel (curled strips)
const HERB_CHENPI = [
  ' aaa     ',
  'abbba ab ',
  'abcba abb',
  'abbba bba',
  ' aaa abcb',
  '   abbba ',
  '  abcba  ',
  ' abbba   ',
  ' aaa     ',
  '         ',
];
const PAL_CHENPI = { a:'#8a4a2a', b:'#d9955a', c:'#ffae2a' };

// 茯苓 — white mushroom-like chunk
const HERB_FULING = [
  '   aaa   ',
  '  abbba  ',
  ' abcccba ',
  ' abcccba ',
  'abbcccbba',
  'abcccccba',
  ' abcccba ',
  '  abbba  ',
  '   aaa   ',
  '         ',
];
const PAL_FULING = { a:'#8a6a3a', b:'#d9c49a', c:'#f4ead5' };

// 生姜 — ginger
const HERB_SHENGJIANG = [
  '   aa    ',
  '  abba a ',
  ' abbba ab',
  ' abbba bb',
  'abbbba ab',
  'abbbbba  ',
  ' abbbba  ',
  '  abbba  ',
  '   aab   ',
  '    a    ',
];
const PAL_SHENGJIANG = { a:'#8a5a2a', b:'#e8c991' };

// 肉桂 — cinnamon curl
const HERB_ROUGUI = [
  ' aaaaaa  ',
  'abbbbba  ',
  'abccccba ',
  'abc  cba ',
  'abc  cba ',
  'abc  cba ',
  'abccccba ',
  'abbbbba  ',
  ' aaaaaa  ',
  '         ',
];
const PAL_ROUGUI = { a:'#3a1a0a', b:'#8a4a2a', c:'#c89550' };

// 薄荷 — mint leaf
const HERB_BOHE = [
  '   bb    ',
  '  bbba   ',
  ' bbabba  ',
  'babaabba ',
  'babaabba ',
  'babaabb  ',
  ' bbabb   ',
  '  bbb    ',
  '   bb    ',
  '    b    ',
];
const PAL_BOHE = { a:'#b8d0a0', b:'#4a7a3a' };

// 金银花 — yellow-white flower
const HERB_JINYINHUA = [
  '  a  a   ',
  ' aba aba ',
  ' aba aba ',
  '  a   a  ',
  '   bbb   ',
  '  bcccb  ',
  '  bcccb  ',
  '   bbb   ',
  '    b    ',
  '    b    ',
];
const PAL_JINYINHUA = { a:'#f4ead5', b:'#4a7a3a', c:'#ffd24a' };

// ============================================================================
// Derived Herbs (using base shapes with different palettes)
// ============================================================================

// 川芎 — uses DANGGUI shape with different palette
const HERB_CHUANXIONG = HERB_DANGGUI;
const PAL_CHUANXIONG = { a:'#4a7a3a', b:'#6a8c78', c:'#8a4a2a', d:'#b86a3a', e:'#d9955a' };

// 白术 — uses FULING shape with different palette
const HERB_BAIZHU = HERB_FULING;
const PAL_BAIZHU = { a:'#6a4a2a', b:'#d9c49a', c:'#f4ead5' };

// 熟地 — uses RENSHEN shape with dark palette
const HERB_SHUDI = HERB_RENSHEN;
const PAL_SHUDI = { a:'#1a0a04', b:'#4a2818' };

// 白芍 — uses HUANGQI shape with light palette
const HERB_BAISHAO = HERB_HUANGQI;
const PAL_BAISHAO = { a:'#f4ead5', b:'#c89550' };

// 大枣 — uses GOUQI shape
const HERB_DAZAO = HERB_GOUQI;
const PAL_DAZAO = { a:'#ffd24a', b:'#8a1f1a', c:'#6a8c78' };

// 半夏 — uses FULING shape with brown palette
const HERB_BANXIA = HERB_FULING;
const PAL_BANXIA = { a:'#3a2418', b:'#8a6a3a', c:'#c89550' };

// 黄连 — uses HUANGQI shape with yellow palette
const HERB_HUANGLIAN = HERB_HUANGQI;
const PAL_HUANGLIAN = { a:'#ffd24a', b:'#b8633a' };

// 麻黄 — uses BOHE shape with dark green palette
const HERB_MAHUANG = HERB_BOHE;
const PAL_MAHUANG = { a:'#a2d090', b:'#2a4a1a' };

// 石斛 — uses BOHE shape with green palette
const HERB_SHIHU = HERB_BOHE;
const PAL_SHIHU = { a:'#c8e0a0', b:'#6a8a3a' };

// 附子 — uses RENSHEN shape with dark palette
const HERB_FUZI = HERB_RENSHEN;
const PAL_FUZI = { a:'#3a1a0a', b:'#8a4a2a' };

// ============================================================================
// HERB_PIXELS Array (22 herbs)
// ============================================================================

export const HERB_PIXELS: HerbPixelData[] = [
  { id:'danggui',   name:'当归', prop:'补血', grid:HERB_DANGGUI,   pal:PAL_DANGGUI,    count: 6 },
  { id:'huangqi',   name:'黄芪', prop:'补气', grid:HERB_HUANGQI,   pal:PAL_HUANGQI,    count: 4 },
  { id:'renshen',   name:'人参', prop:'大补', grid:HERB_RENSHEN,   pal:PAL_RENSHEN,    count: 1 },
  { id:'gancao',    name:'甘草', prop:'调和', grid:HERB_GANCAO,    pal:PAL_GANCAO,     count: 9 },
  { id:'gouqi',     name:'枸杞', prop:'明目', grid:HERB_GOUQI,     pal:PAL_GOUQI,      count: 12 },
  { id:'juhua',     name:'菊花', prop:'清热', grid:HERB_JUHUA,     pal:PAL_JUHUA,      count: 7 },
  { id:'chenpi',    name:'陈皮', prop:'理气', grid:HERB_CHENPI,    pal:PAL_CHENPI,     count: 5 },
  { id:'fuling',    name:'茯苓', prop:'利水', grid:HERB_FULING,    pal:PAL_FULING,     count: 3 },
  { id:'shengjiang',name:'生姜', prop:'发散', grid:HERB_SHENGJIANG,pal:PAL_SHENGJIANG, count: 8 },
  { id:'rougui',    name:'肉桂', prop:'温阳', grid:HERB_ROUGUI,    pal:PAL_ROUGUI,     count: 2 },
  { id:'bohe',      name:'薄荷', prop:'清凉', grid:HERB_BOHE,      pal:PAL_BOHE,       count: 5 },
  { id:'jinyinhua', name:'金银', prop:'解毒', grid:HERB_JINYINHUA, pal:PAL_JINYINHUA,  count: 4 },
  { id:'chuanxiong',name:'川芎', prop:'活血', grid:HERB_CHUANXIONG, pal:PAL_CHUANXIONG, count: 3 },
  { id:'baizhu',    name:'白术', prop:'健脾', grid:HERB_BAIZHU,    pal:PAL_BAIZHU,     count: 5 },
  { id:'shudi',     name:'熟地', prop:'滋阴', grid:HERB_SHUDI,     pal:PAL_SHUDI,      count: 4 },
  { id:'baishao',   name:'白芍', prop:'柔肝', grid:HERB_BAISHAO,   pal:PAL_BAISHAO,    count: 6 },
  { id:'dazao',     name:'大枣', prop:'养血', grid:HERB_DAZAO,     pal:PAL_DAZAO,      count: 10 },
  { id:'banxia',    name:'半夏', prop:'化痰', grid:HERB_BANXIA,    pal:PAL_BANXIA,     count: 3 },
  { id:'huanglian', name:'黄连', prop:'泻火', grid:HERB_HUANGLIAN, pal:PAL_HUANGLIAN,  count: 2 },
  { id:'mahuang',   name:'麻黄', prop:'发汗', grid:HERB_MAHUANG,   pal:PAL_MAHUANG,    count: 3 },
  { id:'shihu',     name:'石斛', prop:'养胃', grid:HERB_SHIHU,     pal:PAL_SHIHU,      count: 4 },
  { id:'fuzi',      name:'附子', prop:'回阳', grid:HERB_FUZI,      pal:PAL_FUZI,       count: 1 },
];

// ============================================================================
// FORMULAS Array (5 formulas)
// ============================================================================

export const FORMULAS: FormulaData[] = [
  { name:'四君子汤', hint:'补气健脾 · 4味', count:4,
    correct:['renshen','baizhu','fuling','gancao'] },
  { name:'桂枝汤',   hint:'解表和营 · 5味', count:5,
    correct:['rougui','baishao','shengjiang','dazao','gancao'] },
  { name:'六味地黄', hint:'滋阴补肾 · 6味', count:6,
    correct:['shudi','gouqi','fuling','chenpi','baishao','juhua'] },
  { name:'银翘散',   hint:'辛凉解表 · 4味', count:4,
    correct:['jinyinhua','bohe','juhua','gancao'] },
  { name:'逍遥散',   hint:'疏肝解郁 · 5味', count:5,
    correct:['danggui','baishao','baizhu','fuling','gancao'] },
];