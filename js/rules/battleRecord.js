/**
 * 責務: 今の敵との戦闘の記録（使ったターン数・城が被害を受けたか・放った一番長い区切りの枚数）の生成・足し・形の確かめ（純粋）。
 * 点の項目の判定そのものは持たない（`score.js` の計算の表が読む戦闘の事実だけを持つ）。
 */

/**
 * 今の敵との戦闘の記録。
 * @typedef {Object} BattleRecord
 * @property {number} turns 使ったターン数（攻防を解決した回数）。
 * @property {boolean} castleDamaged 城が1度でも被害を受けたか（一度 true になったら戻らない）。
 * @property {number} longestRun その戦闘で放った一番長い区切りの枚数。
 */

/**
 * 新しい戦闘の記録を作る。
 * @returns {BattleRecord} 空の記録
 */
export function createBattleRecord() {
  return { turns: 0, castleDamaged: false, longestRun: 0 };
}

/**
 * 区切りの並びの枚数（`count`）の最大を返す。
 * @param {ReadonlyArray<{count: number}>} segments 区切りの並び
 * @returns {number} 最大の枚数（空なら 0）
 */
export function longestSegmentOf(segments) {
  let longest = 0;
  for (const segment of segments) longest = Math.max(longest, segment.count);
  return longest;
}

/**
 * 放ったときの区切りを記録に足す（引数は書き換えない）。
 * @param {BattleRecord} record 今の記録
 * @param {ReadonlyArray<{count: number}>} segments 放った区切りの並び
 * @returns {BattleRecord} `longestRun` を更新した新しい記録
 */
export function recordRelease(record, segments) {
  return { ...record, longestRun: Math.max(record.longestRun, longestSegmentOf(segments)) };
}

/**
 * 1回の攻防を記録に足す（引数は書き換えない）。
 * @param {BattleRecord} record 今の記録
 * @param {ReadonlyArray<{type: string}>} events 攻防の出来事の並び
 * @returns {BattleRecord} `turns` を 1 足し、出来事に `castleDamage` があれば `castleDamaged` を真にした新しい記録
 */
export function recordBattle(record, events) {
  const damaged = events.some((event) => event.type === 'castleDamage');
  return { ...record, turns: record.turns + 1, castleDamaged: record.castleDamaged || damaged };
}

/**
 * 値がプレーンなオブジェクト（配列でなく、プロトタイプが `Object.prototype` か `null`）か。
 * @param {unknown} value 調べる値
 * @returns {boolean} プレーンなオブジェクトなら true
 */
function isPlainObject(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * 値が戦闘の記録の形か確かめる（例外を投げない）。
 * @param {unknown} value 確かめる値
 * @returns {boolean} プレーンなオブジェクトで、キーがちょうど3つ（`turns`・`castleDamaged`・`longestRun`）で、形が正しければ true
 */
export function isBattleRecord(value) {
  try {
    if (!isPlainObject(value)) return false;
    const keys = Object.keys(value);
    if (keys.length !== 3) return false;
    const record = /** @type {Record<string, unknown>} */ (value);
    return (
      Number.isInteger(record.turns) && /** @type {number} */ (record.turns) >= 0 &&
      typeof record.castleDamaged === 'boolean' &&
      Number.isInteger(record.longestRun) && /** @type {number} */ (record.longestRun) >= 0
    );
  } catch {
    return false;
  }
}
