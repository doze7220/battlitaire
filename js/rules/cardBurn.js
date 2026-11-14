/**
 * 責務: 行動に付く「列の札を燃やす」効果の、燃やす札の決め方と、列から捨て札への移し（純粋なルール。乱数は渡されたものだけ）。
 */

/**
 * 燃える札1枚の記録。
 * @typedef {Object} BurnedCard
 * @property {number} columnIndex 燃えた札のあった列の番号
 * @property {number} cardIndex 燃えた時点のその列の下から数えた位置（＝その時点の一番上）
 * @property {import('./card.js').Card} card 燃えた札
 */

/**
 * 行動に付く `burn` から、燃やす札を順に決める。`columns` は書き換えない。
 * `action.burn` がなければ乱数を呼ばず空配列を返す。あれば枚数に1回、1枚ごとに列の選択に1回、乱数を使う。
 * 札のある列がなくなったら、そこで止める。
 * @param {{ burn?: { min: number, max: number } }} action 敵の行動の予告
 * @param {import('./card.js').Card[][]} columns 列（`[0]` が一番下）
 * @param {() => number} random `[0, 1)` の値を返す乱数の関数
 * @returns {BurnedCard[]} 燃える札の並び（燃える順）
 */
export function planActionBurns(action, columns, random) {
  if (!action.burn) return [];
  const { min, max } = action.burn;
  const count = min + Math.floor(random() * (max - min + 1));
  const lengths = columns.map((column) => column.length);
  /** @type {BurnedCard[]} */
  const burns = [];
  for (let i = 0; i < count; i++) {
    const candidates = [];
    for (let c = 0; c < lengths.length; c++) {
      if (lengths[c] >= 1) candidates.push(c);
    }
    if (candidates.length === 0) break;
    const columnIndex = candidates[Math.floor(random() * candidates.length)];
    const cardIndex = lengths[columnIndex] - 1;
    burns.push({ columnIndex, cardIndex, card: columns[columnIndex][cardIndex] });
    lengths[columnIndex] -= 1;
  }
  return burns;
}

/**
 * 燃えた札を、並びの順に列の一番上から取り除いて捨て札の末尾へ移す（渡された配列を書き換える）。
 * @param {import('./card.js').Card[][]} columns 列（書き換える）
 * @param {import('./card.js').Card[]} discard 捨て札（書き換える）
 * @param {BurnedCard[]} burns 燃える札の並び
 * @returns {void}
 */
export function applyBurns(columns, discard, burns) {
  for (const burn of burns) {
    discard.push(columns[burn.columnIndex].pop());
  }
}
