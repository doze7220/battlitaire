/**
 * 絵の敵（スライム）の、当たりの時刻からのへこみの量と、へこみを絵の姿勢（縦に縮み横に広がる）へ重ねる計算を持つ。
 * 倒れ始めの手前で量を 0 へ寄せ、倒れ始めた後は重ねない。描画も状態の変更も行わない（姿勢の入れ物へ書くだけ）。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';

/**
 * 滑らかな 0→1（`u²(3−2u)`）。
 * @param {number} u 0〜1 に収めた進み具合
 * @returns {number} 滑らかにした値
 */
function smooth(u) {
  return u * u * (3 - 2 * u);
}

/**
 * 1回の当たりぶんのへこみの量（0〜1）。当たりから `dentInMs` かけて 0→1、`dentOutMs` かけて 1→0。
 * @param {number} elapsed 当たりからの経過時間（ms。負なら当たる前）
 * @returns {number} 量
 */
function singleDent(elapsed) {
  if (elapsed <= 0) return 0;
  if (elapsed < BATTLE_ANIM.dentInMs) return smooth(elapsed / BATTLE_ANIM.dentInMs);
  const out = elapsed - BATTLE_ANIM.dentInMs;
  if (out < BATTLE_ANIM.dentOutMs) return 1 - smooth(out / BATTLE_ANIM.dentOutMs);
  return 0;
}

/**
 * いまの時計のへこみの量（0〜1）を返す。1回ぶんの和を 1 で頭打ちにし、倒れ始めの手前の `dentOutMs` の間は
 * 倍率 `u²(3−2u)`（`u = (fallAt − clock) / dentOutMs` を 0〜1 に収めた値）をかけ、倒れ始め以後はちょうど 0。
 * @param {readonly number[]|null} times 体に当たった時刻（ms。昇順。へこまない敵は null）
 * @param {number} clock 時計の値（ms）
 * @param {number|null} fallAt 倒れ始めの時刻（ms。倒れない攻防は null）
 * @returns {number} へこみの量
 */
export function dentAmount(times, clock, fallAt) {
  if (times === null) return 0;
  let sum = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] > clock) break;
    sum += singleDent(clock - times[i]);
  }
  let amount = Math.min(1, sum);
  if (fallAt !== null) {
    if (clock >= fallAt) return 0;
    amount *= smooth(Math.min(1, Math.max(0, (fallAt - clock) / BATTLE_ANIM.dentOutMs)));
  }
  return amount;
}

/**
 * へこみを絵の姿勢へ重ねる（`pose.scaleY` に `1 − dentSquash × 量`、`pose.scaleX` に `1 + dentWiden × 量` をかける）。
 * @param {readonly number[]|null} times 体に当たった時刻（ms。昇順。へこまない敵は null）
 * @param {number} clock 時計の値（ms）
 * @param {number|null} fallAt 倒れ始めの時刻（ms。倒れない攻防は null）
 * @param {{tilt: number, scaleX: number, scaleY: number}} pose 絵の姿勢（書き換える）
 * @returns {void}
 */
export function applyDent(times, clock, fallAt, pose) {
  const amount = dentAmount(times, clock, fallAt);
  if (amount === 0) return;
  pose.scaleY *= 1 - BATTLE_ANIM.dentSquash * amount;
  pose.scaleX *= 1 + BATTLE_ANIM.dentWiden * amount;
}
