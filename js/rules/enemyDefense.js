/**
 * 責務: 敵の防御の量（張るかと量の抽選）の計算。
 * 渡された乱数だけを使う純粋な関数（ルール層）。予告の組み立ては enemyIntent.js。
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
