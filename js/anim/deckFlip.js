/**
 * 山札の一番上のカードの、裏から表へのめくれ（横幅の比率と表裏）を、時計の値から求める。
 * 時間は持たず進めない。描画も状態の変更も行わない。
 */

import { clamp01 } from './easing.js';

/**
 * 山札のめくれ。
 * @typedef {Object} DeckFlip
 * @property {number} deckIndex 山札の番号
 * @property {number} delay 開始の遅れ（ms）
 * @property {number} duration かかる時間（ms）
 */

/**
 * めくれのサンプル結果。
 * @typedef {Object} DeckFlipSample
 * @property {number} scaleX 横幅の比率（0〜1）
 * @property {boolean} faceUp 表を向いているか
 */

/**
 * 山札のめくれを作る。
 * @param {{deckIndex: number, delay: number, duration: number}} params めくれの内容
 * @returns {DeckFlip} めくれ
 */
export function createDeckFlip({ deckIndex, delay, duration }) {
  return { deckIndex, delay, duration };
}

/**
 * 時計の値から、めくれの見た目を求める。
 * @param {DeckFlip} flip めくれ
 * @param {number} clock 動きの時計の値（ms）
 * @returns {DeckFlipSample|null} 見た目。終わっていれば null（普通の表の描画に戻る）
 */
export function sampleDeckFlip(flip, clock) {
  const { delay, duration } = flip;
  if (clock >= delay + duration) return null;
  if (clock < delay) return { scaleX: 1, faceUp: false };
  const t = clamp01((clock - delay) / duration);
  if (t < 0.5) return { scaleX: 1 - 2 * t, faceUp: false };
  return { scaleX: 2 * t - 1, faceUp: true };
}

/**
 * めくれが終わる時刻を求める。
 * @param {DeckFlip} flip めくれ
 * @returns {number} 終わりの時刻（ms）。delay + duration
 */
export function deckFlipEnd(flip) {
  return flip.delay + flip.duration;
}
