/**
 * 1回のゲームの結果の記録（倒した数・総ターン数・スコア・項目ごとの合計と回数・倒した敵の並び・最大の一撃・一番長いコンボ）の生成・足し・形の確かめを担う、
 * 純粋関数のモジュール（ルール層）。
 */

import { enemyTypeIds } from './enemyTypes.js';
import { scoreItemIds } from './score.js';
import { longestSegmentOf } from './battleRecord.js';

/**
 * 点の項目ごとの合計。
 * @typedef {Object} ScoreItemTotal
 * @property {number} points 合計点
 * @property {number} count 取った回数（点が 0 でなかった回数）
 */

/**
 * 1回のゲームの結果の記録。
 * @typedef {Object} GameStats
 * @property {number} enemiesDefeated 倒した敵の数
 * @property {number} phases 総ターン数（「行動終了」の攻防の回数）
 * @property {number} score スコア（倒した敵の点の合計）
 * @property {Object<string, ScoreItemTotal>} items 点の項目の識別子 → 合計点と取った回数（`config.scoreItems` の全項目）
 * @property {Array<{ typeId: string, stageNumber: number }>} defeated 倒した敵の並び（倒した順）
 * @property {number} maxHit 最大の一撃（1回の攻防で敵に向かった自軍の攻撃の量から敵の防御で相殺された量を引いたもの）
 * @property {number} longestCombo 一番長いコンボ（放った区切りの枚数の最大。ゲーム全体）
 */

/**
 * 回数で数える出来事の種類と、足す先の集計の項目の対応表（1つごとに 1 足す）。
 * @type {Readonly<Record<string, 'enemiesDefeated'>>}
 */
const COUNT_FIELDS = Object.freeze({
  enemyDefeat: 'enemiesDefeated',
});

/**
 * すべて 0・空の記録を作る。
 * @param {{scoreItems: Readonly<Object<string, unknown>>}} config ルールの設定（項目の並びを読む）
 * @returns {GameStats} 新しい記録（`items` は設定の全項目を 0 で持つ）
 */
export function createGameStats(config) {
  const items = {};
  for (const id of scoreItemIds(config)) items[id] = { points: 0, count: 0 };
  return { enemiesDefeated: 0, phases: 0, score: 0, items, defeated: [], maxHit: 0, longestCombo: 0 };
}

/**
 * 1回の攻防を足した新しい記録を返す（引数は書き換えない）。
 * `phases` に 1 を足し、回数の表にある種類の出来事は 1 つごとに 1 を足し、最大の一撃を更新する。
 * 一撃は、出来事に `lose` がなければ `attack − Σ enemyBlock の量`（とどめで敵の残りの HP を超えた分も含む）、`lose` があれば 0（城が落ちた攻防では自軍の攻撃が起きないため）。
 * @param {GameStats} stats 足す前の記録
 * @param {import('./battle.js').BattleEvent[]} events 1回の攻防の出来事の並び
 * @param {number} attack この攻防の自軍の攻撃の量（攻撃のゲージ）
 * @returns {GameStats} 足した後の新しい記録
 */
export function tallyBattle(stats, events, attack) {
  const next = { ...stats, phases: stats.phases + 1 };
  let blocked = 0;
  let lost = false;
  for (const event of events) {
    const countField = COUNT_FIELDS[event.type];
    if (countField !== undefined) next[countField] += 1;
    if (event.type === 'enemyBlock') blocked += event.amount;
    if (event.type === 'lose') lost = true;
  }
  const hit = lost ? 0 : attack - blocked;
  next.maxHit = Math.max(stats.maxHit, hit);
  return next;
}

/**
 * 放ったときの区切りを足した新しい記録を返す（引数は書き換えない）。
 * @param {GameStats} stats 足す前の記録
 * @param {ReadonlyArray<{count: number}>} segments 放った区切りの並び
 * @returns {GameStats} `longestCombo` を更新した新しい記録
 */
export function addRelease(stats, segments) {
  return { ...stats, longestCombo: Math.max(stats.longestCombo, longestSegmentOf(segments)) };
}

/**
 * 敵を倒した点を足した新しい記録を返す（引数は書き換えない）。
 * `score` に合計を足し、項目ごとに合計点を足して点が 0 でなければ回数を 1 足し、倒した敵の並びの後ろに足す。
 * @param {GameStats} stats 足す前の記録
 * @param {import('./score.js').ScoreBreakdown} breakdown 倒した敵の内訳
 * @param {{ typeId: string, stageNumber: number }} foe 倒した敵の種類とステージの番号
 * @returns {GameStats} 足した後の新しい記録
 */
export function addDefeat(stats, breakdown, foe) {
  const items = {};
  for (const id of Object.keys(stats.items)) items[id] = { ...stats.items[id] };
  for (const { id, points } of breakdown.items) {
    const total = items[id] ?? { points: 0, count: 0 };
    items[id] = { points: total.points + points, count: total.count + (points !== 0 ? 1 : 0) };
  }
  return {
    ...stats,
    score: stats.score + breakdown.total,
    items,
    defeated: [...stats.defeated, { typeId: foe.typeId, stageNumber: foe.stageNumber }],
  };
}

/**
 * 値がプレーンなオブジェクト（配列でない）か。
 * @param {unknown} value 調べる値
 * @returns {boolean} オブジェクトで、`null`・配列でなければ true
 */
function isPlainRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 値が `min` 以上の整数か。
 * @param {unknown} value 調べる値
 * @param {number} min 下限
 * @returns {boolean} 整数で `min` 以上なら true
 */
function isIntFrom(value, min) {
  return Number.isInteger(value) && /** @type {number} */ (value) >= min;
}

/**
 * 値が結果の記録の形か確かめる（例外を投げない）。
 * 整数の項目、`items` のキーが設定の項目とちょうど同じで各 `{ points: 整数, count: 0 以上の整数 }`、
 * `defeated` が設定の敵の種類と 1 以上のステージの番号の並びで長さが `enemiesDefeated` と同じ、`score` が `items` の合計点の和と同じ。
 * @param {unknown} value 確かめる値
 * @param {Readonly<import('./config.js').Rules>} config ルールの設定
 * @returns {boolean} 形が正しければ true
 */
export function isGameStats(value, config) {
  try {
    if (!isPlainRecord(value)) return false;
    const v = /** @type {Record<string, any>} */ (value);
    const expectedKeys = ['enemiesDefeated', 'phases', 'score', 'items', 'defeated', 'maxHit', 'longestCombo'];
    const keys = Object.keys(v);
    if (keys.length !== expectedKeys.length || !expectedKeys.every((key) => Object.hasOwn(v, key))) return false;
    if (!isIntFrom(v.enemiesDefeated, 0) || !isIntFrom(v.phases, 0)) return false;
    if (!isIntFrom(v.maxHit, 0) || !isIntFrom(v.longestCombo, 0)) return false;
    if (!Number.isInteger(v.score)) return false;
    if (!isPlainRecord(v.items)) return false;
    const ids = scoreItemIds(config);
    const itemKeys = Object.keys(v.items);
    if (itemKeys.length !== ids.length || !ids.every((id) => Object.hasOwn(v.items, id))) return false;
    let sum = 0;
    for (const id of ids) {
      const item = v.items[id];
      if (!isPlainRecord(item) || Object.keys(item).length !== 2) return false;
      if (!Number.isInteger(item.points) || !isIntFrom(item.count, 0)) return false;
      sum += item.points;
    }
    if (sum !== v.score) return false;
    if (!Array.isArray(v.defeated) || v.defeated.length !== v.enemiesDefeated) return false;
    const typeIds = enemyTypeIds(config);
    return v.defeated.every(
      (foe) =>
        isPlainRecord(foe) &&
        Object.keys(foe).length === 2 &&
        typeof foe.typeId === 'string' &&
        typeIds.includes(foe.typeId) &&
        isIntFrom(foe.stageNumber, 1),
    );
  } catch {
    return false;
  }
}
