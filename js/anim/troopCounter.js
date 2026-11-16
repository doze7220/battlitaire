/**
 * 役割ごとの兵の人数の表示値（最初の人数 − 時計までに消え始めた数）を、時計から求める。
 * 減る時刻の並びは攻防の始めに1回だけ作り、毎回の問い合わせは二分探索で答える。
 */

/**
 * 人数の表示値の元。
 * @typedef {Object} TroopCounter
 * @property {Object<string, number>} initial 役割ごとの最初の人数
 * @property {Object<string, number[]>} times 役割ごとの1減る時刻（昇順）
 */

/**
 * 人数の表示値の元を作る（渡された時刻の並びは写して持つ）。
 * @param {Array<{ role: string, initial: number, times: number[] }>} entries 役割ごとの最初の人数と1減る時刻
 * @returns {TroopCounter} 人数の表示値の元
 */
export function createTroopCounter(entries) {
  const initial = {};
  const times = {};
  for (const e of entries) {
    initial[e.role] = e.initial;
    times[e.role] = e.times.slice().sort((a, b) => a - b);
  }
  return { initial, times };
}

/**
 * 時計の値での役割ごとの人数を求める。
 * @param {TroopCounter} counter 人数の表示値の元
 * @param {number} clock 時計の値（ms）
 * @returns {Object<string, number>} 役割 → 人数
 */
export function sampleTroopCounts(counter, clock) {
  const counts = {};
  for (const role of Object.keys(counter.initial)) {
    const arr = counter.times[role];
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= clock) lo = mid + 1;
      else hi = mid;
    }
    counts[role] = counter.initial[role] - lo;
  }
  return counts;
}
