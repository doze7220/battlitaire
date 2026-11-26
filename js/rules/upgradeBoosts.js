/**
 * 責務: 取った強化から、札の +◯・放つ計算の足し分（束の補正の段・4スートそろいの足し分）を合計して求める（ルール層。純粋な計算だけ）。
 * 種類ごとの分岐は効き方の表に任せ、ここは表の口を引いて足すだけ。
 */

import { effectOf } from './upgradeEffects.js';
import { upgradeIds, upgradeSpecOf, upgradeTakenOf } from './upgrades.js';

/**
 * 札の +◯（全種類の `cardBonus` の合計）。札そのものは書き換えない。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {import('./upgrades.js').UpgradeState} state 取った強化の状態
 * @param {{ suit: string, rank: number }} card 札
 * @returns {number} 札の +◯
 */
export function cardBonusOf(config, state, card) {
  let total = 0;
  for (const id of upgradeIds(config)) {
    const spec = upgradeSpecOf(config, id);
    total += effectOf(spec).cardBonus(spec, upgradeTakenOf(state, id), card);
  }
  return total;
}

/**
 * 束の補正の段（全種類の `comboSteps` の合計）。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {import('./upgrades.js').UpgradeState} state 取った強化の状態
 * @returns {number} 段
 */
export function comboStepsOf(config, state) {
  let total = 0;
  for (const id of upgradeIds(config)) {
    const spec = upgradeSpecOf(config, id);
    total += effectOf(spec).comboSteps(spec, upgradeTakenOf(state, id));
  }
  return total;
}

/**
 * 4スートそろいの足し分（全種類の `allSuitsExtra` の合計）。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {import('./upgrades.js').UpgradeState} state 取った強化の状態
 * @returns {number} 足し分
 */
export function allSuitsExtraOf(config, state) {
  let total = 0;
  for (const id of upgradeIds(config)) {
    const spec = upgradeSpecOf(config, id);
    total += effectOf(spec).allSuitsExtra(spec, upgradeTakenOf(state, id));
  }
  return total;
}

/**
 * 放つ計算に渡す強化の足し分を作る。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {import('./upgrades.js').UpgradeState} state 取った強化の状態
 * @returns {import('./release.js').ReleaseBoost} 足し分（`cardBonus` は `cardBonusOf` を呼ぶ関数）
 */
export function releaseBoostOf(config, state) {
  return {
    cardBonus: (card) => cardBonusOf(config, state, card),
    comboSteps: comboStepsOf(config, state),
    allSuitsExtra: allSuitsExtraOf(config, state),
  };
}
