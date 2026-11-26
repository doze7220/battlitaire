/**
 * 責務: 戦闘の段の、敵を倒したときの案内の配置（「倒した！」・内訳の2列の格子・合計・タップの案内の位置）を求める純粋な計算。
 * 何も import しない。文字は持たない。
 */

/** 「倒した！」の中心の y（段の上端から）。 */
const TITLE_Y = 92;
/** 内訳の最初の行の中心の y（段の上端から）。 */
const ITEM_FIRST_Y = 152;
/** 内訳の行の間（px）。 */
const ITEM_ROW_GAP = 42;
/** 合計の中心の y（段の上端から）。 */
const TOTAL_Y = 290;
/** タップの案内の中心の y（段の上端から）。 */
const HINT_Y = 336;
/** 内訳の2列の中心の x（段の幅に対する割合）。 */
const COLUMN_RATIOS = Object.freeze([0.27, 0.73]);
/** 内訳の1列の幅から引く余白（px）。 */
const ITEM_PAD = 24;

/**
 * 敵を倒したときの案内の配置。
 * @typedef {Object} DefeatLayout
 * @property {number} x 段の中央の x（「倒した！」・合計・案内）
 * @property {number} titleY 「倒した！」の中心 y
 * @property {number} maxW 「倒した！」・合計・案内の文字の最大の幅
 * @property {(i: number, count: number) => {x: number, y: number}} itemSpot i 番目（0 から）の項目の中心（項目が count 個。奇数の最後は中央）
 * @property {number} itemMaxW 内訳の1行の文字の最大の幅
 * @property {number} totalY 合計の中心 y
 * @property {number} hintY タップの案内の中心 y
 */

/**
 * 敵を倒したときの案内の配置を作る。
 * @param {{x: number, y: number, w: number, h: number}} area 戦闘の段の矩形。
 * @param {number} sideMargin 段の左右の余白（px）。
 * @returns {DefeatLayout} 配置。
 */
export function createDefeatLayout(area, sideMargin) {
  const centerX = area.x + area.w / 2;
  return {
    x: centerX,
    titleY: area.y + TITLE_Y,
    maxW: area.w - sideMargin * 2,
    itemSpot(i, count) {
      const row = Math.floor(i / 2);
      const alone = count % 2 === 1 && i === count - 1;
      const x = alone ? centerX : area.x + area.w * COLUMN_RATIOS[i % 2];
      return { x, y: area.y + ITEM_FIRST_Y + ITEM_ROW_GAP * row };
    },
    itemMaxW: area.w * (COLUMN_RATIOS[1] - COLUMN_RATIOS[0]) - ITEM_PAD,
    totalY: area.y + TOTAL_Y,
    hintY: area.y + HINT_Y,
  };
}
