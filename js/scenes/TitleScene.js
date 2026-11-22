/**
 * 責務: タイトル画面のシーン。「はじめる」と Enter・Space で盤面へ、「遊び方」で遊び方の画面へ進み、「設定」でメニューの窓を
 * 積む（渡された関数でシーンを作る。ボタンはこのシーンで押して離したとき）。描くのは titleView.js。
 * タイトルの曲を流し、ゲームスタートでは曲を止めてスタートの音を鳴らす（音は bgmCues.js・soundCues.js 経由）。
 */
import { Engine, Scene } from 'oz';
import { createTitleLayout } from '../view/layout.js';
import { drawTitle } from '../view/titleView.js';
import { playTitleBgm, stopTitleBgm } from './bgmCues.js';
import { playStartSe } from './soundCues.js';

/**
 * @typedef {Object} TitleOptions TitleScene に渡すオプション
 * @property {{ width: number, height: number }} screen 解像度
 * @property {string} layer 描くレイヤー名
 * @property {() => Scene} next 新しい盤面のシーンを作る関数（進むときに呼ぶ）
 * @property {() => Scene} howTo 遊び方の画面のシーンを作る関数（「遊び方」ボタンで進むときに呼ぶ）
 * @property {() => Scene} menu メニューの窓のシーンを作る関数（「設定」ボタンで積むときに呼ぶ）
 */

/** タイトル画面（ゲーム名と「はじめる」「遊び方」「設定」ボタン）。「はじめる」か Enter・Space で盤面へ、「遊び方」で遊び方の画面へ進み、「設定」でメニューの窓を積む */
export class TitleScene extends Scene {
  /**
   * @param {TitleOptions} options オプション
   */
  constructor({ screen, layer, next, howTo, menu }) {
    super();
    /** @type {{ width: number, height: number }} 解像度 */
    this.screen = screen;
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {() => Scene} 新しい盤面のシーンを作る関数 */
    this.next = next;
    /** @type {() => Scene} 遊び方の画面のシーンを作る関数 */
    this.howTo = howTo;
    /** @type {() => Scene} メニューの窓のシーンを作る関数 */
    this.menu = menu;
    /** @type {import('../view/layout.js').TitleLayout | null} タイトル画面の配置 */
    this.layout = null;
    /** @type {('start'|'howTo'|'settings'|null)} このシーンで押したボタン（前の画面で押した 'up' では進まないため） */
    this.pressed = null;
  }

  /**
   * 配置を作り、押下の記録を初期化し、タイトルの曲を流す（同じ曲が流れていれば何もしない）。
   * @returns {void}
   */
  init() {
    this.layout = createTitleLayout(this.screen);
    this.pressed = null;
    playTitleBgm();
  }

  /**
   * ゲームスタート: タイトルの曲を止め、スタートの音を鳴らして、新しい盤面へ進む。
   * @returns {void}
   */
  startGame() {
    stopTitleBgm();
    playStartSe();
    Engine.changeScene(this.next());
  }

  /**
   * 押したボタンと同じボタンの中で離したとき、そのボタンの働き（スタートの音を鳴らして盤面へ／遊び方の画面へ／メニューの窓を積む）で進む。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type === 'down') {
      this.pressed = this.layout.titleHitTest(pointer.x, pointer.y);
    } else if (pointer.type === 'up') {
      const target = this.layout.titleHitTest(pointer.x, pointer.y);
      const button = target !== null && target === this.pressed ? target : null;
      this.pressed = null;
      if (button === 'start') this.startGame();
      else if (button === 'howTo') Engine.changeScene(this.howTo());
      else if (button === 'settings') Engine.pushScene(this.menu());
    }
  }

  /**
   * Enter・Space でゲームスタート（曲を止めスタートの音を鳴らして盤面へ進む）（ほかのキーは何もしない）。
   * @param {string} code KeyboardEvent.code
   * @returns {void}
   */
  onKeyDown(code) {
    if (code === 'Enter' || code === 'Space') this.startGame();
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
