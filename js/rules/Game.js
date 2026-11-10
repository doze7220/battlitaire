/**
 * 責務: ゲーム全体の状態（山札・捨て札・列・ゲージ・行動回数）の保持と、
 * 問い合わせ・操作（置く・捨てる・放つ）の提供。操作は「何が起きたか」を返す。
 */

import { RULES } from './config.js';
import { createDecks, takeTop, refillEmptyDecks } from './piles.js';
import { createColumns, placeableColumnIndices } from './columns.js';
import { computeRelease } from './release.js';

/**
 * 「置く」操作の結果。
 * @typedef {Object} PlaceResult
 * @property {'place'} type 操作の種類
 * @property {number} deckIndex 取った山札の番号
 * @property {number} columnIndex 置いた列の番号
 * @property {import('./card.js').Card} card 置いたカード
 * @property {number} actionsLeft 操作後の残り行動回数
 * @property {import('./piles.js').Refill[]} refills 操作後に起きた補充
 */

/**
 * 「捨てる」操作の結果。
 * @typedef {Object} DiscardResult
 * @property {'discard'} type 操作の種類
 * @property {number} deckIndex 捨てた山札の番号
 * @property {import('./card.js').Card} card 捨てたカード
 * @property {number} actionsLeft 操作後の残り行動回数
 * @property {import('./piles.js').Refill[]} refills 操作後に起きた補充
 */

/**
 * 「放つ」操作の結果。
 * @typedef {Object} ReleaseResult
 * @property {'release'} type 操作の種類
 * @property {number} columnIndex 放った列の番号
 * @property {import('./card.js').Card[]} cards 放ったカード（列の下から順）
 * @property {import('./release.js').ReleaseSegment[]} segments 区切りごとの計算結果
 * @property {Object<string, number>} gains ゲージごとの加算量
 * @property {number} actionsLeft 操作後の残り行動回数
 * @property {import('./piles.js').Refill[]} refills 操作後に起きた補充
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
    /** @type {Object<string, number>} ゲージ（`config.gauges` の順） */
    this.gauges = {};
    for (const gauge of config.gauges) this.gauges[gauge] = 0;
    /** @type {number} 基本の行動回数 */
    this.actionsMax = config.baseActions;
    /** @type {number} 残りの行動回数 */
    this.actionsLeft = config.baseActions;
    /** @type {number} 列に積める最大の枚数（読み取り用） */
    this.maxColumnLength = config.maxRank - config.minRank + 1;
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
    return !this.isOutOfActions() && this.decks[d].cards.length > 0;
  }

  /**
   * 山札の一番上のカードを置ける列の番号を返す。
   * @param {number} d 山札の番号
   * @returns {number[]} 置ける列の番号。行動がない・山札が空なら空配列
   */
  placeableColumns(d) {
    if (!this.canSelectDeck(d)) return [];
    return placeableColumnIndices(this.columns, this.decks[d].cards[0]);
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
   * 列を放てるか（行動が残っていて、列が空でない）。
   * @param {number} c 列の番号
   * @returns {boolean} 放てるなら `true`
   */
  canRelease(c) {
    return !this.isOutOfActions() && this.columns[c].length > 0;
  }

  /**
   * 山札の一番上のカードを列に置く。条件を満たさなければ何もしない。
   * @param {number} d 山札の番号
   * @param {number} c 列の番号
   * @returns {PlaceResult|null} 結果。置けなければ `null`
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
   * @returns {DiscardResult|null} 結果。捨てられなければ `null`
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
   * 列のカードをすべて放ち、ゲージに加算して捨て札に移す。条件を満たさなければ何もしない。
   * @param {number} c 列の番号
   * @returns {ReleaseResult|null} 結果。放てなければ `null`
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
}
