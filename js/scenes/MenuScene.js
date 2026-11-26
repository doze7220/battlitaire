/**
 * 責務: 窓だけを持つメニューのシーン。受け取ったタブの一覧で窓を組み立て、ポインタを窓へ渡し、
 * 閉じるボタン・窓の外・Escape で外す。タブの中身は呼ぶ側（menuTabs.js など）から受け取る。
 */
import { Engine, Scene, Ui } from 'oz';
import { MENU_LAYOUT } from '../view/menuLayout.js';
import { MENU_TEXT } from '../view/menuText.js';

/**
 * @typedef {Object} MenuTab メニューの窓のタブ1つ分
 * @property {string} label タブの名前
 * @property {(tab: object, close: () => void) => void} build addTabs が返したそのタブのオブジェクトと、窓を閉じる関数を受けて部品を足す関数
 */

/**
 * @typedef {Object} MenuOptions MenuScene に渡すオプション
 * @property {string} layer 窓を描くレイヤー名
 * @property {MenuTab[]} tabs タブの一覧（コピーして持つ）
 */

/** 窓だけを持つメニューのシーン。積んでいる間は下のシーンの update が止まり、入力も届かない */
export class MenuScene extends Scene {
  /**
   * @param {MenuOptions} options 描くレイヤー名とタブの一覧
   */
  constructor({ layer, tabs }) {
    super();
    /** @type {string} 窓を描くレイヤー名 */
    this.layer = layer;
    /** @type {MenuTab[]} タブの一覧（コピー） */
    this.tabs = [...tabs];
    /** @type {object | null} 窓（init で作る） */
    this.window = null;
    /** @type {boolean} 閉じ済みか（閉じるボタンと Escape が同じフレームで重なっても2回外さないための印） */
    this.closed = false;
  }

  /**
   * 窓を作り、タブの列を足し、タブごとに中身を足す。
   * @returns {void}
   */
  init() {
    this.window = Ui.createWindow({
      title: MENU_TEXT.title,
      width: MENU_LAYOUT.window.width,
      height: MENU_LAYOUT.window.height,
      onClose: () => this.close(),
    });
    const tabObjects = this.window.addTabs({
      ...MENU_LAYOUT.tabs,
      labels: this.tabs.map((t) => t.label),
    });
    tabObjects.forEach((tabObject, i) => this.tabs[i].build(tabObject, () => this.close()));
  }

  /**
   * このシーンを1回だけ外す。
   * @returns {void}
   */
  close() {
    if (this.closed) return;
    this.closed = true;
    Engine.popScene();
  }

  /**
   * ポインタを窓へ渡す。
   * @param {object} pointer エンジンから受けたポインタ
   * @returns {void}
   */
  onPointer(pointer) {
    this.window.onPointer(pointer);
  }

  /**
   * Escape で閉じる。ほかのキーは何もしない。
   * @param {string} code 押されたキーのコード
   * @returns {void}
   */
  onKeyDown(code) {
    if (code === 'Escape') this.close();
  }

  /**
   * 窓を描く。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    this.window.draw(ctx);
  }
}
