/**
 * 責務: ポイントの量を、1体が受け持つポイント（unit）ごとの体の並び・体の数・傷ついているかに割り振る。
 * 何も import しない、時間で進まない純粋関数（anim・scenes からも使う）。1体1ポイント（unit 1）では全部 1 になる。
 */

/**
 * ポイントの量を、体ごとのポイントの並びにする（前＝最初に当たる体から）。
 * 体の数は `Math.ceil(total / unit)`。端数の体（`total − (体の数 − 1) × unit`。端数がなければ unit）を先頭（前）にし、残りは unit。
 * unit 1 では全部 1。total が 0 以下なら空。
 * @param {number} total ポイントの量（整数）。
 * @param {number} unit 1体のポイント（1 以上の整数）。
 * @returns {number[]} 体ごとのポイント（前から）。
 */
export function splitPoints(total, unit) {
  const count = bodyCount(total, unit);
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push(i === 0 ? total - (count - 1) * unit : unit);
  }
  return points;
}

/**
 * 体の数（`splitPoints(total, unit).length` と同じ値。並びは作らない）。
 * @param {number} total ポイントの量（整数）。
 * @param {number} unit 1体のポイント（1 以上の整数）。
 * @returns {number} 体の数（total が 0 以下なら 0）。
 */
export function bodyCount(total, unit) {
  return total > 0 ? Math.ceil(total / unit) : 0;
}

/**
 * 傷ついた体か（1体のポイントより少ない体）。unit 1 では常に偽。
 * @param {number} points その体のポイント。
 * @param {number} unit 1体のポイント（1 以上の整数）。
 * @returns {boolean} 傷ついていれば真。
 */
export function isWoundedBody(points, unit) {
  return points < unit;
}
