/**
 * 1回のゲームの結果の集計（かかったフェーズ数・敵に与えた総ダメージ・城が受けた総ダメージ・回復の合計）の生成と、
 * 攻防の出来事の並びからの加算を担う純粋関数のモジュール（ルール層）。
 */

/**
 * 1回のゲームの結果の集計。
 * @typedef {Object} GameStats
 * @property {number} phases かかったフェーズ数（「行動終了」の攻防の回数）
 * @property {number} damageDealt 敵に与えた総ダメージ
 * @property {number} damageTaken 城が受けた総ダメージ
 * @property {number} healed 回復の合計
 */

/**
 * 数える出来事の種類と、足す先の集計の項目の対応表。
 * @type {Readonly<Record<string, 'damageDealt'|'damageTaken'|'healed'>>}
 */
const TALLY_FIELDS = Object.freeze({
  enemyDamage: 'damageDealt',
  castleDamage: 'damageTaken',
  heal: 'healed',
});

/**
 * すべて 0 の集計を作る。
 * @returns {GameStats} 新しい集計
 */
export function createGameStats() {
  return { phases: 0, damageDealt: 0, damageTaken: 0, healed: 0 };
}

/**
 * 1回の攻防の出来事の並びを足した新しい集計を返す（引数は書き換えない）。
 * phases に 1 を足し、対応表にある種類の出来事の量をそれぞれの項目に足す。ほかの種類は数えない。
 * @param {GameStats} stats 足す前の集計
 * @param {import('./battle.js').BattleEvent[]} events 1回の攻防の出来事の並び
 * @returns {GameStats} 足した後の新しい集計
 */
export function tallyBattle(stats, events) {
  const next = { ...stats, phases: stats.phases + 1 };
  for (const event of events) {
    const field = TALLY_FIELDS[event.type];
    if (field !== undefined) next[field] += event.amount;
  }
  return next;
}
