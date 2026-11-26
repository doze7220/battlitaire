/**
 * 役割ごとの兵のポイントの表示値（最初のポイント − 時計までに減ったポイント）と、その上振れ（ポイント − 人数）を、時計から求める。
 * 減る時刻と量の並びは攻防の始めに1回だけ作り、毎回の問い合わせは二分探索で答える。
 */

/**
 * 人数の表示値の元。
 * @typedef {Object} TroopCounter
 * @property {Object<string, number>} initial 役割ごとの最初のポイント（ゲージの値 = 人数 + 上振れ）
 * @property {Object<string, number>} heads 役割ごとの最初の人数
 * @property {Object<string, number[]>} dropTimes 役割ごとのポイントが減る時刻（昇順）
 * @property {Object<string, number[]>} dropTotals 役割ごとの、dropTimes の k 番目までに減ったポイントの累積（長さは dropTimes と同じ）
 * @property {Object<string, number[]>} endTimes 役割ごとの1人減る時刻（昇順）
 */

/**
 * 人数の表示値の元を作る（渡された並びは写して持つ。時刻の昇順と累積はここで1回だけ作る）。
 * @param {Array<{ role: string, initial: number, heads: number, drops: Array<{ time: number, points: number }>, ends: number[] }>} entries
 *   役割ごとの最初のポイント（人数 + 上振れ）・最初の人数・ポイントが減る時刻と量・1人減る時刻
 * @returns {TroopCounter} 人数の表示値の元
 */
export function createTroopCounter(entries) {
  const initial = {};
  const heads = {};
  const dropTimes = {};
  const dropTotals = {};
  const endTimes = {};
  for (const e of entries) {
    initial[e.role] = e.initial;
    heads[e.role] = e.heads;
    const sorted = e.drops.slice().sort((a, b) => a.time - b.time);
    dropTimes[e.role] = sorted.map((d) => d.time);
    let sum = 0;
    dropTotals[e.role] = sorted.map((d) => (sum += d.points));
    endTimes[e.role] = e.ends.slice().sort((a, b) => a - b);
  }
  return { initial, heads, dropTimes, dropTotals, endTimes };
}

/**
 * 昇順の並びのうち clock 以下の数（二分探索）。
 * @param {number[]} arr 昇順の並び
 * @param {number} clock 時計の値（ms）
 * @returns {number} arr[i] <= clock となる要素の数
 */
function countUpTo(arr, clock) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= clock) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * 時計の値での役割ごとのポイント（人数 + 上振れ。精鋭がいなければ人数）を求める。
 * @param {TroopCounter} counter 人数の表示値の元
 * @param {number} clock 時計の値（ms）
 * @returns {Object<string, number>} 役割 → ポイント
 */
export function sampleTroopCounts(counter, clock) {
  const counts = {};
  for (const role of Object.keys(counter.initial)) {
    const n = countUpTo(counter.dropTimes[role], clock);
    counts[role] = counter.initial[role] - (n > 0 ? counter.dropTotals[role][n - 1] : 0);
  }
  return counts;
}

/**
 * 時計の値での役割ごとの上振れ（ポイント − 人数。0 未満にならない）を求める。
 * @param {TroopCounter} counter 人数の表示値の元
 * @param {number} clock 時計の値（ms）
 * @returns {Object<string, number>} 役割 → 上振れ
 */
export function sampleTroopExtras(counter, clock) {
  const points = sampleTroopCounts(counter, clock);
  const extras = {};
  for (const role of Object.keys(points)) {
    const people = counter.heads[role] - countUpTo(counter.endTimes[role], clock);
    extras[role] = Math.max(0, points[role] - people);
  }
  return extras;
}
