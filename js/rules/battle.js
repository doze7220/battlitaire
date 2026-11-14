/**
 * 責務: 攻防（敵の攻撃・防御・振りかぶり、城の被害・敵の回復・敵への攻撃・回復・決着）の出来事の並びと結果を求める純粋な計算。
 */

/**
 * 攻防の計算の入力（すべて0以上の整数）。
 * @typedef {Object} BattleInput
 * @property {number} attack 攻撃ゲージの値
 * @property {number} defense 防御ゲージの値
 * @property {number} heal 回復ゲージの値
 * @property {{ kind: 'attack'|'defend'|'windup', amount: number }} enemyAction 敵の行動（予告の写し）
 * @property {number} castleHp 攻防の前の城の HP
 * @property {number} castleMaxHp 城の最大 HP
 * @property {number} enemyHp 攻防の前の敵の HP
 * @property {number} enemyMaxHp 敵の最大 HP（敵の回復の頭打ちに使う）
 * @property {number} enemyHeal 攻撃の直後の敵の回復の候補の量（抽選に外れた・対象外なら 0。最大 HP での頭打ちは計算側で行う）
 * @property {number} enemyArmor 敵の常時防御力（毎フェーズ、自軍の攻撃を減らす壁）
 * @property {boolean} lastEnemy いまの敵が最後の敵か（最後の敵を倒すと勝ち、途中の敵なら回復へ進む）
 */

/**
 * 攻防で起きた出来事。量は実際に変わった値。
 * `block`・`castleDamage`・`enemyHeal`・`enemyBlock`・`enemyArmorBlock`・`enemyDamage`・`heal` は量が0のとき並びに入らない（敵の行動は必ず入る）。
 * `enemyWindup`（敵の振りかぶり）は量 0 で必ず入る。`enemyDefeat` は途中の敵を倒したとき（量 0）だけ入る。
 * @typedef {Object} BattleEvent
 * @property {'enemyAttack'|'enemyDefend'|'enemyWindup'|'block'|'castleDamage'|'enemyHeal'|'enemyBlock'|'enemyArmorBlock'|'enemyDamage'|'enemyDefeat'|'heal'|'lose'|'win'} type 出来事の種類
 * @property {number} amount 量（`enemyWindup`・`lose`・`win`・`enemyDefeat` は 0）
 */

/**
 * 攻防の計算結果。
 * @typedef {Object} BattleCalc
 * @property {BattleEvent[]} events 出来事の並び（起きた順）
 * @property {number} castleHp 攻防の後の城の HP
 * @property {number} enemyHp 攻防の後の敵の HP
 * @property {boolean} enemyDefeated このフェーズで敵の HP が 0 になったか（最後の敵でも true）
 * @property {'win'|'lose'|null} outcome 決着（決着していなければ null。途中の敵を倒しただけなら null）
 */

/**
 * 攻防を計算する。引数は書き換えない。余った防御は消える。
 * 敵の防御の余り・常時防御力の余りも消える。未知の敵の行動の種類は Error を投げる。
 * 順序: 敵の行動 → 相殺 → 城の被害（0なら負け）→ 敵の回復（最大 HP で頭打ち）→ 敵の防御での相殺 → 常時防御力での相殺 → 敵への攻撃
 * （0になったとき、最後の敵なら勝ちで終わり、途中の敵なら撃破の出来事を入れて続ける）→ 回復。
 * @param {BattleInput} input 攻防の入力
 * @returns {BattleCalc} 計算結果
 */
export function computeBattle(input) {
  const { attack, defense, heal, enemyAction, castleMaxHp, enemyMaxHp, enemyHeal, enemyArmor, lastEnemy } = input;
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
  } else if (enemyAction.kind === 'windup') {
    enemyAttack = 0;
    enemyDefense = 0;
    events.push({ type: 'enemyWindup', amount: 0 });
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
    return { events, castleHp, enemyHp, enemyDefeated: false, outcome: 'lose' };
  }

  const enemyHealed = Math.min(enemyHeal, enemyMaxHp - enemyHp);
  enemyHp += enemyHealed;
  if (enemyHealed > 0) events.push({ type: 'enemyHeal', amount: enemyHealed });

  const enemyBlocked = Math.min(attack, enemyDefense);
  if (enemyBlocked > 0) events.push({ type: 'enemyBlock', amount: enemyBlocked });

  const armorBlocked = Math.min(attack - enemyBlocked, enemyArmor);
  if (armorBlocked > 0) events.push({ type: 'enemyArmorBlock', amount: armorBlocked });

  const dealt = Math.min(attack - enemyBlocked - armorBlocked, enemyHp);
  enemyHp -= dealt;
  if (dealt > 0) events.push({ type: 'enemyDamage', amount: dealt });

  const enemyDefeated = enemyHp === 0;
  if (enemyDefeated) {
    if (lastEnemy) {
      events.push({ type: 'win', amount: 0 });
      return { events, castleHp, enemyHp, enemyDefeated, outcome: 'win' };
    }
    events.push({ type: 'enemyDefeat', amount: 0 });
  }

  const healed = Math.min(heal, castleMaxHp - castleHp);
  castleHp += healed;
  if (healed > 0) events.push({ type: 'heal', amount: healed });

  return { events, castleHp, enemyHp, enemyDefeated, outcome: null };
}
