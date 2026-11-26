/**
 * 責務: 取った強化から、札の +◯・放つ計算の足し分（束の補正の段・4スートそろいの足し分）・ターンの始まりの行動の足し分（発動の抽選を含む）を求める（ルール層）。
 * 種類ごとの分岐は効き方の表に任せ、ここは表の口を引いて足すだけ。乱数は渡されたものだけを使う。
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

/**
 * ターンの始まりの行動の発動率（全種類の `actionChance` の合計）。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {import('./upgrades.js').UpgradeState} state 取った強化の状態
 * @returns {{ percent: number, actions: number, capped: boolean }} 発動率の百分率の合計・率が 0 より大きい種類の増える行動の数の合計・その種類がすべて上限に着いているか
 */
export function actionChanceOf(config, state) {
  let percent = 0;
  let actions = 0;
  let capped = true;
  for (const id of upgradeIds(config)) {
    const spec = upgradeSpecOf(config, id);
    const effect = effectOf(spec);
    const taken = upgradeTakenOf(state, id);
    const chance = effect.actionChance(spec, taken);
    if (chance.percent > 0) {
      percent += chance.percent;
      actions += chance.actions;
      if (!effect.isCapped(spec, taken)) capped = false;
    }
  }
  return { percent, actions, capped };
}

/**
 * ターンの始まりに足す行動を求める（「この戦闘の間」の足し分と、発動の抽選）。
 * 発動率が 0 より大きいときだけ乱数を1回呼び、率 0 では呼ばない。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {import('./upgrades.js').UpgradeState} state 取った強化の状態
 * @param {number} battleActionBonus この戦闘の間の行動の足し分
 * @param {() => number} random 乱数の関数（`[0, 1)`）
 * @returns {{ battleActions: number, chanceActions: number }} この戦闘の間の足し分・発動で増えた行動の数
 */
export function turnUpgradeActions(config, state, battleActionBonus, random) {
  const { percent, actions } = actionChanceOf(config, state);
  let chanceActions = 0;
  if (percent > 0 && random() < percent / 100) chanceActions = actions;
  return { battleActions: battleActionBonus, chanceActions };
}
