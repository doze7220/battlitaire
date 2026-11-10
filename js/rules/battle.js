/**
 * 責務: 攻防（敵の攻撃・防御、城の被害・敵への攻撃・回復・決着）の出来事の並びと結果を求める純粋な計算。
 */

/**
 * 攻防の計算の入力（すべて0以上の整数）。
 * @typedef {Object} BattleInput
 * @property {number} attack 攻撃ゲージの値
 * @property {number} defense 防御ゲージの値
 * @property {number} heal 回復ゲージの値
 * @property {{ kind: 'attack'|'defend', amount: number }} enemyAction 敵の行動（予告の写し）
 * @property {number} castleHp 攻防の前の城の HP
 * @property {number} castleMaxHp 城の最大 HP
 * @property {number} enemyHp 攻防の前の敵の HP
 */

/**
 * 攻防で起きた出来事。量は実際に変わった値。
 * `block`・`castleDamage`・`enemyBlock`・`enemyDamage`・`heal` は量が0のとき並びに入らない（敵の行動は必ず入る）。
 * @typedef {Object} BattleEvent
 * @property {'enemyAttack'|'enemyDefend'|'block'|'castleDamage'|'enemyBlock'|'enemyDamage'|'heal'|'lose'|'win'} type 出来事の種類
 * @property {number} amount 量（`lose`・`win` は 0）
 */

/**
 * 攻防の計算結果。
 * @typedef {Object} BattleCalc
 * @property {BattleEvent[]} events 出来事の並び（起きた順）
 * @property {number} castleHp 攻防の後の城の HP
 * @property {number} enemyHp 攻防の後の敵の HP
 * @property {'win'|'lose'|null} outcome 決着（決着していなければ null）
 */

/**
 * 攻防を計算する。引数は書き換えない。余った防御は消える。
 * 敵の防御の余りも消える。未知の敵の行動の種類は Error を投げる。
 * 順序: 敵の行動 → 相殺 → 城の被害（0なら負け）→ 敵の防御での相殺 → 敵への攻撃（0なら勝ち）→ 回復。
 * @param {BattleInput} input 攻防の入力
 * @returns {BattleCalc} 計算結果
 */
export function computeBattle(input) {
  const { attack, defense, heal, enemyAction, castleMaxHp } = input;
  let castleHp = input.castleHp;
  let enemyHp = input.enemyHp;

  let enemyAttack;
  let enemyDefense;
  /** @type {BattleEvent[]} */
  const events = [];
  if (enemyAction.kind === 'attack') {
    enemyAttack = enemyAction.amount;
    enemyDefense = 0;
    events.push({ type: 'enemyAttack', amount: enemyAttack });
  } else if (enemyAction.kind === 'defend') {
    enemyAttack = 0;
    enemyDefense = enemyAction.amount;
    events.push({ type: 'enemyDefend', amount: enemyDefense });
  } else {
    throw new Error(`未知の敵の行動の種類: ${enemyAction.kind}`);
  }

  const blocked = Math.min(defense, enemyAttack);
  if (blocked > 0) events.push({ type: 'block', amount: blocked });

  const damage = Math.min(enemyAttack - blocked, castleHp);
  castleHp -= damage;
  if (damage > 0) events.push({ type: 'castleDamage', amount: damage });

  if (castleHp === 0) {
    events.push({ type: 'lose', amount: 0 });
    return { events, castleHp, enemyHp, outcome: 'lose' };
  }

  const enemyBlocked = Math.min(attack, enemyDefense);
  if (enemyBlocked > 0) events.push({ type: 'enemyBlock', amount: enemyBlocked });

  const dealt = Math.min(attack - enemyBlocked, enemyHp);
  enemyHp -= dealt;
  if (dealt > 0) events.push({ type: 'enemyDamage', amount: dealt });

  if (enemyHp === 0) {
    events.push({ type: 'win', amount: 0 });
    return { events, castleHp, enemyHp, outcome: 'win' };
  }

  const healed = Math.min(heal, castleMaxHp - castleHp);
  castleHp += healed;
  if (healed > 0) events.push({ type: 'heal', amount: healed });

  return { events, castleHp, enemyHp, outcome: null };
}
