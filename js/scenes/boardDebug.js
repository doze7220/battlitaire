/**
 * 責務: 盤面のデバッグの口。ルール層のデバッグ用の操作（ルールの値を含む）を呼び、段取りの間の兵の数・ステージの曲・
 * ステージの始まりの印を合わせ、DEBUG タブが読む値を答える（Scene を継承しない）。
 */
import {
  setTroopGauge,
  enemyChoices,
  switchEnemy,
  moveStage,
  intentChoiceIdsOf,
  intentChoiceSlotCount,
  currentIntentChoice,
  chooseEnemyIntent,
  setCastleHp,
  setEnemyHp,
  setBattleTurn,
} from '../rules/debugControls.js';
import {
  ruleGroups,
  ruleItemInfo,
  ruleValue,
  ruleTiming,
  setRuleValue,
  resetRuleValues,
} from '../rules/debugRules.js';

/**
 * DEBUG タブの口が使う盤面の部品。メニューを開いている間は盤面の `update` が止まって攻防に入らないので、
 * 開いたときの参照（攻防のたびに作り直される `releaseShow` を含む）のまま使える。
 * @typedef {Object} BoardMenuTarget
 * @property {import('../rules/Game.js').Game} game ルール層の状態
 * @property {import('../anim/releaseShow.js').ReleaseShow} releaseShow 放つ演出の管理
 * @property {import('./boardFlow.js').BoardFlow} flow 盤面の段階の管理
 */

/**
 * 盤面のデバッグの口。持つのは盤面の部品の参照だけで、ほかの状態は持たない。
 * 読む口は状態を変えない。操作の口はルール層の操作でだけ状態を変え、見た目は anim・段階の管理の口で合わせる。
 */
export class BoardDebug {
  /**
   * @param {BoardMenuTarget} target 盤面の部品
   */
  constructor({ game, releaseShow, flow }) {
    /**
     * ルール層の状態。
     * @type {import('../rules/Game.js').Game}
     */
    this.game = game;
    /**
     * 放つ演出の管理。
     * @type {import('../anim/releaseShow.js').ReleaseShow}
     */
    this.releaseShow = releaseShow;
    /**
     * 盤面の段階の管理。
     * @type {import('./boardFlow.js').BoardFlow}
     */
    this.flow = flow;
  }

  /**
   * ルールの値の組の並び（城・敵の種類ごと）。
   * @returns {{ group: string, enemyName: string|null, itemIds: string[] }[]} 組の識別子・敵の名前（城は null）・項目の識別子
   */
  ruleGroups() {
    return ruleGroups(this.game.config);
  }

  /**
   * ルールの値の項目の種類と名前。
   * @param {string} id 項目の識別子
   * @returns {{ kind: string, name: string }|null} 値の種類と項目の名前の識別子。知らない識別子は null
   */
  ruleItemInfo(id) {
    return ruleItemInfo(id);
  }

  /**
   * ルールの値（ゲームが使っている設定の値）。
   * @param {string} id 項目の識別子
   * @returns {number|null} 値。知らない識別子は null
   */
  ruleValue(id) {
    return ruleValue(this.game, id);
  }

  /**
   * ルールの値が効く時期の識別子。
   * @param {string} id 項目の識別子
   * @returns {string|null} 時期の識別子。知らない識別子は null
   */
  ruleTiming(id) {
    return ruleTiming(this.game, id);
  }

  /**
   * ルールの値を指定した値にする。見た目は描くときにルール層を読んで合うので、anim・段階の管理の口は呼ばない。
   * @param {string} id 項目の識別子
   * @param {number} value 新しい値
   */
  setRuleValue(id, value) {
    setRuleValue(this.game, id, value);
  }

  /**
   * ルールの値をすべて `RULES` の値に戻す。
   */
  resetRuleValues() {
    resetRuleValues(this.game);
  }

  /**
   * 種類の兵の数（ゲージの値）。
   * @param {string} kind ゲージの識別子
   * @returns {number} 兵の数
   */
  troopCount(kind) {
    return this.game.gauges[kind] ?? 0;
  }

  /**
   * 兵が動いている間か（動いている間は兵の数を変えられない）。
   * @returns {boolean} 動いていれば true
   */
  troopsLocked() {
    return this.releaseShow.isBusy();
  }

  /**
   * 切り替えられる敵の一覧。
   * @returns {{ typeId: string, name: string }[]} 敵の種類の識別子と名前
   */
  enemyChoices() {
    return enemyChoices(this.game.config);
  }

  /**
   * 今の敵の種類の識別子。
   * @returns {string} 敵の種類の識別子
   */
  enemyTypeId() {
    return this.game.enemy.typeId;
  }

  /**
   * 今のステージの番号。
   * @returns {number} ステージの番号（1 から）
   */
  stageNumber() {
    return this.game.stageNumber;
  }

  /**
   * 次の行動の選択肢の枠の数。
   * @returns {number} 枠の数
   */
  intentSlotCount() {
    return intentChoiceSlotCount(this.game.config);
  }

  /**
   * 枠に当たる、今の敵の次の行動の識別子。
   * @param {number} slot 枠の番号
   * @returns {string|null} 識別子。その枠まで選択肢がなければ null
   */
  intentChoiceAt(slot) {
    return intentChoiceIdsOf(this.game)[slot] ?? null;
  }

  /**
   * 今の予告に当たる枠の番号。
   * @returns {number} 枠の番号。当たるものがなければ -1
   */
  selectedIntentSlot() {
    const chosen = currentIntentChoice(this.game);
    if (chosen === null) return -1;
    return intentChoiceIdsOf(this.game).indexOf(chosen);
  }

  /**
   * 今の戦闘のターンの番号。
   * @returns {number} 戦闘のターンの番号（1 から）
   */
  battleTurn() {
    return this.game.battleTurn;
  }

  /**
   * 城の状態（読むだけ）。
   * @returns {import('../rules/combatants.js').Castle} 城
   */
  castle() {
    return this.game.castle;
  }

  /**
   * 今の敵の状態（読むだけ）。
   * @returns {import('../rules/combatants.js').Enemy} 敵
   */
  enemy() {
    return this.game.enemy;
  }

  /**
   * 種類の兵の数を指定した数にする。兵が動いている間は何もしない。
   * ゲージ（ルール層）と陣地の兵の数（anim）を同じ数にそろえる。
   * @param {string} kind ゲージの識別子
   * @param {number} count 新しい数
   */
  setTroops(kind, count) {
    if (this.releaseShow.isBusy()) return;
    if (!setTroopGauge(this.game, kind, count)) return;
    this.releaseShow.setCampCount(kind, this.game.gauges[kind]);
  }

  /**
   * 敵を入れ替える。入れ替わったら、ステージの始まりを出さずにステージの曲を流す。
   * @param {string} typeId 敵の種類の識別子
   */
  switchEnemy(typeId) {
    if (switchEnemy(this.game, typeId)) this.flow.enterSwitchedEnemy(this.game);
  }

  /**
   * ステージを移る。移ったら、ステージの始まりを出さずにステージの曲を流す（敵の入れ替えと同じ）。
   * @param {number} delta 移る数（負なら戻る。1 より前には戻れない）
   */
  moveStage(delta) {
    if (moveStage(this.game, delta)) this.flow.enterSwitchedEnemy(this.game);
  }

  /**
   * 枠に当たる次の行動を指定する。識別子のない枠では何もしない。
   * @param {number} slot 枠の番号
   */
  chooseIntentSlot(slot) {
    const id = this.intentChoiceAt(slot);
    if (id === null) return;
    chooseEnemyIntent(this.game, id);
  }

  /**
   * 今の戦闘のターンの番号を指定した値にする。見た目は描くときにルール層を読んで合うので、anim・段階の管理の口は呼ばない。
   * @param {number} turn 新しい番号（1 以上の整数）
   */
  setBattleTurn(turn) {
    setBattleTurn(this.game, turn);
  }

  /**
   * 城の HP を指定した値にする。
   * @param {number} hp 新しい HP
   */
  setCastleHp(hp) {
    setCastleHp(this.game, hp);
  }

  /**
   * 敵の HP を指定した値にする。
   * @param {number} hp 新しい HP
   */
  setEnemyHp(hp) {
    setEnemyHp(this.game, hp);
  }
}
