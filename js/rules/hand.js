/** 手札の枠の生成と、枠が空いているか・カードが入っているかの判定を担う。 */

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
