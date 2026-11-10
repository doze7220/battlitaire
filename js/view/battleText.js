/**
 * 責務: 攻防の出来事・敵の行動・決着を、画面に出す文字に直す。
 * 計算はせず、量をそのまま文字にする。ルール層は実行時に import しない。
 */

/**
 * 出来事の種類 → 行の文字（量の前の部分）の対応表。決着（win・lose）は行にしない。
 * @type {Readonly<Record<string, string>>}
 */
const EVENT_LABELS = Object.freeze({
  enemyAttack: '敵の攻撃',
  block: '防御で相殺',
  castleDamage: '城が受けたダメージ',
  enemyDamage: '敵に与えたダメージ',
  heal: '城の回復',
});

/**
 * 決着 → 表示文字の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const OUTCOME_LABELS = Object.freeze({
  win: '勝ち',
  lose: '負け',
});

/**
 * 敵の行動の種類 → 表示名の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const ACTION_LABELS = Object.freeze({
  attack: '攻撃',
});

/** 未知の行動の種類の表示名 */
const UNKNOWN_ACTION_LABEL = '？';

/**
 * 出来事1つを行の文字にする。
 * @param {import('../rules/battle.js').BattleEvent} event 出来事
 * @returns {string|null} 「敵の攻撃 10」のような文字。行にしない出来事・未知の種類は null
 */
export function eventLine(event) {
  const label = Object.prototype.hasOwnProperty.call(EVENT_LABELS, event.type) ? EVENT_LABELS[event.type] : null;
  if (label === null) return null;
  return `${label} ${event.amount}`;
}

/**
 * 出来事の並びを行の文字の並びにする（並びの順を保ち、行にしないものは除く）。
 * @param {import('../rules/battle.js').BattleEvent[]} events 出来事の並び
 * @returns {string[]} 行の文字の配列
 */
export function battleEventLines(events) {
  const lines = [];
  for (const event of events) {
    const line = eventLine(event);
    if (line !== null) lines.push(line);
  }
  return lines;
}

/**
 * 決着を表示文字にする。
 * @param {'win'|'lose'|null} outcome 決着
 * @returns {string} 「勝ち」「負け」。それ以外は空文字
 */
export function outcomeText(outcome) {
  return Object.prototype.hasOwnProperty.call(OUTCOME_LABELS, outcome) ? OUTCOME_LABELS[outcome] : '';
}

/**
 * 敵の行動を「攻撃 10」のような文字にする。
 * @param {import('../rules/combatants.js').EnemyAction} action 敵の行動
 * @returns {string} 表示名と量の文字。種類が未知なら表示名は「？」
 */
export function enemyActionText(action) {
  const name = Object.prototype.hasOwnProperty.call(ACTION_LABELS, action.kind)
    ? ACTION_LABELS[action.kind]
    : UNKNOWN_ACTION_LABEL;
  return `${name} ${action.amount}`;
}
