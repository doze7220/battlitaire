/**
 * 責務: 結果の画面の文字の表（見出し・区画の名前・ボタン・「なし」など）と、描く内容（ResultModel）の組み立てを担う。
 * ルールの値を文字にして並べるだけで計算はしない。ルール層は import しない（型の参照だけ）。
 */

import { outcomeText } from './battleText.js';
import { formatScore, resultScoreLine } from './scoreText.js';
import { takenUpgradeLines, nextEnemyText } from './upgradeText.js';

/**
 * 結果の画面の文字の表。
 * @type {Readonly<{
 *   headings: Readonly<Record<string, string>>,
 *   headlineLabels: Readonly<Record<string, string>>,
 *   lines: Readonly<Record<string, string>>,
 *   buttons: Readonly<Record<string, string>>,
 *   newMark: string,
 *   turns: string,
 *   maxHit: string,
 *   longestCombo: string,
 *   comboUnit: string,
 *   todayBest: string,
 *   selfBest: string,
 * }>}
 */
export const RESULT_TEXT = Object.freeze({
  headings: Object.freeze({
    breakdown: '内訳',
    defeated: '倒した敵',
    lost: '負けた敵',
    upgrades: '取った強化',
    records: '記録',
    bests: 'ベスト',
  }),
  headlineLabels: Object.freeze({ defeated: '倒した敵', score: 'SCORE' }),
  lines: Object.freeze({ none: 'なし', debug: 'デバッグでは記録しません' }),
  buttons: Object.freeze({ retry: 'もう一度', title: 'タイトルへ' }),
  newMark: 'NEW',
  turns: '総ターン数',
  maxHit: '最大の一撃',
  longestCombo: '一番長いコンボ',
  comboUnit: '枚',
  todayBest: '今日のベスト',
  selfBest: '自己ベスト',
});

/**
 * 結果の画面に描く内容。
 * @typedef {Object} ResultModel
 * @property {string} outcome 決着の文字（「負け」）
 * @property {string} defeated 倒した敵の数の文字
 * @property {string} score スコアの文字（3桁の区切り付き）
 * @property {Array<{ label: string, value: string }>} scoreRows 内訳の行（結果の記録の `items` のキーの順）
 * @property {{ label: string, value: string }} turnsRow 総ターン数の行
 * @property {string[]} defeatedTypeIds 倒した敵の種類の識別子（倒した順）
 * @property {{ typeId: string, text: string }} lost 負けた敵の種類と「名前 LvN」
 * @property {string[]} upgradeLines 取った強化の行
 * @property {Array<{ label: string, value: string }>} records 記録の行（最大の一撃・一番長いコンボ）
 * @property {Array<{ label: string, value: string, isNew: boolean }>|null} bests ベストの行。デバッグでは null
 */

/**
 * 結果の画面に描く内容を組み立てる（計算はせず、ルールが出した値を文字にして並べる）。
 * 内訳の行の並びは `stats.items` のキーの順（`config.scoreItems` の書いた順。複製や JSON を通っても変わらない）。
 * @param {Object} source 元の値
 * @param {'lose'|null} source.outcome 決着
 * @param {import('../rules/gameStats.js').GameStats} source.stats 結果の記録
 * @param {Array<{ id: string, count: number, amount: number, value: number, limit: number }>} source.upgradeRows 取った強化の行（`game.takenUpgradeRows()`）
 * @param {boolean} source.anyTaken 強化を1つでも取っているか
 * @param {{ typeId: string, name: string, stageNumber: number }} source.lostEnemy 負けた敵
 * @param {{ today: { score: number, isNew: boolean }, best: { score: number, isNew: boolean } }|null} source.bests ベスト。デバッグでは null
 * @returns {ResultModel} 描く内容
 * @throws {Error} 表にない点の項目・強化の識別子のとき。
 */
export function resultModel({ outcome, stats, upgradeRows, anyTaken, lostEnemy, bests }) {
  return {
    outcome: outcomeText(outcome),
    defeated: String(stats.enemiesDefeated),
    score: formatScore(stats.score),
    scoreRows: Object.keys(stats.items).map((id) => resultScoreLine(id, stats.items[id])),
    turnsRow: { label: RESULT_TEXT.turns, value: String(stats.phases) },
    defeatedTypeIds: stats.defeated.map((d) => d.typeId),
    lost: { typeId: lostEnemy.typeId, text: nextEnemyText(lostEnemy.name, lostEnemy.stageNumber) },
    upgradeLines: takenUpgradeLines(upgradeRows, anyTaken),
    records: [
      { label: RESULT_TEXT.maxHit, value: formatScore(stats.maxHit) },
      { label: RESULT_TEXT.longestCombo, value: `${stats.longestCombo}${RESULT_TEXT.comboUnit}` },
    ],
    bests:
      bests === null
        ? null
        : [
            { label: RESULT_TEXT.todayBest, value: formatScore(bests.today.score), isNew: bests.today.isNew },
            { label: RESULT_TEXT.selfBest, value: formatScore(bests.best.score), isNew: bests.best.isNew },
          ],
  };
}
