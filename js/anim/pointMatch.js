/**
 * 責務: 前から並んだ2つの体の列のポイントを、量だけ消し合う組（当たる順）にする。
 * 何も import しない純粋関数。両方とも全部 1 ポイントなら今の1対1の組と同じになる。
 */

/**
 * 消し合う1組。
 * @typedef {Object} PointPair
 * @property {number} a Aの列の体の番号（前から 0）。
 * @property {number} b Bの列の体の番号（前から 0）。
 * @property {number} points この組で消し合うポイント。
 */

/**
 * 前から並んだ2つの列の残りのポイントを、二つの指で前から消し合う組にする。
 * `x = min(Aの残り, Bの残り, 残りの量)` を1組にし、0 になった側の指を次へ進める。
 * 両方とも全部 1 なら `{ a: k, b: k, points: 1 }`（k = 0..amount−1）になる。
 * @param {number[]} aPoints Aの体ごとのポイント（前から）。
 * @param {number[]} bPoints Bの体ごとのポイント（前から）。
 * @param {number} amount 消し合うポイントの量（0 以上の整数）。
 * @returns {PointPair[]} 当たる順の組。
 * @throws {Error} どちらかの合計が amount に足りないとき。
 */
export function matchPoints(aPoints, bPoints, amount) {
  const sumA = aPoints.reduce((s, p) => s + p, 0);
  const sumB = bPoints.reduce((s, p) => s + p, 0);
  if (sumA < amount || sumB < amount) {
    throw new Error(`matchPoints: ポイントが足りません（A ${sumA}・B ${sumB}・量 ${amount}）`);
  }
  const pairs = [];
  let ia = 0;
  let ib = 0;
  let restA = aPoints.length > 0 ? aPoints[0] : 0;
  let restB = bPoints.length > 0 ? bPoints[0] : 0;
  let left = amount;
  while (left > 0) {
    while (restA <= 0) {
      ia++;
      restA = aPoints[ia];
    }
    while (restB <= 0) {
      ib++;
      restB = bPoints[ib];
    }
    const x = Math.min(restA, restB, left);
    pairs.push({ a: ia, b: ib, points: x });
    restA -= x;
    restB -= x;
    left -= x;
  }
  return pairs;
}
