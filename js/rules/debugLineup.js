/**
 * 責務: DEBUG タブの先の並びの一覧の1行（ステージの番号・★・敵の名前・今か）を、ゲームの状態とステージの並びから求める。
 * 状態は読むだけで変えない。import は stageOrder.js と enemyTypes.js だけ。
 */
import { enemyTypeIdOfStage } from './stageOrder.js';
import { enemySpecOf } from './enemyTypes.js';

/**
 * 先の並びの一覧の1行。
 * @typedef {Object} LineupRow
 * @property {number} stageNumber ステージの番号
 * @property {number} star そのステージの敵の★
 * @property {string} name そのステージの敵の名前
 * @property {boolean} current 今のステージの行か（offset が 0）
 */

/**
 * 今のステージから offset 先のステージの1行を求める。今のステージ（offset 0）は今の敵（DEBUG の敵の切り替えの後も画面の敵と合わせる）、
 * ほかは `enemyTypeIdOfStage` の敵。状態は変えない。
 * @param {{ config: object, seed: number, stageNumber: number, enemy: { typeId: string } }} game ルール層の状態
 * @param {number} offset 今のステージからの先の数（0 以上の整数）
 * @returns {LineupRow} 1行の中身
 * @throws {Error} offset が 0 以上の整数でないとき。
 */
export function stageLineupRow(game, offset) {
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error(`stageLineupRow: offset は 0 以上の整数にしてください: ${offset}`);
  }
  const stageNumber = game.stageNumber + offset;
  const typeId = offset === 0
    ? game.enemy.typeId
    : enemyTypeIdOfStage(game.config, game.seed, stageNumber);
  const spec = enemySpecOf(game.config, typeId);
  return { stageNumber, star: spec.star, name: spec.name, current: offset === 0 };
}
