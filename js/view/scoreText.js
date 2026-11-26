/**
 * 責務: 点の項目の文字の表と、点の数字の書き方（3桁の区切り・符号）、敵を倒したときの内訳の行と合計の文字、結果の画面の内訳の1行を作る。
 * 点の計算や足し算はしない（ルールが出した値を文字にするだけ）。何も import しない。
 */

/**
 * 点の項目の文字の行。
 * @typedef {Object} ScoreItemText
 * @property {string} name 項目の名前。
 * @property {boolean} signed 点に符号（+ / -）を付けるか。
 * @property {boolean} counted 結果の画面の行に取った回数（×回数）を出すか。
 */

/**
 * 点の項目の文字の表（キーは `config.scoreItems` と同じ識別子）。
 * @type {Readonly<Object<string, Readonly<ScoreItemText>>>}
 */
export const SCORE_ITEM_TEXTS = Object.freeze({
  defeat: Object.freeze({ name: '討伐', signed: false, counted: false }),
  strong: Object.freeze({ name: '強敵', signed: true, counted: false }),
  turns: Object.freeze({ name: 'ターン', signed: true, counted: false }),
  combo: Object.freeze({ name: 'コンボ', signed: true, counted: true }),
  noDamage: Object.freeze({ name: '無傷', signed: true, counted: true }),
});

/**
 * 項目の識別子から文字の行を引く。
 * @param {string} id 項目の識別子。
 * @returns {Readonly<ScoreItemText>} 文字の行。
 * @throws {Error} 表にない識別子のとき。
 */
export function scoreItemTextOf(id) {
  if (!Object.prototype.hasOwnProperty.call(SCORE_ITEM_TEXTS, id)) {
    throw new Error(`知らない点の項目: ${id}`);
  }
  return SCORE_ITEM_TEXTS[id];
}

/**
 * 点を3桁ごとに「,」で区切る（負は頭に `-`）。
 * @param {number} n 整数の点。
 * @returns {string} 区切り付きの文字。
 */
export function formatScore(n) {
  const digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n < 0 ? `-${digits}` : digits;
}

/**
 * 点を符号付きで書く（正は `+`、負は `-`、0 は `0`。3桁の区切り付き）。
 * @param {number} n 整数の点。
 * @returns {string} 符号付きの文字。
 */
export function formatSignedScore(n) {
  if (n > 0) return `+${formatScore(n)}`;
  return formatScore(n);
}

/**
 * 項目の点を、その項目の書き方（符号の有無）で書く。
 * @param {Readonly<ScoreItemText>} text 文字の行。
 * @param {number} points 点。
 * @returns {string} 点の文字。
 */
function pointsText(text, points) {
  return text.signed ? formatSignedScore(points) : formatScore(points);
}

/**
 * 敵を倒したときの内訳の行（0 点の項目は出さない）。
 * @param {{items: Array<{id: string, points: number}>}} score 倒した攻防の点（`result.defeat.score`）。
 * @returns {string[]} 「名前 点」の並び（項目の並びの順）。
 * @throws {Error} 表にない識別子のとき。
 */
export function defeatScoreLines(score) {
  const lines = [];
  for (const { id, points } of score.items) {
    const text = scoreItemTextOf(id);
    if (points === 0) continue;
    lines.push(`${text.name} ${pointsText(text, points)}`);
  }
  return lines;
}

/**
 * 敵を倒したときの合計の文字。
 * @param {number} total その敵の点の合計。
 * @param {number} after 足した後のスコア。
 * @returns {string} 例: 「+975　SCORE 3,250」（全角の空白）。
 */
export function defeatTotalText(total, after) {
  return `${formatSignedScore(total)}　SCORE ${formatScore(after)}`;
}

/**
 * 結果の画面の内訳の1行。
 * @param {string} id 項目の識別子。
 * @param {{points: number, count: number}} item 結果の記録の項目（合計点と取った回数）。
 * @returns {{label: string, value: string}} 行の名前と値（`counted` なら名前は「コンボ ×3」）。
 * @throws {Error} 表にない識別子のとき。
 */
export function resultScoreLine(id, item) {
  const text = scoreItemTextOf(id);
  return {
    label: text.counted ? `${text.name} ×${item.count}` : text.name,
    value: pointsText(text, item.points),
  };
}
