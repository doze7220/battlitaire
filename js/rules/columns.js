/** 列の生成と、置ける並び（数字の一周を含む）・置けるか・束の範囲の判定を担う。 */

/**
 * 置ける並びの判定に必要な設定のキー（構造型）。
 * @typedef {Object} StackConfig
 * @property {number} minRank 最小の数字。
 * @property {number} maxRank 最大の数字。
 * @property {boolean} rankWrap 最小の数字の上に最大の数字を置けるか（一周）。
 */

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
 * 下のカードの上に別のカードを置けるか判定する（スートは問わない）。
 * 数字がちょうど1つ小さければ置ける。`rankWrap` が `true` なら、
 * 下が最小の数字のとき最大の数字も置ける。
 * @param {import('./card.js').Card} lower 下のカード。
 * @param {import('./card.js').Card} upper 上に置くカード。
 * @param {StackConfig} config 判定に使う設定。
 * @returns {boolean} 置けるなら `true`。
 */
export function canStack(lower, upper, config) {
  if (upper.rank === lower.rank - 1) return true;
  return config.rankWrap && lower.rank === config.minRank && upper.rank === config.maxRank;
}

/**
 * カードを列に置けるか判定する。空の列には何でも置け、
 * そうでなければ一番上のカードの上に `canStack` で置けるか調べる。
 * @param {import('./card.js').Card[]} column 置き先の列。
 * @param {import('./card.js').Card} card 置くカード。
 * @param {StackConfig} config 判定に使う設定。
 * @returns {boolean} 置けるなら `true`。
 */
export function canPlaceOn(column, card, config) {
  const top = topCard(column);
  return top === null || canStack(top, card, config);
}

/**
 * カードを置ける列の番号をすべて返す。
 * @param {import('./card.js').Card[][]} columns 列の配列。
 * @param {import('./card.js').Card} card 置くカード。
 * @param {StackConfig} config 判定に使う設定。
 * @returns {number[]} 置ける列の番号（昇順）。
 */
export function placeableColumnIndices(columns, card, config) {
  const result = [];
  columns.forEach((column, index) => {
    if (canPlaceOn(column, card, config)) result.push(index);
  });
  return result;
}

/**
 * 列の一番上から下へ、置ける並びが続いている束の一番下の番号を返す。
 * 隣り合う2枚が `canStack(下, 上)` で続く間たどる。
 * @param {import('./card.js').Card[]} column 対象の列。
 * @param {StackConfig} config 判定に使う設定。
 * @returns {number} 束の一番下の番号。空の列は `-1`、続きがなければ一番上の番号。
 */
export function runStartIndex(column, config) {
  if (column.length === 0) return -1;
  let start = column.length - 1;
  while (start > 0 && canStack(column[start - 1], column[start], config)) {
    start -= 1;
  }
  return start;
}
