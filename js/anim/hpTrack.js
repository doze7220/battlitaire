/**
 * HP の表示値の変わり方（変化の記録と、時計からの整数の表示値）を求める。
 * 描画も状態の変更も行わない純粋な関数だけを持つ。
 */

/**
 * HP の表示値の1回の変化。
 * @typedef {Object} HpChange
 * @property {number} from 変化の前の表示値
 * @property {number} to 変化の後の表示値
 * @property {number} start 変化を始める時刻（ms）
 * @property {number} duration 変化にかける時間（ms）
 */

/**
 * HP の変化を作る。
 * @param {{from: number, to: number, start: number, duration: number}} params 変化の内容
 * @returns {HpChange} 変化
 */
export function createHpChange({ from, to, start, duration }) {
  return { from, to, start, duration };
}

/**
 * 変化が終わる時刻を返す。
 * @param {HpChange} change 変化
 * @returns {number} start + duration（ms）
 */
export function hpChangeEnd(change) {
  return change.start + change.duration;
}

/**
 * 時計の値での HP の表示値を求める。変化を順に見て、始まっているものを反映する。
 * 途中の値は 0 の向きに切るので、to が先に出ることはない。
 * @param {number} initial 最初の表示値
 * @param {HpChange[]} changes 変化（時刻の順）
 * @param {number} clock 時計（ms）
 * @returns {number} 整数の表示値
 */
export function sampleHp(initial, changes, clock) {
  let value = initial;
  for (const change of changes) {
    if (change.start > clock) continue;
    if (change.duration <= 0 || clock >= change.start + change.duration) {
      value = change.to;
    } else {
      value = change.from + Math.trunc(((change.to - change.from) * (clock - change.start)) / change.duration);
    }
  }
  return value;
}
