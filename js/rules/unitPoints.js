/**
 * 責務: 1体が受け持つポイント（unitPoints。書かなければ 1）を設定から引くことと、量を1体のポイントの倍数に切り捨てる計算（純粋関数。ルール層）。
 * 何も import しない。敵・兵のどちらにも使えるよう名前に「敵」を入れない。
 */

/**
 * 設定の1体のポイントを引く。
 * @param {{ unitPoints?: number }} spec 敵の種類の設定（`unitPoints` は任意）
 * @returns {number} `spec.unitPoints` が 1 以上の整数ならその値、なければ 1
 */
export function unitPointsOf(spec) {
  const value = spec.unitPoints;
  return Number.isInteger(value) && value >= 1 ? value : 1;
}

/**
 * 量を1体のポイントの倍数に切り捨てる（unit 1 では整数をそのまま返す）。
 * @param {number} value 量（0 以上）
 * @param {number} unit 1体のポイント（1 以上の整数）
 * @returns {number} `Math.floor(value / unit) * unit`
 */
export function floorToUnit(value, unit) {
  return Math.floor(value / unit) * unit;
}
