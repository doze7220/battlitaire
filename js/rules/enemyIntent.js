/**
 * 責務: 敵の行動に、ステージの加算（攻撃・防御）と防御の量と激昂の倍率を付けて予告を作り、戦闘のターンを変えたときに倍率を数え直す（純粋関数。ルール層）。
 * 予告にステージの加算を足すのはこのファイルだけ。渡された乱数だけを使う。
 */

import { isOpeningAction } from './enemyBehaviors.js';
import { rollDefense } from './enemyDefense.js';
import { rageStatusOf, ragedAmount } from './enemyRage.js';
import { stockSpentOf } from './enemyStock.js';
import { unitPointsOf, floorToUnit } from './unitPoints.js';

/**
 * 行動にステージの加算と防御の量と激昂の倍率を付けて予告を作る。
 * 攻撃は量に攻撃の加算を足し（baseAmount。振りかぶり・吸い込む・防御だけは 0 のまま）、激昂の倍率をかけた量を amount にする。
 * 行動が防御の量 `guard` を持つときは、乱数を呼ばず `guard` に防御の加算を足した量（予告には `guard` を残さない）。
 * 持たないときは、隙の行動は乱数を呼ばず防御 0、敵の設定に `defense` がなければ乱数を呼ばず防御 0、
 * それ以外は `rollDefense`（必ず2回）で、張れば量に防御の加算を足し、張らなければ 0。これが defense（激昂の倍率はかけない）。
 * 攻撃・防御に足す加算は、敵の1体のポイント（`unitPoints`）の倍数に切り捨てる（1 では今と同じ値）。倍率は乱数を使わない。
 * @param {{ unitPoints?: number, behavior: { type: string }, defense?: { chance: number, range: { min: number, max: number } } }} spec 敵の種類の設定
 * @param {import('./combatants.js').EnemyAction} action 行動の決まりが決めた行動（量は加算の前）
 * @param {import('./stageBonus.js').StageBonus} bonus ステージの加算量
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @param {{ fromTurn: number, stepPercent: number }} rage 激昂の設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {import('./combatants.js').EnemyIntent} 新しい予告
 */
export function createIntent(spec, action, bonus, battleTurn, rage, random) {
  const { guard, ...rest } = action;
  const unit = unitPointsOf(spec);
  const defenseBonus = floorToUnit(bonus.defense, unit);
  let defense = 0;
  if (guard !== undefined) {
    defense = guard + defenseBonus;
  } else if (!isOpeningAction(spec.behavior, action) && spec.defense !== undefined) {
    const rolled = rollDefense(spec.defense, random, unit);
    defense = rolled === null ? 0 : rolled + defenseBonus;
  }
  const baseAmount = action.kind === 'attack' ? action.amount + floorToUnit(bonus.attack, unit) : action.amount;
  return {
    ...rest,
    amount: ragedAmount(baseAmount, rageStatusOf(rage, battleTurn).percent, unit),
    baseAmount,
    defense,
  };
}

/**
 * 倍率の前の攻撃の量（baseAmount）から、いまのターン数の激昂の倍率で amount を数え直した新しい予告を返す（乱数は呼ばない。防御などはそのまま）。
 * 攻撃に移した溜め（`stockSpentOf`。体当たり）は倍率をかけず、倍率の後の量に足し直す（持たない敵は 0 で今と同じ値）。
 * @param {{ unitPoints?: number }} spec 敵の種類の設定
 * @param {import('./combatants.js').EnemyIntent} intent 今の予告
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @param {{ fromTurn: number, stepPercent: number }} rage 激昂の設定
 * @returns {import('./combatants.js').EnemyIntent} 新しい予告
 */
export function refreshIntent(spec, intent, battleTurn, rage) {
  return {
    ...intent,
    amount:
      ragedAmount(intent.baseAmount, rageStatusOf(rage, battleTurn).percent, unitPointsOf(spec)) + stockSpentOf(intent),
  };
}
