/**
 * 責務: タイトル画面のシーン。「再開」（中断データがあるときだけ。下に再開の場所の文字）・「はじめる」・Enter・Space で盤面へ、「遊び方」で遊び方の画面へ進み、「設定」でメニューの窓を積む
 * （ボタンはこのシーンで押して離したとき）。描くのは titleView.js。「DEBUG MODE」のレイヤーも描く（debugModeLayer.js）。
 * タイトルの曲を流し、盤面へ進むときは曲を止めてスタートの音を鳴らす（音は bgmCues.js・soundCues.js 経由）。中断データは init で1回だけ読む（suspendStore.js）。
 */
import { Engine, Scene } from 'oz';
import { createTitleLayout } from '../view/layout.js';
import { drawTitle } from '../view/titleView.js';
import { playTitleBgm, stopTitleBgm } from './bgmCues.js';
import { playStartSe } from './soundCues.js';
import { drawDebugModeLayer } from './debugModeLayer.js';
import { loadSuspend } from './suspendStore.js';

/**
 * @typedef {Object} TitleOptions TitleScene に渡すオプション
 * @property {{ width: number, height: number }} screen 解像度
 * @property {string} layer 描くレイヤー名
 * @property {() => Scene} next 新しい盤面のシーンを作る関数（進むときに呼ぶ）
 * @property {(suspend: import('../rules/suspendData.js').SuspendData) => Scene} resume 中断データから再開する盤面のシーンを作る関数（「再開」で進むときに呼ぶ）
 * @property {() => Scene} howTo 遊び方の画面のシーンを作る関数（「遊び方」ボタンで進むときに呼ぶ）
 * @property {() => Scene} menu メニューの窓のシーンを作る関数（「設定」ボタンで積むときに呼ぶ）
 */

/** タイトル画面（ゲーム名と「再開」（中断データがあるときだけ）「はじめる」「遊び方」「設定」ボタン）。「はじめる」か Enter・Space で盤面へ（中断データがあるときの Enter・Space と「再開」は再開）、「遊び方」で遊び方の画面へ進み、「設定」でメニューの窓を積む */
export class TitleScene extends Scene {
  /**
   * @param {TitleOptions} options オプション
   */
  constructor({ screen, layer, next, resume, howTo, menu }) {
    super();
    /** @type {{ width: number, height: number }} 解像度 */
    this.screen = screen;
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {() => Scene} 新しい盤面のシーンを作る関数 */
    this.next = next;
    /** @type {(suspend: import('../rules/suspendData.js').SuspendData) => Scene} 再開する盤面のシーンを作る関数 */
    this.resume = resume;
    /** @type {() => Scene} 遊び方の画面のシーンを作る関数 */
    this.howTo = howTo;
    /** @type {() => Scene} メニューの窓のシーンを作る関数 */
    this.menu = menu;
    /** @type {import('../view/layout.js').TitleLayout | null} タイトル画面の配置 */
    this.layout = null;
    /** @type {import('../rules/suspendData.js').SuspendData | null} 中断データ（init で1回だけ読む。なければ null） */
    this.suspend = null;
    /** @type {('resume'|'start'|'howTo'|'settings'|null)} このシーンで押したボタン（前の画面で押した 'up' では進まないため） */
    this.pressed = null;
  }

  /**
   * 中断データを1回だけ読み、配置を作り、押下の記録を初期化し、タイトルの曲を流す（同じ曲が流れていれば何もしない）。
   * @returns {void}
   */
  init() {
    this.suspend = loadSuspend();
    this.layout = createTitleLayout(this.screen, this.suspend !== null);
    this.pressed = null;
    playTitleBgm();
  }

  /**
   * 盤面へ進む共通の処理: タイトルの曲を止め、スタートの音を鳴らして、渡された関数で作った盤面へ進む。
   * @param {() => Scene} createBoard 盤面のシーンを作る関数（曲を止めて音を鳴らした後に呼ぶ）
   * @returns {void}
   */
  enterBoard(createBoard) {
    stopTitleBgm();
    playStartSe();
    Engine.changeScene(createBoard());
  }

  /**
   * ゲームスタート: 新しい盤面へ進む。
   * @returns {void}
   */
  startGame() {
    this.enterBoard(this.next);
  }

  /**
   * 再開: 中断データの盤面へ進む（中断データがあるときだけ呼ぶ）。
   * @returns {void}
   */
  resumeGame() {
    this.enterBoard(() => this.resume(this.suspend));
  }

  /**
   * 押したボタンと同じボタンの中で離したとき、そのボタンの働き（再開／スタートの音を鳴らして盤面へ／遊び方の画面へ／メニューの窓を積む）で進む。
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
      if (button === 'resume') this.resumeGame();
      else if (button === 'start') this.startGame();
      else if (button === 'howTo') Engine.changeScene(this.howTo());
      else if (button === 'settings') Engine.pushScene(this.menu());
    }
  }

  /**
   * Enter・Space で、中断データがあれば再開、なければゲームスタート（曲を止めスタートの音を鳴らして盤面へ進む）（ほかのキーは何もしない）。
   * @param {string} code KeyboardEvent.code
   * @returns {void}
   */
  onKeyDown(code) {
    if (code === 'Enter' || code === 'Space') {
      if (this.suspend !== null) this.resumeGame();
      else this.startGame();
    }
  }

  /**
   * 「DEBUG MODE」のレイヤーを描き、タイトル画面を描く（状態は変えない）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    drawDebugModeLayer(ctx, layer);
    if (layer !== this.layer) return;
    const resumePlace =
      this.suspend === null
        ? null
        : {
            stageNumber: this.suspend.stageNumber,
            battleTurn: this.suspend.battleTurn,
            choosing: this.suspend.stage === 'choosing',
          };
    drawTitle(ctx, this.layout, resumePlace);
  }
}
