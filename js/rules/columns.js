/** 列（カードを下から積む場所）の生成と、カードを置けるかの判定を担う。 */

/**
 * 空の列を指定の数だけ作る。列は `Card[]` で、`[0]` が一番下、末尾が一番上。
 * @param {number} count 列の数。
 * @returns {import('./card.js').Card[][]} 空の列の配列。
 */
export function createColumns(count) {
  return Array.from({ length: count }, () => []);
}

/**
 * 列の一番上のカードを返す。
 * @param {import('./card.js').Card[]} column 対象の列。
 * @returns {import('./card.js').Card|null} 一番上のカード。空なら `null`。
 */
export function topCard(column) {
  return column.length > 0 ? column[column.length - 1] : null;
}

/**
 * カードを列に置けるか判定する。空の列には何でも置け、
 * 一番上の数字がちょうど `card.rank + 1` ならスートを問わず置ける。
 * @param {import('./card.js').Card[]} column 置き先の列。
 * @param {import('./card.js').Card} card 置くカード。
 * @returns {boolean} 置けるなら `true`。
 */
export function canPlaceOn(column, card) {
  const top = topCard(column);
  return top === null || top.rank === card.rank + 1;
}

/**
 * カードを置ける列の番号をすべて返す。
 * @param {import('./card.js').Card[][]} columns 列の配列。
 * @param {import('./card.js').Card} card 置くカード。
 * @returns {number[]} 置ける列の番号（昇順）。
 */
export function placeableColumnIndices(columns, card) {
  const result = [];
  columns.forEach((column, index) => {
    if (canPlaceOn(column, card)) result.push(index);
  });
  return result;
}
