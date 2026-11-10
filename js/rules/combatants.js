/**
 * 責務: 城・敵の状態の生成と、敵の次の行動の決定（ルール層。画面・エンジンには触れない）。
 */

/**
 * 敵の行動（予告にも使う）。
 * @typedef {Object} EnemyAction
 * @property {string} kind 行動の種類（今は 'attack' だけ）
 * @property {number} amount 行動の量（攻撃なら攻撃の値）
 */

/**
 * 城の状態。
 * @typedef {Object} Castle
 * @property {number} hp 現在の HP
 * @property {number} maxHp 最大 HP
 */

/**
 * 敵の状態。
 * @typedef {Object} Enemy
 * @property {number} hp 現在の HP
 * @property {number} maxHp 最大 HP
 * @property {EnemyAction|null} intent 次の行動の予告（未決定なら null）
 */

/**
 * 城の初期状態を作る。
 * @param {{ castleMaxHp: number }} config ルールの設定
 * @returns {Castle} HP が最大の城
 */
export function createCastle(config) {
  return { hp: config.castleMaxHp, maxHp: config.castleMaxHp };
}

/**
 * 敵の初期状態を作る（予告はまだ決めない）。
 * @param {{ enemyMaxHp: number }} config ルールの設定
 * @returns {Enemy} HP が最大で、予告が null の敵
 */
export function createEnemy(config) {
  return { hp: config.enemyMaxHp, maxHp: config.enemyMaxHp, intent: null };
}

/**
 * 敵の次の行動を決める。今は毎回 `config.enemyAction` の写しを返す。
 * @param {{ enemyAction: { kind: string, amount: number } }} config ルールの設定
 * @returns {EnemyAction} 新しい行動オブジェクト
 */
export function planEnemyAction(config) {
  return { kind: config.enemyAction.kind, amount: config.enemyAction.amount };
}
