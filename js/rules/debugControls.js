/**
 * 責務: DEBUG タブから呼ばれる、ゲームの状態を書き換えるデバッグ用の操作（兵のゲージ・敵の切り替え・次の行動の指定・城と敵の HP）と問い合わせ。
 * 段取り中だけ効き、行動の回数は使わない（ルール層）。
 */

import { createEnemy } from './combatants.js';
import { enemyTypeIdAt, enemySpecAt } from './enemyProgress.js';
import { intentChoiceIds, planChosenIntent, chosenIntentOf } from './debugIntents.js';

/**
 * 段取り中か。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {boolean} 段取り中なら true
 */
function isPlanning(game) {
  return game.stage === 'planning';
}

/**
 * 兵になるゲージの識別子の並び（力こぶの換算のゲージを除く）。
 * @param {{ gauges: readonly string[], muscleConversion: { gauge: string } }} config ルールの設定
 * @returns {string[]} ゲージの識別子の並び
 */
export function troopGaugeIds(config) {
  return config.gauges.filter((gauge) => gauge !== config.muscleConversion.gauge);
}

/**
 * 兵のゲージの値を指定した数にする。段取り中で、兵のゲージで、0 以上の整数のときだけ。
 * 上限はここでは決めない。行動の回数は使わない。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {string} gauge ゲージの識別子
 * @param {number} count 新しい値
 * @returns {boolean} 書き換えたら true（条件外・今と同じ値なら false）
 */
export function setTroopGauge(game, gauge, count) {
  if (!isPlanning(game)) return false;
  if (!troopGaugeIds(game.config).includes(gauge)) return false;
  if (!Number.isInteger(count) || count < 0) return false;
  if (game.gauges[gauge] === count) return false;
  game.gauges[gauge] = count;
  return true;
}

/**
 * 切り替えられる敵の一覧（戦う順）。
 * @param {import('./enemyProgress.js').ProgressConfig} config ルールの設定
 * @returns {{ index: number, name: string }[]} 敵の番号と名前
 */
export function enemyChoices(config) {
  return config.enemyOrder.map((_, index) => ({ index, name: enemySpecAt(config, index).name }));
}

/**
 * 今の敵を指定した番号の敵（HP 満タン・決まりの状態は初期値）に入れ替え、ふつうに予告を決める。
 * 段取り中で、範囲内の整数で、今の番号と違うときだけ。TURN・城・盤面・ゲージ・行動の回数・結果の集計は触らない。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {number} index 敵の番号（0から）
 * @returns {boolean} 入れ替えたら true
 */
export function switchEnemy(game, index) {
  if (!isPlanning(game)) return false;
  if (!Number.isInteger(index) || index < 0 || index >= game.config.enemyOrder.length) return false;
  if (index === game.enemyIndex) return false;
  game.enemyIndex = index;
  game.enemy = createEnemy(enemyTypeIdAt(game.config, index), enemySpecAt(game.config, index));
  game.planIntent();
  return true;
}

/**
 * 今の敵の決まりの設定を返す。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {any} 行動の決まりの設定
 */
function currentBehavior(game) {
  return enemySpecAt(game.config, game.enemyIndex).behavior;
}

/**
 * 今の敵に指定できる次の行動の識別子の並び。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {string[]} 識別子の並び
 */
export function intentChoiceIdsOf(game) {
  return intentChoiceIds(currentBehavior(game));
}

/**
 * 敵の次の行動の選択肢の最大の数（全部の敵の中で最も多いもの）。
 * @param {import('./enemyProgress.js').ProgressConfig} config ルールの設定
 * @returns {number} 選択肢の数の最大
 */
export function intentChoiceSlotCount(config) {
  let max = 0;
  for (let i = 0; i < config.enemyOrder.length; i += 1) {
    max = Math.max(max, intentChoiceIds(enemySpecAt(config, i).behavior).length);
  }
  return max;
}

/**
 * 今の予告に当たる識別子。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {string|null} 識別子。予告がなければ null
 */
export function currentIntentChoice(game) {
  return chosenIntentOf(currentBehavior(game), game.enemy.intent);
}

/**
 * 敵の次の行動を指定する。段取り中で、敵の HP が 0 より大きく、今の敵に指定できる識別子で、
 * 今の予告と違うときだけ、予告と決まりの状態を入れ替える（量の抽選は `game.random`）。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {string} id 行動の識別子
 * @returns {boolean} 入れ替えたら true
 */
export function chooseEnemyIntent(game, id) {
  if (!isPlanning(game)) return false;
  if (!(game.enemy.hp > 0)) return false;
  if (!intentChoiceIdsOf(game).includes(id)) return false;
  if (currentIntentChoice(game) === id) return false;
  const { action, state } = planChosenIntent(currentBehavior(game), id, game.random);
  game.enemy.intent = action;
  game.enemy.behaviorState = state;
  return true;
}

/**
 * 体力を書き換える共通の処理（1 以上・最大 HP 以下の整数で、今の値と違うときだけ）。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {{ hp: number, maxHp: number }} target 城または敵
 * @param {number} hp 新しい HP
 * @returns {boolean} 書き換えたら true
 */
function setHp(game, target, hp) {
  if (!isPlanning(game)) return false;
  if (!Number.isInteger(hp) || hp < 1 || hp > target.maxHp) return false;
  if (target.hp === hp) return false;
  target.hp = hp;
  return true;
}

/**
 * 城の HP を指定した値にする（0 にはしない）。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {number} hp 新しい HP（1 以上・最大 HP 以下の整数）
 * @returns {boolean} 書き換えたら true
 */
export function setCastleHp(game, hp) {
  return setHp(game, game.castle, hp);
}

/**
 * 敵の HP を指定した値にする（0 にはしない）。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {number} hp 新しい HP（1 以上・最大 HP 以下の整数）
 * @returns {boolean} 書き換えたら true
 */
export function setEnemyHp(game, hp) {
  return setHp(game, game.enemy, hp);
}
