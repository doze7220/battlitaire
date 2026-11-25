/**
 * 責務: 新しいゲームのプレイ用の乱数を、Math.random から作った始めの状態で作る（js/ で Math.random を呼ぶ唯一の所）。
 */
import { createRng, rngStateOfSeed } from '../rules/rng.js';

/**
 * 新しいゲームのプレイ用の乱数を作る（`Math.random` は1回だけ呼ぶ）。
 * @returns {import('../rules/rng.js').Rng} 新しい乱数
 */
export function newPlayRng() {
  return createRng(rngStateOfSeed(Math.floor(Math.random() * 2 ** 53)));
}
