/**
 * 責務: 3択の画面のシーン。時計を進め、入りきった後の1タップで札を選び、反応が終わったらルール層の選ぶ操作を呼んで外れること。
 * 次のステージへ進んだときは、その最初のターンの始まりを中断データとして保存する（デバッグでは保存されない）。ゲームの状態は選ぶ操作でしか変えない。
 */
import { Engine, Scene } from 'oz';
import { saveSuspend } from './suspendStore.js';
import { UpgradeChoiceShow } from '../anim/upgradeChoiceShow.js';
import { createUpgradeChoiceLayout, upgradeChoiceHitTest } from '../view/upgradeChoiceLayout.js';
import { drawUpgradeChoice, upgradeChoiceModel } from '../view/upgradeChoiceView.js';

/**
 * @typedef {Object} UpgradeChoiceOptions UpgradeChoiceScene に渡すオプション
 * @property {string} layer 描くレイヤー名
 * @property {import('../rules/Game.js').Game} game ルール層のゲーム（3択の段階。候補を読み、選ぶ操作を呼ぶ）
 * @property {import('../view/layout.js').Layout} layout 盤面の配置（画面の大きさ `screen` と敵の絵の配置 `battle` を使う）
 */

/** 敵を倒した後の3択（強化3つ＋城を修理）を見せ、1つ選ばせて次のステージへ進めるシーン（盤面のシーンの上に積む） */
export class UpgradeChoiceScene extends Scene {
  /**
   * @param {UpgradeChoiceOptions} options オプション
   */
  constructor({ layer, game, layout }) {
    super();
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {import('../rules/Game.js').Game} ルール層のゲーム */
    this.game = game;
    /** @type {import('../view/layout.js').Layout} 盤面の配置 */
    this.layout = layout;
    /** @type {import('../view/upgradeChoiceLayout.js').UpgradeChoiceLayout|null} 3択の画面の配置（init で作る） */
    this.choiceLayout = null;
    /** @type {UpgradeChoiceShow|null} 3択の画面の動き（init で作る） */
    this.show = null;
    /** @type {boolean} 選ぶ操作を呼んで外れる処理を済ませたか（1回に限るためだけに使う） */
    this.finished = false;
  }

  /**
   * 配置と動きを作る（候補の数は game.upgradeOffer から。画面の大きさは盤面の配置の screen から）。
   * @returns {void}
   */
  init() {
    const count = this.game.upgradeOffer.choices.length;
    this.choiceLayout = createUpgradeChoiceLayout(this.layout.screen, count);
    this.show = new UpgradeChoiceShow(count + 1);
  }

  /**
   * 時計を進め（演出の速さの設定には合わせない）、反応が終わったら1回だけ終える。
   * @param {number} dt 1ティックの長さ（ミリ秒）
   * @returns {void}
   */
  update(dt) {
    if (this.finished) return;
    this.show.update(dt);
    if (this.show.isDone()) this.finish();
  }

  /**
   * 選んだ札でルール層の選ぶ操作を呼び、次のステージへ進んだら中断データを保存して、このシーンを外す（1回だけ）。
   * 札の番号が候補の数なら修理。
   * @returns {void}
   */
  finish() {
    this.finished = true;
    const index = this.show.chosenIndex();
    const choice = index === this.game.upgradeOffer.choices.length ? 'repair' : index;
    const result = this.game.chooseUpgrade(choice);
    if (result !== null && result.nextPhase !== null) saveSuspend(this.game);
    Engine.popScene();
  }

  /**
   * 押したとき（'down'）だけ、入りきった後に当たった札を選ぶ（入りきるまで・選んだ後は何もしない）。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type !== 'down' || this.finished) return;
    if (!this.show.isSettled()) return;
    const hit = upgradeChoiceHitTest(this.choiceLayout, pointer.x, pointer.y);
    if (hit !== null) this.show.choose(hit);
  }

  /**
   * 3択の画面を描く（状態は変えない）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    if (this.finished) return;
    drawUpgradeChoice(ctx, this.choiceLayout, this.layout.battle, upgradeChoiceModel(this.game), this.show.look());
  }
}
