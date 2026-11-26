/**
 * 責務: 前から並んだ2つの体の列のポイントを、量だけ消し合う組（当たる順）にすることと、
 * 1つの列の前から量だけポイントを使う割り振りを求める。何も import しない純粋関数。全部 1 ポイントなら1対1・前から量の数と同じ。
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

/**
 * 前から並んだ1つの列のポイントを、前から量だけ使う割り振りにする。
 * 前から `min(体の残り, 量の残り)` を使い、量に着いたら止める（最後の1体は一部だけのことがある）。全部 1 ポイントなら前から量の数の体を全部使う。
 * @param {number[]} points 体ごとのポイント（前から。0 以下の体は飛ばす）
 * @param {number} amount 使う量（0 以上。`Infinity` なら全員の全部）
 * @returns {Array<{index: number, points: number}>} 使う体の番号（前から 0）とその体の使うポイント（前から順）
 * @throws {Error} amount が有限で、合計が amount に足りないとき
 */
export function spendFromFront(points, amount) {
  const spent = [];
  let left = amount;
  for (let i = 0; i < points.length && left > 0; i++) {
    if (points[i] <= 0) continue;
    const x = Math.min(points[i], left);
    spent.push({ index: i, points: x });
    left -= x;
  }
  if (left > 0 && Number.isFinite(amount)) {
    const sum = points.reduce((s, p) => s + Math.max(0, p), 0);
    throw new Error(`spendFromFront: ポイントが足りません（合計 ${sum}・量 ${amount}）`);
  }
  return spent;
}
