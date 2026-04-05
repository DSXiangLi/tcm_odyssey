/**
 * 占位瓦片生成脚本
 *
 * 此脚本用于生成简单的占位瓦片PNG
 * 实际项目中应该使用真实的像素风格素材替换
 *
 * 使用方法：
 * 1. 安装canvas模块: npm install canvas
 * 2. 运行脚本: node scripts/generate-placeholder-tiles.js
 *
 * 注意：当前项目使用Phaser的graphics在运行时绘制瓦片
 * 此脚本仅用于开发参考和后续素材制作
 */

const TILE_SIZE = 32;

// 瓦片颜色定义
const COLORS = {
  grass: '#4a7c59',   // 草地 - 深绿色
  path: '#c9b896',    // 小路 - 米色
  water: '#4a90a4',    // 水域 - 蓝色
  wall: '#8b4513',     // 墙壁 - 棕色
  door: '#654321',     // 门 - 深棕色
  wood: '#a0522d',     // 木板 - 棕色
  bridge: '#deb887',   // 桥 - 浅棕色
  fence: '#cd853f',    // 围栏 - 秘鲁色
  flower: '#ff69b4',   // 花 - 粉色
  tree: '#228b22',     // 树 - 森林绿
  rock: '#808080',     // 岩石 - 灰色
  sign: '#daa520',     // 告示牌 - 金麒麟色
  chest: '#b8860b',    // 宝箱 - 暗金色
  bed: '#8b0000',      // 床 - 暗红色
  table: '#d2691e',    // 桌子 - 巧克力色
  chair: '#a0522d'     // 椅子 - 棕色
};

// 如果安装了canvas模块，可以生成实际的PNG文件
// 否则仅输出颜色配置供参考

function generatePlaceholderTiles() {
  console.log('===========================================');
  console.log('  占位瓦片素材生成器');
  console.log('===========================================');
  console.log('');
  console.log('瓦片尺寸: ' + TILE_SIZE + 'x' + TILE_SIZE + ' 像素');
  console.log('');
  console.log('瓦片颜色配置:');
  console.log('-------------------------------------------');

  Object.entries(COLORS).forEach(([type, color]) => {
    console.log(`  ${type.padEnd(10)}: ${color}`);
  });

  console.log('');
  console.log('-------------------------------------------');
  console.log('注意: 当前使用Phaser graphics在运行时绘制');
  console.log('后续应替换为真实的像素风格素材');
  console.log('===========================================');

  // 检查是否可以生成PNG
  try {
    require.resolve('canvas');
    console.log('');
    console.log('检测到canvas模块，可以生成PNG文件');
    console.log('运行以下命令生成瓦片图集:');
    console.log('  node scripts/generate-placeholder-tiles.js --generate');
  } catch (e) {
    console.log('');
    console.log('未检测到canvas模块');
    console.log('如需生成PNG文件，请先安装:');
    console.log('  npm install canvas');
  }
}

// 导出颜色配置供其他模块使用
export {
  TILE_SIZE,
  COLORS
};

// 运行脚本
generatePlaceholderTiles();