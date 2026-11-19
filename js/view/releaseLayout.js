/**
 * 責務: 放つ演出の配置（放った札の矩形・区切りごとの合体する位置と飛ぶ先・玉の大きさ・弧の持ち上がり・式の向き）を、`layout.js` の配置の矩形から求める。
 * 状態は変えず、ルール層は import しない。
 */

/** 小さい玉の直径の、カードの幅に対する割合。試遊で決め直す。 */
export const ORB_SMALL_RATIO = 0.35;

/** 大きい玉の直径の、カードの幅に対する割合。試遊で決め直す。 */
export const ORB_BIG_RATIO = 0.6;

/** 弾けて広がり切ったときの直径の、大きい玉に対する割合。試遊で決め直す。 */
export const ORB_BURST_RATIO = 1.6;

/** 列の画面上の上端（[0] の札の上端）と、一番下の区切りの大きい玉の下端の間（px）。試遊で決め直す。 */
export const ORB_MERGE_GAP = 12;

/** 区切りの合体する位置どうしの縦の間隔の上限（px）。試遊で決め直す。 */
export const ORB_SEGMENT_STEP = 56;

/** 飛ぶ弧の持ち上がり（px）。試遊で決め直す。 */
export const ORB_ARC_RISE = 80;

/**
 * 放つ演出の配置。
 * @typedef {Object} ReleaseGeometry
 * @property {Array<{x: number, y: number, w: number, h: number}>} cardRects 放った札の矩形（下から順）
 * @property {Array<{x: number, y: number}>} mergePoints 区切りごとの合体する位置（玉の中心。下の区切りから順）
 * @property {Array<{x: number, y: number}>} targets 区切りごとの飛ぶ先（玉の中心。下の区切りから順）
 * @property {number} smallSize 小さい玉の直径
 * @property {number} bigSize 大きい玉の直径
 * @property {number} burstSize 弾けて広がり切ったときの直径
 * @property {number} arcRise 飛ぶ弧の持ち上がり
 * @property {(1|-1)} labelDir 式を出す向き（1 は玉の右、-1 は左）
 */

/**
 * 矩形の中心を返す。
 * @param {{x: number, y: number, w: number, h: number}} r 矩形
 * @returns {{x: number, y: number}} 中心
 */
function centerOf(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/**
 * 放つ演出の配置を求める。
 * @param {import('./layout.js').Layout} layout 画面の配置
 * @param {number} columnIndex 放った列の番号
 * @param {number} cardCount 放った札の枚数
 * @param {string[]} segmentGauges 区切りごとのゲージ名（下の区切りから順）
 * @param {string} coinGauge 金貨のゲージの識別子（陣地のない区切りのうち、最上部の金貨のゲージへ飛ぶもの）
 * @returns {ReleaseGeometry} 放つ演出の配置
 * @throws {Error} 飛ぶ先のないゲージがあるとき
 */
export function releaseGeometry(layout, columnIndex, cardCount, segmentGauges, coinGauge) {
  const cardRects = layout.columnCardRects(columnIndex, cardCount);
  const col = layout.columns[columnIndex];
  const cardW = layout.card.w;
  const smallSize = cardW * ORB_SMALL_RATIO;
  const bigSize = cardW * ORB_BIG_RATIO;
  const burstSize = bigSize * ORB_BURST_RATIO;

  const centerX = col.x + cardW / 2;
  const minY = layout.sections.solitaire.y + bigSize / 2;
  const baseY = Math.max(minY, col.y - ORB_MERGE_GAP - bigSize / 2);
  const n = segmentGauges.length;
  const step = n <= 1 ? 0 : Math.min(ORB_SEGMENT_STEP, Math.max(0, (baseY - minY) / (n - 1)));

  const mergePoints = [];
  const targets = [];
  const camps = layout.battle.troops.camps;
  for (let s = 0; s < n; s++) {
    mergePoints.push({ x: centerX, y: baseY - s * step });
    const gauge = segmentGauges[s];
    if (Object.prototype.hasOwnProperty.call(camps, gauge)) {
      targets.push(centerOf(camps[gauge]));
    } else {
      if (gauge !== coinGauge) throw new Error(`releaseGeometry: 飛ぶ先のないゲージ ${gauge}`);
      targets.push(centerOf(layout.battle.topGauges.coinBar));
    }
  }

  const labelDir = centerX < layout.screen.width / 2 ? 1 : -1;
  return { cardRects, mergePoints, targets, smallSize, bigSize, burstSize, arcRise: ORB_ARC_RISE, labelDir };
}
