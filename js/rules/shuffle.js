/** 渡された乱数の関数を使って配列を混ぜる（Fisher–Yates）。 */

/**
 * 配列をその場で Fisher–Yates で混ぜ、同じ配列を返す。
 * @template T
 * @param {T[]} array 混ぜる配列（この配列自体が書き換わる）。
 * @param {() => number} random `[0, 1)` の値を返す乱数の関数。
 * @returns {T[]} 渡された配列（混ぜ済み）。
 */
export function shuffle(array, random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}
