/**
 * 数字の浮き出し（敵の回復の量など）1つの記録（量と時刻ごとの濃さ）と、時計からの見た目を求める純粋な関数。
 * 描画も状態の変更も行わない。
 */

import { clamp01, lerp } from './easing.js';

/**
 * 浮き出しの記録の1点。
 * @typedef {Object} PopKey
 * @property {number} time 時刻（ms）
 * @property {number} alpha 濃さ（0〜1）
 */

/**
 * 数字の浮き出し1つの記録。
 * @typedef {Object} PopTrack
 * @property {number} amount 出す量
 * @property {PopKey[]} keys 点（time の昇順）
 */

/**
 * 浮き出しの記録を作る。
 * @param {number} amount 出す量
 * @param {PopKey[]} keys 点（time の昇順。写して持つ）
 * @returns {PopTrack} 記録
 */
export function createPopTrack(amount, keys) {
  return { amount, keys: keys.map((k) => ({ time: k.time, alpha: k.alpha })) };
}

/**
 * 記録の最後の点の時刻を返す。
 * @param {PopTrack} track 記録
 * @returns {number} 最後の点の時刻（ms）。点がなければ 0
 */
export function popTrackEnd(track) {
  const n = track.keys.length;
  return n === 0 ? 0 : track.keys[n - 1].time;
}

/**
 * 時計での見た目を求める。点の間は濃さを直線で補間し、最後の点より後は最後の濃さのまま。
 * @param {PopTrack} track 記録
 * @param {number} clock 演出の時計（ms）
 * @returns {{amount: number, alpha: number}|null} 見た目。最初の点より前・濃さが 0 以下・点がないときは null
 */
export function samplePopTrack(track, clock) {
  const keys = track.keys;
  if (keys.length === 0 || clock < keys[0].time) return null;
  let alpha = keys[keys.length - 1].alpha;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (clock < b.time) {
      const span = b.time - a.time;
      alpha = span <= 0 ? b.alpha : lerp(a.alpha, b.alpha, clamp01((clock - a.time) / span));
      break;
    }
  }
  if (alpha <= 0) return null;
  return { amount: track.amount, alpha };
}
