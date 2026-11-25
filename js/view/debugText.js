/**
 * 責務: DEBUG タブの文字を凍結した定数で持ち、次の行動の選択肢・HP・FPS・
 * ルールの値の項目名・効く時期・百分率を文字にする。何も import しない。
 */

/**
 * DEBUG タブの文字（凍結）。敵の名前は config.js の name を使うのでここには書かない。
 * @type {Readonly<{
 *   tab: string, troopsHeading: string, troopsLocked: string,
 *   troops: Readonly<{ attack: string, defense: string, heal: string }>,
 *   enemy: string, intent: string, noChoice: string, battleTurn: string,
 *   castleHp: string, enemyHp: string, hpToOne: string, hpToFull: string,
 *   fpsVisible: string, fps: string, bakedDrawing: string,
 *   rulesCastle: string, rulesReset: string
 * }>}
 */
export const DEBUG_TEXT = Object.freeze({
  tab: 'DEBUG',
  troopsHeading: '兵の数',
  troopsLocked: '兵が動いている間は変えられません',
  troops: Object.freeze({ attack: '攻撃の兵', defense: '防御の兵', heal: '修理の兵' }),
  enemy: '敵',
  intent: '敵の次の行動',
  noChoice: '－',
  battleTurn: 'この戦闘のターン',
  castleHp: '城の HP',
  enemyHp: '敵の HP',
  hpToOne: '1 にする',
  hpToFull: '満タンにする',
  fpsVisible: 'FPS を表示',
  fps: 'FPS',
  bakedDrawing: '焼き付けで描く',
  rulesCastle: '城',
  rulesReset: 'ルールの値を元に戻す',
});

/**
 * ルールの値の項目名の識別子（RuleItem.name）から文字を引く表（凍結）。
 * @type {Readonly<Record<string, string>>}
 */
export const RULE_ITEM_TEXT = Object.freeze({
  maxHp: '最大 HP',
  attackMin: '攻撃の量 最小',
  attackMax: '攻撃の量 最大',
  cycleLength: '攻撃までのターン数',
  healChance: '攻撃後に回復する確率',
  healAmount: '回復の量',
  clawMin: '爪の量 最小',
  clawMax: '爪の量 最大',
  breathMin: 'ブレスの量 最小',
  breathMax: 'ブレスの量 最大',
  burnMin: '燃やす札 最小',
  burnMax: '燃やす札 最大',
  inhaleChance: '吸い込む確率',
  defenseChance: '防御を張る確率',
  defenseMin: '防御の量 最小',
  defenseMax: '防御の量 最大',
});

/**
 * ルールの値が効く時期の識別子から文字を引く表（凍結）。
 * @type {Readonly<Record<string, string>>}
 */
export const RULE_TIMING_TEXT = Object.freeze({
  now: 'すぐ',
  nextIntent: '次の予告から',
  nextCycle: '次の周期から',
  nextBattle: '次の攻防から',
  onAppear: '出てきたときから',
});

/**
 * 項目名と効く時期を「項目名（時期）」の文字にする。
 * @param {string} name 項目名の識別子
 * @param {string} timing 効く時期の識別子
 * @returns {string} 例「最大 HP（すぐ）」。表にない名前・時期は識別子そのもの
 */
export function ruleItemText(name, timing) {
  return `${RULE_ITEM_TEXT[name] ?? name}（${RULE_TIMING_TEXT[timing] ?? timing}）`;
}

/**
 * 0〜1 の値を百分率の文字にする。
 * @param {number} v 値（0〜1）
 * @returns {string} 例「25%」
 */
export function percentText(v) {
  return `${Math.round(v * 100)}%`;
}

/**
 * 次の行動の識別子から選択肢の文字を引く表（凍結）。
 * @type {Readonly<Record<string, string>>}
 */
export const INTENT_CHOICE_TEXT = Object.freeze({
  attack: '攻撃',
  attackDefend: '攻撃と防御',
  windup: '振りかぶり',
  attackHeal: '攻撃して回復',
  claw: '爪',
  inhale: '吸い込む',
  breath: 'ブレス',
});

/**
 * 次の行動の識別子を選択肢の文字にする。
 * @param {string} id 行動の識別子
 * @returns {string} 表にあればその文字、なければ識別子そのもの
 */
export function intentChoiceText(id) {
  return INTENT_CHOICE_TEXT[id] ?? id;
}

/**
 * HP を「今 / 最大」の文字にする。
 * @param {number} hp 今の HP
 * @param {number} maxHp 最大 HP
 * @returns {string} 例「32 / 50」
 */
export function hpText(hp, maxHp) {
  return `${hp} / ${maxHp}`;
}

/**
 * FPS の値を文字にする。
 * @param {number|null} v FPS（まだ測れていなければ null）
 * @returns {string} null なら「--」、そうでなければ数の文字
 */
export function fpsText(v) {
  return v === null ? '--' : String(v);
}
