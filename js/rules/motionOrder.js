/** 種と「同じ★の何番目か」から、動きの番号を決める純粋関数（隣り合う動きが続かない並びを、前を順に計算せず求める）。 */
import { seededIndex, STREAM } from './seededIndex.js';

/**
 * 組 b の最後の動きを決める。動きが 2 つのときは種だけで決まる一定の値（交互になる）。
 * @param {number} seed 種。
 * @param {number} b 組の番号（0 以上）。
 * @param {number} motionCount 動きの数（2 以上）。
 * @returns {number} 動きの番号。
 */
function lastOfGroup(seed, b, motionCount) {
  return seededIndex(seed, STREAM.last, motionCount >= 3 ? b : 0, motionCount);
}

/**
 * 組 b の最初の動きを決める。組の最後と、前の組の最後を除いた候補から選ぶ。
 * @param {number} seed 種。
 * @param {number} b 組の番号（0 以上）。
 * @param {number} motionCount 動きの数（2 以上）。
 * @returns {number} 動きの番号。
 */
function firstOfGroup(seed, b, motionCount) {
  const last = lastOfGroup(seed, b, motionCount);
  const prevLast = b > 0 ? lastOfGroup(seed, b - 1, motionCount) : -1;
  const candidates = [];
  for (let i = 0; i < motionCount; i++) {
    if (i !== last && i !== prevLast) candidates.push(i);
  }
  return candidates[seededIndex(seed, STREAM.first, b, candidates.length)];
}

/**
 * 種と「同じ★の何番目か」から、動きの番号を決める。
 * 動きの数 M ずつの組に分け、組の中は M 個が1回ずつ、組の境目でも同じ動きが続かない。
 * @param {number} seed 種（整数）。
 * @param {number} position 同じ★の中の何番目か（0 以上の整数）。
 * @param {number} motionCount 動きの数（1 以上の整数）。
 * @returns {number} 0 以上 motionCount 未満の動きの番号。
 */
export function motionIndexAt(seed, position, motionCount) {
  if (motionCount <= 1) return 0;
  const b = Math.floor(position / motionCount);
  const s = position % motionCount;
  const first = firstOfGroup(seed, b, motionCount);
  if (s === 0) return first;
  const last = lastOfGroup(seed, b, motionCount);
  if (s === motionCount - 1) return last;
  // 残りを並べ替えて真ん中に置く（Fisher-Yates。番号は組と手順から決める）。
  const middle = [];
  for (let i = 0; i < motionCount; i++) {
    if (i !== first && i !== last) middle.push(i);
  }
  for (let i = middle.length - 1; i > 0; i--) {
    const j = seededIndex(seed, STREAM.middle, b * motionCount + i, i + 1);
    const tmp = middle[i];
    middle[i] = middle[j];
    middle[j] = tmp;
  }
  return middle[s - 1];
}
