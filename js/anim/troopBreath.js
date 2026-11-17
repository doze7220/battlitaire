/**
 * 段取りの間・攻防の間に陣地の家で待っている自軍の兵の呼吸の伸び縮み（兵ごとの位相は番号から。乱数なし）を求める。
 * 描画も状態の変更もしない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { OWN_KINDS } from './troopRoster.js';

/**
 * 黄金比の小数部（兵ごとの位相のばらけに使う）。
 * @type {number}
 */
const GOLDEN = 0.6180339887;

/**
 * 種類ごとの位相のずれ（周期に対する割合）。
 * @type {Readonly<Record<string, number>>}
 */
const KIND_PHASE = Object.freeze({ attack: 0, defense: 1 / 3, heal: 2 / 3 });

/**
 * 小数部を返す。
 * @param {number} v 値
 * @returns {number} v − floor(v)
 */
function frac(v) {
  return v - Math.floor(v);
}

/**
 * 自軍の兵1体の呼吸の伸び縮みを `out` に書き込む（オブジェクトを作らない）。自軍以外の種類は 1・1。
 * @param {string} kind 兵の種類
 * @param {number} index 種類の中の何番目か
 * @param {number} clock 時計の値（ms）
 * @param {{scaleX: number, scaleY: number}} out 書き込み先
 * @returns {void}
 */
export function breathScale(kind, index, clock, out) {
  if (!OWN_KINDS.includes(kind)) {
    out.scaleX = 1;
    out.scaleY = 1;
    return;
  }
  const phase = 2 * Math.PI * frac(index * GOLDEN + KIND_PHASE[kind]);
  const s = BATTLE_ANIM.breathDepth * Math.sin((2 * Math.PI * clock) / BATTLE_ANIM.breathPeriodMs + phase);
  out.scaleY = 1 + s;
  out.scaleX = 1 - s / 2;
}
