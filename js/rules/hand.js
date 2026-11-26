/** 手札の枠の生成・枠を増やす／減らす操作と、枠が空いているか・カードが入っているかの判定を担う。 */

/**
 * 手札。長さ = 枠の数。`null` は空いた枠。
 * @typedef {(import('./card.js').Card|null)[]} Hand
 */

/**
 * すべての枠が空の手札を作る。
 * @param {number} size 枠の数。
 * @returns {Hand} 長さ `size` ですべて `null` の手札。
 */
export function createHand(size) {
  return Array.from({ length: size }, () => null);
}

/**
 * 後ろに空き枠を足した新しい手札を作る（元の手札は変えない）。
 * @param {Hand} hand 手札。
 * @param {number} count 足す枠の数。
 * @returns {Hand} 元の枠の後ろに `count` 個の空き枠（`null`）を足した新しい手札。
 */
export function growHand(hand, count) {
  return [...hand, ...createHand(count)];
}

/**
 * 手札を先頭の `size` 枠にした新しい手札を作り、外した枠にあった札を返す（元の手札は変えない）。
 * @param {Hand} hand 手札。
 * @param {number} size 残す枠の数（先頭から）。
 * @returns {{ hand: Hand, removed: import('./card.js').Card[] }} 先頭 `size` 枠の新しい手札と、外した枠にあった札（`null` は除く。枠の並びの順）。
 */
export function shrinkHand(hand, size) {
  return {
    hand: hand.slice(0, size),
    removed: hand.slice(size).filter((card) => card !== null),
  };
}

/**
 * 枠が範囲内で空いているか判定する。
 * @param {Hand} hand 手札。
 * @param {number} s 枠の番号。
 * @returns {boolean} 整数で範囲内かつ空いていれば `true`。
 */
export function isEmptySlot(hand, s) {
  return Number.isInteger(s) && s >= 0 && s < hand.length && hand[s] === null;
}

/**
 * 枠が範囲内でカードが入っているか判定する。
 * @param {Hand} hand 手札。
 * @param {number} s 枠の番号。
 * @returns {boolean} 整数で範囲内かつカードが入っていれば `true`。
 */
export function hasCardInSlot(hand, s) {
  return Number.isInteger(s) && s >= 0 && s < hand.length && hand[s] !== null;
}
