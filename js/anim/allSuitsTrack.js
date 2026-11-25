/**
 * 4スートそろいの文字と4つの玉の記録（現れる・飛ぶ・弾けるの時刻と位置）を組み立て、時計から見た目を求める。
 * 4スートそろいの時刻の式はここだけに置く。描画も状態の変更もしない。ルール層は import しない。
 */
import { ANIM_TIMING } from './animConfig.js';
import { clamp01, lerp, easeOutBack } from './easing.js';
import { flyPoint } from './orbTrack.js';

/**
 * 4スートそろいの玉1つの記録。
 * @typedef {Object} AllSuitsOrb
 * @property {string} suit スート（玉の色）。
 * @property {string} gauge 加算先のゲージ。
 * @property {number} amount 加算量。
 * @property {{x:number,y:number}} start 現れる位置（玉の中心）。
 * @property {{x:number,y:number}} target 飛ぶ先（玉の中心）。
 * @property {number} showAt 現れ始める時刻。
 * @property {number} flyStart 飛び始める時刻。
 * @property {number} arriveAt 飛ぶ先に着く時刻。
 * @property {number} burstEnd 弾け終わる時刻。
 */

/**
 * 4スートそろいの文字の記録。
 * @typedef {Object} AllSuitsLabel
 * @property {number} x 中心 x。
 * @property {number} y 中心 y。
 * @property {number} maxW 最大の幅。
 * @property {number} suitCount そろったスートの数。
 * @property {number} amount 1つのゲージに足す量。
 * @property {number} showAt 出る時刻。
 * @property {number} hideAt 消え終わる時刻。
 */

/**
 * 4スートそろい1回分の記録。
 * @typedef {Object} AllSuitsTrack
 * @property {AllSuitsLabel} label 文字。
 * @property {AllSuitsOrb[]} orbs 玉（`parts` の順）。
 * @property {number} smallSize 玉の直径（現れ切ったとき）。
 * @property {number} burstSize 弾け切ったときの直径。
 * @property {number} arcRise 飛ぶ弧の持ち上がり。
 * @property {number} endTime 文字が消える時刻と最後の玉の弾け終わる時刻の遅い方。
 */

/**
 * 4スートそろいの文字の見た目。
 * @typedef {Object} AllSuitsLabelLook
 * @property {number} suitCount そろったスートの数。
 * @property {number} amount 1つのゲージに足す量。
 * @property {number} x 中心 x。
 * @property {number} y 中心 y。
 * @property {number} maxW 最大の幅。
 * @property {number} scale 倍率。
 * @property {number} alpha 濃さ（0〜1）。
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
 * 4スートそろいの記録を組み立てる。
 * @param {{amount: number, parts: Array<{suit: string, gauge: string}>}} allSuits そろいの加算（`AllSuitsBonus`）
 * @param {import('../view/releaseLayout.js').ReleaseGeometry} geometry 放つ演出の配置（`allSuits` が null でないもの）
 * @param {number} t 基準の時刻（最後の区切りの玉が飛び始める時刻）
 * @returns {AllSuitsTrack} 記録
 * @throws {Error} 配置に4スートそろいがないとき
 */
export function createAllSuitsTrack(allSuits, geometry, t) {
  const place = geometry.allSuits;
  if (place === null || place === undefined) throw new Error('createAllSuitsTrack: 配置に allSuits がない');
  const orbs = allSuits.parts.map((part, k) => {
    const flyStart = t + ANIM_TIMING.allSuitsHoldMs + k * ANIM_TIMING.allSuitsFlyStaggerMs;
    const arriveAt = flyStart + ANIM_TIMING.orbFlyMs;
    return {
      suit: part.suit,
      gauge: part.gauge,
      amount: allSuits.amount,
      start: place.starts[k],
      target: place.targets[k],
      showAt: t,
      flyStart,
      arriveAt,
      burstEnd: arriveAt + ANIM_TIMING.orbBurstMs,
    };
  });
  const label = {
    x: place.label.x,
    y: place.label.y,
    maxW: place.label.maxW,
    suitCount: allSuits.parts.length,
    amount: allSuits.amount,
    showAt: t,
    hideAt: t + ANIM_TIMING.allSuitsLabelMs,
  };
  const endTime = orbs.reduce((m, o) => Math.max(m, o.burstEnd), label.hideAt);
  return {
    label,
    orbs,
    smallSize: geometry.smallSize,
    burstSize: geometry.smallBurstSize,
    arcRise: geometry.arcRise,
    endTime,
  };
}

/**
 * 時計から見た目を求め、out の各配列へ push する。
 * @param {AllSuitsTrack} track 記録
 * @param {number} clock 時計の値
 * @param {{orbs: import('./orbTrack.js').OrbLook[], labels: AllSuitsLabelLook[]}} out 書き込み先
 * @returns {void}
 */
export function sampleAllSuits(track, clock, out) {
  const label = track.label;
  if (clock >= label.showAt && clock < label.hideAt) {
    const fadeStart = label.hideAt - ANIM_TIMING.allSuitsFadeMs;
    out.labels.push({
      suitCount: label.suitCount,
      amount: label.amount,
      x: label.x,
      y: label.y,
      maxW: label.maxW,
      scale: easeOutBack(progress(clock, label.showAt, ANIM_TIMING.allSuitsAppearMs)),
      alpha: 1 - progress(clock, fadeStart, ANIM_TIMING.allSuitsFadeMs),
    });
  }
  for (const o of track.orbs) {
    if (clock < o.showAt || clock >= o.burstEnd) continue;
    if (clock < o.flyStart) {
      const size = lerp(0, track.smallSize, progress(clock, o.showAt, ANIM_TIMING.allSuitsAppearMs));
      out.orbs.push({ suit: o.suit, x: o.start.x, y: o.start.y, size, alpha: 1 });
    } else if (clock < o.arriveAt) {
      const p = flyPoint(o.start, o.target, track.arcRise, progress(clock, o.flyStart, ANIM_TIMING.orbFlyMs));
      out.orbs.push({ suit: o.suit, x: p.x, y: p.y, size: track.smallSize, alpha: 1 });
    } else {
      const p = progress(clock, o.arriveAt, ANIM_TIMING.orbBurstMs);
      out.orbs.push({ suit: o.suit, x: o.target.x, y: o.target.y, size: lerp(track.smallSize, track.burstSize, p), alpha: 1 - p });
    }
  }
}
