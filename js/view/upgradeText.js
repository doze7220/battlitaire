/**
 * 3択の画面・「強化」タブの文字（見出し・枠の名前・強化の種類ごとの文字の表・修理の文字・取っていないときの文字）を持つ。
 * 何も import せず、値を並べるだけで前後の値の計算はしない（前後の値はルール層の preview が返す）。
 */

/** 3択の画面の見出し。 */
export const UPGRADE_HEADING_TEXT = '強化を選ぶ';

/** 次の敵の板の見出し。 */
export const UPGRADE_NEXT_ENEMY_TEXT = '次の敵';

/**
 * 枠の識別子 → 枠の名前。
 * @type {Readonly<Record<string, string>>}
 */
export const UPGRADE_SLOT_TEXT = Object.freeze({ castle: '城', troop: '兵士', card: 'カード', special: '特別' });

/** 取った強化がないときの「強化」タブの文字。 */
export const UPGRADE_NONE_TEXT = 'まだ強化を取っていません';

/**
 * 選択肢の取る前と後（ルール層の UpgradePreview と同じ形）。
 * @typedef {{ before: number, after: number, left?: number, cards?: number, actions?: number }} UpgradePreviewLike
 */

/**
 * 「強化」タブの行の値（ルール層の UpgradeRow と同じ形）。
 * @typedef {{ count: number, amount: number, value: number, limit: number }} UpgradeRowLike
 */

/**
 * 選択肢の文字。
 * @typedef {Object} ChoiceText
 * @property {string} title 見出しの文字
 * @property {string} detail 説明の文字
 */

/**
 * 強化の種類の文字。
 * @typedef {Object} UpgradeTextSpec
 * @property {string} name 強化の名前
 * @property {(value: number, preview: UpgradePreviewLike) => ChoiceText} choice 選択肢の文字（value は取ったときの値）
 * @property {(row: UpgradeRowLike) => string} taken 取った強化の行の文字
 */

/**
 * 自動兵士の強化の文字を作る。
 * @param {string} name 強化の名前
 * @returns {Readonly<UpgradeTextSpec>} 文字の定義
 */
function autoTroopText(name) {
  return Object.freeze({
    name,
    choice: (value, preview) => ({
      title: `${name} +${value}`,
      detail: `毎ターン ${preview.before}人 → ${preview.after}人`,
    }),
    taken: (row) => `${name} +${row.value}`,
  });
}

/**
 * スートの札の強化の文字を作る。
 * @param {string} suitName スートの名前（「剣」など）
 * @returns {Readonly<UpgradeTextSpec>} 文字の定義
 */
function suitCardsText(suitName) {
  const name = `${suitName}の札`;
  return Object.freeze({
    name,
    choice: (value, preview) => ({
      title: `${name} +${value}`,
      detail: `${name}すべて +${preview.before} → +${preview.after}`,
    }),
    taken: (row) => `${name} +${row.value}`,
  });
}

/**
 * 数字の札の強化の文字を作る。
 * @param {number} rank 数字
 * @returns {Readonly<UpgradeTextSpec>} 文字の定義
 */
function rankCardsText(rank) {
  const name = `数字 ${rank} の札`;
  return Object.freeze({
    name,
    choice: (value, preview) => ({
      title: `${name} +${value}`,
      detail: `${rank} の札すべて +${preview.before} → +${preview.after}`,
    }),
    taken: (row) => `${name} +${row.value}`,
  });
}

/**
 * 強化の種類の識別子 → 文字の表。
 * @type {Readonly<Record<string, Readonly<UpgradeTextSpec>>>}
 */
export const UPGRADE_TEXTS = Object.freeze({
  castleMaxHp: Object.freeze({
    name: '城の最大 HP',
    choice: (value, preview) => ({
      title: `城の最大 HP +${value}`,
      detail: `最大 HP ${preview.before} → ${preview.after}`,
    }),
    taken: (row) => `城の最大 HP +${row.value}（${row.count}回）`,
  }),
  autoSword: autoTroopText('毎ターン 剣の兵'),
  autoShield: autoTroopText('毎ターン 盾の兵'),
  autoHammer: autoTroopText('毎ターン ハンマーの兵'),
  swordCards: suitCardsText('剣'),
  shieldCards: suitCardsText('盾'),
  hammerCards: suitCardsText('ハンマー'),
  goldCards: suitCardsText('金貨'),
  rank1Cards: rankCardsText(1),
  rank2Cards: rankCardsText(2),
  rank3Cards: rankCardsText(3),
  rank4Cards: rankCardsText(4),
  rank5Cards: rankCardsText(5),
  rank6Cards: rankCardsText(6),
  rank7Cards: rankCardsText(7),
  allSuits: Object.freeze({
    name: '4スートそろい',
    choice: (value, preview) => ({
      title: '4スートそろいを強化',
      detail: `4スート +${preview.before} → +${preview.after}（あと ${preview.left} 回）`,
    }),
    taken: (row) => `4スートそろい +${row.value}（${row.count}回）`,
  }),
  combo: Object.freeze({
    name: 'コンボ',
    choice: (value, preview) => ({
      title: 'コンボを強化',
      detail: `${preview.cards}枚の束 +${preview.before} → +${preview.after}（あと ${preview.left} 回）`,
    }),
    taken: (row) => `コンボ 1枚ごと +${row.value}・上限 +${row.limit}（${row.count}回）`,
  }),
});

/**
 * 強化の種類の文字を引く。
 * @param {string} id 強化の種類の識別子
 * @returns {Readonly<UpgradeTextSpec>} 文字の定義
 * @throws {Error} 表にない識別子のとき
 */
export function upgradeTextOf(id) {
  if (!Object.prototype.hasOwnProperty.call(UPGRADE_TEXTS, id)) {
    throw new Error(`upgradeText: 未知の強化の識別子です: ${id}`);
  }
  return UPGRADE_TEXTS[id];
}

/**
 * 城の修理の選択肢の文字。
 * @param {{ amount: number, before: number, after: number }} preview 修理の回復量と前後の HP（game.repairPreview() の値）
 * @returns {ChoiceText} 見出しと説明
 */
export function repairChoiceText(preview) {
  return { title: `城を修理 +${preview.amount}`, detail: `HP ${preview.before} → ${preview.after}` };
}

/**
 * 次の敵の名前と Lv の文字（最上部のゲージと同じ書き方）。
 * @param {string} name 敵の名前
 * @param {number} stageNumber ステージの番号
 * @returns {string} 「名前 Lv番号」
 */
export function nextEnemyText(name, stageNumber) {
  return `${name} Lv${stageNumber}`;
}

/**
 * 「強化」タブの行の文字にする。
 * @param {Array<UpgradeRowLike & { id: string }>} rows 表示する行（game.takenUpgradeRows() の結果）
 * @param {boolean} anyTaken 強化を1つでも取っているか（取った回数で判定した結果）
 * @returns {string[]} 行の文字の並び（取っていなければ取っていないときの文字1行。取っていて表示する行が無ければ空）
 */
export function takenUpgradeLines(rows, anyTaken) {
  if (!anyTaken) return [UPGRADE_NONE_TEXT];
  return rows.map((row) => upgradeTextOf(row.id).taken(row));
}
