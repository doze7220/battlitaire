/** 種と★の抽選の決まりから、ステージ 1 から順に★を抽選し、各ステージの★と同じ★の中の何番目かを答える。乱数は呼ばず日付も読まない。
 * 求めた並びを1つだけ覚えて先へ伸ばすが、これは計算結果の写し（キャッシュ）でゲームの状態ではない。
 * 答えは引数（決まり・種・番号）だけで決まり、覚え方（呼ぶ順・回数）で変わらない（描く中から呼ばれて写しが伸びてもよい）。 */
import { seededIndex, STREAM } from './seededIndex.js';

/**
 * 百分率の分母（100% で頭打ち。ルールの調整値ではない単位の定数）。
 * 確率も抽選の値も整数どうしで比べ、浮動小数の誤差で並びが変わらないようにする。
 * @type {number}
 */
export const PERCENT = 100;

/**
 * 覚えた並び（計算結果の写し）。外へは渡さない。
 * @typedef {Object} StarMemo
 * @property {string} key 種と決まりの値（base・draws の star・risePercent・resetBy）をつないだ鍵。
 * @property {number} seed 求めた種。
 * @property {number[]} stars 添字 n − 1 にステージ n の★。
 * @property {number[]} positions 添字 n − 1 にステージ n の「同じ★の中の何番目か」（0 から）。
 * @property {number[]} steps 抽選ごとの「戻ってからのステージ数」（次に求めるステージの分）。
 * @property {Map<number, number>} counts ★ごとの、ここまでに出た数。
 */

/**
 * 覚えておく並び（1つだけ）。更新しても答えは引数だけで決まり変わらないので、ゲームの状態ではない。
 * @type {StarMemo | null}
 */
let memo = null;

/**
 * 種と決まりの値から、覚えた並びの鍵を作る。呼ぶたびに今の値から作る。
 * @param {import('./config.js').StageStarsSpec} stageStars ★の抽選の決まり。
 * @param {number} seed 種（整数）。
 * @returns {string} 鍵（`first` は答えに関わらないので含めない）。
 */
function memoKey(stageStars, seed) {
  const draws = stageStars.draws.map((d) => `${d.star}:${d.risePercent}:${d.resetBy.join('.')}`).join('|');
  return `${seed}/${stageStars.base}/${draws}`;
}

/**
 * 覚えた並びを、ステージ upTo まで伸ばす。
 * ステージ n は、draws を書いた順に確率 min(PERCENT, risePercent × 戻ってからのステージ数) で抽選し、
 * 最初に当たった★にする（`seededIndex(seed, STREAM.star, (n − 1) × draws の数 + i, PERCENT) < 確率`）。
 * どれも外れたら base。抽選の後、出た★が resetBy に入っている抽選は戻り、ほかは 1 増える。
 * ゲームの始まりは全部が戻った直後（steps が全部 0）とみなす。
 * @param {StarMemo} m 伸ばす並び（この関数が写しを更新する）。
 * @param {import('./config.js').StageStarsSpec} stageStars ★の抽選の決まり。
 * @param {number} upTo 求めるステージの番号（1 以上の整数）。
 * @returns {void}
 */
function extend(m, stageStars, upTo) {
  const { base, draws } = stageStars;
  while (m.stars.length < upTo) {
    const n = m.stars.length + 1;
    let star = base;
    for (let i = 0; i < draws.length; i += 1) {
      const chance = Math.min(PERCENT, draws[i].risePercent * m.steps[i]);
      if (seededIndex(m.seed, STREAM.star, (n - 1) * draws.length + i, PERCENT) < chance) {
        star = draws[i].star;
        break;
      }
    }
    for (let i = 0; i < draws.length; i += 1) {
      m.steps[i] = draws[i].resetBy.includes(star) ? 0 : m.steps[i] + 1;
    }
    const before = m.counts.get(star) ?? 0;
    m.stars.push(star);
    m.positions.push(before);
    m.counts.set(star, before + 1);
  }
}

/**
 * ステージの★と、同じ★の中の何番目か（0 から。間に別の★を挟んでも続けて数える）を答える。
 * 同じ種・決まりの値・番号には、いつ・どの順で呼んでも同じ答えを返す（覚えた並びは計算結果の写しで、外へ渡さない）。
 * 鍵（種と決まりの値）が覚えた並びと違えばステージ 1 から求め直し、足りなければ続きから伸ばす。
 * @param {import('./config.js').StageStarsSpec} stageStars ★の抽選の決まり。
 * @param {number} seed 種（整数。日付から作った値）。
 * @param {number} stageNumber ステージの番号（1 以上の整数）。
 * @returns {{star: number, position: number}} ステージの★と、同じ★の中の何番目か。
 * @throws {Error} stageNumber が 1 以上の整数でないとき。
 */
export function starDrawAt(stageStars, seed, stageNumber) {
  if (!Number.isInteger(stageNumber) || stageNumber < 1) {
    throw new Error(`ステージの番号は 1 以上の整数: ${stageNumber}`);
  }
  const key = memoKey(stageStars, seed);
  if (memo === null || memo.key !== key) {
    memo = {
      key,
      seed,
      stars: [],
      positions: [],
      steps: stageStars.draws.map(() => 0),
      counts: new Map(),
    };
  }
  extend(memo, stageStars, stageNumber);
  return { star: memo.stars[stageNumber - 1], position: memo.positions[stageNumber - 1] };
}
