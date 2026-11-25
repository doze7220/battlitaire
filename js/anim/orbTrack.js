/**
 * 1回の放つの、札1枚ごと・区切りごとの玉の記録（玉に変わる・上る・合体・式・飛ぶ・弾けるの時刻と位置）を組み立て、
 * 時計から見た目（玉に変わる前の札・玉・式）を求める。時刻の式はここだけに置く。描画も状態の変更もしない。
 */
import { ANIM_TIMING } from './animConfig.js';
import { clamp01, lerp, easeOutCubic, easeInOutQuad } from './easing.js';

/**
 * 放った札1枚の記録。
 * @typedef {Object} OrbCard
 * @property {*} card 札（描画側が表の札として描く）。
 * @property {{x:number,y:number,w:number,h:number}} rect 放つ前の列での札の矩形。
 * @property {number} convertAt 玉に変わる時刻（時計の値）。
 * @property {number} segment 属する区切りの番号。
 */

/**
 * 区切り1つ（大きい玉1つ）の記録。
 * @typedef {Object} OrbSegment
 * @property {string} suit スート。
 * @property {string} gauge 加算先のゲージ。
 * @property {number} sum 札の合計。
 * @property {number} bonus 足す量。
 * @property {number} amount 加算量。
 * @property {{x:number,y:number}} point 合体する位置（玉の中心）。
 * @property {{x:number,y:number}} target 飛ぶ先（玉の中心）。
 * @property {number} gatherAt 小さい玉が全部集まる時刻。
 * @property {number} mergeEnd 合体が終わる時刻（式を出し始める）。
 * @property {number} flyStart 飛び始める時刻（式を消す）。
 * @property {number} arriveAt 飛ぶ先に着く時刻。
 * @property {number} burstEnd 弾け終わる時刻。
 */

/**
 * 1回の放つの玉の記録。
 * @typedef {Object} ReleaseOrbs
 * @property {OrbCard[]} cards 放った札。列の下から順。
 * @property {OrbSegment[]} segments 区切り。下の区切りから順。
 * @property {number} smallSize 小さい玉の直径。
 * @property {number} bigSize 大きい玉の直径。
 * @property {number} burstSize 弾け切ったときの直径。
 * @property {number} arcRise 飛ぶ弧の持ち上がり。
 * @property {number} labelDir 式を出す向き（1 = 玉の右、-1 = 左）。
 * @property {number} holdUntil 最後の札が玉に変わる時刻。
 * @property {number} endTime 最後の区切りの弾け終わる時刻。
 * @property {number[]} chainTimes 札が玉に変わる時刻（昇順。添字+1 が何枚目か）。
 */

/**
 * 玉に変わる前の札の見た目。
 * @typedef {Object} OrbCardLook
 * @property {*} card 札。
 * @property {number} x 左上 x。
 * @property {number} y 左上 y。
 * @property {number} w 幅。
 * @property {number} h 高さ。
 */

/**
 * 玉の見た目。
 * @typedef {Object} OrbLook
 * @property {string} suit スート（色を決める）。
 * @property {number} x 中心 x。
 * @property {number} y 中心 y。
 * @property {number} size 直径。
 * @property {number} alpha 濃さ（0〜1）。
 */

/**
 * 式の見た目。
 * @typedef {Object} FormulaLook
 * @property {number} sum 札の合計。
 * @property {number} bonus 足す量。
 * @property {number} amount 加算量。
 * @property {number} x 玉の中心 x。
 * @property {number} y 玉の中心 y。
 * @property {number} gap 玉の半径（玉から文字までの間の基準）。
 * @property {number} dir 式を出す向き（1 = 右、-1 = 左）。
 */

/**
 * ある時計での放つ演出の見た目。
 * @typedef {Object} ReleaseOrbsLook
 * @property {OrbCardLook[]} cards 玉に変わる前の札。
 * @property {OrbLook[]} orbs 玉（小さい玉・大きい玉・弾ける玉）。
 * @property {FormulaLook[]} formulas 出している式。
 */

/**
 * 区間の進み具合（0〜1）。長さが 0 以下なら 1。
 * @param {number} clock 時計。
 * @param {number} start 区間の始め。
 * @param {number} length 区間の長さ。
 * @returns {number} 進み具合。
 */
function progress(clock, start, length) {
  return length <= 0 ? 1 : clamp01((clock - start) / length);
}

/**
 * 玉が飛ぶ弧（2次ベジェ）の上の位置を求める。区切りの玉と4スートそろいの玉で共用する。
 * @param {{x:number,y:number}} from 飛び始める位置（玉の中心）。
 * @param {{x:number,y:number}} to 飛ぶ先（玉の中心）。
 * @param {number} rise 弧の持ち上がり（px）。
 * @param {number} u 進み具合（イージング前の 0〜1。中で `easeInOutQuad` を掛ける）。
 * @returns {{x:number,y:number}} 位置（玉の中心）。
 */
export function flyPoint(from, to, rise, u) {
  const e = easeInOutQuad(u);
  const cx = (from.x + to.x) / 2;
  const cy = Math.min(from.y, to.y) - rise;
  const a = (1 - e) * (1 - e);
  const b = 2 * (1 - e) * e;
  const c = e * e;
  return { x: a * from.x + b * cx + c * to.x, y: a * from.y + b * cy + c * to.y };
}

/**
 * 1回の放つの玉の記録を組み立てる。
 * @param {Array<{suit:string, gauge:string, cards:Array<*>, sum:number, bonus:number, amount:number}>} segments 放った結果の区切り（下の区切りから順）。
 * @param {{cardRects:Array<{x:number,y:number,w:number,h:number}>, mergePoints:Array<{x:number,y:number}>, targets:Array<{x:number,y:number}>, smallSize:number, bigSize:number, burstSize:number, arcRise:number, labelDir:number}} geometry 放つ演出の配置。
 * @param {number} t0 放った時計の値。
 * @returns {ReleaseOrbs} 玉の記録。
 */
export function createReleaseOrbs(segments, geometry, t0) {
  const total = segments.reduce((n, s) => n + s.cards.length, 0);
  const stagger = total <= 1
    ? 0
    : Math.min(ANIM_TIMING.orbConvertStaggerMs, ANIM_TIMING.orbConvertMaxMs / (total - 1));
  /** @type {OrbCard[]} */
  const cards = [];
  /** @type {OrbSegment[]} */
  const segs = [];
  /** @type {number[]} */
  const chainTimes = [];
  let k = 0;
  let lastConvert = t0;
  segments.forEach((seg, s) => {
    seg.cards.forEach((card) => {
      const convertAt = t0 + ANIM_TIMING.orbStartDelayMs + k * stagger;
      cards.push({ card, rect: geometry.cardRects[k], convertAt, segment: s });
      chainTimes.push(convertAt);
      lastConvert = convertAt;
      k += 1;
    });
    const gatherAt = lastConvert + ANIM_TIMING.orbRiseMs;
    const mergeEnd = gatherAt + ANIM_TIMING.orbMergeMs;
    const flyStart = mergeEnd + ANIM_TIMING.orbFormulaMs;
    const arriveAt = flyStart + ANIM_TIMING.orbFlyMs;
    segs.push({
      suit: seg.suit,
      gauge: seg.gauge,
      sum: seg.sum,
      bonus: seg.bonus,
      amount: seg.amount,
      point: geometry.mergePoints[s],
      target: geometry.targets[s],
      gatherAt,
      mergeEnd,
      flyStart,
      arriveAt,
      burstEnd: arriveAt + ANIM_TIMING.orbBurstMs,
    });
  });
  const holdUntil = cards.length > 0 ? cards[cards.length - 1].convertAt : t0;
  const endTime = segs.length > 0 ? segs[segs.length - 1].burstEnd : t0;
  return {
    cards,
    segments: segs,
    smallSize: geometry.smallSize,
    bigSize: geometry.bigSize,
    burstSize: geometry.burstSize,
    arcRise: geometry.arcRise,
    labelDir: geometry.labelDir,
    holdUntil,
    endTime,
    chainTimes,
  };
}

/**
 * 時計から見た目を求め、out の各配列へ push する。
 * @param {ReleaseOrbs} orbs 玉の記録。
 * @param {number} clock 時計の値。
 * @param {ReleaseOrbsLook} out 書き込み先（呼び出し側が毎回空の配列を渡す）。
 * @returns {void}
 */
export function sampleReleaseOrbs(orbs, clock, out) {
  for (const oc of orbs.cards) {
    const seg = orbs.segments[oc.segment];
    if (clock < oc.convertAt) {
      out.cards.push({ card: oc.card, x: oc.rect.x, y: oc.rect.y, w: oc.rect.w, h: oc.rect.h });
    } else if (clock < seg.gatherAt) {
      const e = easeOutCubic(progress(clock, oc.convertAt, ANIM_TIMING.orbRiseMs));
      const cx = oc.rect.x + oc.rect.w / 2;
      const cy = oc.rect.y + oc.rect.h / 2;
      out.orbs.push({
        suit: seg.suit,
        x: lerp(cx, seg.point.x, e),
        y: lerp(cy, seg.point.y, e),
        size: orbs.smallSize,
        alpha: 1,
      });
    }
  }
  for (const seg of orbs.segments) {
    const { point, target } = seg;
    if (clock < seg.gatherAt || clock >= seg.burstEnd) continue;
    if (clock < seg.mergeEnd) {
      const p = easeOutCubic(progress(clock, seg.gatherAt, ANIM_TIMING.orbMergeMs));
      out.orbs.push({ suit: seg.suit, x: point.x, y: point.y, size: lerp(orbs.smallSize, orbs.bigSize, p), alpha: 1 });
    } else if (clock < seg.flyStart) {
      out.orbs.push({ suit: seg.suit, x: point.x, y: point.y, size: orbs.bigSize, alpha: 1 });
      out.formulas.push({
        sum: seg.sum,
        bonus: seg.bonus,
        amount: seg.amount,
        x: point.x,
        y: point.y,
        gap: orbs.bigSize / 2,
        dir: orbs.labelDir,
      });
    } else if (clock < seg.arriveAt) {
      const p = flyPoint(point, target, orbs.arcRise, progress(clock, seg.flyStart, ANIM_TIMING.orbFlyMs));
      out.orbs.push({ suit: seg.suit, x: p.x, y: p.y, size: orbs.bigSize, alpha: 1 });
    } else {
      const p = progress(clock, seg.arriveAt, ANIM_TIMING.orbBurstMs);
      out.orbs.push({ suit: seg.suit, x: target.x, y: target.y, size: lerp(orbs.bigSize, orbs.burstSize, p), alpha: 1 - p });
    }
  }
}
