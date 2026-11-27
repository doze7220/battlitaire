/** 種・用途の鍵・番号から、0 以上 count 未満の整数を決める純粋関数（前の番号を順に計算せず、乱数も呼ばない）。 */

/**
 * 用途の鍵の表（混ぜ合わせの値であり、ルールの数値ではない）。用途ごとに別の列にするために混ぜる。
 * @type {Readonly<{member: number, last: number, first: number, middle: number, star: number, bagLast: number, bagFirst: number, bagMiddle: number}>}
 */
export const STREAM = Object.freeze({
  member: 1,
  last: 2,
  first: 3,
  middle: 4,
  star: 5,
  bagLast: 6,
  bagFirst: 7,
  bagMiddle: 8,
});

/**
 * 32 ビット整数の混ぜ合わせ（混ぜ合わせの定数であり、ルールの数値ではない）。
 * @param {number} v 入力の整数。
 * @returns {number} 0 以上 2^32 未満の整数。
 */
function mix32(v) {
  let h = v >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * 種・用途の鍵・番号から、0 以上 count 未満の整数を決める。
 * @param {number} seed 種（整数）。
 * @param {number} stream 用途の鍵（`STREAM` の値）。
 * @param {number} number 番号（0 以上の整数）。
 * @param {number} count 候補の数。
 * @returns {number} 0 以上 count 未満の整数。
 */
export function seededIndex(seed, stream, number, count) {
  const h = mix32(
    mix32(mix32(seed ^ 0x9e3779b9) + Math.imul(stream, 0x9e3779b1)) + Math.imul(number + 1, 0x85ebca77),
  );
  return Math.floor((h / 0x100000000) * count);
}
