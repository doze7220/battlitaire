/** ステージの番号と種から、そのステージの★と敵の種類を決める純粋関数（乱数は呼ばない）。 */
import { enemyTypeIdsOfStar } from './enemyTypes.js';

/**
 * 32 ビット整数の混ぜ合わせ（混ぜ合わせの定数であり、ルールの数値ではない）。
 * @param {number} v 入力の整数。
 * @returns {number} 0 以上 2^32 未満の整数。
 */
function mix32(v) {
  let h = v >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * 種とステージの番号から、0 以上 count 未満の整数を決める（前のステージを順に計算しない）。
 * @param {number} seed 種（整数）。
 * @param {number} stageNumber ステージの番号。
 * @param {number} count 候補の数。
 * @returns {number} 0 以上 count 未満の整数。
 */
export function seededIndex(seed, stageNumber, count) {
  const h = mix32(mix32(seed ^ 0x9e3779b9) + Math.imul(stageNumber, 0x9e3779b1));
  return Math.floor((h / 0x100000000) * count);
}

/**
 * ステージの番号から★を決める。
 * @param {{base: number, multiples: readonly {of: number, star: number}[]}} stageStars ★の決まり。
 * @param {number} stageNumber ステージの番号（1 以上の整数）。
 * @returns {number} ★。
 */
export function starOfStage(stageStars, stageNumber) {
  for (const m of stageStars.multiples) {
    if (stageNumber % m.of === 0) return m.star;
  }
  return stageStars.base;
}

/**
 * 種とステージの番号から、そのステージの敵の種類の識別子を決める。
 * @param {{enemies: Readonly<Object<string, {star: number}>>, stageStars: object}} config ルールの設定。
 * @param {number} seed 種（整数）。
 * @param {number} stageNumber ステージの番号（1 以上の整数）。
 * @returns {string} 敵の種類の識別子。
 * @throws {Error} stageNumber が 1 以上の整数でないとき、またはその★の敵がないとき。
 */
export function enemyTypeIdOfStage(config, seed, stageNumber) {
  if (!Number.isInteger(stageNumber) || stageNumber < 1) {
    throw new Error(`enemyTypeIdOfStage: ステージの番号は 1 以上の整数です: ${stageNumber}`);
  }
  const star = starOfStage(config.stageStars, stageNumber);
  const candidates = enemyTypeIdsOfStar(config, star);
  if (candidates.length === 0) {
    throw new Error(`enemyTypeIdOfStage: ★${star} の敵がいません`);
  }
  return candidates[seededIndex(seed, stageNumber, candidates.length)];
}
