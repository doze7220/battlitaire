/**
 * 責務: 敵の行動（爪・吸い込む・ブレスの種類と防御を含む）・予告の量の数字・表にない予告の印・決着・結果の集計の見出し・タップでタイトルへの案内・敵を倒したときの案内・数え下ろし・回復の量・当たりのダメージの数字・放った区切りの式・4スートそろいの文字を、画面に出す文字に直す。
 * 計算はせず、量をそのまま文字にする。ルール層は実行時に import しない。
 */

import { intentParts } from './intentParts.js';

/** 予告の攻撃の側と防御の側をつなぐ文字 */
const SIDE_SEPARATOR = ' ／ ';

/**
 * 決着 → 表示文字の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const OUTCOME_LABELS = Object.freeze({
  lose: '負け',
});

/**
 * 敵の行動の種類 → 表示名の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const ACTION_LABELS = Object.freeze({
  attack: '攻撃',
  defend: '防御',
  windup: '振りかぶり',
});

/**
 * 行動の中の種類（variant）→ 表示名の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const VARIANT_LABELS = Object.freeze({
  claw: '爪',
  inhale: '吸い込む',
  breath: 'ブレス',
});

/**
 * 量を出さない敵の行動の種類の集合（表示名だけを出す）。
 * @type {Set<string>}
 */
const AMOUNTLESS_KINDS = new Set(['windup']);

/**
 * 結果の集計の項目 → 見出し文字の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const RESULT_STAT_LABELS = Object.freeze({
  phases: 'かかったターン数',
  damageDealt: '敵に与えた総ダメージ',
  damageTaken: '城が受けた総ダメージ',
  healed: '修理の合計',
});

/**
 * 結果の集計の項目を表示する順の並び。
 * @type {ReadonlyArray<string>}
 */
const RESULT_STAT_ORDER = Object.freeze(['phases', 'damageDealt', 'damageTaken', 'healed']);

/** 結果の表示を閉じる案内の文字 */
const RESULT_HINT_TEXT = 'タップでタイトルへ';

/** 敵を倒したときの、タップで次へ進む案内の文字 */
const DEFEAT_HINT_TEXT = 'タップで次へ';

/** 当たり1回で減る HP の表示の文字 */
const DAMAGE_POP_TEXT = '-1';

/** 未知の行動の種類の表示名 */
const UNKNOWN_ACTION_LABEL = '？';

/**
 * 決着を表示文字にする。
 * @param {'lose'|null} outcome 決着
 * @returns {string} 「負け」。それ以外は空文字
 */
export function outcomeText(outcome) {
  return Object.prototype.hasOwnProperty.call(OUTCOME_LABELS, outcome) ? OUTCOME_LABELS[outcome] : '';
}

/**
 * 結果の集計を、見出しと数字の文字の4行にする。
 * @param {import('../rules/gameStats.js').GameStats} stats 結果の集計
 * @returns {Array<{ label: string, value: string }>} 表示順の行。value は数字をそのまま文字にしたもの
 */
export function resultStatLines(stats) {
  return RESULT_STAT_ORDER.map((key) => ({ label: RESULT_STAT_LABELS[key], value: String(stats[key]) }));
}

/**
 * 結果の表示を閉じる案内の文字にする。
 * @returns {string} 「タップでタイトルへ」
 */
export function resultHintText() {
  return RESULT_HINT_TEXT;
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
 * 敵を倒したときの、タップで次へ進む案内の文字にする。
 * @returns {string} 「タップで次へ」
 */
export function defeatHintText() {
  return DEFEAT_HINT_TEXT;
}

/**
 * 敵の予告を「攻撃 3 ／ 防御 2」のような文字にする。出す側は intentParts で決め、片方だけならその文字だけ。
 * @param {import('../rules/combatants.js').EnemyIntent} action 敵の予告
 * @returns {string} 攻撃の側（表示名と量。variant が表にあればその表示名。「爪 10」「吸い込む」「ブレス 25」「振りかぶり」。種類が未知なら「？」）と防御の側（「防御 量」）を ` ／ ` でつないだ文字
 */
export function enemyActionText(action) {
  const parts = intentParts(action);
  const texts = [];
  if (parts.attack) texts.push(attackSideText(action));
  if (parts.defense) texts.push(`${ACTION_LABELS.defend} ${intentDefenseText(action)}`);
  return texts.join(SIDE_SEPARATOR);
}

/**
 * 敵の予告の攻撃の側を「攻撃 10」のような文字にする。
 * @param {import('../rules/combatants.js').EnemyAction} action 敵の行動
 * @returns {string} 表示名と量の文字（variant が表にあればその表示名）。種類が未知なら表示名は「？」
 */
function attackSideText(action) {
  const hasVariant = typeof action.variant === 'string' && Object.prototype.hasOwnProperty.call(VARIANT_LABELS, action.variant);
  const name = hasVariant
    ? VARIANT_LABELS[action.variant]
    : Object.prototype.hasOwnProperty.call(ACTION_LABELS, action.kind)
      ? ACTION_LABELS[action.kind]
      : UNKNOWN_ACTION_LABEL;
  if (AMOUNTLESS_KINDS.has(action.kind)) return name;
  return `${name} ${action.amount}`;
}

/**
 * 敵の行動の量を、予告の札に出す数字の文字にする。
 * @param {import('../rules/combatants.js').EnemyAction} action 敵の行動
 * @returns {string|null} 量をそのまま文字にしたもの。量を出さない行動（振りかぶり）は null
 */
export function intentAmountText(action) {
  if (AMOUNTLESS_KINDS.has(action.kind)) return null;
  return String(action.amount);
}

/**
 * 敵の予告の防御の量を、予告の札に出す数字の文字にする。
 * @param {import('../rules/combatants.js').EnemyIntent} action 敵の予告
 * @returns {string} 防御の量をそのまま文字にしたもの
 */
export function intentDefenseText(action) {
  return String(action.defense);
}

/**
 * 表にない予告の種類に出す印の文字にする。
 * @returns {string} 「？」
 */
export function unknownIntentText() {
  return UNKNOWN_ACTION_LABEL;
}

/**
 * 攻撃までの数え下ろしを表示文字にする。
 * @param {number} countdown 攻撃までの残りフェーズ数（0 は攻撃するフェーズ）
 * @returns {string} 1以上は「攻撃まで あとN」、0 は「攻撃！」
 */
export function countdownText(countdown) {
  return countdown > 0 ? `攻撃まで あと${countdown}` : '攻撃！';
}

/**
 * 回復の量を「+20」のような文字にする。
 * @param {number} amount 回復の量
 * @returns {string} 「+量」
 */
export function healAmountText(amount) {
  return `+${amount}`;
}

/**
 * 当たり1回で減る HP の表示を「-1」の文字にする。
 * @returns {string} 「-1」
 */
export function damagePopText() {
  return DAMAGE_POP_TEXT;
}

/**
 * 放った区切りの式を「18 +2 = 20」のような文字にする。足す量 0 は加算量の数字だけ（「4」）。
 * @param {number} sum 区切りの合計
 * @param {number} bonus 足す量
 * @param {number} amount 加算量
 * @returns {string} 「合計 +足す量 = 加算量」（足す量 0 は加算量の数字だけ）
 */
export function releaseFormulaText(sum, bonus, amount) {
  return bonus > 0 ? `${sum} +${bonus} = ${amount}` : `${amount}`;
}

/**
 * 4スートそろいの文字を「4スート +1」のような文字にする。数は引数をそのまま文字にする。
 * @param {number} suitCount そろったスートの数
 * @param {number} amount それぞれのゲージに足す量
 * @returns {string} 「Nスート +量」
 */
export function allSuitsText(suitCount, amount) {
  return `${suitCount}スート +${amount}`;
}
