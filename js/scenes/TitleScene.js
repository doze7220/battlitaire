/**
 * 責務: タイトル画面のシーン。「はじめる」ボタン（このシーンで押して離したとき）と Enter・Space キーで、
 * 渡された関数で作った新しいゲームの盤面へ進むこと。描くのは titleView.js。
 */
import { Engine, Scene } from 'oz';
import { createTitleLayout } from '../view/layout.js';
import { drawTitle } from '../view/titleView.js';

/**
 * @typedef {Object} TitleOptions TitleScene に渡すオプション
 * @property {{ width: number, height: number }} screen 解像度
 * @property {string} layer 描くレイヤー名
 * @property {() => Scene} next 新しい盤面のシーンを作る関数（進むときに呼ぶ）
 */

/** タイトル画面（ゲーム名と「はじめる」ボタン）。ボタンか Enter・Space で盤面へ進む */
export class TitleScene extends Scene {
  /**
   * @param {TitleOptions} options オプション
   */
  constructor({ screen, layer, next }) {
    super();
    /** @type {{ width: number, height: number }} 解像度 */
    this.screen = screen;
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {() => Scene} 新しい盤面のシーンを作る関数 */
    this.next = next;
    /** @type {import('../view/layout.js').TitleLayout | null} タイトル画面の配置 */
    this.layout = null;
    /** @type {boolean} このシーンでボタンの中を押したか（前の画面で押した 'up' では進まないため） */
    this.pressed = false;
  }

  /**
   * 配置を作り、押下の記録を初期化する。
   * @returns {void}
   */
  init() {
    this.layout = createTitleLayout(this.screen);
    this.pressed = false;
  }

  /**
   * ボタンの中で押して、ボタンの中で離したとき盤面へ進む。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type === 'down') {
      this.pressed = this.layout.titleHitTest(pointer.x, pointer.y) === 'start';
    } else if (pointer.type === 'up') {
      const start = this.pressed && this.layout.titleHitTest(pointer.x, pointer.y) === 'start';
      this.pressed = false;
      if (start) Engine.changeScene(this.next());
    }
  }

  /**
   * Enter・Space で盤面へ進む（ほかのキーは何もしない）。
   * @param {string} code KeyboardEvent.code
   * @returns {void}
   */
  onKeyDown(code) {
    if (code === 'Enter' || code === 'Space') Engine.changeScene(this.next());
  }

  /**
   * タイトル画面を描く（状態は変えない）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    drawTitle(ctx, this.layout);
  }
}
