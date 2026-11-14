/**
 * 責務: ゲーム全体の状態（山札・捨て札・列・手札・ゲージ・行動回数・フェーズと段階・城・敵）の保持と、
 * 問い合わせ・操作（置く・捨てる・放つ・手札に入れる・手札から置く・束を移す・攻防・次のフェーズ）の提供。
 * 敵の順番の中の今の敵（倒した敵の入れ替わりを含む）と結果の集計（数え方は gameStats.js）を持つ。攻防では札の燃やしを反映する。操作は「何が起きたか」を返す。
 */

import { RULES } from './config.js';
import { createDecks, takeTop, refillEmptyDecks } from './piles.js';
import { createColumns, placeableColumnIndices, runStartIndex } from './columns.js';
import { createHand, isEmptySlot, hasCardInSlot } from './hand.js';
import { computeRelease } from './release.js';
import { createCastle, createEnemy } from './combatants.js';
import {
  planBehaviorAction,
  behaviorCountdown,
  rollAttackHeal,
} from './enemyBehaviors.js';
import { planActionBurns, applyBurns } from './cardBurn.js';
import { enemyTypeIdAt, enemySpecAt, isLastEnemy, nextEnemyName } from './enemyProgress.js';
import { computeBattle } from './battle.js';
import { computePhaseStart } from './phase.js';
import { createGameStats, tallyBattle } from './gameStats.js';

/**
 * 「攻防」操作の結果。
 * @typedef {Object} BattleResult
 * @property {'battle'} type 操作の種類
 * @property {import('./combatants.js').EnemyAction} enemyAction この攻防での敵の行動（予告の写し。`variant`・`burn` を含む）
 * @property {import('./battle.js').BattleEvent[]} events 出来事の並び（起きた順）
 * @property {number} castleHp 攻防の後の城の HP
 * @property {number} enemyHp 攻防の後の敵の HP
 * @property {'win'|'lose'|null} outcome 決着（決着していなければ null。途中の敵を倒しただけなら null）
 * @property {{ enemyName: string, nextEnemyName: string|null }|null} defeat 途中の敵を倒したときの倒した敵と次の敵の名前（そうでなければ null）
 */

/**
 * 「次のフェーズ」操作の結果。
 * @typedef {Object} NextPhaseResult
 * @property {'nextPhase'} type 操作の種類
 * @property {number} phase 新しいフェーズの番号
 * @property {number} bonusActions 力こぶの換算で増えた行動回数
 * @property {number} muscleSpent 換算で使った力こぶの量
 * @property {number} muscleLeft 換算後に残った力こぶの量
 * @property {number} actionsMax このフェーズの行動回数
 * @property {number} actionsLeft 残りの行動回数（フェーズの頭では actionsMax と同じ）
 * @property {import('./combatants.js').EnemyAction} enemyAction 敵の次の行動の予告
 * @property {boolean} enemyChanged このフェーズの頭で敵が入れ替わったか
 */

/**
 * ゲーム全体の状態と操作。列は `[0]` が一番下、山札は `cards[0]` が一番上。
 */
export class Game {
  /**
   * @param {Object} options 生成オプション
   * @param {() => number} options.random `[0, 1)` の値を返す乱数の関数（必須）
   * @param {Readonly<import('./config.js').Rules>} [options.config] ルールの設定（既定は `RULES`）
   * @throws {Error} `random` が関数でないとき
   */
  constructor({ random, config = RULES } = {}) {
    if (typeof random !== 'function') {
      throw new Error('Game: random は関数で渡してください');
    }
    /** @type {Readonly<import('./config.js').Rules>} ルールの設定 */
    this.config = config;
    /** @type {() => number} 乱数の関数 */
    this.random = random;
    /** @type {import('./piles.js').Deck[]} 山札（スートごと） */
    this.decks = createDecks(config, random);
    /** @type {import('./card.js').Card[]} 捨て札 */
    this.discard = [];
    /** @type {import('./card.js').Card[][]} 列 */
    this.columns = createColumns(config.columnCount);
    /** @type {import('./hand.js').Hand} 手札（枠ごとにカードか `null`）。フェーズをまたいで残る */
    this.hand = createHand(config.handSize);
    /** @type {Object<string, number>} ゲージ（`config.gauges` の順） */
    this.gauges = {};
    for (const gauge of config.gauges) this.gauges[gauge] = 0;
    /** @type {number} 基本の行動回数 */
    this.actionsMax = config.baseActions;
    /** @type {number} 残りの行動回数 */
    this.actionsLeft = config.baseActions;
    /** @type {number} 今のフェーズの番号（1から） */
    this.phase = 1;
    /** @type {'planning'|'result'|'over'} 段階（段取り中・攻防の結果を見ている・決着） */
    this.stage = 'planning';
    /** @type {'win'|'lose'|null} 決着（決着前は null） */
    this.outcome = null;
    /** @type {import('./combatants.js').Castle} 城 */
    this.castle = createCastle(config);
    /** @type {number} いま戦っている敵の、`config.enemyOrder` の中の番号（0から） */
    this.enemyIndex = 0;
    /** @type {import('./combatants.js').Enemy} 敵 */
    this.enemy = createEnemy(enemyTypeIdAt(config, 0), enemySpecAt(config, 0));
    /** @type {import('./gameStats.js').GameStats} 結果の集計（攻防ごとに足す。新しいゲームで 0 から） */
    this.stats = createGameStats();
    this.planIntent();
  }

  /**
   * 結果の集計の写しを返す（書き換えてもゲームの状態に影響しない）。
   * @returns {import('./gameStats.js').GameStats} かかったフェーズ数・敵に与えた総ダメージ・城が受けた総ダメージ・回復の合計
   */
  gameStats() {
    return { ...this.stats };
  }

  /**
   * いまの敵の次の行動を、行動の決まりで決めて予告と決まりの状態に入れる（乱数は決まりによって0回か1回。決まりの種類ごとの使い方は `enemyBehaviors.js` に従う）。
   */
  planIntent() {
    const spec = enemySpecAt(this.config, this.enemyIndex);
    const { action, state } = planBehaviorAction(spec.behavior, this.enemy.behaviorState, this.random);
    this.enemy.intent = action;
    this.enemy.behaviorState = state;
  }

  /**
   * いまの敵の攻撃までの残りフェーズ数（0 は攻撃するフェーズ）。数え下ろしを持たない敵は null。
   * @returns {number|null} 残りフェーズ数。数え下ろしを持たなければ `null`
   */
  attackCountdown() {
    return behaviorCountdown(enemySpecAt(this.config, this.enemyIndex).behavior, this.enemy.behaviorState);
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
   * 次のフェーズに進めるか（攻防の結果を見ている段階）。
   * @returns {boolean} 進めるなら `true`
   */
  canStartNextPhase() {
    return this.stage === 'result';
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
   * @param {number} c 列の番号
   * @returns {import('./planningResults.js').ReleaseResult|null} 結果。放てなければ `null`
   */
  release(c) {
    if (!this.canRelease(c)) return null;
    const cards = this.columns[c].splice(0);
    const { segments, gains } = computeRelease(cards, this.config);
    for (const gauge of Object.keys(gains)) {
      this.gauges[gauge] = (this.gauges[gauge] ?? 0) + gains[gauge];
    }
    this.discard.push(...cards);
    this.actionsLeft -= 1;
    const refills = refillEmptyDecks(this.decks, this.discard, this.random);
    return { type: 'release', columnIndex: c, cards, segments, gains, actionsLeft: this.actionsLeft, refills };
  }

  /**
   * 攻防を計算し、城・敵の HP と段階を更新する。条件を満たさなければ何もしない。
   * 決着しなければ段階は 'result'、決着したら 'over' になる（途中の敵を倒しただけなら 'result'）。
   * 敵は入れ替えない（入れ替わりは次のフェーズの頭）。行動の `burn` があれば列の札を燃やして捨て札へ移す。
   * @returns {BattleResult|null} 結果。攻防に入れなければ `null`
   */
  resolveBattle() {
    if (!this.canResolveBattle()) return null;
    const enemyAction = this.enemy.intent;
    const spec = enemySpecAt(this.config, this.enemyIndex);
    const enemyHeal = rollAttackHeal(spec.behavior, enemyAction, this.random);
    const burns = planActionBurns(enemyAction, this.columns, this.random);
    const calc = computeBattle({
      attack: this.gauges.attack ?? 0,
      defense: this.gauges.defense ?? 0,
      heal: this.gauges.heal ?? 0,
      enemyAction: { kind: enemyAction.kind, amount: enemyAction.amount },
      castleHp: this.castle.hp,
      castleMaxHp: this.castle.maxHp,
      enemyHp: this.enemy.hp,
      enemyMaxHp: this.enemy.maxHp,
      enemyHeal,
      enemyArmor: this.enemy.armor,
      lastEnemy: isLastEnemy(this.config, this.enemyIndex),
      burns,
    });
    this.castle.hp = calc.castleHp;
    this.enemy.hp = calc.enemyHp;
    this.stats = tallyBattle(this.stats, calc.events);
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
      defeat:
        calc.enemyDefeated && calc.outcome === null
          ? { enemyName: this.enemy.name, nextEnemyName: nextEnemyName(this.config, this.enemyIndex) }
          : null,
    };
  }

  /**
   * 次のフェーズを始める（ゲージの戻し・力こぶの換算・行動回数・倒した敵の入れ替わり・敵の予告）。条件を満たさなければ何もしない。
   * 倒した敵（HP 0）は次の敵（HP 最大）に入れ替わる。山札・列・捨て札・城の HP には触れない。
   * @returns {NextPhaseResult|null} 結果。進めなければ `null`
   */
  startNextPhase() {
    if (!this.canStartNextPhase()) return null;
    const start = computePhaseStart(this.gauges, this.config);
    this.phase += 1;
    this.gauges = start.gauges;
    this.actionsMax = start.actions;
    this.actionsLeft = start.actions;
    const enemyChanged = this.enemy.hp === 0;
    if (enemyChanged) {
      this.enemyIndex += 1;
      this.enemy = createEnemy(enemyTypeIdAt(this.config, this.enemyIndex), enemySpecAt(this.config, this.enemyIndex));
    }
    this.planIntent();
    this.stage = 'planning';
    return {
      type: 'nextPhase',
      phase: this.phase,
      bonusActions: start.bonusActions,
      muscleSpent: start.muscleSpent,
      muscleLeft: this.gauges[this.config.muscleConversion.gauge],
      actionsMax: this.actionsMax,
      actionsLeft: this.actionsLeft,
      enemyAction: { ...this.enemy.intent },
      enemyChanged,
    };
  }
}
