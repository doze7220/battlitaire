/**
 * 責務: 攻防（敵の攻撃・防御・振りかぶり、城の被害・札が燃える・敵の回復・敵への攻撃・回復・決着）の出来事の並びと結果を求める純粋な計算。
 * 親子の敵では、敵へのダメージを親と子に分けて出来事に出し、攻防の後の親と子の HP を返す。
 * 子（次のターンに持ち越す攻撃のユニット）を持つ敵では、襲う子をふつうの攻撃に上乗せ（子が先）し、生まれる子の数を返す。
 */

import { splitPartDamage } from './enemyParts.js';
import { minionBirths, minionShares } from './enemySplit.js';

/**
 * 攻防の計算の入力（すべて0以上の整数）。
 * @typedef {Object} BattleInput
 * @property {number} attack 攻撃ゲージの値
 * @property {number} defense 防御ゲージの値
 * @property {number} heal 回復ゲージの値
 * @property {{ kind: 'attack'|'windup'|'guard', amount: number, defense: number }} enemyAction 敵の行動（予告の写し。amount は攻撃の量（振りかぶり・防御だけは 0）、defense はそのターンの防御の量（疲弊の後））
 * @property {number} castleHp 攻防の前の城の HP
 * @property {number} castleMaxHp 城の最大 HP
 * @property {number} enemyHp 攻防の前の敵の HP
 * @property {number} enemyMaxHp 敵の最大 HP（敵の回復の頭打ちに使う）
 * @property {number} enemyHeal 攻撃の直後の敵の回復の候補の量（抽選に外れた・対象外なら 0。最大 HP での頭打ちは計算側で行う）
 * @property {import('./cardBurn.js').BurnedCard[]} [burns] 行動で燃やす札の並び（省くと空。城が落ちたときは燃えない）
 * @property {import('./enemyParts.js').BattleParts|null} [enemyParts] 親子の敵の攻防の前の親と子の HP と当たる順（省く・null は親子でない敵。合計は enemyHp と同じ・enemyHeal は 0）
 * @property {number} [minions] この攻防でふつうの攻撃に上乗せして襲う子の数（省くと 0）
 * @property {{ percent: number }|null} [split] 分裂の設定（省く・null は子が生まれない）
 */

/**
 * 攻防で起きた出来事。量は実際に変わった値。
 * `block`・`castleDamage`・`cardBurn`・`enemyHeal`・`enemyDefend`・`enemyBlock`・`enemyDamage`・`heal` は量が0のとき並びに入らない（敵の行動 `enemyAttack`／`enemyWindup`／`enemyGuard` は必ず1つ入る）。
 * `minionAttack`（襲う子の数）は子が 1 以上のとき敵の攻撃の側（と敵の防御）の直後に、`minionSpawn`（生まれた子の数）は 1 以上のとき `enemyDamage` の直後に入る（倒した攻防では入らない）。
 * `enemyWindup`（敵の振りかぶり）・`enemyGuard`（敵の防御だけの行動）は量 0 で必ず入る（防御の量は続く `enemyDefend`）。`enemyDefeat` は敵の HP が 0 になったとき（量 0）に入る。
 * @typedef {Object} BattleEvent
 * @property {'enemyAttack'|'enemyDefend'|'enemyWindup'|'enemyGuard'|'block'|'castleDamage'|'cardBurn'|'enemyHeal'|'enemyBlock'|'enemyDamage'|'enemyDefeat'|'heal'|'lose'|'minionAttack'|'minionSpawn'} type 出来事の種類
 * @property {number} amount 量（`enemyWindup`・`enemyGuard`・`lose`・`enemyDefeat` は 0。`cardBurn` は燃えた枚数）
 * @property {import('./cardBurn.js').BurnedCard[]} [burns] 燃えた札の並び（`cardBurn` のときだけ）
 * @property {import('./enemyParts.js').PartDamage[]} [parts] 親と子に当たった量（当たる順。`enemyDamage` で親子の敵のときだけ。量の合計は amount）
 * @property {number} [minions] `block`・`castleDamage` のうち子の分（`minionAttack` がある攻防だけ。0 のこともある。子が先）
 */

/**
 * 攻防の計算結果。
 * @typedef {Object} BattleCalc
 * @property {BattleEvent[]} events 出来事の並び（起きた順）
 * @property {number} castleHp 攻防の後の城の HP
 * @property {number} enemyHp 攻防の後の敵の HP
 * @property {boolean} enemyDefeated このフェーズで敵の HP が 0 になったか（負けでは false）
 * @property {'lose'|null} outcome 決着（城が落ちたら 'lose'、そうでなければ null。敵を倒しただけなら null）
 * @property {import('./cardBurn.js').BurnedCard[]} burned 実際に燃えた札の並び（城が落ちて負けで終わったときは空）
 * @property {import('./enemyParts.js').EnemyParts|null} enemyParts 攻防の後の親と子の HP（城が落ちた攻防は入力のまま。親子でない敵は null）
 * @property {number} minions 攻防の後の子の数（その攻防で生まれた数。倒した・城が落ちた攻防・生まれない敵は 0）
 */

/**
 * 攻防を計算する。引数は書き換えない。余った防御は消える。
 * 敵の防御の余りも消える。未知の敵の行動の種類は Error を投げる。親子の敵（入力の `enemyParts`）の親と子の合計が敵の HP と違うとき、敵の回復があるときも Error を投げる。
 * 順序: 敵の行動（攻撃か振りかぶりか防御だけ）→ 敵の防御（量があれば）→ 襲う子（あれば。ふつうの攻撃に上乗せし、盾の兵・城には子が先）→ 相殺 → 城の被害（0なら負け）→ 札が燃える → 敵の回復（最大 HP で頭打ち）→ 敵の防御での相殺 → 敵への攻撃
 * （0になったら撃破の出来事を入れて続ける。倒さず子を持つ敵なら生まれた子の出来事が続く）→ 回復。
 * @param {BattleInput} input 攻防の入力
 * @returns {BattleCalc} 計算結果
 */
export function computeBattle(input) {
  const { attack, defense, heal, enemyAction, castleMaxHp, enemyMaxHp, enemyHeal } = input;
  const burns = input.burns ?? [];
  const battleParts = input.enemyParts ?? null;
  if (battleParts) {
    if (battleParts.hp.parent + battleParts.hp.child !== input.enemyHp) {
      throw new Error('親と子の HP の合計が敵の HP と違う');
    }
    if (enemyHeal > 0) throw new Error('親子の敵の回復は扱わない');
  }
  const partsBefore = battleParts ? { parent: battleParts.hp.parent, child: battleParts.hp.child } : null;
  let castleHp = input.castleHp;
  let enemyHp = input.enemyHp;

  const enemyDefense = enemyAction.defense;
  let enemyAttack;
  /** @type {BattleEvent[]} */
  const events = [];
  if (enemyAction.kind === 'attack') {
    enemyAttack = enemyAction.amount;
    events.push({ type: 'enemyAttack', amount: enemyAttack });
  } else if (enemyAction.kind === 'windup') {
    enemyAttack = 0;
    events.push({ type: 'enemyWindup', amount: 0 });
  } else if (enemyAction.kind === 'guard') {
    enemyAttack = 0;
    events.push({ type: 'enemyGuard', amount: 0 });
  } else {
    throw new Error(`未知の敵の行動の種類: ${enemyAction.kind}`);
  }
  if (enemyDefense > 0) events.push({ type: 'enemyDefend', amount: enemyDefense });

  const minions = input.minions ?? 0;
  if (minions > 0) events.push({ type: 'minionAttack', amount: minions });

  const total = enemyAttack + minions;
  const blocked = Math.min(defense, total);
  const damage = Math.min(total - blocked, castleHp);
  const share = minionShares(minions, blocked, damage);
  if (blocked > 0) events.push({ type: 'block', amount: blocked, ...(minions > 0 ? { minions: share.blocked } : {}) });

  castleHp -= damage;
  if (damage > 0) events.push({ type: 'castleDamage', amount: damage, ...(minions > 0 ? { minions: share.damage } : {}) });

  if (castleHp === 0) {
    events.push({ type: 'lose', amount: 0 });
    return { events, castleHp, enemyHp, enemyDefeated: false, outcome: 'lose', burned: [], enemyParts: partsBefore, minions: 0 };
  }

  const burned = burns.slice();
  if (burned.length > 0) events.push({ type: 'cardBurn', amount: burned.length, burns: burned.slice() });

  const enemyHealed = Math.min(enemyHeal, enemyMaxHp - enemyHp);
  enemyHp += enemyHealed;
  if (enemyHealed > 0) events.push({ type: 'enemyHeal', amount: enemyHealed });

  const enemyBlocked = Math.min(attack, enemyDefense);
  if (enemyBlocked > 0) events.push({ type: 'enemyBlock', amount: enemyBlocked });

  const dealt = Math.min(attack - enemyBlocked, enemyHp);
  enemyHp -= dealt;
  let partsAfter = partsBefore;
  if (dealt > 0) {
    if (battleParts) {
      const split = splitPartDamage(battleParts, dealt);
      partsAfter = split.after;
      events.push({ type: 'enemyDamage', amount: dealt, parts: split.damages });
    } else {
      events.push({ type: 'enemyDamage', amount: dealt });
    }
  }

  const born = enemyHp > 0 ? minionBirths(input.split, dealt) : 0;
  if (born > 0) events.push({ type: 'minionSpawn', amount: born });

  const enemyDefeated = enemyHp === 0;
  if (enemyDefeated) {
    events.push({ type: 'enemyDefeat', amount: 0 });
  }

  const healed = Math.min(heal, castleMaxHp - castleHp);
  castleHp += healed;
  if (healed > 0) events.push({ type: 'heal', amount: healed });

  return { events, castleHp, enemyHp, enemyDefeated, outcome: null, burned, enemyParts: partsAfter, minions: born };
}
