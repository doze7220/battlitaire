/**
 * 責務: 手札の場所（上の行の手札1枠分の矩形）と枠の数から、手札の各枠の矩形を求める（2枠以上は縮めて斜めに重ねる）。
 * 何も import しない純粋関数。
 */

/** 手札が2枠以上のときの枠の縮め方（場所の幅・高さに対する割合）。試遊で決め直す。 */
export const HAND_COMPACT_SCALE = 0.65;

/**
 * 矩形。
 * @typedef {Object} HandRect
 * @property {number} x 左端
 * @property {number} y 上端
 * @property {number} w 幅
 * @property {number} h 高さ
 */

/**
 * 手札の枠の矩形を、枠の番号順（奥 → 手前）に求める。
 * 1枠以下なら場所の写し1つ。2枠以上なら幅・高さを `HAND_COMPACT_SCALE` で縮め、場所の左上（奥）から右下（手前）へ斜めに、
 * 全体が場所に収まるように等間隔で重ねて並べる。
 * @param {HandRect} area 手札の場所（手札1枠分の矩形）
 * @param {number} count 手札の枠の数
 * @returns {HandRect[]} 枠の矩形（長さは 1 以上なら `count`、`count` が 1 以下なら 1。番号が大きいほど手前）
 */
export function handSlotRects(area, count) {
  if (count <= 1) return [{ x: area.x, y: area.y, w: area.w, h: area.h }];
  const w = Math.round(area.w * HAND_COMPACT_SCALE);
  const h = Math.round(area.h * HAND_COMPACT_SCALE);
  const rects = [];
  for (let i = 0; i < count; i++) {
    rects.push({
      x: area.x + Math.round(((area.w - w) * i) / (count - 1)),
      y: area.y + Math.round(((area.h - h) * i) / (count - 1)),
      w,
      h,
    });
  }
  return rects;
}
