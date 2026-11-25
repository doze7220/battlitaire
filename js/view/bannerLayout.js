/**
 * 責務: 合図（準備終了・BATTLE!・フェーズとステージの始まり）の配置と敵の入りの始めのずれを、`layout.js` の配置の矩形から求める。
 * 状態は変えず、ルール層は import しない。
 */

/** BATTLE! のロゴの y の、戦闘の段の高さに対する割合。試遊で決め直す。 */
export const BATTLE_LOGO_RATIO = 0.47;

/** 始まりのロゴ（PHASE・STAGE）の y の、戦闘の段の高さに対する割合。試遊で決め直す。 */
export const INTRO_LOGO_RATIO = 0.27;

/** 始まりの番号（数字の絵）の y の、戦闘の段の高さに対する割合。試遊で決め直す。 */
export const INTRO_NUMBER_RATIO = 0.5;

/** フェーズの始まりの予告の文字の y の、戦闘の段の高さに対する割合。試遊で決め直す。 */
export const INTRO_TEXT_RATIO = 0.69;

/** フェーズの始まりの数え下ろしの文字の y の、戦闘の段の高さに対する割合。試遊で決め直す。 */
export const INTRO_SUBTEXT_RATIO = 0.8;

/** ステージの始まりの敵の名前の文字の y の、戦闘の段の高さに対する割合。試遊で決め直す。 */
export const INTRO_NAME_RATIO = 0.73;

/** 始まりの文字の左右の余白（px）。試遊で決め直す。 */
export const INTRO_TEXT_MARGIN_X = 40;

/**
 * 合図の配置。
 * @typedef {Object} BannerLayout
 * @property {{ x: number, y: number, w: number, h: number }} screen 画面全体の矩形（準備終了の暗幕）
 * @property {{ x: number, y: number }} ready 準備終了のロゴの位置（画面の中心）
 * @property {{ x: number, y: number }} battle BATTLE! のロゴの位置（戦闘の段の中央付近）
 * @property {{ x: number, logoY: number, numberY: number, textY: number, subTextY: number, nameY: number, maxW: number }} intro
 *   始まりの配置（x は段の中央、各 Y は中心の y、maxW は文字の最大の幅）
 * @property {number} enemyEntryDX 敵の入りの始めの右へのずれ（px）
 */

/**
 * 合図の配置を求める。
 * @param {import('./layout.js').Layout} layout 画面の配置
 * @returns {BannerLayout} 合図の配置
 */
export function createBannerLayout(layout) {
  const area = layout.battle.area;
  const cx = area.x + area.w / 2;
  return {
    screen: { x: 0, y: 0, w: layout.screen.width, h: layout.screen.height },
    ready: { x: layout.screen.width / 2, y: layout.screen.height / 2 },
    battle: { x: cx, y: area.y + area.h * BATTLE_LOGO_RATIO },
    intro: {
      x: cx,
      logoY: area.y + area.h * INTRO_LOGO_RATIO,
      numberY: area.y + area.h * INTRO_NUMBER_RATIO,
      textY: area.y + area.h * INTRO_TEXT_RATIO,
      subTextY: area.y + area.h * INTRO_SUBTEXT_RATIO,
      nameY: area.y + area.h * INTRO_NAME_RATIO,
      maxW: area.w - INTRO_TEXT_MARGIN_X * 2,
    },
    enemyEntryDX: area.w,
  };
}
