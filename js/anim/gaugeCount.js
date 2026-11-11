/**
 * ゲージの数字の数え上げ（整数の表示値）を、時計の値から求める。
 * 時間は持たず進めない。描画も状態の変更も行わない。
 */

import { clamp01 } from './easing.js';

/**
 * ゲージの数え上げ。
 * @typedef {Object} GaugeCount
 * @property {string} gauge ゲージの識別子
 * @property {number} from 始めの値
 * @property {number} to 終わりの値
 * @property {number} delay 開始の遅れ（ms）
 * @property {number} duration かかる時間（ms）
 */

/**
 * ゲージの数え上げを作る。
 * @param {{gauge: string, from: number, to: number, delay: number, duration: number}} params 数え上げの内容
 * @returns {GaugeCount} 数え上げ
 */
export function createGaugeCount({ gauge, from, to, delay, duration }) {
  return { gauge, from, to, delay, duration };
}

/**
 * 時計の値から、表示する整数を求める（線形）。
 * @param {GaugeCount} count 数え上げ
 * @param {number} clock 動きの時計の値（ms）
 * @returns {number} 表示する整数
 */
export function sampleGaugeCount(count, clock) {
  const { from, to, delay, duration } = count;
  const t = duration > 0 ? clamp01((clock - delay) / duration) : clock >= delay ? 1 : 0;
  if (t >= 1) return to;
  return from + Math.floor((to - from) * t);
}

/**
 * 数え上げが終わる時刻を求める。
 * @param {GaugeCount} count 数え上げ
 * @returns {number} 終わりの時刻（ms）。delay + duration
 */
export function gaugeCountEnd(count) {
  return count.delay + count.duration;
}
