/**
 * 責務: DEBUG タブの文字を凍結した定数で持ち、ステージを移るボタン・次の行動の選択肢・HP・FPS・
 * 強化のボタン・ルールの値の項目名・効く時期・百分率を文字にする。何も import しない。
 */

/**
 * DEBUG タブの文字（凍結）。敵の名前は config.js の name を使うのでここには書かない。
 * @type {Readonly<{
 *   tab: string, troopsHeading: string, troopsLocked: string,
 *   troops: Readonly<{ attack: string, defense: string, heal: string }>,
 *   stage: string, enemy: string, intent: string, noChoice: string, battleTurn: string,
 *   castleHp: string, enemyHp: string, hpToOne: string, hpToFull: string,
 *   childToZero: string, parentToZero: string,
 *   upgrades: string, upgradeOffer: string, upgradeClear: string,
 *   fpsVisible: string, fps: string, bakedDrawing: string,
 *   rulesCastle: string, rulesReset: string
 * }>}
 */
export const DEBUG_TEXT = Object.freeze({
  tab: 'DEBUG',
  troopsHeading: '兵の数',
  troopsLocked: '兵が動いている間は変えられません',
  troops: Object.freeze({ attack: '攻撃の兵', defense: '防御の兵', heal: '修理の兵' }),
  stage: 'ステージ',
  enemy: '敵',
  intent: '敵の次の行動',
  noChoice: '－',
  battleTurn: 'この戦闘のターン',
  castleHp: '城の HP',
  enemyHp: '敵の HP',
  hpToOne: '1 にする',
  hpToFull: '満タンにする',
  childToZero: '子を 0 にする',
  parentToZero: '親を 0 にする',
  upgrades: '強化',
  upgradeOffer: '3択を出す',
  upgradeClear: '強化をすべて外す',
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
  heavyMin: '大攻撃の量 最小',
  heavyMax: '大攻撃の量 最大',
  chargeChance: '溜める確率',
  chargeTurns: '溜めのターン数',
  attackChance: '攻撃する確率',
  bigGuardChance: '大防御の確率',
  bigGuardMin: '大防御の量 最小',
  bigGuardMax: '大防御の量 最大',
  maxHpTotal: '最大 HP（合計）',
  youngAttackMin: '子の攻撃の量 最小',
  youngAttackMax: '子の攻撃の量 最大',
  protectChance: '守る確率',
  protectMin: '守るの防御 最小',
  protectMax: '守るの防御 最大',
  rushMin: '突進の量 最小',
  rushMax: '突進の量 最大',
  rageChance: '怒りを溜める確率',
  bigRushMin: '大突進の量 最小',
  bigRushMax: '大突進の量 最大',
});

/**
 * ルールの値が効く時期の識別子から文字を引く表（凍結）。
 * @type {Readonly<Record<string, string>>}
 */
export const RULE_TIMING_TEXT = Object.freeze({
  now: 'すぐ',
  nextIntent: '次の予告から',
  nextCycle: '次の周期から',
  nextCharge: '次の溜めから',
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
  charge: '溜める',
  heavy: '大攻撃',
  guard: '防御',
  bigGuard: '大防御',
  youngAttack: '子の攻撃',
  protect: '子どもたちを守る',
  rush: '突進',
  rage: '怒りを溜める',
  bigRush: '大突進',
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
 * ステージを移るボタンの文字にする。
 * @param {number} delta 移る数（負なら戻る）
 * @returns {string} 例「−5」「+1」
 */
export function stageStepText(delta) {
  return delta < 0 ? `−${-delta}` : `+${delta}`;
}

/**
 * FPS の値を文字にする。
 * @param {number|null} v FPS（まだ測れていなければ null）
 * @returns {string} null なら「--」、そうでなければ数の文字
 */
export function fpsText(v) {
  return v === null ? '--' : String(v);
}

/**
 * 強化の「取る」ボタンの文字にする。
 * @param {string} name 強化の名前
 * @param {number} count 今取っている回数
 * @returns {string} 例「城の最大 HP を取る（今 0 回）」「数字 3 の札 を取る（今 1 回）」
 */
export function upgradeAddText(name, count) {
  return `${name} を取る（今 ${count} 回）`;
}
