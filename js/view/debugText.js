/**
 * 責務: DEBUG タブの文字を凍結した定数で持ち、次の行動の選択肢・HP・FPS を文字にする。
 * 何も import しない。
 */

/**
 * DEBUG タブの文字（凍結）。敵の名前は config.js の name を使うのでここには書かない。
 * @type {Readonly<{
 *   tab: string, troopsHeading: string, troopsLocked: string,
 *   troops: Readonly<{ attack: string, defense: string, heal: string }>,
 *   enemy: string, intent: string, noChoice: string,
 *   castleHp: string, enemyHp: string, hpToOne: string, hpToFull: string,
 *   fpsVisible: string, fps: string
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
  castleHp: '城の HP',
  enemyHp: '敵の HP',
  hpToOne: '1 にする',
  hpToFull: '満タンにする',
  fpsVisible: 'FPS を表示',
  fps: 'FPS',
});

/**
 * 次の行動の識別子から選択肢の文字を引く表（凍結）。
 * @type {Readonly<Record<string, string>>}
 */
export const INTENT_CHOICE_TEXT = Object.freeze({
  attack: '攻撃',
  defend: '防御',
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
