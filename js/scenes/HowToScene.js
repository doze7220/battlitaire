/**
 * 責務: 遊び方の画面のシーン。今のページの番号を持ち、まえへ／つぎへ／タイトルへのボタン（このシーンで押して離したとき）と
 * ← → ・Escape キーで、ページを移る・渡された関数で作ったタイトル画面へ戻ること。描くのは howToView.js。
 * 「DEBUG MODE」のレイヤーも描く（debugModeLayer.js）。
 */
import { Engine, Scene } from 'oz';
import { drawDebugModeLayer } from './debugModeLayer.js';
import { createHowToLayout } from '../view/layout.js';
import { drawHowTo } from '../view/howToView.js';
import { HOW_TO_PAGES } from '../view/howToText.js';

/**
 * @typedef {Object} HowToOptions HowToScene に渡すオプション
 * @property {{ width: number, height: number }} screen 解像度
 * @property {string} layer 描くレイヤー名
 * @property {() => Scene} back 新しいタイトル画面のシーンを作る関数（戻るときに呼ぶ）
 */

/** 遊び方の画面。ページをめくって読み、タイトル画面へ戻る */
export class HowToScene extends Scene {
  /**
   * @param {HowToOptions} options オプション
   */
  constructor({ screen, layer, back }) {
    super();
    /** @type {{ width: number, height: number }} 解像度 */
    this.screen = screen;
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {() => Scene} 新しいタイトル画面のシーンを作る関数 */
    this.back = back;
    /** @type {import('../view/layout.js').HowToLayout | null} 遊び方の画面の配置 */
    this.layout = null;
    /** @type {number} 今のページの番号（0 始まり） */
    this.page = 0;
    /** @type {('prev'|'next'|'back'|null)} このシーンで押したボタン（前の画面で押した 'up' では働かないため） */
    this.pressed = null;
  }

  /**
   * 配置を作り、1ページ目と押下の記録を初期化する。
   * @returns {void}
   */
  init() {
    this.layout = createHowToLayout(this.screen);
    this.page = 0;
    this.pressed = null;
  }

  /**
   * 前のページへ移れるか。
   * @returns {boolean} 移れるとき true
   */
  canPrev() {
    return this.page > 0;
  }

  /**
   * 次のページへ移れるか。
   * @returns {boolean} 移れるとき true
   */
  canNext() {
    return this.page < HOW_TO_PAGES.length - 1;
  }

  /**
   * ボタンの中で押して、同じボタンの中で離したとき、そのボタンの働きをする。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type === 'down') {
      this.pressed = this.layout.howToHitTest(pointer.x, pointer.y);
    } else if (pointer.type === 'up') {
      const hit = this.layout.howToHitTest(pointer.x, pointer.y);
      const button = hit !== null && hit === this.pressed ? hit : null;
      this.pressed = null;
      if (button === 'prev') this.goPrev();
      else if (button === 'next') this.goNext();
      else if (button === 'back') Engine.changeScene(this.back());
    }
  }

  /**
   * ← で前のページ、→ で次のページ、Escape でタイトル画面へ戻る（ほかのキーは何もしない）。
   * @param {string} code KeyboardEvent.code
   * @returns {void}
   */
  onKeyDown(code) {
    if (code === 'ArrowLeft') this.goPrev();
    else if (code === 'ArrowRight') this.goNext();
    else if (code === 'Escape') Engine.changeScene(this.back());
  }

  /**
   * 前のページへ移る（移れないときは何もしない）。
   * @returns {void}
   */
  goPrev() {
    if (this.canPrev()) this.page -= 1;
  }

  /**
   * 次のページへ移る（移れないときは何もしない）。
   * @returns {void}
   */
  goNext() {
    if (this.canNext()) this.page += 1;
  }

  /**
   * 遊び方の画面を描く（状態は変えない）。「DEBUG MODE」のレイヤーも描く（debugModeLayer.js）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    drawDebugModeLayer(ctx, layer);
    if (layer !== this.layer) return;
    drawHowTo(ctx, this.layout, {
      page: this.page,
      count: HOW_TO_PAGES.length,
      canPrev: this.canPrev(),
      canNext: this.canNext(),
    });
  }
}
