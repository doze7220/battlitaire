/**
 * カード1枚の、元の矩形から先の矩形への移動（遅れ・時間・着いたか）を、時計の値から求める。
 * 時間は持たず進めない。描画も状態の変更も行わない。
 */

import { clamp01, lerp, easeOutCubic } from './easing.js';

/**
 * @typedef {{x: number, y: number, w: number, h: number}} Rect 矩形。
 */

/**
 * カード1枚の移動。
 * @typedef {Object} CardTween
 * @property {*} card 動かすカード
 * @property {Rect} from 元の矩形
 * @property {Rect} to 先の矩形
 * @property {number} delay 開始の遅れ（ms）
 * @property {number} duration かかる時間（ms）
 * @property {'column'|'hand'|'discard'} dest 先の種類
 */

/**
 * 移動のサンプル結果。
 * @typedef {Object} CardTweenSample
 * @property {number} x 現在の x
 * @property {number} y 現在の y
 * @property {number} w 現在の幅
 * @property {number} h 現在の高さ
 * @property {boolean} arrived 着いたか
 */

/**
 * カード1枚の移動を作る。
 * @param {{card: *, from: Rect, to: Rect, delay: number, duration: number, dest: 'column'|'hand'|'discard'}} params 移動の内容
 * @returns {CardTween} 移動
 */
export function createCardTween({ card, from, to, delay, duration, dest }) {
  return { card, from, to, delay, duration, dest };
}

/**
 * 時計の値から、移動の見た目を求める。
 * @param {CardTween} tween 移動
 * @param {number} clock 動きの時計の値（ms）
 * @returns {CardTweenSample} 位置・大きさと、着いたか
 */
export function sampleCardTween(tween, clock) {
  const { from, to, delay, duration } = tween;
  const arrived = clock >= delay + duration;
  const raw = duration > 0 ? (clock - delay) / duration : clock >= delay ? 1 : 0;
  const e = easeOutCubic(clamp01(raw));
  return {
    x: lerp(from.x, to.x, e),
    y: lerp(from.y, to.y, e),
    w: lerp(from.w, to.w, e),
    h: lerp(from.h, to.h, e),
    arrived,
  };
}

/**
 * 移動が終わる時刻を求める。
 * @param {CardTween} tween 移動
 * @returns {number} 終わりの時刻（ms）。delay + duration
 */
export function cardTweenEnd(tween) {
  return tween.delay + tween.duration;
}
