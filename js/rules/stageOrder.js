/** ステージの番号と種から、そのステージの★・同じ★の中の何番目か・敵の種類を決める純粋関数（乱数は呼ばない）。 */
import { enemyMotionsOfStar } from './enemyTypes.js';
import { motionIndexAt } from './motionOrder.js';
import { seededIndex, STREAM } from './seededIndex.js';

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
 * 最大公約数。
 * @param {number} a 正の整数。
 * @param {number} b 正の整数。
 * @returns {number} 最大公約数。
 */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * そのステージが、同じ★のステージの中で何番目か（0 から）を求める。
 * 倍数の最小公倍数を周期とし、周期の中の数と端の数から求める（前のステージの敵は計算しない）。
 * @param {{base: number, multiples: readonly {of: number, star: number}[]}} stageStars ★の決まり。
 * @param {number} stageNumber ステージの番号（1 以上の整数）。
 * @returns {number} 同じ★の中での番号（0 以上の整数）。
 */
export function starPositionOfStage(stageStars, stageNumber) {
  const star = starOfStage(stageStars, stageNumber);
  const period = stageStars.multiples.reduce((p, m) => (p * m.of) / gcd(p, m.of), 1);
  let perPeriod = 0;
  let upToEdge = 0;
  const edge = ((stageNumber - 1) % period) + 1;
  for (let n = 1; n <= period; n++) {
    if (starOfStage(stageStars, n) !== star) continue;
    perPeriod++;
    if (n <= edge) upToEdge++;
  }
  return Math.floor((stageNumber - 1) / period) * perPeriod + upToEdge - 1;
}

/**
 * 種とステージの番号から、そのステージの敵の種類の識別子を決める。
 * 動きが2つ以上ある★では、動きは同じ★の中で隣り合わない（動きが1つの★では、同じ動きの敵が続く）。同じ動きの中の敵は番号から選ぶ。
 * @param {{enemies: Readonly<Object<string, {star: number, behavior: {type: string}}>>, stageStars: object}} config ルールの設定。
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
  const motions = enemyMotionsOfStar(config, star);
  if (motions.length === 0) {
    throw new Error(`enemyTypeIdOfStage: ★${star} の敵がいません`);
  }
  const position = starPositionOfStage(config.stageStars, stageNumber);
  const members = motions[motionIndexAt(seed, position, motions.length)];
  return members[seededIndex(seed, STREAM.member, stageNumber, members.length)];
}
