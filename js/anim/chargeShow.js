/**
 * ための段の時刻の窓と、時計からのための強さと、巨人・ドラゴンのための姿勢（後ろへ反る・膨らむ）を求める。
 * 描画も状態の変更もしない。
 */
import { BATTLE_ANIM } from './battleAnimConfig.js';

/**
 * ための段の時刻の窓。
 * @typedef {Object} ChargeWindow
 * @property {number} start 段の始め（ms）
 * @property {number} end 段の終わり（ms）
 */

/**
 * ための姿勢の見た目。
 * @typedef {Object} ChargePoseLook
 * @property {number} tilt 傾き（rad。後ろ＝右へ反るのが正）
 * @property {number} scaleX 横の伸び
 * @property {number} scaleY 縦の伸び
 */

/**
 * 時刻つきの段から、ための段の始め・終わりを写す。
 * @param {Array<{type: string, start: number, end: number}>} timedSteps 時刻つきの段の並び
 * @returns {ChargeWindow[]} ための段の窓（時刻の昇順）
 */
export function chargeWindows(timedSteps) {
  const windows = [];
  for (const step of timedSteps) {
    if (step.type === 'charge') windows.push({ start: step.start, end: step.end });
  }
  return windows;
}

/**
 * 時計でのためる強さ（段の中の進み具合 u から sin(π·u)。始めと終わりが 0、段の外は ちょうど 0）。
 * @param {ChargeWindow[]} windows ための段の窓
 * @param {number} clock 演出の時計（ms）
 * @returns {number} 強さ（0〜1）
 */
export function chargeLevel(windows, clock) {
  for (const w of windows) {
    if (clock <= w.start || clock >= w.end) continue;
    const u = (clock - w.start) / (w.end - w.start);
    if (u <= 0 || u >= 1) return 0;
    return Math.sin(Math.PI * u);
  }
  return 0;
}

/**
 * 時計でのための姿勢を `out` へ書く（ための段の外は 傾き0・伸び1・1）。
 * @param {ChargeWindow[]} windows ための段の窓
 * @param {number} clock 演出の時計（ms）
 * @param {ChargePoseLook} out 書き込み先
 * @returns {void}
 */
export function sampleChargePose(windows, clock, out) {
  const k = chargeLevel(windows, clock);
  out.tilt = k > 0 ? BATTLE_ANIM.chargeLean * k : 0;
  out.scaleX = 1 + (k > 0 ? BATTLE_ANIM.chargeSwell * k : 0);
  out.scaleY = out.scaleX;
}
