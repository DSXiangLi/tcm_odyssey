// 游戏尺寸 - 16:9宽屏视口 (720p标准)
// 室外地图 2752×1536 > 视口，室内地图 1408×768 ≈ 视口
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// 瓦片尺寸
export const TILE_SIZE = 32;

// 场景名称
export const SCENES = {
  TITLE: 'TitleScene',
  BOOT: 'BootScene',
  TOWN_OUTDOOR: 'TownOutdoorScene',
  CLINIC: 'ClinicScene',
  GARDEN: 'GardenScene',
  HOME: 'HomeScene',
  // Phase 2 S4: 问诊场景
  INQUIRY: 'InquiryScene',
  // Phase 2 S6: 诊治场景
  PULSE: 'PulseScene',
  TONGUE: 'TongueScene',
  SYNDROME: 'SyndromeScene',
  PRESCRIPTION: 'PrescriptionScene',
  // Phase 2 S9: 煎药场景
  DECOCTION: 'DecoctionScene',
  // Phase 2 S10: 炮制场景
  PROCESSING: 'ProcessingScene',
  // Phase 2 S11: 种植场景
  PLANTING: 'PlantingScene'
} as const;

// 玩家移动速度
export const PLAYER_SPEED = 150;

// 资源路径
export const ASSETS = {
  MAPS: {
    TOWN_OUTDOOR: 'maps/town-outdoor',
    CLINIC: 'maps/clinic',
    GARDEN: 'maps/garden',
    HOME: 'maps/home'
  },
  TILES: {
    OUTDOOR: 'tiles/tileset'
  },
  SPRITES: {
    PLAYER: 'sprites/player'
  }
} as const;