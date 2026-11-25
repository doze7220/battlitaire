/**
 * 責務: 放つ演出の配置（放った札の矩形・区切りごとの合体する位置と飛ぶ先・玉の大きさ・弧の持ち上がり・式の向き・4スートそろいの文字と玉）を、`layout.js` の配置の矩形から求める。
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

/** 4スートそろいの玉どうしの横の間隔（px）。試遊で決め直す。 */
export const ALL_SUITS_ORB_STEP = 40;

/** 4スートそろいの文字の中心が、玉の列の中心（一番下の合体位置）より上にある量（px）。試遊で決め直す。 */
export const ALL_SUITS_LABEL_DY = 44;

/** 4スートそろいの文字の最大の幅（px）。 */
export const ALL_SUITS_LABEL_MAX_W = 180;

/** 4スートそろいの文字・玉の列が、画面の左右の端から空ける間（px）。 */
export const ALL_SUITS_EDGE = 8;

/**
 * 放つ演出の配置。
 * @typedef {Object} ReleaseGeometry
 * @property {Array<{x: number, y: number, w: number, h: number}>} cardRects 放った札の矩形（下から順）
 * @property {Array<{x: number, y: number}>} mergePoints 区切りごとの合体する位置（玉の中心。下の区切りから順）
 * @property {Array<{x: number, y: number}>} targets 区切りごとの飛ぶ先（玉の中心。下の区切りから順）
 * @property {number} smallSize 小さい玉の直径
 * @property {number} bigSize 大きい玉の直径
 * @property {number} burstSize 弾けて広がり切ったときの直径
 * @property {number} smallBurstSize 4スートそろいの玉が弾けて広がり切ったときの直径
 * @property {number} arcRise 飛ぶ弧の持ち上がり
 * @property {(1|-1)} labelDir 式を出す向き（1 は玉の右、-1 は左）
 * @property {{label: {x: number, y: number, maxW: number}, starts: Array<{x: number, y: number}>, targets: Array<{x: number, y: number}>}|null} allSuits 4スートそろいの配置（文字の中心と最大の幅・玉の現れる位置と飛ぶ先。玉は `bonusGauges` の順。そろわないときは null）
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
 * @param {string[]} [bonusGauges] 4スートそろいの玉ごとのゲージ名（そろわないときは空。省くと空）
 * @returns {ReleaseGeometry} 放つ演出の配置
 * @throws {Error} 陣地（`layout.battle.troops.camps`）になく、金貨のゲージ（coinGauge）でもない区切り・玉があるとき
 */
export function releaseGeometry(layout, columnIndex, cardCount, segmentGauges, coinGauge, bonusGauges = []) {
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
  for (let s = 0; s < n; s++) {
    mergePoints.push({ x: centerX, y: baseY - s * step });
    targets.push(flyTarget(layout, segmentGauges[s], coinGauge));
  }

  const labelDir = centerX < layout.screen.width / 2 ? 1 : -1;
  return {
    cardRects,
    mergePoints,
    targets,
    smallSize,
    bigSize,
    burstSize,
    smallBurstSize: smallSize * ORB_BURST_RATIO,
    arcRise: ORB_ARC_RISE,
    labelDir,
    allSuits: allSuitsGeometry(layout, centerX, baseY, smallSize, bonusGauges, coinGauge),
  };
}

/**
 * 4スートそろいの文字と玉の配置を求める。そろわないとき（`bonusGauges` が空）は null。
 * @param {import('./layout.js').Layout} layout 画面の配置
 * @param {number} centerX 放った列の中心 x
 * @param {number} baseY 一番下の合体位置の y（玉の列の中心 y）
 * @param {number} smallSize 小さい玉の直径
 * @param {string[]} bonusGauges 玉ごとのゲージ名
 * @param {string} coinGauge 金貨のゲージの識別子
 * @returns {{label: {x: number, y: number, maxW: number}, starts: Array<{x: number, y: number}>, targets: Array<{x: number, y: number}>}|null} 配置
 */
function allSuitsGeometry(layout, centerX, baseY, smallSize, bonusGauges, coinGauge) {
  const n = bonusGauges.length;
  if (n === 0) return null;
  const rowHalf = ((n - 1) * ALL_SUITS_ORB_STEP) / 2 + smallSize / 2;
  const half = Math.max(ALL_SUITS_LABEL_MAX_W / 2, rowHalf);
  const lo = ALL_SUITS_EDGE + half;
  const x = Math.min(Math.max(centerX, lo), layout.screen.width - lo);
  return {
    label: { x, y: baseY - ALL_SUITS_LABEL_DY, maxW: ALL_SUITS_LABEL_MAX_W },
    starts: bonusGauges.map((_, k) => ({ x: x + (k - (n - 1) / 2) * ALL_SUITS_ORB_STEP, y: baseY })),
    targets: bonusGauges.map((gauge) => flyTarget(layout, gauge, coinGauge)),
  };
}

/**
 * ゲージごとの飛ぶ先（玉の中心）を求める。陣地があればその中心、金貨のゲージなら金貨の棒の中心。
 * @param {import('./layout.js').Layout} layout 画面の配置
 * @param {string} gauge ゲージの識別子
 * @param {string} coinGauge 金貨のゲージの識別子
 * @returns {{x: number, y: number}} 飛ぶ先
 * @throws {Error} 陣地になく、金貨のゲージでもないとき
 */
function flyTarget(layout, gauge, coinGauge) {
  const camps = layout.battle.troops.camps;
  if (Object.prototype.hasOwnProperty.call(camps, gauge)) return centerOf(camps[gauge]);
  if (gauge !== coinGauge) throw new Error(`releaseGeometry: 飛ぶ先のないゲージ ${gauge}`);
  return centerOf(layout.battle.topGauges.coinBar);
}
