/**
 * 責務: ベスト（自己ベストと今日のベスト）の形、保存の値の読み方（壊れた値は「ベストなし」）、今回のスコアでの書き換えと NEW の判定を行う純粋な計算。
 * 保存・読み込み・日付の取得はしない（何も import しない）。
 */

/**
 * @typedef {Object} BestScores ベスト
 * @property {number} best 自己ベスト（なしは 0）
 * @property {{ date: number, score: number }|null} today 今日のベスト（date はゲームの種。なしは null）
 */

/**
 * @typedef {Object} BestUpdate 書き換えの結果
 * @property {BestScores} next 保存する新しいベスト
 * @property {{ score: number, isNew: boolean }} today 今日のベストの値と更新したか
 * @property {{ score: number, isNew: boolean }} best 自己ベストの値と更新したか
 */

/**
 * 値が 0 以上の整数か。
 * @param {unknown} value 調べる値
 * @returns {boolean} 0 以上の整数なら true
 */
function isCount(value) {
  return Number.isInteger(value) && /** @type {number} */ (value) >= 0;
}

/**
 * 値が整数か。
 * @param {unknown} value 調べる値
 * @returns {boolean} 整数なら true
 */
function isInt(value) {
  return Number.isInteger(value);
}

/**
 * 値がプレーンなオブジェクト（配列でなく、プロトタイプが Object.prototype か null）か。
 * @param {unknown} value 調べる値
 * @returns {boolean} プレーンなら true
 */
function isPlainObject(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * 保存の値を確かめてベストにする。形が違う部分は「ベストなし」（自己ベスト 0・今日のベスト null）として扱う。例外を投げない。
 * @param {unknown} raw 保存から読んだ値
 * @returns {BestScores} ベスト（新しいオブジェクト）
 */
export function readBestScores(raw) {
  if (!isPlainObject(raw)) return { best: 0, today: null };
  const obj = /** @type {Record<string, unknown>} */ (raw);
  const best = isCount(obj.best) ? /** @type {number} */ (obj.best) : 0;
  const t = obj.today;
  const today = isPlainObject(t) && isInt(/** @type {any} */ (t).date) && isCount(/** @type {any} */ (t).score)
    ? { date: /** @type {any} */ (t).date, score: /** @type {any} */ (t).score }
    : null;
  return { best, today };
}

/**
 * 今回のスコアでベストを書き換える。同じ点は更新しない（NEW にしない）。今日のベストの日付は、いつもそのゲームの日付で書き換える。
 * @param {BestScores} stored 保存されているベスト（readBestScores を通したもの）
 * @param {number} date そのゲームの日付（ゲームの種）
 * @param {number} score 今回のスコア
 * @returns {BestUpdate} 書き換えの結果
 */
export function updateBestScores(stored, date, score) {
  const todayBefore = stored.today !== null && stored.today.date === date ? stored.today.score : 0;
  const todayNew = score > todayBefore;
  const bestNew = score > stored.best;
  const todayScore = todayNew ? score : todayBefore;
  const bestScore = bestNew ? score : stored.best;
  return {
    next: { best: bestScore, today: { date, score: todayScore } },
    today: { score: todayScore, isNew: todayNew },
    best: { score: bestScore, isNew: bestNew },
  };
}
