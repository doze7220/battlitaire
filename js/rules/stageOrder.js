/** ステージの番号と種から、そのステージの敵の種類と、くじ袋の決まりの★では袋の何番目かを決める純粋関数（★と同じ★の中の何番目かは `starDraw.js` の抽選の並びから。
 * ★ごとの並びの決まり（動きの組・くじ袋）は設定の名前で表を引く。最初の1体は設定の `first`）。乱数は呼ばない。 */
import { enemyMotionsOfStar, enemySpecOf, enemyTypeIdsOfStar } from './enemyTypes.js';
import { motionIndexAt } from './motionOrder.js';
import { bagMemberAt, bagSlotOf } from './bagOrder.js';
import { seededIndex, STREAM } from './seededIndex.js';
import { starDrawAt } from './starDraw.js';

/**
 * そのステージの選び方に要る値（starDrawAt の答えと、その★の行の決まり）。
 * @typedef {Object} StagePick
 * @property {number} star ステージの★。
 * @property {number} position 同じ★の中の何番目か（0 から）。
 * @property {number} stageNumber ステージの番号。
 * @property {string[]} members その★の敵の種類の識別子（設定に書いた順。空でない）。
 * @property {string|undefined} first その★の最初の1体（行の first。なければ undefined）。
 * @property {number} lane 袋の列の番号（draws の行の番号。base の★は draws の数）。
 * @property {number} lanes 袋の列の数（draws の数 + 1）。
 */

/**
 * ルールの設定の形（このファイルで使う部分）。
 * @typedef {{enemies: Readonly<Object<string, {star: number, behavior: {type: string}}>>, stageStars: import('./config.js').StageStarsSpec}} StageOrderConfig
 */

/**
 * ★の行（draws のうち star が同じ行。なければ base）の並びの決まりを求める。★の数字では分岐しない。
 * @param {import('./config.js').StageStarsSpec} stageStars ★の抽選の決まり。
 * @param {number} star ステージの★。
 * @returns {{order: string, first: (string|undefined), lane: number, lanes: number}} 並びの決まりの名前・最初の1体・袋の列の番号・袋の列の数。
 */
function starRuleOf(stageStars, star) {
  const lanes = stageStars.draws.length + 1;
  const lane = stageStars.draws.findIndex((d) => d.star === star);
  if (lane >= 0) {
    const draw = stageStars.draws[lane];
    return { order: draw.order, first: draw.first, lane, lanes };
  }
  return { order: stageStars.baseOrder, first: undefined, lane: stageStars.draws.length, lanes };
}

/**
 * 動きの組で敵を選ぶ（今までの選び方そのまま）。
 * @param {StageOrderConfig} config ルールの設定。
 * @param {number} seed 種（整数）。
 * @param {StagePick} pick 選び方に要る値。
 * @returns {string} 敵の種類の識別子。
 */
function motionTypeIdAt(config, seed, pick) {
  if (pick.position === 0 && pick.first !== undefined) {
    return pick.first;
  }
  const motions = enemyMotionsOfStar(config, pick.star);
  const members = motions[motionIndexAt(seed, pick.position, motions.length)];
  return members[seededIndex(seed, STREAM.member, pick.stageNumber, members.length)];
}

/**
 * くじ袋で敵を選ぶ（その★の全種を1体ずつ袋に入れ、空になったら入れ直す）。
 * @param {StageOrderConfig} config ルールの設定。
 * @param {number} seed 種（整数）。
 * @param {StagePick} pick 選び方に要る値。
 * @returns {string} 敵の種類の識別子。
 */
function bagTypeIdAt(config, seed, pick) {
  const firstIndex = pick.first === undefined ? -1 : pick.members.indexOf(pick.first);
  return pick.members[
    bagMemberAt({ seed, lane: pick.lane, lanes: pick.lanes }, pick.position, pick.members.length, firstIndex)
  ];
}

/**
 * 並びの決まりの名前 → 選び方（敵の選び方 typeIdAt と袋の位置の求め方 slotAt）の表。
 * @type {Readonly<Object<string, {typeIdAt: function(StageOrderConfig, number, StagePick): string, slotAt: function(StagePick): ({bag: number, slot: number}|null)}>>}
 */
const STAGE_ORDERS = Object.freeze({
  motion: Object.freeze({ typeIdAt: motionTypeIdAt, slotAt: () => null }),
  bag: Object.freeze({ typeIdAt: bagTypeIdAt, slotAt: (pick) => bagSlotOf(pick.position, pick.members.length) }),
});

/**
 * そのステージの選び方に要る値と、並びの決まりの表の1行を求める。
 * @param {StageOrderConfig} config ルールの設定。
 * @param {number} seed 種（整数）。
 * @param {number} stageNumber ステージの番号（1 以上の整数）。
 * @param {string} caller 呼び元の関数名（Error の文言用）。
 * @returns {{pick: StagePick, order: {typeIdAt: Function, slotAt: Function}}} 選び方に要る値と表の1行。
 * @throws {Error} stageNumber が 1 以上の整数でないとき、その★の敵がないとき、`first` が設定にない敵・★の違う敵のとき、知らない並びの決まりの名前のとき。
 */
function pickOf(config, seed, stageNumber, caller) {
  if (!Number.isInteger(stageNumber) || stageNumber < 1) {
    throw new Error(`${caller}: ステージの番号は 1 以上の整数です: ${stageNumber}`);
  }
  const { star, position } = starDrawAt(config.stageStars, seed, stageNumber);
  const rule = starRuleOf(config.stageStars, star);
  const members = enemyTypeIdsOfStar(config, star);
  if (members.length === 0) {
    throw new Error(`${caller}: ★${star} の敵がいません`);
  }
  if (rule.first !== undefined && enemySpecOf(config, rule.first).star !== star) {
    throw new Error(`${caller}: first の敵 ${rule.first} は★${star} ではありません`);
  }
  const order = STAGE_ORDERS[rule.order];
  if (order === undefined) {
    throw new Error(`stageOrder: 知らない並びの決まりです: ${rule.order}`);
  }
  return {
    pick: { star, position, stageNumber, members, first: rule.first, lane: rule.lane, lanes: rule.lanes },
    order,
  };
}

/**
 * 種とステージの番号から、そのステージの敵の種類の識別子を決める。
 * ★と同じ★の中の何番目か（position）は `starDrawAt` の抽選の並びから求め、その★の並びの決まり（動きの組・くじ袋）の表で敵を選ぶ。
 * @param {StageOrderConfig} config ルールの設定。
 * @param {number} seed 種（整数）。
 * @param {number} stageNumber ステージの番号（1 以上の整数）。
 * @returns {string} 敵の種類の識別子。
 * @throws {Error} stageNumber が 1 以上の整数でないとき、その★の敵がないとき、`first` が設定にない敵・★の違う敵のとき、知らない並びの決まりのとき。
 */
export function enemyTypeIdOfStage(config, seed, stageNumber) {
  const { pick, order } = pickOf(config, seed, stageNumber, 'enemyTypeIdOfStage');
  return order.typeIdAt(config, seed, pick);
}

/**
 * そのステージの袋の番号と袋の何番目か（どちらも 0 から）を求める。くじ袋の決まりでない★のステージは null。
 * @param {StageOrderConfig} config ルールの設定。
 * @param {number} seed 種（整数）。
 * @param {number} stageNumber ステージの番号（1 以上の整数）。
 * @returns {{bag: number, slot: number}|null} 袋の位置。袋の決まりでなければ null。
 * @throws {Error} enemyTypeIdOfStage と同じ条件のとき。
 */
export function stageBagSlotOf(config, seed, stageNumber) {
  const { pick, order } = pickOf(config, seed, stageNumber, 'stageBagSlotOf');
  return order.slotAt(pick);
}
