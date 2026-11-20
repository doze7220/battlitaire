/**
 * 兵1体ごとの動きのずれ（動き出しのずれの割合・動きの長さの倍率）を、種類と種類の中の番号から決める純粋関数を持つ。
 * 乱数は使わず、同じ種類と番号から必ず同じ値を返す。
 */

/**
 * 動き出しのずれの列の増分（黄金比の小数部分）。家の位置の列（campSlots.js）とそろわない値。
 * @type {number}
 */
const START_STEP = 0.6180339887498949;

/**
 * 動きの長さの列の増分（√2 の小数部分）。家の位置の列・動き出しの列とそろわない値。
 * @type {number}
 */
const SPEED_STEP = 0.41421356237309515;

/**
 * ずれを入れる種類 → 列の始めのずらし。同じ番号の違う種類の兵がそろわないようにする。
 * 表にない種類（goblin・shield・flame・figure）にはずれを入れない。
 * @type {Readonly<Record<string, number>>}
 */
const KIND_PHASES = Object.freeze({
  attack: 0,
  defense: 0.2,
  heal: 0.4,
  enemy: 0.6,
  enemyGuard: 0.8,
});

/**
 * 小数部分を返す（0 以上 1 未満）。
 * @param {number} v 値。
 * @returns {number} v の小数部分。
 */
function frac(v) {
  return v - Math.floor(v);
}

/**
 * 兵1体の動き出しのずれの割合を返す。
 * @param {string} kind 兵の種類。
 * @param {number} index 種類の中の番号。
 * @returns {number} 0 以上 1 未満の割合。表にない種類は 0。
 */
export function startJitter(kind, index) {
  if (!Object.prototype.hasOwnProperty.call(KIND_PHASES, kind)) return 0;
  return frac(KIND_PHASES[kind] + index * START_STEP);
}

/**
 * 兵1体の動きの長さの倍率を返す。
 * @param {string} kind 兵の種類。
 * @param {number} index 種類の中の番号。
 * @param {number} spread ばらつきの幅（割合。0.15 なら 0.85〜1.15 倍）。
 * @returns {number} `1 - spread` 以上 `1 + spread` 未満の倍率。表にない種類は 1。
 */
export function durationScale(kind, index, spread) {
  if (!Object.prototype.hasOwnProperty.call(KIND_PHASES, kind)) return 1;
  return 1 + spread * (2 * frac(KIND_PHASES[kind] + 0.5 + index * SPEED_STEP) - 1);
}
