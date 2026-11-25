/**
 * 責務: 端末の日付から、敵の並びを決める種（整数）を作ること。日付を読むのはこのファイルだけで、時間の経過（動き・待ち）には使わない。
 */

/**
 * 日付から種を作る（年×10000＋月×100＋日。端末の時刻の地方日付。例: 2026年11月25日 → 20261125）。純粋。
 * @param {Date} date 日付
 * @returns {number} 種（整数）
 */
export function seedOfDate(date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/**
 * 今日の日付から種を作る（端末の日付を読むのはここだけ。時間の経過には使わない）。
 * @returns {number} 今日の種（整数）
 */
export function todaySeed() {
  return seedOfDate(new Date());
}
