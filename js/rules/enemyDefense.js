/**
 * 責務: 敵の防御の量（張るかと量の抽選・疲弊での減り）と疲弊しているかの計算。
 * 渡された乱数だけを使う純粋な関数（ルール層）。疲弊で減らした量を求めるのはこのファイルだけ。予告の組み立ては enemyIntent.js。
 */

import { rollAmount } from './enemyBehaviors.js';

/**
 * 防御の量を抽選する。張るかの抽選（1回）→ 量の抽選（1回）の順で、張らない結果でも必ず2回 `random()` を呼ぶ。
 * @param {{ chance: number, range: { min: number, max: number } }} spec 防御の設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量は幅の中のこの倍数。既定 1。1 では今と同じ値）
 * @returns {number|null} 防御の量（張らなければ null。量が 0 でも張ったなら 0）
 */
export function rollDefense(spec, random, unit = 1) {
  const guards = random() < spec.chance;
  const amount = rollAmount(spec.range, random, unit);
  return guards ? amount : null;
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
