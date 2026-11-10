/**
 * 責務: 城・敵の状態の生成と、敵の次の行動の決定（渡された乱数で。ルール層。画面・エンジンには触れない）。
 */

/**
 * 敵の行動（予告にも使う）。
 * @typedef {Object} EnemyAction
 * @property {'attack'|'defend'} kind 行動の種類（攻撃・防御）
 * @property {number} amount 行動の量（攻撃なら攻撃の値、防御なら防御の値）
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
 * 敵の次の行動を、設定の重みと渡された乱数で決める。`random()` は1回だけ呼ぶ。
 * @param {{ enemyActions: ReadonlyArray<{ kind: string, amount: number, weight: number }> }} config ルールの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {EnemyAction} 新しい行動オブジェクト（重みは含まない）
 */
export function planEnemyAction(config, random) {
  const specs = config.enemyActions;
  const total = specs.reduce((sum, spec) => sum + spec.weight, 0);
  const r = random() * total;
  let acc = 0;
  for (const spec of specs) {
    acc += spec.weight;
    if (acc > r) return { kind: spec.kind, amount: spec.amount };
  }
  const last = specs[specs.length - 1];
  return { kind: last.kind, amount: last.amount };
}
