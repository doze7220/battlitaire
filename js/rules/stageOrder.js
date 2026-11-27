/** ステージの番号と種から、そのステージの敵の種類を決める純粋関数（★と同じ★の中の何番目かは `starDraw.js` の抽選の並びから。最初の1体は設定の `first`）。
 * 乱数は呼ばない。 */
import { enemyMotionsOfStar, enemySpecOf } from './enemyTypes.js';
import { motionIndexAt } from './motionOrder.js';
import { seededIndex, STREAM } from './seededIndex.js';
import { starDrawAt } from './starDraw.js';

/**
 * 種とステージの番号から、そのステージの敵の種類の識別子を決める。
 * ★と同じ★の中の何番目か（position）は `starDrawAt` の抽選の並びから求める。
 * 最初の1体: position が 0 で、その★の抽選の行（`stageStars.draws` のうち star が同じ行）に `first` があれば、`first` を返す。
 * それ以外は、動きが2つ以上ある★では動きが同じ★の中で隣り合わない（動きが1つの★では同じ動きの敵が続く）。同じ動きの中の敵は番号から選ぶ。
 * @param {{enemies: Readonly<Object<string, {star: number, behavior: {type: string}}>>, stageStars: import('./config.js').StageStarsSpec}} config ルールの設定。
 * @param {number} seed 種（整数）。
 * @param {number} stageNumber ステージの番号（1 以上の整数）。
 * @returns {string} 敵の種類の識別子。
 * @throws {Error} stageNumber が 1 以上の整数でないとき、その★の敵がないとき、`first` が設定にない敵・★の違う敵のとき。
 */
export function enemyTypeIdOfStage(config, seed, stageNumber) {
  if (!Number.isInteger(stageNumber) || stageNumber < 1) {
    throw new Error(`enemyTypeIdOfStage: ステージの番号は 1 以上の整数です: ${stageNumber}`);
  }
  const { star, position } = starDrawAt(config.stageStars, seed, stageNumber);
  const motions = enemyMotionsOfStar(config, star);
  if (motions.length === 0) {
    throw new Error(`enemyTypeIdOfStage: ★${star} の敵がいません`);
  }
  if (position === 0) {
    const draw = config.stageStars.draws.find((d) => d.star === star);
    if (draw !== undefined && draw.first !== undefined) {
      if (enemySpecOf(config, draw.first).star !== star) {
        throw new Error(`enemyTypeIdOfStage: first の敵 ${draw.first} は★${star} ではありません`);
      }
      return draw.first;
    }
  }
  const members = motions[motionIndexAt(seed, position, motions.length)];
  return members[seededIndex(seed, STREAM.member, stageNumber, members.length)];
}
