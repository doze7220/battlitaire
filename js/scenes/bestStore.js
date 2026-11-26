/**
 * 責務: ベスト（自己ベストと今日のベスト）を Storage に読み書きする唯一の所。デバッグ（Engine.debug）のときは保存も読み込みもしない。
 * 値の形・書き換えの計算は rules/bestScores.js の持ち分。Engine.debug は Engine.start の後だけ読めるので、シーンからだけ呼ぶ。
 */
import { Engine, Storage } from 'oz';
import { readBestScores, updateBestScores } from '../rules/bestScores.js';

/** ベストを Storage に入れる名前（このファイルだけが使う）。 @type {string} */
const BEST_NAME = 'bestScores';

/**
 * Storage.open の defaults に足す名前と既定値（ベストなし）。
 * @type {Readonly<{bestScores: null}>}
 */
export const BEST_DEFAULTS = Object.freeze({ [BEST_NAME]: null });

/**
 * 今回のスコアでベストを書き換えて保存する（保存は1回）。デバッグなら何もせず null を返す。
 * @param {number} date そのゲームの日付（ゲームの種）
 * @param {number} score 今回のスコア
 * @returns {{ today: { score: number, isNew: boolean }, best: { score: number, isNew: boolean } }|null} 今日のベストと自己ベスト（更新したかを含む）。デバッグなら null
 */
export function recordBestScores(date, score) {
  if (Engine.debug) return null;
  const stored = readBestScores(Storage.get(BEST_NAME));
  const update = updateBestScores(stored, date, score);
  Storage.set(BEST_NAME, update.next);
  return { today: update.today, best: update.best };
}
