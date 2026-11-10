/**
 * 責務: 盤面のシーン。入力を受けてルール層の操作を呼び、選択中の山札を持ち、view を呼んで盤面を描くこと。
 */
import { Scene } from 'oz';
import { Game } from '../rules/Game.js';
import { createLayout } from '../view/layout.js';
import { drawBoard } from '../view/boardView.js';

/**
 * @typedef {Object} BoardOptions BoardScene に渡すオプション
 * @property {{ width: number, height: number }} screen 解像度
 * @property {string} layer 描くレイヤー名
 * @property {() => number} random 乱数の関数（0以上1未満。ルール層へ渡す）
 */

/** 盤面を表示し、置く・捨てる・放つをタップ／クリックで行うシーン */
export class BoardScene extends Scene {
  /**
   * @param {BoardOptions} options オプション
   */
  constructor({ screen, layer, random }) {
    super();
    /** @type {{ width: number, height: number }} 解像度 */
    this.screen = screen;
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {() => number} 乱数の関数 */
    this.random = random;
    /** @type {Game|null} ルール層のゲーム（init で作る） */
    this.game = null;
    /** @type {import('../view/layout.js').Layout|null} 画面の配置（init で作る） */
    this.layout = null;
    /** @type {number|null} 選択中の山札の番号（選択なしは null） */
    this.selectedDeck = null;
    /** @type {object|null} 直近の操作の結果（Phase 2 の演出で使う。今は保持するだけ） */
    this.lastResult = null;
  }

  /**
   * ゲームと画面の配置を作る。
   * @returns {void}
   */
  init() {
    this.game = new Game({ random: this.random });
    this.layout = createLayout({
      screen: this.screen,
      deckCount: this.game.decks.length,
      columnCount: this.game.columns.length,
      maxColumnLength: this.game.maxColumnLength,
    });
    this.selectedDeck = null;
    this.lastResult = null;
  }

  /**
   * 押したとき（'down'）だけ、当たった場所に応じてルール層の操作を呼ぶ。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type !== 'down') return;
    const game = this.game;
    if (game.isOutOfActions()) {
      this.selectedDeck = null;
      return;
    }
    const hit = this.layout.hitTest(pointer.x, pointer.y);
    if (hit === null) {
      this.selectedDeck = null;
      return;
    }
    if (hit.kind === 'deck') {
      this.#onDeck(hit.index);
    } else if (hit.kind === 'column') {
      if (this.selectedDeck !== null && game.placeableColumns(this.selectedDeck).includes(hit.index)) {
        this.lastResult = game.place(this.selectedDeck, hit.index);
      }
      this.selectedDeck = null;
    } else if (hit.kind === 'release') {
      if (game.canRelease(hit.index)) {
        this.lastResult = game.release(hit.index);
        this.selectedDeck = null;
      }
    }
  }

  /**
   * 山札を押したときの処理（同じ山札なら捨てる、別の山札なら選択を替える）。
   * @param {number} index 押した山札の番号
   * @returns {void}
   */
  #onDeck(index) {
    const game = this.game;
    if (index === this.selectedDeck) {
      if (game.canDiscard(index)) {
        this.lastResult = game.discardTop(index);
      }
      this.selectedDeck = null;
    } else if (game.canSelectDeck(index)) {
      this.selectedDeck = index;
    } else {
      this.selectedDeck = null;
    }
  }

  /**
   * ルール層の問い合わせから表示用の値を作り、盤面を描く（状態は変えない）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    const game = this.game;
    const selected = this.selectedDeck;
    /** @type {import('../view/boardView.js').BoardUi} */
    const ui = {
      selectedDeck: selected,
      discardMode: selected !== null && game.canDiscard(selected),
      placeableColumns: selected !== null ? game.placeableColumns(selected) : [],
      releasable: game.columns.map((_, c) => game.canRelease(c)),
      outOfActions: game.isOutOfActions(),
    };
    drawBoard(ctx, this.layout, game, ui);
  }
}
