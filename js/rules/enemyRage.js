/**
 * 責務: 戦闘のターンと激昂の設定から、敵が激昂しているか・倍率（百分率の整数）と、倍率をかけた攻撃の量を求める（純粋関数。ルール層）。
 * 激昂の式はこのファイルだけ。
 */

import { floorToUnit } from './unitPoints.js';

/**
 * 倍率 ×1.0 を表す百分率（単位の定数。ルールの数値ではない）。
 * @type {number}
 */
const BASE_PERCENT = 100;

/**
 * 激昂の状態。
 * @typedef {Object} RageStatus
 * @property {boolean} enraged 激昂しているか
 * @property {number} percent 攻撃の量にかける倍率（百分率の整数。激昂していなければ 100）
 */

/**
 * 戦闘のターンから、敵が激昂しているかと倍率を求める。
 * 戦闘のターンが `rage.fromTurn` 以上なら激昂で、倍率 = 100 + `rage.stepPercent` × (戦闘のターン − `fromTurn` + 1)（上限なし）。
 * 例: fromTurn 16・stepPercent 20 のとき、15 → 100（激昂なし）、16 → 120、17 → 140、20 → 200。
 * @param {{ fromTurn: number, stepPercent: number }} rage 激昂の設定
 * @param {number} battleTurn 戦闘のターン数（1 から）
 * @returns {RageStatus} 激昂の状態（毎回新しいオブジェクト）
 */
export function rageStatusOf(rage, battleTurn) {
  if (battleTurn >= rage.fromTurn) {
    return { enraged: true, percent: BASE_PERCENT + rage.stepPercent * (battleTurn - rage.fromTurn + 1) };
  }
  return { enraged: false, percent: BASE_PERCENT };
}

/**
 * 攻撃の量に倍率をかけ、1体のポイントの倍数に切り捨てる。
 * 整数だけで計算する: `amount * percent` は整数で、100 で割った切り捨ては、割り切れるときは正確な整数、
 * 割り切れないときは整数から 0.01 以上離れるので、浮動小数の誤差で数字が変わらない。
 * 例: 7 × 120% → 8、3 × 120% → 3、0 → 0、オーガ（unit 2）の 6 × 120% = 7.2 → 7 → 6。
 * @param {number} amount 倍率の前の攻撃の量（0 以上の整数）
 * @param {number} percent 倍率（百分率の整数）
 * @param {number} unit 1体のポイント（1 以上の整数）
 * @returns {number} 倍率をかけた量
 */
export function ragedAmount(amount, percent, unit) {
  return floorToUnit(Math.floor((amount * percent) / BASE_PERCENT), unit);
}
