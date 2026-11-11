/**
 * 補間（0〜1 への丸め・線形補間・イージング）の純粋関数を持つ。
 * 描画も状態の変更も行わない。
 */

/**
 * 値を 0〜1 の範囲に丸める。
 * @param {number} t 値
 * @returns {number} 0 未満は 0、1 超は 1、それ以外はそのまま
 */
export function clamp01(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * 線形補間。
 * @param {number} a t=0 のときの値
 * @param {number} b t=1 のときの値
 * @param {number} t 進み具合（丸めない）
 * @returns {number} a から b への補間値
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 出だしが速く、終わりで減速するイージング。
 * @param {number} t 進み具合（0〜1）
 * @returns {number} イージング後の進み具合（0〜1）
 */
export function easeOutCubic(t) {
  const u = 1 - t;
  return 1 - u * u * u;
}
