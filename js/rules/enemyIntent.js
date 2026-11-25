/**
 * 責務: 敵の行動に、ステージの加算（攻撃・防御）と防御の量を付けて予告を作り、疲弊を掛けて数え直す（純粋関数。ルール層）。
 * 予告にステージの加算を足すのはこのファイルだけ。渡された乱数だけを使う。
 */

import { isOpeningAction } from './enemyBehaviors.js';
import { rollDefense, fatiguedDefense } from './enemyDefense.js';

/**
 * 行動にステージの加算と防御の量を付けて予告を作る。
 * 攻撃は量に攻撃の加算を足す（振りかぶり・吸い込む・防御だけは 0 のまま）。
 * 行動が防御の量 `guard` を持つときは、乱数を呼ばず `guard` に防御の加算を足した量（予告には `guard` を残さない）。
 * 持たないときは、隙の行動は乱数を呼ばず防御 0、敵の設定に `defense` がなければ乱数を呼ばず防御 0、
 * それ以外は `rollDefense`（必ず2回）で、張れば量に防御の加算を足し、張らなければ 0。これが baseDefense（加算後・疲弊の前）。
 * @param {{ behavior: { type: string }, defense?: { chance: number, range: { min: number, max: number } } }} spec 敵の種類の設定
 * @param {import('./combatants.js').EnemyAction} action 行動の決まりが決めた行動（量は加算の前）
 * @param {import('./stageBonus.js').StageBonus} bonus ステージの加算量
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @param {ReadonlyArray<{ fromTurn: number, defenseRate: number }>} fatigue 疲弊の段
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {import('./combatants.js').EnemyIntent} 新しい予告
 */
export function createIntent(spec, action, bonus, battleTurn, fatigue, random) {
  const { guard, ...rest } = action;
  let baseDefense = 0;
  if (guard !== undefined) {
    baseDefense = guard + bonus.defense;
  } else if (!isOpeningAction(spec.behavior, action) && spec.defense !== undefined) {
    const rolled = rollDefense(spec.defense, random);
    baseDefense = rolled === null ? 0 : rolled + bonus.defense;
  }
  return {
    ...rest,
    amount: action.kind === 'attack' ? action.amount + bonus.attack : action.amount,
    baseDefense,
    defense: fatiguedDefense(baseDefense, battleTurn, fatigue),
  };
}

/**
 * 元の防御の量（baseDefense）から、いまのターン数で defense を数え直した新しい予告を返す（乱数は呼ばない）。
 * @param {import('./combatants.js').EnemyIntent} intent 今の予告
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @param {ReadonlyArray<{ fromTurn: number, defenseRate: number }>} fatigue 疲弊の段
 * @returns {import('./combatants.js').EnemyIntent} 新しい予告
 */
export function refreshIntent(intent, battleTurn, fatigue) {
  return { ...intent, defense: fatiguedDefense(intent.baseDefense, battleTurn, fatigue) };
}
