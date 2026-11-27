/**
 * 責務: 敵の行動（爪・吸い込む・ブレス・溜める・大攻撃・突進・怒りを溜める・大突進の種類と防御と子の数を含む）・予告の量の数字・子の数の数字・量の代わりの文字（怒り）・表にない予告の印・決着・敵を倒したときの案内・敵の名前とレベル・激昂の倍率・数え下ろし・回復の量・当たりのダメージの数字・放った区切りの式・4スートそろいの文字を、画面に出す文字に直す。
 * 列の印の名前（「混乱」。予告の札と始まりの文字の頭）と、ひとりでに放つときの呼び（「混乱！」）も文字に直す。計算はせず、量をそのまま文字にする。ルール層は実行時に import しない。
 */

import { intentParts } from './intentParts.js';

/**
 * 激昂の表示の文字の部品（名前・印）。
 * @type {Readonly<{ name: string, mark: string }>}
 */
const RAGE_LABEL = Object.freeze({ name: '激昂', mark: '⚔' });

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
  charge: '溜める',
  heavy: '大攻撃',
  rush: '突進',
  rage: '怒りを溜める',
  bigRush: '大突進',
});

/**
 * 行動の中の種類（variant）→ 予告の札に量の代わりに出す文字の対応表（量を出さない行動用）。
 * @type {Readonly<Record<string, string>>}
 */
const BADGE_LABELS = Object.freeze({
  rage: '怒り',
});

/**
 * 量を出さない敵の行動の種類の集合（表示名だけを出す）。
 * @type {Set<string>}
 */
const AMOUNTLESS_KINDS = new Set(['windup']);

/**
 * 敵の種類の識別子 → 子の名前の対応表（子を持つ敵だけ。表にない種類は「？」）。
 * @type {Readonly<Record<string, string>>}
 */
export const MINION_LABELS = Object.freeze({
  slime: '子スライム',
});

/**
 * 列の印の種類 → ひとりでに放つときの呼びの文字の対応表（表にない種類は「？」）。
 * @type {Readonly<Record<string, string>>}
 */
export const MARK_CALL_LABELS = Object.freeze({
  confuse: '混乱！',
});

/**
 * 列の印の種類 → 予告の札・始まりの文字に出す印の名前の対応表（表にない種類は「？」）。
 * @type {Readonly<Record<string, string>>}
 */
export const MARK_LABELS = Object.freeze({
  confuse: '混乱',
});

/** 始まりの文字の頭に付ける印の名前と本体をつなぐ文字 */
const MARK_SEPARATOR = ' ＋ ';

/** 敵を倒したときの、タップで次へ進む案内の文字 */
const DEFEAT_HINT_TEXT = 'タップで次へ';

/** 当たり1回で減る HP の表示の文字の頭（量が後ろに付く） */
const DAMAGE_POP_PREFIX = '-';

/** 未知の行動の種類の表示名 */
const UNKNOWN_ACTION_LABEL = '？';

/**
 * 列の印の種類を、ひとりでに放つときの呼びの文字（「混乱！」）にする。
 * @param {string} kind 印の種類
 * @returns {string} 呼びの文字。表にない種類は「？」
 */
export function markCallText(kind) {
  return Object.prototype.hasOwnProperty.call(MARK_CALL_LABELS, kind) ? MARK_CALL_LABELS[kind] : UNKNOWN_ACTION_LABEL;
}

/**
 * 列の印の種類を、予告の札・始まりの文字に出す印の名前（「混乱」）にする。
 * @param {string} kind 印の種類
 * @returns {string} 印の名前。表にない種類は「？」
 */
export function markLabelText(kind) {
  return Object.prototype.hasOwnProperty.call(MARK_LABELS, kind) ? MARK_LABELS[kind] : UNKNOWN_ACTION_LABEL;
}

/**
 * 決着を表示文字にする。
 * @param {'lose'|null} outcome 決着
 * @returns {string} 「負け」。それ以外は空文字
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
 * 画面の最上部に出す敵の名前とレベル（ステージの番号）の文字にする。
 * @param {string} name 敵の名前
 * @param {number} level レベル（ステージの番号）
 * @returns {string} 「（名前） Lv（レベル）」
 */
export function enemyLabelText(name, level) {
  return `${name} Lv${level}`;
}

/**
 * 激昂の倍率（百分率の整数）を「激昂 ⚔×1.2」のような文字にする。小数第1位まで（第2位以下は切り捨て）。整数の割り算だけで作る。
 * @param {number} percent 倍率（百分率の整数。120 は 1.2 倍）
 * @returns {string} 「激昂 ⚔×倍率」（120 → 「激昂 ⚔×1.2」、200 → 「激昂 ⚔×2.0」）
 */
export function rageLabelText(percent) {
  return `${RAGE_LABEL.name} ${RAGE_LABEL.mark}×${Math.floor(percent / 100)}.${Math.floor((percent % 100) / 10)}`;
}

/**
 * 敵を倒したときの、タップで次へ進む案内の文字にする。
 * @returns {string} 「タップで次へ」
 */
export function defeatHintText() {
  return DEFEAT_HINT_TEXT;
}

/**
 * 敵の予告を「攻撃 3 ／ 防御 2」「攻撃 4 +子スライム 8」のような文字にする。出す側は intentParts で決め、片方だけならその文字だけ。
 * 子の側が出るときは、攻撃の側（出さないときは空）の後ろに半角の空白をはさんで「+子の名前 数」を続ける。
 * 列の印があるときは、全体の頭に「混乱 ＋ 」のように印の名前と「 ＋ 」を付ける（「混乱 ＋ 大攻撃 9」「混乱 ＋ 防御 9」）。
 * @param {import('../rules/combatants.js').EnemyIntent} action 敵の予告
 * @param {string|null} [typeId=null] 敵の種類の識別子（子の名前を MINION_LABELS で引く。null・表にない種類は「？」）
 * @returns {string} （列の印があれば頭に「印の名前 ＋ 」）攻撃の側（表示名と量。variant が表にあればその表示名。「爪 10」「吸い込む」「ブレス 25」「振りかぶり」。種類が未知なら「？」）に子の側（「+子スライム 8」）を空白で続けたものと、防御の側（「防御 量」）を ` ／ ` でつないだ文字
 */
export function enemyActionText(action, typeId = null) {
  const parts = intentParts(action);
  const texts = [];
  const minionText = parts.minions ? `+${minionLabelOf(typeId)} ${intentMinionText(action)}` : null;
  if (parts.attack) texts.push(minionText === null ? attackSideText(action) : `${attackSideText(action)} ${minionText}`);
  else if (minionText !== null) texts.push(minionText);
  if (parts.defense) texts.push(`${ACTION_LABELS.defend} ${intentDefenseText(action)}`);
  const body = texts.join(SIDE_SEPARATOR);
  return parts.mark ? `${markLabelText(action.mark.kind)}${MARK_SEPARATOR}${body}` : body;
}

/**
 * 敵の種類の子の名前を引く。
 * @param {string|null} typeId 敵の種類の識別子
 * @returns {string} MINION_LABELS の名前。null・表にない種類は「？」
 */
function minionLabelOf(typeId) {
  return typeId !== null && Object.prototype.hasOwnProperty.call(MINION_LABELS, typeId) ? MINION_LABELS[typeId] : UNKNOWN_ACTION_LABEL;
}

/**
 * 敵の予告の子の数を、予告の札と始まりの文字に出す数字の文字にする。
 * @param {import('../rules/combatants.js').EnemyIntent} action 敵の予告（minions が数のとき）
 * @returns {string} 子の数をそのまま文字にしたもの
 */
export function intentMinionText(action) {
  return String(action.minions);
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
 * 敵の行動に、予告の札へ量の代わりに出す文字があれば返す。
 * @param {import('../rules/combatants.js').EnemyAction} action 敵の行動
 * @returns {string|null} 表（BADGE_LABELS）にある中の種類ならその文字（「怒り」）。なければ null
 */
export function intentBadgeLabel(action) {
  return typeof action.variant === 'string' && Object.prototype.hasOwnProperty.call(BADGE_LABELS, action.variant)
    ? BADGE_LABELS[action.variant]
    : null;
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
 * 当たり1回で減る HP の表示を「-N」の文字にする。
 * @param {number} [amount] 減る量（既定 1）
 * @returns {string} 「-量」（既定は「-1」）
 */
export function damagePopText(amount = 1) {
  return `${DAMAGE_POP_PREFIX}${amount}`;
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
