/**
 * 責務: 敵の行動・決着・敵を倒したときの案内を、画面に出す文字に直す。
 * 計算はせず、量をそのまま文字にする。ルール層は実行時に import しない。
 */

/**
 * 決着 → 表示文字の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const OUTCOME_LABELS = Object.freeze({
  win: 'クリア',
  lose: '負け',
});

/**
 * 敵の行動の種類 → 表示名の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const ACTION_LABELS = Object.freeze({
  attack: '攻撃',
  defend: '防御',
});

/** 未知の行動の種類の表示名 */
const UNKNOWN_ACTION_LABEL = '？';

/**
 * 決着を表示文字にする。
 * @param {'win'|'lose'|null} outcome 決着
 * @returns {string} 「クリア」「負け」。それ以外は空文字
 */
export function outcomeText(outcome) {
  return Object.prototype.hasOwnProperty.call(OUTCOME_LABELS, outcome) ? OUTCOME_LABELS[outcome] : '';
}

/**
 * 敵を倒したときの見出しの文字にする。
 * @param {string} enemyName 倒した敵の名前
 * @returns {string} 「（名前）を倒した！」
 */
export function defeatText(enemyName) {
  return `${enemyName}を倒した！`;
}

/**
 * 次の敵の案内の文字にする。
 * @param {string} enemyName 次の敵の名前
 * @returns {string} 「次は（名前）」
 */
export function nextEnemyText(enemyName) {
  return `次は${enemyName}`;
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
