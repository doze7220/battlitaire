/**
 * 責務: 盤面の画面配置（座標・大きさ）を一手に持ち、座標から「何に当たるか」を求める。
 * ルール層は import せず、数の情報は引数で受け取る。状態は変えない。
 */

/**
 * 矩形。
 * @typedef {Object} Rect
 * @property {number} x 左端
 * @property {number} y 上端
 * @property {number} w 幅
 * @property {number} h 高さ
 */

/**
 * 列1本の配置。
 * @typedef {Object} ColumnLayout
 * @property {number} x 左端
 * @property {number} y 領域の上端
 * @property {number} w 幅（カードの幅）
 * @property {number} h 領域の高さ
 * @property {number} step カードの重ねのずらし幅
 * @property {number} cardW カードの幅
 * @property {number} cardH カードの高さ
 */

/**
 * 右側パネル（HUD）の配置。
 * @typedef {Object} HudLayout
 * @property {Rect} panel パネル全体
 * @property {function(number): number} gaugeY ゲージ行の上端 y を返す（引数はゲージの並び順の番号）
 * @property {number} gaugeH ゲージ行1つの高さ
 * @property {Rect} actions 「行動 残り / 最大」の領域
 * @property {Rect} actionEnd 「行動終了」の領域
 */

/**
 * 当たり判定の結果。
 * @typedef {{ kind: 'deck'|'column'|'release', index: number }} Hit
 */

/**
 * 盤面の配置。
 * @typedef {Object} Layout
 * @property {{ width: number, height: number }} screen 画面の大きさ
 * @property {{ w: number, h: number }} card カードの幅と高さ
 * @property {Rect[]} decks 山札の領域
 * @property {Rect} discard 捨て札の領域
 * @property {ColumnLayout[]} columns 列の領域
 * @property {Rect[]} releaseButtons 放つボタンの領域
 * @property {HudLayout} hud 右側パネル
 * @property {function(number, number): (Hit|null)} hitTest 座標から当たったものを返す
 */

const CARD_W = 90;
const CARD_H = 126;
const LEFT_X = 80;
const PITCH_X = 130;
const DECK_Y = 50;
const DISCARD_X = 640;
const COLUMN_TOP = 230;
const COLUMN_STEP_DEFAULT = 36;
const RELEASE_Y = 600;
const RELEASE_H = 44;
/** 列の領域の下端と放つボタンの間のすき間 */
const COLUMN_BOTTOM_GAP = 16;
const PANEL_X = 840;
const PANEL_Y = 50;
const PANEL_W = 400;
const PANEL_H = 594;
const GAUGE_Y = 60;
const GAUGE_PITCH = 70;
const GAUGE_H = 56;
const ACTIONS_Y = 360;
const ACTIONS_H = 50;
const ACTION_END_Y = 440;
const ACTION_END_H = 80;
const PANEL_PADDING = 20;

/**
 * 点が矩形の中にあるか（右端・下端は含まない）。
 * @param {Rect} r 矩形
 * @param {number} x x 座標
 * @param {number} y y 座標
 * @returns {boolean} 含むなら true
 */
function inRect(r, x, y) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

/**
 * 盤面の配置を作る。
 * @param {Object} params 引数
 * @param {{ width: number, height: number }} params.screen 画面の大きさ
 * @param {number} params.deckCount 山札の数
 * @param {number} params.columnCount 列の数
 * @param {number} params.maxColumnLength 列の最大枚数
 * @returns {Layout} 配置
 */
export function createLayout({ screen, deckCount, columnCount, maxColumnLength }) {
  const decks = [];
  for (let i = 0; i < deckCount; i++) {
    decks.push({ x: LEFT_X + PITCH_X * i, y: DECK_Y, w: CARD_W, h: CARD_H });
  }
  const discard = { x: DISCARD_X, y: DECK_Y, w: CARD_W, h: CARD_H };

  const areaH = RELEASE_Y - COLUMN_BOTTOM_GAP - COLUMN_TOP;
  let step = COLUMN_STEP_DEFAULT;
  if (maxColumnLength > 1) {
    step = Math.min(step, (areaH - CARD_H) / (maxColumnLength - 1));
  }

  const columns = [];
  const releaseButtons = [];
  for (let i = 0; i < columnCount; i++) {
    const x = LEFT_X + PITCH_X * i;
    columns.push({ x, y: COLUMN_TOP, w: CARD_W, h: areaH, step, cardW: CARD_W, cardH: CARD_H });
    releaseButtons.push({ x, y: RELEASE_Y, w: CARD_W, h: RELEASE_H });
  }

  const innerX = PANEL_X + PANEL_PADDING;
  const innerW = PANEL_W - PANEL_PADDING * 2;
  /** @type {HudLayout} */
  const hud = {
    panel: { x: PANEL_X, y: PANEL_Y, w: PANEL_W, h: PANEL_H },
    gaugeY: (i) => GAUGE_Y + GAUGE_PITCH * i,
    gaugeH: GAUGE_H,
    actions: { x: innerX, y: ACTIONS_Y, w: innerW, h: ACTIONS_H },
    actionEnd: { x: innerX, y: ACTION_END_Y, w: innerW, h: ACTION_END_H },
  };

  /**
   * 座標から当たったものを返す（放つボタン → 山札 → 列 の順）。
   * @param {number} x x 座標
   * @param {number} y y 座標
   * @returns {Hit|null} 当たったもの。なければ null
   */
  function hitTest(x, y) {
    for (let i = 0; i < releaseButtons.length; i++) {
      if (inRect(releaseButtons[i], x, y)) return { kind: 'release', index: i };
    }
    for (let i = 0; i < decks.length; i++) {
      if (inRect(decks[i], x, y)) return { kind: 'deck', index: i };
    }
    for (let i = 0; i < columns.length; i++) {
      if (inRect(columns[i], x, y)) return { kind: 'column', index: i };
    }
    return null;
  }

  return { screen, card: { w: CARD_W, h: CARD_H }, decks, discard, columns, releaseButtons, hud, hitTest };
}
