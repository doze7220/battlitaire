/**
 * 当たりの記録からヒットストップの並び（同じ時刻は1回、段ごとの合計に上限、大きな一撃は長く）を作り、壁の時計から演出の時計（時間割の時刻）を求める。
 * 時間割の時刻は変えず、描画も状態の変更もしない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { IMPACT_KINDS } from './impactLog.js';

/**
 * ヒットストップの並び（時刻の昇順。同じ時刻はない）。
 * @typedef {Object} HitStops
 * @property {Float64Array} at 止まる演出の時刻（ms）
 * @property {Float64Array} dur 止まる長さ（壁の時計の ms）
 * @property {Float64Array} wallAt その止まりが始まる壁の時計（`at` ＋ それより前の `dur` の合計）
 * @property {Float64Array} cum その止まりまでの `dur` の合計（その止まり自身を含む）
 * @property {number} count 止まりの数
 * @property {number} total 全部の `dur` の合計
 */

/**
 * 当たりの記録からヒットストップの並びを作る（修理の当たりでは止まらない）。
 * 段ごとに、時刻の昇順に同じ時刻を1つにまとめ、1つごとに通常は `hitStopMs`・大きな一撃は `heavyStopMs` 止める。
 * 段の合計は `hitStopCapMs`・`heavyStopCapMs` を上限とし、上限に届く1つは残りの分だけにして、その後は止めない。
 * 全部の段の分は時刻の昇順に並べ、同じ時刻は長い方の1つにまとめる。
 * @param {import('./impactLog.js').ImpactLog} log 当たりの記録
 * @returns {HitStops} ヒットストップの並び
 */
export function createHitStops(log) {
  /** @type {Map<number, {heavy: boolean, times: Set<number>}>} 段の番号ごとの当たりの時刻 */
  const bySteps = new Map();
  for (let i = 0; i < log.time.length; i++) {
    if (log.kind[i] === IMPACT_KINDS.repair) continue;
    let entry = bySteps.get(log.step[i]);
    if (entry === undefined) {
      entry = { heavy: false, times: new Set() };
      bySteps.set(log.step[i], entry);
    }
    if (log.heavy[i] === 1) entry.heavy = true;
    entry.times.add(log.time[i]);
  }

  /** @type {Map<number, number>} 時刻 → 止まる長さ（同じ時刻は長い方） */
  const merged = new Map();
  for (const entry of bySteps.values()) {
    const each = entry.heavy ? BATTLE_ANIM.heavyStopMs : BATTLE_ANIM.hitStopMs;
    const cap = entry.heavy ? BATTLE_ANIM.heavyStopCapMs : BATTLE_ANIM.hitStopCapMs;
    const times = [...entry.times].sort((a, b) => a - b);
    let used = 0;
    for (const time of times) {
      const dur = Math.min(each, cap - used);
      if (dur <= 0) break;
      used += dur;
      const old = merged.get(time);
      if (old === undefined || dur > old) merged.set(time, dur);
    }
  }

  const ats = [...merged.keys()].sort((a, b) => a - b);
  const count = ats.length;
  const stops = {
    at: new Float64Array(count),
    dur: new Float64Array(count),
    wallAt: new Float64Array(count),
    cum: new Float64Array(count),
    count,
    total: 0,
  };
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const dur = merged.get(ats[i]);
    stops.at[i] = ats[i];
    stops.dur[i] = dur;
    stops.wallAt[i] = ats[i] + sum;
    sum += dur;
    stops.cum[i] = sum;
  }
  stops.total = sum;
  return stops;
}

/**
 * 壁の時計から演出の時計（時間割の時刻）を求める。止まっている間は止まりの時刻のまま。
 * @param {HitStops} stops ヒットストップの並び
 * @param {number} wall 壁の時計（ms）
 * @returns {number} 演出の時計（ms）
 */
export function showTimeAt(stops, wall) {
  let lo = 0;
  let hi = stops.count - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (stops.wallAt[mid] <= wall) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (found < 0) return wall;
  if (wall < stops.wallAt[found] + stops.dur[found]) return stops.at[found];
  return wall - stops.cum[found];
}
