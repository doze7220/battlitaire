/**
 * 陣地・ゴブリンの群れの矩形と「何番目か」から、兵・ゴブリンの家（矩形の中の足元の位置）を求める純粋関数を持つ。
 * 乱数は使わず、同じ入力から必ず同じ位置を返す。
 */

/**
 * R2 列（低食い違い列）の x 方向の増分。
 * @type {number}
 */
const R2_A1 = 0.7548776662466927;

/**
 * R2 列（低食い違い列）の y 方向の増分。
 * @type {number}
 */
const R2_A2 = 0.5698402909980532;

/**
 * 数の小数部分（0 以上 1 未満）を返す。
 * @param {number} v 値
 * @returns {number} 小数部分
 */
function frac(v) {
  return v - Math.floor(v);
}

/**
 * 陣地の中の家の位置（兵の足元の中心）を返す。何番目かだけで決まり、ほかの兵が消えても変わらない。
 * @param {{x: number, y: number, w: number, h: number}} camp 陣地・ゴブリンの群れの矩形（兵・ゴブリンの足元の中心が入る範囲）
 * @param {number} index 種類の中の何番目か（0 から）
 * @returns {{x: number, y: number}} 家の位置
 */
export function campSlot(camp, index) {
  return {
    x: camp.x + camp.w * frac(0.5 + index * R2_A1),
    y: camp.y + camp.h * frac(0.5 + index * R2_A2),
  };
}
