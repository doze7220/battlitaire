/**
 * 責務: DEBUG タブから呼ばれる、ゲームの状態を書き換えるデバッグ用の操作（兵のゲージ・ステージを移る・敵の切り替え・次の行動の指定・戦闘のターンの番号・城と敵の HP（親子の敵は親と子の HP も）・親と子の HP を 0 にする・強化の取る（上限で止まる）・すべて外す・3択を出す）と問い合わせ。
 * 段取り中だけ効き、行動の回数は使わない（ルール層）。
 */

import { enemyTypeIds, enemySpecOf } from './enemyTypes.js';
import { refreshIntent } from './enemyIntent.js';
import { intentChoiceIds, planChosenIntent, chosenIntentOf } from './debugIntents.js';
import { ENEMY_SITUATIONS, enemySituationOf, partsWithTotal, zeroPart } from './enemyParts.js';
import { clearEliteOf } from './elites.js';
import { upgradeIds, takeUpgrade, clearUpgrades, fixedUpgradeValue, isUpgradeCapped, takenUpgradeList } from './upgrades.js';

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
 * 上限はここでは決めない。行動の回数は使わない。そのゲージの精鋭はなくなる（値はすべて人数になる）。
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
  game.elites = clearEliteOf(game.elites, gauge);
  return true;
}

/**
 * 切り替えられる敵の一覧（設定に書いた順）。
 * @param {import('./config.js').Rules} config ルールの設定
 * @returns {{ typeId: string, name: string }[]} 敵の種類の識別子と名前
 */
export function enemyChoices(config) {
  return enemyTypeIds(config).map((typeId) => ({ typeId, name: enemySpecOf(config, typeId).name }));
}

/**
 * 今の敵を指定した種類の敵（HP 満タン・決まりの状態は初期値）に入れ替え、ふつうに予告を決める。
 * 段取り中で、設定にある識別子で、今の敵の種類と違うときだけ。ステージの番号・通しのターンの番号・城・盤面・ゲージ・行動の回数・結果の集計は触らない。戦闘のターンの番号は 1 に戻す。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {string} typeId 敵の種類の識別子
 * @returns {boolean} 入れ替えたら true
 */
export function switchEnemy(game, typeId) {
  if (!isPlanning(game)) return false;
  if (!enemyTypeIds(game.config).includes(typeId)) return false;
  if (typeId === game.enemy.typeId) return false;
  game.spawnEnemy(typeId);
  game.planIntent();
  return true;
}

/**
 * ステージの番号を今から delta だけ移し、そのステージのふつうの敵（HP 満タン・決まりの状態は初期値）にして予告を決める。
 * 段取り中で、delta が整数のときだけ。行き先は 1 以上（上の限りはない）で、今と同じなら何もしない。
 * 通しのターンの番号・城・盤面・ゲージ・行動の回数・結果の集計は触らない。戦闘のターンの番号は 1 に戻る。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {number} delta 移る数（整数。負なら戻る）
 * @returns {boolean} 移したら true
 */
export function moveStage(game, delta) {
  if (!isPlanning(game)) return false;
  if (!Number.isInteger(delta)) return false;
  const target = Math.max(1, game.stageNumber + delta);
  if (target === game.stageNumber) return false;
  game.enterStage(target);
  game.planIntent();
  return true;
}

/**
 * 戦闘のターンの番号を指定した値にし、今の予告の防御の量を数え直す（乱数は呼ばない）。
 * 段取り中で、1 以上の整数で、今の番号と違うときだけ。通しの番号・行動の回数・盤面・集計は触らない。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {number} turn 新しい番号（1 以上の整数）
 * @returns {boolean} 書き換えたら true
 */
export function setBattleTurn(game, turn) {
  if (!isPlanning(game)) return false;
  if (!Number.isInteger(turn) || turn < 1) return false;
  if (game.battleTurn === turn) return false;
  game.battleTurn = turn;
  if (game.enemy.intent) {
    game.enemy.intent = refreshIntent(game.enemy.intent, turn, game.config.fatigue);
  }
  return true;
}

/**
 * 今の敵の決まりの設定を返す。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {any} 行動の決まりの設定
 */
function currentBehavior(game) {
  return enemySpecOf(game.config, game.enemy.typeId).behavior;
}

/**
 * 今の敵に指定できる次の行動の識別子の並び（親と子を持つ敵は今の局面でできる行動だけ）。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {string[]} 識別子の並び
 */
export function intentChoiceIdsOf(game) {
  return intentChoiceIds(currentBehavior(game), enemySituationOf(game.enemy.parts));
}

/**
 * 敵の次の行動の選択肢の最大の数（全部の敵の、全部の局面の中で最も多いもの）。
 * @param {import('./config.js').Rules} config ルールの設定
 * @returns {number} 選択肢の数の最大
 */
export function intentChoiceSlotCount(config) {
  let max = 0;
  for (const typeId of enemyTypeIds(config)) {
    const { behavior } = enemySpecOf(config, typeId);
    for (const situation of [null, ...ENEMY_SITUATIONS]) {
      max = Math.max(max, intentChoiceIds(behavior, situation).length);
    }
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
  const { action, state } = planChosenIntent(currentBehavior(game), id, game.random, game.enemyUnitPoints());
  game.enemy.intent = game.intentOf(action);
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
 * 敵の HP を指定した値にする（0 にはしない）。親と子を持つ敵は、親と子の HP を `partsWithTotal` で決める
 * （満タンは親子とも最大。「1 にする」は親が生きていれば親 1・子 0、親が 0 なら子 1）。予告は変えない。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {number} hp 新しい HP（1 以上・最大 HP 以下の整数）
 * @returns {boolean} 書き換えたら true
 */
export function setEnemyHp(game, hp) {
  const { enemy } = game;
  const brood = enemySpecOf(game.config, enemy.typeId).brood;
  const parts = enemy.parts;
  if (!brood || !parts) return setHp(game, enemy, hp);
  if (!setHp(game, enemy, hp)) return false;
  enemy.parts = partsWithTotal(brood, enemy.maxHp, parts, hp);
  return true;
}

/**
 * 親か子の HP を 0 にする共通の処理（段取り中で、親と子を持ち、その部分が 0 より大きいときだけ）。
 * もう片方が 0 のときは 1 を残す（倒したことにしない）。`hp` は合計にする。予告は変えない。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {'parent'|'child'} part 0 にする側
 * @returns {boolean} 書き換えたら true（条件外・変わらないときは false）
 */
function zeroEnemyPart(game, part) {
  if (!isPlanning(game)) return false;
  const { enemy } = game;
  if (!enemy.parts || !(enemy.parts[part] > 0)) return false;
  const next = zeroPart(enemy.parts, part);
  if (next.parent === enemy.parts.parent && next.child === enemy.parts.child) return false;
  enemy.parts = next;
  enemy.hp = next.parent + next.child;
  return true;
}

/**
 * 子の HP を 0 にする（親が 0 なら 1 を残す）。予告は変えない（次のターンの予告から怒る）。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {boolean} 書き換えたら true
 */
export function zeroEnemyChild(game) {
  return zeroEnemyPart(game, 'child');
}

/**
 * 親の HP を 0 にする（子が 0 なら 1 を残す）。今の予告が今の局面で指定できない行動になったときは、
 * ふつうに予告を決め直す（乱数はゲームの乱数）。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {boolean} 書き換えたら true
 */
export function zeroEnemyParent(game) {
  if (!zeroEnemyPart(game, 'parent')) return false;
  if (!intentChoiceIdsOf(game).includes(currentIntentChoice(game))) game.planIntent();
  return true;
}

/**
 * DEBUG タブに並べる強化の識別子の並び（設定に書いた順）。
 * @param {import('./config.js').Rules} config ルールの設定
 * @returns {string[]} 強化の種類の識別子
 */
export function upgradeChoices(config) {
  return upgradeIds(config);
}

/**
 * 強化を1つ取る（DEBUG の「取る」。値は乱数なしの決まった値）。段取り中で、一覧にある識別子で、上限に着いていないときだけ（上限では何もしない）。
 * 自動兵士・アクションポイント・「次の戦闘の間」は次のターンの頭から効く（今のターンのゲージ・行動の数は変えない）。手札の枠はその場で増える。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {string} id 強化の種類の識別子
 * @returns {boolean} 取ったら true（条件外・上限なら false）
 */
export function addUpgrade(game, id) {
  if (!isPlanning(game)) return false;
  if (!upgradeIds(game.config).includes(id)) return false;
  if (isUpgradeCapped(game.config, game.upgrades, id)) return false;
  takeUpgrade(game, id, fixedUpgradeValue(game.config, game.upgrades, id));
  return true;
}

/**
 * 取った強化をすべて外す。段取り中で、取った強化があるときだけ。手札は設定の枠の数に戻り（外した枠の札は捨て札の後ろへ）、「この戦闘の間」の足し分は 0 になる。今のターンの行動の数は変えない。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {boolean} 外したら true
 */
export function clearAllUpgrades(game) {
  if (!isPlanning(game)) return false;
  if (takenUpgradeList(game.config, game.upgrades).length === 0) return false;
  clearUpgrades(game);
  return true;
}

/**
 * 3択を出す（選ぶと今の段取りへ戻る。ステージは進まない）。段取り中だけ。候補は今のプレイ用の乱数で引く。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {boolean} 3択の段階にしたら true
 */
export function openUpgradeChoice(game) {
  if (!isPlanning(game)) return false;
  game.offerUpgrades('planning');
  return true;
}
