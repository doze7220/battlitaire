/**
 * 責務: 列の印（敵が予告で列に付ける印。予告の任意の項目 `mark`）の種類の表・印を付ける列の選び方・今出ている印・印を済みにすること・
 * ひとりでに放つ印かの判定・中断データの印の形の確かめ（純粋関数。ルール層）。乱数は呼ばない。放つ計算は release.js の computeRelease をそのまま使う。
 */

import { computeRelease } from './release.js';

/** 混乱の印の種類の識別子（印の列の束が、攻防の前に行動を使わずにひとりでに放たれる） */
export const CONFUSE_MARK = 'confuse';

/**
 * 印の種類 → ルール上の効き目の表。`releases` は、行動を使い切った後・攻防の前に、印の列の束をひとりでに放つか。
 * 別の印はここへ1行足す。
 * @type {Readonly<Object<string, Readonly<{ releases: boolean }>>>}
 */
export const MARK_KINDS = Object.freeze({
  [CONFUSE_MARK]: Object.freeze({ releases: true }),
});

/**
 * 行動が持つ印の求め（列はまだ決まっていない）。
 * @typedef {Object} MarkRequest
 * @property {string} kind 印の種類（`MARK_KINDS` のキー）
 */

/**
 * 予告の列の印。
 * @typedef {Object} ColumnMark
 * @property {string} kind 印の種類（`MARK_KINDS` のキー）
 * @property {number} column 印の列の番号（0 から）
 * @property {boolean} settled その印の効き目（ひとりでに放つ・空振り）が済んだか
 */

/**
 * 印を付ける列を選ぶ（乱数は呼ばない）。束の枚数が多い列 → 束の数値の合計（放つ計算の区切りの `sum` の合計。札の数字 + 札の +◯）が高い列 → 左の列 の順。全部空なら 0。
 * @param {import('./card.js').Card[][]} columns 列（`[0]` が一番下）
 * @param {Readonly<import('./config.js').Rules>} config ルールの設定
 * @param {import('./release.js').ReleaseBoost} boost 放つ計算の足し分（`releaseBoostOf` の値）
 * @returns {number} 印を付ける列の番号
 */
export function pickMarkColumn(columns, config, boost) {
  let best = 0;
  let bestCount = -1;
  let bestSum = -1;
  for (let c = 0; c < columns.length; c += 1) {
    const count = columns[c].length;
    const sum = computeRelease(columns[c], config, boost).segments.reduce((total, seg) => total + seg.sum, 0);
    if (count > bestCount || (count === bestCount && sum > bestSum)) {
      best = c;
      bestCount = count;
      bestSum = sum;
    }
  }
  return best;
}

/**
 * 予告が印の求めを持てば、列を選んで列の印（`ColumnMark`）にした新しい予告を返す。持たなければ同じ予告を返す（元の予告は書き換えない）。
 * @param {Object} intent 印の求め `MarkRequest` を持ちうる途中の予告（`createIntent` の戻り値。`mark` は求めのまま）
 * @param {import('./card.js').Card[][]} columns 列
 * @param {Readonly<import('./config.js').Rules>} config ルールの設定
 * @param {import('./release.js').ReleaseBoost} boost 放つ計算の足し分
 * @returns {Object} 印を持つなら `mark` を `{ kind, column, settled: false }` にした新しい予告。持たなければ引数のまま
 */
export function withMarkColumn(intent, columns, config, boost) {
  if (!intent || !intent.mark) return intent;
  return {
    ...intent,
    mark: { kind: intent.mark.kind, column: pickMarkColumn(columns, config, boost), settled: false },
  };
}

/**
 * 今出ている（まだ済んでいない）印を返す。
 * @param {{ mark?: ColumnMark }|null} intent 予告
 * @returns {{ kind: string, column: number }|null} 印の種類と列。予告が null・印なし・済みなら null
 */
export function activeMark(intent) {
  if (!intent || !intent.mark || intent.mark.settled) return null;
  return { kind: intent.mark.kind, column: intent.mark.column };
}

/**
 * 印を済みにした新しい予告を返す（印の入れ物も写す。元の予告は書き換えない）。
 * @param {Object} intent 印を持つ予告
 * @returns {Object} `mark.settled` を真にした新しい予告。印がなければ予告の写し
 */
export function settleMark(intent) {
  if (!intent.mark) return { ...intent };
  return { ...intent, mark: { ...intent.mark, settled: true } };
}

/**
 * その印の種類が、ひとりでに放つ印か。
 * @param {string} kind 印の種類
 * @returns {boolean} ひとりでに放つなら true（表にない種類は false）
 */
export function marksRelease(kind) {
  return Object.hasOwn(MARK_KINDS, kind) && MARK_KINDS[kind].releases === true;
}

/**
 * 中断データの予告の `mark` の形が正しいか（どんな値でも例外を投げない）。
 * @param {unknown} value 調べる値
 * @param {number} columnCount 列の数
 * @returns {boolean} プレーンなオブジェクトで、`kind` が `MARK_KINDS` のキー、`column` が 0 以上 columnCount 未満の整数、`settled` が真偽値なら true
 */
export function isColumnMarkShape(value, columnCount) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  const mark = /** @type {Record<string, unknown>} */ (value);
  return (
    typeof mark.kind === 'string' &&
    Object.hasOwn(MARK_KINDS, mark.kind) &&
    Number.isInteger(mark.column) &&
    /** @type {number} */ (mark.column) >= 0 &&
    /** @type {number} */ (mark.column) < columnCount &&
    typeof mark.settled === 'boolean'
  );
}
