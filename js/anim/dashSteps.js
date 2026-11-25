/**
 * 敵の攻撃の段の並びに、打撃の段の前の駆け寄りの段と、最後の打撃の後の戻りの段を差し込む。
 * 段の並びを組み替えるだけで、時刻・見た目は求めない。描画も状態の変更もしない。
 */

/** 打撃の段の種類 → 駆け寄りの行き先。 */
const STRIKE_TARGETS = Object.freeze({
  strikeBlock: 'defense',
  strikeCastle: 'castle',
});

/**
 * 打撃の段（`strikeBlock`・`strikeCastle`）の前に駆け寄りの段、最後の打撃の後に戻りの段を差し込んだ新しい並びを返す。
 * 防御の兵を倒しきって城も打つときは、城の打撃の前にもう一度駆け寄る（城の前まで詰める）。
 * 城が落ちたとき（`lost`）は戻りの段を入れない。打撃がなければ並びをそのまま返す。
 * @param {import('./battleSteps.js').BattleStep[]} steps 段の並び（書き換えない）
 * @param {string} style 駆け寄りの見せ方の名前（`DASH_STYLES` の項目名）
 * @param {boolean} lost 城が落ちるか
 * @returns {import('./battleSteps.js').BattleStep[]} 差し込んだ後の新しい並び（打撃がないときは渡された並びをそのまま返す）
 */
export function insertDashSteps(steps, style, lost) {
  let lastStrike = -1;
  steps.forEach((step, index) => {
    if (Object.prototype.hasOwnProperty.call(STRIKE_TARGETS, step.type)) lastStrike = index;
  });
  if (lastStrike < 0) return steps;
  /** @type {import('./battleSteps.js').BattleStep[]} */
  const out = [];
  steps.forEach((step, index) => {
    if (Object.prototype.hasOwnProperty.call(STRIKE_TARGETS, step.type)) {
      out.push({ type: 'dash', amount: 0, to: STRIKE_TARGETS[step.type], style });
    }
    out.push(step);
    if (index === lastStrike && !lost) out.push({ type: 'dashBack', amount: 0, style });
  });
  return out;
}
