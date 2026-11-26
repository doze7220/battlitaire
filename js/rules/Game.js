/**
 * 責務: ゲーム全体の状態（山札・捨て札・列・手札・ゲージ・行動回数・フェーズと段階・城・敵）の保持と、
 * 問い合わせ・操作（置く・捨てる・放つ・手札に入れる・手札から置く・束を移す・攻防・次のフェーズ）の提供。
 * ステージの番号・今の敵・今の戦闘の記録とスコア（結果の記録）・取った強化と3択の段階・この戦闘の間の行動の足し分・ゲージごとの精鋭の数と上振れを持ち（親子の敵は親と子の局面を予告に、親と子の HP を攻防に渡す）、放つ計算とターンの始まりの行動に強化の足し分を渡す。攻防では札の燃やしを反映する。操作は「何が起きたか」を返す。
 */

import { RULES } from './config.js';
import { createDecks, takeTop, refillEmptyDecks } from './piles.js';
import { createColumns, placeableColumnIndices, runStartIndex } from './columns.js';
import { createHand, isEmptySlot, hasCardInSlot } from './hand.js';
import { computeRelease } from './release.js';
import { cardBonusOf, releaseBoostOf, actionChanceOf, turnUpgradeActions, eliteStatusOf } from './upgradeBoosts.js';
import { createEliteState, drawElites, addElites } from './elites.js';
import { createCastle, createEnemy } from './combatants.js';
import {
  planBehaviorAction,
  behaviorCountdown,
  rollAttackHeal,
} from './enemyBehaviors.js';
import { planActionBurns, applyBurns } from './cardBurn.js';
import { enemySpecOf } from './enemyTypes.js';
import { enemySituationOf, battlePartsOf } from './enemyParts.js';
import { enemyTypeIdOfStage } from './stageOrder.js';
import { computeBattle } from './battle.js';
import { isFatigued } from './enemyDefense.js';
import { createIntent } from './enemyIntent.js';
import { stageBonusOf } from './stageBonus.js';
import { unitPointsOf } from './unitPoints.js';
import { computePhaseStart } from './phase.js';
import { createGameStats, tallyBattle, addRelease, addDefeat } from './gameStats.js';
import { createBattleRecord, recordRelease, recordBattle } from './battleRecord.js';
import { scoreDefeat } from './score.js';
import {
  createUpgradeState,
  takeUpgrade,
  turnGainsOf,
  castleRepairAmount,
  castleRepairPreview,
  upgradeTakenOf,
  upgradePreview,
  takenUpgradeRows,
} from './upgrades.js';
import { drawUpgradeChoices } from './upgradeOffer.js';

/**
 * 「攻防」操作の結果。
 * @typedef {Object} BattleResult
 * @property {'battle'} type 操作の種類
 * @property {import('./combatants.js').EnemyIntent} enemyAction この攻防での敵の行動（予告の写し。`variant`・`burn` を含む）
 * @property {import('./battle.js').BattleEvent[]} events 出来事の並び（起きた順）
 * @property {number} castleHp 攻防の後の城の HP
 * @property {number} enemyHp 攻防の後の敵の HP
 * @property {'lose'|null} outcome 決着（負けたら 'lose'、そうでなければ null。敵を倒しただけなら null）
 * @property {{ enemyName: string, score: import('./score.js').DefeatScore }|null} defeat 敵を倒したときの倒した敵の名前とその点（項目ごとの点・合計・足した後のスコア。そうでなければ null）
 */

/**
 * 「次のフェーズ」操作の結果。
 * @typedef {Object} NextPhaseResult
 * @property {'nextPhase'} type 操作の種類
 * @property {number} phase 新しいフェーズの番号（通しの番号）
 * @property {number} battleTurn 新しい戦闘のターン数（その敵との戦闘で何ターン目か。1 から）
 * @property {number} bonusActions 力こぶの換算で増えた行動回数
 * @property {number} muscleSpent 換算で使った力こぶの量
 * @property {number} muscleLeft 換算後に残った力こぶの量
 * @property {number} actionsMax このフェーズの行動回数
 * @property {number} actionsLeft 残りの行動回数（フェーズの頭では actionsMax と同じ）
 * @property {import('./combatants.js').EnemyIntent} enemyAction 敵の次の行動の予告
 * @property {boolean} enemyChanged このフェーズの頭で敵が入れ替わったか
 * @property {Object<string, number>} autoTroops このフェーズの頭にゲージへ足した自動兵士の量（`{ ゲージ: 量 }`。強化がなければ `{}`）
 * @property {number} battleActions このフェーズの行動回数に足した「この戦闘の間」の足し分（強化がなければ 0）
 * @property {number} chanceActions このフェーズの行動回数に足したアクションポイントの発動分（発動しなければ 0）
 */

/**
 * 「3択を選ぶ」操作の結果。
 * @typedef {Object} UpgradeChoiceResult
 * @property {'upgrade'} type 操作の種類
 * @property {import('./upgradeOffer.js').UpgradeChoice|null} picked 選んだ強化（城を修理を選んだときは null）
 * @property {number} repaired 修理で回復した量（強化を選んだときは 0）
 * @property {NextPhaseResult|null} nextPhase 次のステージへ進んだ結果（候補の行き先が 'stage' のときだけ。'planning' なら null）
 */

/**
 * ゲーム全体の状態と操作。列は `[0]` が一番下、山札は `cards[0]` が一番上。
 */
export class Game {
  /**
   * @param {Object} options 生成オプション
   * @param {import('./rng.js').Rng} options.rng 乱数（必須。`rng.next` は `[0, 1)` の値を返す。敵の並び以外の抽選（山札・敵の行動・燃える札など）に使う）
   * @param {number} options.seed 敵の並びを決める種（整数・必須。始めた日付から作られる。`rng` とは別で、並びの決定には乱数を呼ばない）
   * @param {Readonly<import('./config.js').Rules>} [options.config] ルールの設定（既定は `RULES`）
   * @throws {Error} `rng.next` が関数でないとき、`seed` が整数でないとき
   */
  constructor({ rng, seed, config = RULES } = {}) {
    if (!rng || typeof rng.next !== 'function') {
      throw new Error('Game: rng は乱数（next が関数）で渡してください');
    }
    if (!Number.isInteger(seed)) {
      throw new Error('Game: seed は整数で渡してください');
    }
    /** @type {Readonly<import('./config.js').Rules>} ルールの設定 */
    this.config = config;
    /** @type {import('./rng.js').Rng} 乱数（状態を取り出し・戻せる） */
    this.rng = rng;
    /** @type {() => number} 乱数の関数（`rng.next`） */
    this.random = rng.next;
    /** @type {number} 敵の並びを決める種（整数。ステージの番号と合わせて敵の種類を決める） */
    this.seed = seed;
    /** @type {import('./piles.js').Deck[]} 山札（スートごと） */
    this.decks = createDecks(config, this.random);
    /** @type {import('./card.js').Card[]} 捨て札 */
    this.discard = [];
    /** @type {import('./card.js').Card[][]} 列 */
    this.columns = createColumns(config.columnCount);
    /** @type {import('./hand.js').Hand} 手札（枠ごとにカードか `null`）。フェーズをまたいで残る */
    this.hand = createHand(config.handSize);
    /** @type {Object<string, number>} ゲージ（`config.gauges` の順） */
    this.gauges = {};
    for (const gauge of config.gauges) this.gauges[gauge] = 0;
    /** @type {import('./elites.js').EliteState} ゲージごとの精鋭の数と上振れ（ターンの頭にゲージと一緒に 0 に戻る） */
    this.elites = createEliteState(config);
    /** @type {number} 基本の行動回数 */
    this.actionsMax = config.baseActions;
    /** @type {number} 残りの行動回数 */
    this.actionsLeft = config.baseActions;
    /** @type {number} 今のフェーズの番号（1から） */
    this.phase = 1;
    /** @type {number} いまの敵との戦闘で何ターン目か（1 から。敵が替わると 1 に戻る） */
    this.battleTurn = 1;
    /** @type {'planning'|'result'|'choosing'|'over'} 段階（段取り中・攻防の結果を見ている・3択を選んでいる・決着） */
    this.stage = 'planning';
    /** @type {'lose'|null} 決着（決着前は null） */
    this.outcome = null;
    /** @type {import('./combatants.js').Castle} 城 */
    this.castle = createCastle(config);
    /** @type {number} ステージの番号（1 から。何体目の敵か。段階 `stage` とは別） */
    this.stageNumber = 1;
    /** @type {import('./combatants.js').Enemy} 敵 */
    this.enemy = undefined;
    /** @type {import('./battleRecord.js').BattleRecord} 今の敵との戦闘の記録（敵が替わると新しくなる） */
    this.battleRecord = createBattleRecord();
    this.enterStage(1);
    /** @type {import('./gameStats.js').GameStats} 結果の記録（放つ・攻防・敵を倒すごとに足す。新しいゲームで 0 から） */
    this.stats = createGameStats(config);
    /** @type {import('./upgrades.js').UpgradeState} 取った強化の状態（新しいゲームで空） */
    this.upgrades = createUpgradeState();
    /** @type {import('./upgradeOffer.js').UpgradeOffer|null} 3択の候補（3択を選んでいる間だけ。そうでなければ null） */
    this.upgradeOffer = null;
    /** @type {number} この戦闘の間、毎ターン足す行動の数（新しいゲームで 0。敵を倒して3択が始まると 0 に戻る） */
    this.battleActionBonus = 0;
    this.planIntent();
  }

  /**
   * ステージの番号を入れ、そのステージの敵（種と番号から決まる種類）に入れ替える（乱数は呼ばない。予告は呼ぶ側が `planIntent` で決める）。
   * @param {number} stageNumber 新しいステージの番号（1 以上の整数）
   */
  enterStage(stageNumber) {
    this.stageNumber = stageNumber;
    this.spawnEnemy(enemyTypeIdOfStage(this.config, this.seed, stageNumber));
  }

  /**
   * 指定した種類の敵（今のステージの加算後の HP 満タン・決まりの状態は初期値・予告は null）に入れ替え、戦闘のターンを 1 に戻し、戦闘の記録を新しくする（乱数は呼ばない。予告は呼ぶ側が `planIntent` で決める）。
   * @param {string} typeId 敵の種類の識別子
   */
  spawnEnemy(typeId) {
    this.enemy = createEnemy(typeId, enemySpecOf(this.config, typeId), this.stageBonus());
    this.battleTurn = 1;
    this.battleRecord = createBattleRecord();
  }

  /**
   * 結果の記録の写しを返す（入れ子を持つので深い写し。書き換えてもゲームの状態に影響しない）。
   * @returns {import('./gameStats.js').GameStats} 倒した数・総ターン数・スコア・項目ごとの合計と回数・倒した敵の並び・最大の一撃・一番長いコンボ
   */
  gameStats() {
    return structuredClone(this.stats);
  }

  /**
   * いまの敵の次の行動を、行動の決まりで決めて予告と決まりの状態に入れる（乱数は決まりの抽選のあと、行動が防御の量を持たず、敵が防御の設定を持ち、隙でないときだけ防御の抽選（張るか・量の2回）。決まりの種類ごとの使い方は `enemyBehaviors.js`、防御は `enemyDefense.js` に従う）。
   */
  planIntent() {
    const { action, state } = planBehaviorAction(
      enemySpecOf(this.config, this.enemy.typeId).behavior,
      this.enemy.behaviorState,
      this.random,
      this.enemyUnitPoints(),
      enemySituationOf(this.enemy.parts),
    );
    this.enemy.intent = this.intentOf(action);
    this.enemy.behaviorState = state;
  }

  /**
   * いまの敵の1体のポイントを返す（乱数は呼ばず、状態も変えない）。
   * @returns {number} 1体が受け持つポイント（1 以上の整数。設定に書かなければ 1）
   */
  enemyUnitPoints() {
    return unitPointsOf(enemySpecOf(this.config, this.enemy.typeId));
  }

  /**
   * 今のステージの加算量を返す。
   * @returns {import('./stageBonus.js').StageBonus} 加算量（HP の百分率・攻撃・防御）
   */
  stageBonus() {
    return stageBonusOf(this.config.stageGrowth, this.stageNumber);
  }

  /**
   * 行動から、今の敵の予告（ステージの加算・防御の量・疲弊を付けたもの）を作る（行動が防御の量を持たず、敵が防御の設定を持ち、隙でないときだけ、防御の抽選で乱数を2回呼ぶ）。
   * @param {import('./combatants.js').EnemyAction} action 行動の決まりが決めた行動
   * @returns {import('./combatants.js').EnemyIntent} 新しい予告
   */
  intentOf(action) {
    return createIntent(
      enemySpecOf(this.config, this.enemy.typeId),
      action,
      this.stageBonus(),
      this.battleTurn,
      this.config.fatigue,
      this.random,
    );
  }

  /**
   * いまの敵が疲弊しているか。
   * @returns {boolean} 疲弊していれば true
   */
  isEnemyFatigued() {
    return isFatigued(this.battleTurn, this.config.fatigue);
  }

  /**
   * いまの敵の攻撃までの残りフェーズ数（0 は攻撃するフェーズ）。数え下ろしを持たない敵は null。
   * @returns {number|null} 残りフェーズ数。数え下ろしを持たなければ `null`
   */
  attackCountdown() {
    return behaviorCountdown(enemySpecOf(this.config, this.enemy.typeId).behavior, this.enemy.behaviorState);
  }

  /**
   * 山札の表向きに見えるカードを返す。
   * @param {number} d 山札の番号
   * @returns {import('./card.js').Card[]} 見えるカード（先頭が一番上）
   */
  visibleCards(d) {
    return this.decks[d].cards.slice(0, this.config.visibleCount);
  }

  /**
   * 山札の、見えているカードを除いた残りの枚数を返す。
   * @param {number} d 山札の番号
   * @returns {number} 残り枚数（0未満にならない）
   */
  hiddenCount(d) {
    return Math.max(0, this.decks[d].cards.length - this.config.visibleCount);
  }

  /**
   * 行動を使い切ったか。
   * @returns {boolean} 残り行動回数が0なら `true`
   */
  isOutOfActions() {
    return this.actionsLeft <= 0;
  }

  /**
   * 山札を選べるか（行動が残っていて、山札が空でない）。
   * @param {number} d 山札の番号
   * @returns {boolean} 選べるなら `true`
   */
  canSelectDeck(d) {
    return this.stage === 'planning' && !this.isOutOfActions() && this.decks[d].cards.length > 0;
  }

  /**
   * 山札の一番上のカードを置ける列の番号を返す。
   * @param {number} d 山札の番号
   * @returns {number[]} 置ける列の番号。行動がない・山札が空なら空配列
   */
  placeableColumns(d) {
    if (!this.canSelectDeck(d)) return [];
    return placeableColumnIndices(this.columns, this.decks[d].cards[0], this.config);
  }

  /**
   * 山札の一番上のカードを捨てられるか（行動が残り、山札が空でなく、どの列にも置けない）。
   * @param {number} d 山札の番号
   * @returns {boolean} 捨てられるなら `true`
   */
  canDiscard(d) {
    return this.canSelectDeck(d) && this.placeableColumns(d).length === 0;
  }

  /**
   * 山札の一番上のカードを手札の空き枠に入れられるか（山札を選べて、枠が空いている）。
   * @param {number} d 山札の番号
   * @param {number} s 手札の枠の番号
   * @returns {boolean} 入れられるなら `true`
   */
  canHold(d, s) {
    return this.canSelectDeck(d) && isEmptySlot(this.hand, s);
  }

  /**
   * 手札の枠のカードを選べるか（段取り中で、行動が残り、枠にカードがある）。
   * @param {number} s 手札の枠の番号
   * @returns {boolean} 選べるなら `true`
   */
  canSelectHandSlot(s) {
    return this.stage === 'planning' && !this.isOutOfActions() && hasCardInSlot(this.hand, s);
  }

  /**
   * 手札の枠のカードを置ける列の番号を返す。
   * @param {number} s 手札の枠の番号
   * @returns {number[]} 置ける列の番号。選べなければ空配列
   */
  handPlaceableColumns(s) {
    if (!this.canSelectHandSlot(s)) return [];
    return placeableColumnIndices(this.columns, this.hand[s], this.config);
  }

  /**
   * 列の `i` 番目のカードが、一番上から続く束に含まれるか（段取り中で、行動が残っている）。
   * @param {number} c 列の番号
   * @param {number} i タップしたカードの位置（列の下から数えた番号）
   * @returns {boolean} 選べるなら `true`
   */
  canSelectRun(c, i) {
    if (this.stage !== 'planning' || this.isOutOfActions()) return false;
    const column = this.columns[c];
    if (!column || !Number.isInteger(i)) return false;
    return runStartIndex(column, this.config) <= i && i < column.length;
  }

  /**
   * 列の一番上から続く束の一番下の位置を返す。
   * @param {number} c 列の番号
   * @returns {number} 束の一番下の位置（列の下から数えた番号）。列がない・空なら `-1`
   */
  runStart(c) {
    const column = this.columns[c];
    if (!column) return -1;
    return runStartIndex(column, this.config);
  }

  /**
   * 束全体（束の一番下から一番上まで）を移せる列の番号を返す（元の列は含めない。空いた列は含む）。
   * 移せるかは束の一番下のカードで判定する。
   * @param {number} c 束の元の列の番号
   * @returns {number[]} 移せる列の番号。束を選べなければ空配列
   */
  runTargetColumns(c) {
    const start = this.runStart(c);
    if (start < 0 || !this.canSelectRun(c, start)) return [];
    return placeableColumnIndices(this.columns, this.columns[c][start], this.config).filter((to) => to !== c);
  }

  /**
   * 列を放てるか（行動が残っていて、列が空でない）。
   * @param {number} c 列の番号
   * @returns {boolean} 放てるなら `true`
   */
  canRelease(c) {
    return this.stage === 'planning' && !this.isOutOfActions() && this.columns[c].length > 0;
  }

  /**
   * 攻防に入れるか（段取り中で、行動回数が0）。
   * @returns {boolean} 入れるなら `true`
   */
  canResolveBattle() {
    return this.stage === 'planning' && this.isOutOfActions();
  }

  /**
   * 次のフェーズに進めるか（攻防の結果を見ている段階で、敵が生きている。敵を倒したときは3択を選ぶまで進めない）。
   * @returns {boolean} 進めるなら `true`
   */
  canStartNextPhase() {
    return this.stage === 'result' && this.enemy.hp > 0;
  }

  /**
   * 3択を選んでいる段階か。
   * @returns {boolean} 選んでいれば `true`
   */
  isChoosingUpgrade() {
    return this.stage === 'choosing';
  }

  /**
   * 3択を始められるか（攻防の結果を見ている段階で、敵を倒している）。
   * @returns {boolean} 始められるなら `true`
   */
  canBeginUpgradeChoice() {
    return this.stage === 'result' && this.enemy.hp === 0;
  }

  /**
   * 城を修理で回復する量（今の城の最大 HP と HP から。乱数は呼ばず、状態も変えない）。
   * @returns {number} 回復する量（満タンなら 0）
   */
  castleRepairAmount() {
    return castleRepairAmount(this.castle, this.config.castleRepairPercent);
  }

  /**
   * ターンの頭にゲージへ足す自動兵士の量（取った強化から。状態は変えない）。
   * @returns {Object<string, number>} `{ ゲージ: 量 }`（0 のゲージは入らない）
   */
  autoTroopGains() {
    return turnGainsOf(this.config, this.upgrades);
  }

  /**
   * 強化の取った回数と効いた量を返す（写し）。
   * @param {string} id 強化の識別子
   * @returns {{ count: number, amount: number }} 取っていなければ両方 0
   */
  upgradeTaken(id) {
    return upgradeTakenOf(this.upgrades, id);
  }

  /**
   * 強化を値 `value` で取る前と後の値（状態は変えない）。
   * @param {string} id 強化の識別子
   * @param {number} value 取るときの値
   * @returns {import('./upgradeEffects.js').UpgradePreview} 取る前と後の値
   */
  upgradePreview(id, value) {
    return upgradePreview(this, id, value);
  }

  /**
   * 「強化」タブに出す行（一覧の順。回数 1 以上で出すと決まった種類だけ）。
   * @returns {import('./upgrades.js').UpgradeRow[]} 行の並び
   */
  takenUpgradeRows() {
    return takenUpgradeRows(this);
  }

  /**
   * 行動のゲージの横に出す強化の表示の値（アクションポイントの発動率・この戦闘の間の足し分。状態は変えない）。
   * @returns {{ chance: { actions: number, percent: number, capped: boolean }|null, battleActions: number }} `chance` は率 0 なら `null`
   */
  actionUpgradeStatus() {
    const { percent, actions, capped } = actionChanceOf(this.config, this.upgrades);
    return {
      chance: percent > 0 ? { actions, percent, capped } : null,
      battleActions: this.battleActionBonus,
    };
  }

  /**
   * ゲージごとの精鋭の確率・能力・1体のポイント（取った強化から。状態は変えない）。
   * @returns {Object<string, import('./upgradeBoosts.js').EliteStatus>} ゲージ → 精鋭の状態
   */
  eliteStatus() {
    return eliteStatusOf(this.config, this.upgrades);
  }

  /**
   * ゲージごとの精鋭の数と上振れ（写し。書き換えてもゲームの状態に影響しない）。
   * @returns {import('./elites.js').EliteState} ゲージ → `{ count, extra }`
   */
  eliteBoost() {
    return structuredClone(this.elites);
  }

  /**
   * 札の +◯（取った強化から求める。札そのものは書き換えない。山札・手札・列・捨て札のどこにある札でも同じ）。
   * @param {{ suit: string, rank: number }} card 札
   * @returns {number} 札の +◯
   */
  cardBonus(card) {
    return cardBonusOf(this.config, this.upgrades, card);
  }

  /**
   * 城を修理した前と後の値（状態は変えない）。
   * @returns {import('./upgrades.js').RepairPreview} 回復量と前後の HP
   */
  repairPreview() {
    return castleRepairPreview(this.castle, this.config.castleRepairPercent);
  }

  /**
   * 次のステージの敵（乱数は呼ばず、状態も変えない）。
   * @returns {{ stageNumber: number, typeId: string, name: string }} 次のステージの番号・敵の種類・名前
   */
  nextStageEnemy() {
    const stageNumber = this.stageNumber + 1;
    const typeId = enemyTypeIdOfStage(this.config, this.seed, stageNumber);
    return { stageNumber, typeId, name: enemySpecOf(this.config, typeId).name };
  }

  /**
   * 決着したか。
   * @returns {boolean} 決着していれば `true`
   */
  isOver() {
    return this.stage === 'over';
  }

  /**
   * 山札の一番上のカードを列に置く。条件を満たさなければ何もしない。
   * @param {number} d 山札の番号
   * @param {number} c 列の番号
   * @returns {import('./planningResults.js').PlaceResult|null} 結果。置けなければ `null`
   */
  place(d, c) {
    if (!this.placeableColumns(d).includes(c)) return null;
    const card = takeTop(this.decks[d]);
    this.columns[c].push(card);
    this.actionsLeft -= 1;
    const refills = refillEmptyDecks(this.decks, this.discard, this.random);
    return { type: 'place', deckIndex: d, columnIndex: c, card, actionsLeft: this.actionsLeft, refills };
  }

  /**
   * 山札の一番上のカードを捨て札に捨てる。条件を満たさなければ何もしない。
   * @param {number} d 山札の番号
   * @returns {import('./planningResults.js').DiscardResult|null} 結果。捨てられなければ `null`
   */
  discardTop(d) {
    if (!this.canDiscard(d)) return null;
    const card = takeTop(this.decks[d]);
    this.discard.push(card);
    this.actionsLeft -= 1;
    const refills = refillEmptyDecks(this.decks, this.discard, this.random);
    return { type: 'discard', deckIndex: d, card, actionsLeft: this.actionsLeft, refills };
  }

  /**
   * 山札の一番上のカードを手札の空き枠に入れる。条件を満たさなければ何もしない。
   * @param {number} d 山札の番号
   * @param {number} s 手札の枠の番号
   * @returns {import('./planningResults.js').HoldResult|null} 結果。入れられなければ `null`
   */
  hold(d, s) {
    if (!this.canHold(d, s)) return null;
    const card = takeTop(this.decks[d]);
    this.hand[s] = card;
    this.actionsLeft -= 1;
    const refills = refillEmptyDecks(this.decks, this.discard, this.random);
    return { type: 'hold', deckIndex: d, slotIndex: s, card, actionsLeft: this.actionsLeft, refills };
  }

  /**
   * 手札の枠のカードを列に置く。条件を満たさなければ何もしない。
   * @param {number} s 手札の枠の番号
   * @param {number} c 列の番号
   * @returns {import('./planningResults.js').HandPlaceResult|null} 結果。置けなければ `null`
   */
  placeFromHand(s, c) {
    if (!this.handPlaceableColumns(s).includes(c)) return null;
    const card = this.hand[s];
    this.columns[c].push(card);
    this.hand[s] = null;
    this.actionsLeft -= 1;
    return { type: 'placeFromHand', slotIndex: s, columnIndex: c, card, actionsLeft: this.actionsLeft };
  }

  /**
   * 列の束全体（束の一番下から一番上まで）を、並びを保ったまま別の列へ移す。条件を満たさなければ何もしない。
   * @param {number} c 元の列の番号
   * @param {number} to 移し先の列の番号
   * @returns {import('./planningResults.js').MoveResult|null} 結果（`fromIndex` は束の一番下だった位置）。移せなければ `null`
   */
  moveRun(c, to) {
    if (!this.runTargetColumns(c).includes(to)) return null;
    const start = this.runStart(c);
    const cards = this.columns[c].splice(start);
    this.columns[to].push(...cards);
    this.actionsLeft -= 1;
    return { type: 'move', fromColumn: c, fromIndex: start, toColumn: to, cards, actionsLeft: this.actionsLeft };
  }

  /**
   * 列のカードをすべて放ち、ゲージに加算して捨て札に移す。条件を満たさなければ何もしない。
   * 放つ量が決まった後・山札の補充の前に精鋭を抽選し（確率 0 のゲージは乱数を呼ばない）、ゲージには人数に精鋭の上振れを足し、`elites` の状態にも足す。
   * @param {number} c 列の番号
   * @returns {import('./planningResults.js').ReleaseResult|null} 結果。放てなければ `null`
   */
  release(c) {
    if (!this.canRelease(c)) return null;
    const cards = this.columns[c].splice(0);
    const calc = computeRelease(cards, this.config, releaseBoostOf(this.config, this.upgrades));
    const { segments, gains, allSuits } = calc;
    this.battleRecord = recordRelease(this.battleRecord, segments);
    this.stats = addRelease(this.stats, segments);
    // 精鋭の抽選は、放つ量が決まった後・山札の補充の前（確率 0 のゲージは乱数を呼ばない）
    const elites = drawElites(calc, this.eliteStatus(), this.random);
    for (const gauge of Object.keys(gains)) {
      this.gauges[gauge] = (this.gauges[gauge] ?? 0) + gains[gauge] + (elites.extra[gauge] ?? 0);
    }
    this.elites = addElites(this.elites, elites);
    this.discard.push(...cards);
    this.actionsLeft -= 1;
    const refills = refillEmptyDecks(this.decks, this.discard, this.random);
    return { type: 'release', columnIndex: c, cards, segments, gains, allSuits, elites, actionsLeft: this.actionsLeft, refills };
  }

  /**
   * 攻防を計算し、城・敵の HP と段階を更新する。条件を満たさなければ何もしない。
   * 決着しなければ段階は 'result'、決着したら 'over' になる（敵を倒しただけなら 'result'）。
   * 敵は入れ替えない（入れ替わりは次のフェーズの頭）。行動の `burn` があれば列の札を燃やして捨て札へ移す。
   * @returns {BattleResult|null} 結果。攻防に入れなければ `null`
   */
  resolveBattle() {
    if (!this.canResolveBattle()) return null;
    const enemyAction = this.enemy.intent;
    const spec = enemySpecOf(this.config, this.enemy.typeId);
    const enemyHeal = rollAttackHeal(spec.behavior, enemyAction, this.random);
    const burns = planActionBurns(enemyAction, this.columns, this.random);
    const attack = this.gauges.attack ?? 0;
    const calc = computeBattle({
      attack,
      defense: this.gauges.defense ?? 0,
      heal: this.gauges.heal ?? 0,
      enemyAction: { kind: enemyAction.kind, amount: enemyAction.amount, defense: enemyAction.defense },
      castleHp: this.castle.hp,
      castleMaxHp: this.castle.maxHp,
      enemyHp: this.enemy.hp,
      enemyMaxHp: this.enemy.maxHp,
      enemyHeal,
      burns,
      enemyParts: battlePartsOf(spec, this.enemy.parts, enemyAction.kind),
    });
    this.castle.hp = calc.castleHp;
    this.enemy.hp = calc.enemyHp;
    this.enemy.parts = calc.enemyParts;
    this.stats = tallyBattle(this.stats, calc.events, attack);
    this.battleRecord = recordBattle(this.battleRecord, calc.events);
    let defeat = null;
    if (calc.enemyDefeated) {
      const breakdown = scoreDefeat(this.config, {
        stageNumber: this.stageNumber,
        star: spec.star,
        record: this.battleRecord,
      });
      this.stats = addDefeat(this.stats, breakdown, { typeId: this.enemy.typeId, stageNumber: this.stageNumber });
      defeat = {
        enemyName: this.enemy.name,
        score: { items: breakdown.items.map((item) => ({ ...item })), total: breakdown.total, after: this.stats.score },
      };
    }
    applyBurns(this.columns, this.discard, calc.burned);
    if (calc.outcome === null) {
      this.stage = 'result';
    } else {
      this.stage = 'over';
      this.outcome = calc.outcome;
    }
    return {
      type: 'battle',
      enemyAction: { ...enemyAction },
      events: calc.events,
      castleHp: calc.castleHp,
      enemyHp: calc.enemyHp,
      outcome: calc.outcome,
      defeat,
    };
  }

  /**
   * 3択を始める（敵を倒した直後の `'result'` から）。候補を引いて段階を `'choosing'` にする。条件を満たさなければ何もしない。
   * @returns {import('./upgradeOffer.js').UpgradeOffer|null} 候補の写し（行き先 `'stage'`）。始められなければ `null`
   */
  beginUpgradeChoice() {
    if (!this.canBeginUpgradeChoice()) return null;
    this.battleActionBonus = 0;
    this.offerUpgrades('stage');
    return {
      choices: this.upgradeOffer.choices.map((c) => ({ ...c })),
      next: this.upgradeOffer.next,
    };
  }

  /**
   * 3択の候補を引いて段階を `'choosing'` にする（条件は呼ぶ側が確かめる。乱数は `drawUpgradeChoices` の順に呼ぶ）。
   * @param {'stage'|'planning'} next 選んだ後の行き先（`'stage'` は次のステージ、`'planning'` は今の段取りへ戻る）
   * @returns {void}
   */
  offerUpgrades(next) {
    this.upgradeOffer = {
      choices: drawUpgradeChoices(this.config, this.upgrades, this.random),
      next,
    };
    this.stage = 'choosing';
  }

  /**
   * 3択を選ぶ。強化なら取り、`'repair'` なら城を修理する。行き先が `'stage'` なら次のステージへ進み、`'planning'` なら段取りへ戻る。
   * @param {number|'repair'} choice 候補の番号（0 から）か `'repair'`
   * @returns {UpgradeChoiceResult|null} 結果。3択の段階でない・番号が範囲外なら `null`
   */
  chooseUpgrade(choice) {
    if (!this.isChoosingUpgrade() || !this.upgradeOffer) return null;
    const { choices, next } = this.upgradeOffer;
    let picked = null;
    let repaired = 0;
    if (choice === 'repair') {
      repaired = this.castleRepairAmount();
    } else if (Number.isInteger(choice) && choice >= 0 && choice < choices.length) {
      picked = { ...choices[choice] };
    } else {
      return null;
    }
    if (picked) takeUpgrade(this, picked.id, picked.value);
    else this.castle.hp += repaired;
    this.upgradeOffer = null;
    let nextPhase = null;
    if (next === 'stage') {
      this.stage = 'result';
      nextPhase = this.advancePhase();
    } else {
      this.stage = 'planning';
    }
    return { type: 'upgrade', picked, repaired, nextPhase };
  }

  /**
   * 次のフェーズを始める（ゲージの戻し・自動兵士・力こぶの換算・行動回数・倒した敵の入れ替わり・敵の予告）。条件を満たさなければ何もしない。
   * 倒した敵（HP 0）は次のステージの敵（HP 最大）に入れ替わる。山札・列・捨て札・城の HP には触れない。
   * @returns {NextPhaseResult|null} 結果。進めなければ `null`
   */
  startNextPhase() {
    if (!this.canStartNextPhase()) return null;
    return this.advancePhase();
  }

  /**
   * 次のフェーズを始める本体（条件は呼ぶ側が確かめる。`startNextPhase`・`chooseUpgrade` から呼ぶ）。ゲージの戻しの後に自動兵士の量を足し、予告を決めた後に強化の行動（この戦闘の間の足し分・発動の抽選。率 0 では乱数を呼ばない）を行動回数へ足す。
   * @returns {NextPhaseResult} 結果
   */
  advancePhase() {
    const start = computePhaseStart(this.gauges, this.config);
    this.phase += 1;
    this.gauges = start.gauges;
    this.elites = createEliteState(this.config);
    const autoTroops = this.autoTroopGains();
    for (const gauge of Object.keys(autoTroops)) {
      this.gauges[gauge] = (this.gauges[gauge] ?? 0) + autoTroops[gauge];
    }
    const enemyChanged = this.enemy.hp === 0;
    if (enemyChanged) {
      this.enterStage(this.stageNumber + 1);
    } else {
      this.battleTurn += 1;
    }
    this.planIntent();
    const { battleActions, chanceActions } = turnUpgradeActions(
      this.config,
      this.upgrades,
      this.battleActionBonus,
      this.random,
    );
    this.actionsMax = start.actions + battleActions + chanceActions;
    this.actionsLeft = this.actionsMax;
    this.stage = 'planning';
    return {
      type: 'nextPhase',
      phase: this.phase,
      battleTurn: this.battleTurn,
      bonusActions: start.bonusActions,
      muscleSpent: start.muscleSpent,
      muscleLeft: this.gauges[this.config.muscleConversion.gauge],
      actionsMax: this.actionsMax,
      actionsLeft: this.actionsLeft,
      enemyAction: { ...this.enemy.intent },
      enemyChanged,
      autoTroops,
      battleActions,
      chanceActions,
    };
  }
}
