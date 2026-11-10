/**
 * 責務: 攻防の結果の窓のシーン。タップで次のフェーズへ進めるか、決着ならタイトルへ戻し、結果の窓を描くこと。
 */
import { Engine, Scene } from 'oz';
import { createResultLayout } from '../view/resultLayout.js';
import { drawResultWindow } from '../view/resultWindowView.js';

/**
 * @typedef {Object} BattleResultOptions BattleResultScene に渡すオプション
 * @property {{ width: number, height: number }} screen 解像度
 * @property {string} layer 描くレイヤー名
 * @property {import('../rules/Game.js').Game} game ルール層のゲーム（次のフェーズの操作と決着の問い合わせに使う）
 * @property {import('../rules/Game.js').BattleResult} result game.resolveBattle() の戻り値
 * @property {() => Scene} createTitle タイトルの画面のシーンを作る関数
 */

/** 攻防の結果を文字で見せ、タップで次のフェーズ／タイトルへ進むシーン（盤面のシーンの上に積む） */
export class BattleResultScene extends Scene {
  /**
   * @param {BattleResultOptions} options オプション
   */
  constructor({ screen, layer, game, result, createTitle }) {
    super();
    /** @type {{ width: number, height: number }} 解像度 */
    this.screen = screen;
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {import('../rules/Game.js').Game} ルール層のゲーム */
    this.game = game;
    /** @type {import('../rules/Game.js').BattleResult} 攻防の結果 */
    this.result = result;
    /** @type {() => Scene} タイトルの画面のシーンを作る関数 */
    this.createTitle = createTitle;
    /** @type {import('../view/resultLayout.js').ResultLayout|null} 窓の配置（init で作る） */
    this.resultLayout = null;
  }

  /**
   * 窓の配置を作る。
   * @returns {void}
   */
  init() {
    this.resultLayout = createResultLayout(this.screen);
  }

  /**
   * 押したとき（'down'）だけ、画面のどこでも反応する。決着ならタイトルへ、そうでなければ次のフェーズへ進めて窓を閉じる。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type !== 'down') return;
    const game = this.game;
    if (game.isOver()) {
      Engine.changeScene(this.createTitle());
    } else if (game.canStartNextPhase()) {
      game.startNextPhase();
      Engine.popScene();
    }
  }

  /**
   * 結果の窓を描く（状態は変えない）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    drawResultWindow(ctx, this.resultLayout, this.result, this.game.isOver());
  }
}
