/**
 * 兵の数を大きなユニットと小さな兵に換算し、群れの兵1体ごとの種類・大きさ・位置に並べる。
 * 描画も状態の変更も行わない純粋な関数だけを持つ。
 */

/**
 * 兵1体（または大きなユニット1体）の見た目。
 * @typedef {Object} UnitLook
 * @property {import('./squadTrack.js').SquadKind} kind 群れの種類
 * @property {boolean} big 大きなユニットなら true
 * @property {number} x 中心の x
 * @property {number} footY 足元の y
 * @property {number} w 幅
 * @property {number} h 高さ
 * @property {number} alpha 濃さ（0〜1）
 */

/**
 * 人数を大きなユニットの数と小さな兵の数に分ける。
 * @param {number} count 人数
 * @param {number} unitSize 大きなユニット1体にまとめる人数
 * @returns {{big: number, small: number}} 大きなユニットの数と小さな兵の数
 */
export function splitUnits(count, unitSize) {
  return { big: Math.floor(count / unitSize), small: count % unitSize };
}

/**
 * 1つの列の n 体を、中心 x の周りに横一列に並べる。
 * @param {import('./squadTrack.js').SquadSample} sample 群れの見た目
 * @param {import('../view/layout.js').TroopLayout} troopLayout 兵の配置
 * @param {number} n 列の体数
 * @param {boolean} big 大きなユニットの列なら true
 * @param {number} footY 列の足元の y
 * @returns {UnitLook[]} 左から順の兵の並び
 */
function buildRow(sample, troopLayout, n, big, footY) {
  const w = big ? troopLayout.bigW : troopLayout.smallW;
  const h = big ? troopLayout.bigH : troopLayout.smallH;
  const pitch = n <= 1 ? 0 : Math.min(w * troopLayout.spacing, (troopLayout.zoneW - w) / (n - 1));
  const row = [];
  for (let i = 0; i < n; i++) {
    row.push({
      kind: sample.kind,
      big,
      x: sample.x + (i - (n - 1) / 2) * pitch,
      footY,
      w,
      h,
      alpha: sample.alpha,
    });
  }
  return row;
}

/**
 * 群れの見た目を、兵1体ごとの並びに直す。後ろの列（大）→ 前の列（小）の順で返す。
 * 片方しかなければ、その種類を前の列に置く。
 * @param {import('./squadTrack.js').SquadSample} sample 群れの見た目
 * @param {import('../view/layout.js').TroopLayout} troopLayout 兵の配置
 * @param {number} unitSize 大きなユニット1体にまとめる人数
 * @returns {UnitLook[]} 後ろから描く順の兵の並び
 */
export function formationUnits(sample, troopLayout, unitSize) {
  const { big, small } = splitUnits(sample.count, unitSize);
  const bigFootY = small > 0 ? troopLayout.backFootY : troopLayout.groundY;
  return [
    ...buildRow(sample, troopLayout, big, true, bigFootY),
    ...buildRow(sample, troopLayout, small, false, troopLayout.groundY),
  ];
}
