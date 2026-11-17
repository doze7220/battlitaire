/**
 * 戦闘の段の揺れ（大きな一撃の当たりから）・暗さ（ための段）・撃つ瞬間の光（最初の大きな一撃の段の始め）の記録を作り、時計から見た目を書く。
 * 描画も状態の変更もしない。
 */
import { BATTLE_ANIM } from './battleAnimConfig.js';
import { IMPACT_KINDS } from './impactLog.js';
import { chargeLevel, chargeWindows } from './chargeShow.js';

/**
 * 戦闘の段のエフェクトの記録。
 * @typedef {Object} StageFx
 * @property {Float64Array} heavyTimes 大きな一撃の当たり（`repair` 以外）の時刻の昇順
 * @property {number|null} fireTime 最初の大きな一撃の段の始め（なければ null）
 * @property {import('./chargeShow.js').ChargeWindow[]} charges ための段の窓
 */

/**
 * 戦闘の段のエフェクトの見た目。
 * @typedef {Object} StageFxLook
 * @property {number} shakeX 揺れの x のずれ（px）
 * @property {number} shakeY 揺れの y のずれ（px）
 * @property {number} dim 暗さの濃さ（0〜1）
 * @property {number} flash 撃つ瞬間の光の濃さ（0〜1）
 */

/**
 * 当たりの記録と時刻つきの段から、戦闘の段のエフェクトの記録を作る。
 * @param {import('./impactLog.js').ImpactLog} log 当たりの記録
 * @param {Array<{type: string, start: number, end: number, heavy?: boolean}>} timedSteps 時刻つきの段の並び
 * @returns {StageFx} 記録
 */
export function createStageFx(log, timedSteps) {
  const times = [];
  for (let i = 0; i < log.time.length; i += 1) {
    if (log.heavy[i] === 1 && log.kind[i] !== IMPACT_KINDS.repair) times.push(log.time[i]);
  }
  times.sort((a, b) => a - b);
  let fireTime = null;
  for (const step of timedSteps) {
    if (step.heavy === true) {
      fireTime = step.start;
      break;
    }
  }
  return { heavyTimes: Float64Array.from(times), fireTime, charges: chargeWindows(timedSteps) };
}

/**
 * 演出の時計 `clock` 以下の最後の大きな一撃の時刻を二分探索で探す。
 * @param {Float64Array} times 時刻の昇順
 * @param {number} clock 演出の時計（ms）
 * @returns {number|null} 時刻（なければ null）
 */
function lastHeavyAt(times, clock) {
  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= clock) lo = mid + 1;
    else hi = mid;
  }
  return lo === 0 ? null : times[lo - 1];
}

/**
 * 時計から揺れ・暗さ・撃つ瞬間の光を `out` へ書く（範囲の外はちょうど 0）。
 * @param {StageFx} spec 記録
 * @param {number} clock 演出の時計（ms）
 * @param {number} wall 壁の時計（ms。揺れの拍子に使う）
 * @param {StageFxLook} out 書き込み先
 * @returns {void}
 */
export function sampleStageFx(spec, clock, wall, out) {
  const A = BATTLE_ANIM;
  out.shakeX = 0;
  out.shakeY = 0;
  const t = lastHeavyAt(spec.heavyTimes, clock);
  if (t !== null && clock - t < A.shakeMs) {
    const amp = A.shakeAmp * (1 - (clock - t) / A.shakeMs);
    const phase = (2 * Math.PI * wall) / A.shakePeriodMs;
    out.shakeX = amp * Math.sin(phase);
    out.shakeY = amp * Math.cos(phase);
  }
  const level = chargeLevel(spec.charges, clock);
  out.dim = level > 0 ? A.chargeDim * level : 0;
  out.flash = 0;
  if (spec.fireTime !== null) {
    const s = clock - spec.fireTime;
    if (s >= 0 && s < A.fireFlashMs) out.flash = A.fireFlashAlpha * (1 - s / A.fireFlashMs);
  }
}
