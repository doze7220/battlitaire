/**
 * 責務: 敵の行動（爪・ブレスの種類を含む）・決着・結果の集計の見出し・タップでタイトルへの案内・敵を倒したときの案内・数え下ろし・ブレスチャージ・回復の量を、画面に出す文字に直す。
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
  windup: '振りかぶり',
});

/**
 * 攻撃の中の種類（variant）→ 表示名の対応表。
 * @type {Readonly<Record<string, string>>}
 */
const VARIANT_LABELS = Object.freeze({
  claw: '爪',
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
  phases: 'かかったフェーズ数',
  damageDealt: '敵に与えた総ダメージ',
  damageTaken: '城が受けた総ダメージ',
  healed: '回復の合計',
});

/**
 * 結果の集計の項目を表示する順の並び。
 * @type {ReadonlyArray<string>}
 */
const RESULT_STAT_ORDER = Object.freeze(['phases', 'damageDealt', 'damageTaken', 'healed']);

/** 結果の表示を閉じる案内の文字 */
const RESULT_HINT_TEXT = 'タップでタイトルへ';

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
 * @returns {string} 表示名と量の文字。variant が表にあればその表示名（「爪 10」「ブレス 35」）。種類が未知なら表示名は「？」
 */
export function enemyActionText(action) {
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
 * 攻撃までの数え下ろしを表示文字にする。
 * @param {number} countdown 攻撃までの残りフェーズ数（0 は攻撃するフェーズ）
 * @returns {string} 1以上は「攻撃まで あとN」、0 は「攻撃！」
 */
export function countdownText(countdown) {
  return countdown > 0 ? `攻撃まで あと${countdown}` : '攻撃！';
}

/**
 * ブレスチャージを「ブレス 1/4」のような文字にする。
 * @param {{ current: number, max: number }} charge チャージの現在値と満ちる数
 * @returns {string} 「ブレス 現在値/満ちる数」
 */
export function chargeText({ current, max }) {
  return `${VARIANT_LABELS.breath} ${current}/${max}`;
}

/**
 * 回復の量を「+20」のような文字にする。
 * @param {number} amount 回復の量
 * @returns {string} 「+量」
 */
export function healAmountText(amount) {
  return `+${amount}`;
}
