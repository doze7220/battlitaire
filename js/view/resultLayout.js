/**
 * 責務: 攻防の結果の窓の配置（窓の矩形と、見出し・行・決着・案内の y 座標）を作る。
 * 状態は持たず、ルール層は import しない。
 */

/** 窓の幅の上限 */
const PANEL_MAX_W = 640;
/** 窓の左右に空ける最小の余白（画面の幅が狭いとき、窓が画面を超えないようにする） */
const PANEL_SIDE_MARGIN = 24;
/** 窓の高さ */
const PANEL_H = 520;
/** 窓の上端から見出しまでの距離 */
const TITLE_OFFSET = 40;
/** 窓の上端から行の先頭までの距離 */
const LINE_TOP_OFFSET = 100;
/** 行の間隔 */
const LINE_PITCH = 44;
/** 窓の上端から決着の大きな文字までの距離 */
const OUTCOME_OFFSET = 360;
/** 窓の上端から案内までの距離 */
const HINT_OFFSET = 470;

/**
 * 結果の窓の配置。
 * @typedef {Object} ResultLayout
 * @property {{ width: number, height: number }} screen 画面の大きさ
 * @property {import('./layout.js').Rect} panel 窓の矩形
 * @property {number} titleY 見出しの y
 * @property {number} lineTop 行の先頭の y
 * @property {number} linePitch 行の間隔
 * @property {number} outcomeY 決着の大きな文字の y
 * @property {number} hintY 案内の y
 */

/**
 * 結果の窓の配置を作る。窓は画面の中央に置き、幅は min(上限, 画面の幅 − 左右の余白) とする。
 * @param {{ width: number, height: number }} screen 画面の大きさ
 * @returns {ResultLayout} 窓の配置
 */
export function createResultLayout(screen) {
  const panelW = Math.min(PANEL_MAX_W, screen.width - PANEL_SIDE_MARGIN * 2);
  const x = (screen.width - panelW) / 2;
  const y = (screen.height - PANEL_H) / 2;
  return {
    screen,
    panel: { x, y, w: panelW, h: PANEL_H },
    titleY: y + TITLE_OFFSET,
    lineTop: y + LINE_TOP_OFFSET,
    linePitch: LINE_PITCH,
    outcomeY: y + OUTCOME_OFFSET,
    hintY: y + HINT_OFFSET,
  };
}
