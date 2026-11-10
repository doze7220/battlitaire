/** カードのデータ構造（ID・スート・数字）と、その生成を担う。 */

/**
 * カード。後からフィールドを足せるようオブジェクトにしている。
 * @typedef {Object} Card
 * @property {number} id カードを一意に識別する通し番号。
 * @property {string} suit スートの識別子（`RULES.suits` のいずれか）。
 * @property {number} rank カードの数字。
 */

/**
 * カードを1枚作る。
 * @param {number} id カードの通し番号。
 * @param {string} suit スートの識別子。
 * @param {number} rank カードの数字。
 * @returns {Card} 作ったカード。
 */
export function createCard(id, suit, rank) {
  return { id, suit, rank };
}
