/**
 * 長い列の詰め直し（列にもとからあったカードが、操作前の枚数での位置から操作後の枚数での位置へ動くこと）の記録を配置から組み立て、時計から各カードの上端 y を求める。
 * 時間は持たず進めない。描画も状態の変更も行わず、ルール層は import しない。
 */

import { clamp01, lerp, easeOutCubic } from './easing.js';

/**
 * 長い列の詰め直し。
 * @typedef {Object} ColumnSettle
 * @property {number} columnIndex 列の番号
 * @property {number[]} fromYs 動き始める前の各カードの上端 y（下から順。長さは操作後の枚数）。もとからあったカードは操作前の枚数での位置、新しく来たカードは最初から着く位置
 * @property {number[]} toYs 動き終えた後の各カードの上端 y（下から順。fromYs と同じ長さ）
 * @property {number} delay 開始の遅れ（ms）
 * @property {number} duration かかる時間（ms）
 */

/**
 * 列の詰め直しを作る。
 * @param {import('../view/layout.js').Layout} layout 画面の配置（columnCardRects を使う）
 * @param {number} columnIndex 列の番号
 * @param {number} beforeCount 操作前のカードの枚数
 * @param {number} afterCount 操作後のカードの枚数
 * @param {number} delay 開始の遅れ（ms）
 * @param {number} duration かかる時間（ms）
 * @returns {ColumnSettle|null} 詰め直し。もとからあったカードの位置がどれも変わらなければ null
 */
export function buildColumnSettle(layout, columnIndex, beforeCount, afterCount, delay, duration) {
  const beforeYs = layout.columnCardRects(columnIndex, beforeCount).map((r) => r.y);
  const afterYs = layout.columnCardRects(columnIndex, afterCount).map((r) => r.y);
  const common = Math.min(beforeCount, afterCount);
  let changed = false;
  for (let i = 0; i < common; i++) {
    if (beforeYs[i] !== afterYs[i]) {
      changed = true;
      break;
    }
  }
  if (!changed) return null;
  const fromYs = afterYs.map((y, i) => (i < beforeCount ? beforeYs[i] : y));
  return { columnIndex, fromYs, toYs: afterYs, delay, duration };
}

/**
 * 時計の値から、列の各カードの上端 y を求める。
 * @param {ColumnSettle} settle 詰め直し
 * @param {number} clock 動きの時計の値（ms）
 * @returns {number[]|null} 各カードの上端 y（下から順の新しい配列）。終わっていれば null（普通の描画に戻る）
 */
export function sampleColumnSettle(settle, clock) {
  const { fromYs, toYs, delay, duration } = settle;
  if (clock >= delay + duration) return null;
  let t;
  if (duration <= 0) t = clock >= delay ? 1 : 0;
  else t = clamp01((clock - delay) / duration);
  const e = easeOutCubic(t);
  return fromYs.map((from, i) => lerp(from, toYs[i], e));
}

/**
 * 詰め直しが終わる時刻を求める。
 * @param {ColumnSettle} settle 詰め直し
 * @returns {number} 終わりの時刻（ms）。delay + duration
 */
export function columnSettleEnd(settle) {
  return settle.delay + settle.duration;
}
