/**
 * 責務: 敵の防御の量（隙なら 0・張るかと量の抽選・疲弊での減り）と疲弊しているかの計算、予告に防御の量を付ける処理。
 * 渡された乱数だけを使う純粋な関数（ルール層）。疲弊で減らした量を求めるのはこのファイルだけ。
 */

import { rollAmount, isOpeningAction } from './enemyBehaviors.js';

/**
 * 防御の量を抽選する。張るかの抽選（1回）→ 量の抽選（1回）の順で、張らない結果でも必ず2回 `random()` を呼ぶ。
 * @param {{ chance: number, range: { min: number, max: number } }} spec 防御の設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {number} 防御の量（張らなければ 0）
 */
export function rollDefense(spec, random) {
  const guards = random() < spec.chance;
  const amount = rollAmount(spec.range, random);
  return guards ? amount : 0;
}

/**
 * 戦闘のターン数に当たる疲弊の段を探す（fromTurn <= battleTurn の最後の段）。
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @param {ReadonlyArray<{ fromTurn: number, defenseRate: number }>} fatigue 疲弊の段（fromTurn の昇順）
 * @returns {{ fromTurn: number, defenseRate: number }|null} 当たる段。なければ null
 */
function fatigueStageOf(battleTurn, fatigue) {
  let found = null;
  for (const stage of fatigue) {
    if (stage.fromTurn <= battleTurn) found = stage;
  }
  return found;
}

/**
 * 疲弊を掛けた後の防御の量を求める（疲弊で減らす式はここ1か所）。
 * @param {number} base 疲弊の前の防御の量
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @param {ReadonlyArray<{ fromTurn: number, defenseRate: number }>} fatigue 疲弊の段
 * @returns {number} 疲弊後の防御の量（当たる段がなければ base のまま）
 */
export function fatiguedDefense(base, battleTurn, fatigue) {
  const stage = fatigueStageOf(battleTurn, fatigue);
  return stage === null ? base : Math.floor(base * stage.defenseRate);
}

/**
 * 疲弊しているか（当たる段があるか）。
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @param {ReadonlyArray<{ fromTurn: number, defenseRate: number }>} fatigue 疲弊の段
 * @returns {boolean} 疲弊していれば true
 */
export function isFatigued(battleTurn, fatigue) {
  return fatigueStageOf(battleTurn, fatigue) !== null;
}

/**
 * 行動に防御の量を付けて予告を作る。隙の行動は乱数を呼ばず防御 0、それ以外は `rollDefense`（2回）。
 * @param {{ behavior: { type: string }, defense: { chance: number, range: { min: number, max: number } } }} spec 敵の種類の設定
 * @param {import('./combatants.js').EnemyAction} action 行動の決まりが決めた行動
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @param {ReadonlyArray<{ fromTurn: number, defenseRate: number }>} fatigue 疲弊の段
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {import('./combatants.js').EnemyIntent} 新しい予告
 */
export function createIntent(spec, action, battleTurn, fatigue, random) {
  const baseDefense = isOpeningAction(spec.behavior, action) ? 0 : rollDefense(spec.defense, random);
  return {
    ...action,
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
