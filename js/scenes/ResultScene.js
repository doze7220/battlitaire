/**
 * 責務: 結果の画面のシーン。ゲームを1回だけ読んで中身を作り、「もう一度」「タイトルへ」の2つのボタン（押して同じボタンの上で離したとき）で次の画面へ切り替えること。
 * 描くのは resultView.js。板の外・中身を押しても何も起きない。
 */
import { Engine, Scene } from 'oz';
import { playStartSe } from './soundCues.js';
import { takenUpgradeList } from '../rules/upgrades.js';
import { resultModel } from '../view/resultText.js';
import { createResultLayout, placeResultPieces, resultHitTest } from '../view/resultLayout.js';
import { drawResultScreen } from '../view/resultView.js';

/**
 * @typedef {Object} ResultOptions ResultScene に渡すオプション
 * @property {{ width: number, height: number }} screen 解像度
 * @property {string} layer 描くレイヤー名
 * @property {import('../rules/Game.js').Game} game ルール層のゲーム（init で1回だけ読む）
 * @property {import('../view/layout.js').BattleLayout} battleLayout 盤面の攻防の配置（敵の絵に使う）
 * @property {{ today: { score: number, isNew: boolean }, best: { score: number, isNew: boolean } }|null} bests 記録したベスト（デバッグは null）
 * @property {() => Scene} retry 新しい盤面のシーンを作る関数（「もう一度」）
 * @property {() => Scene} title タイトルの画面のシーンを作る関数（「タイトルへ」）
 */

/** 負けた後の結果の画面（盤面・攻防の演出のシーンの上に積む）。中身と2つのボタンを描き、ボタンで新しい盤面かタイトルへ切り替える */
export class ResultScene extends Scene {
  /**
   * @param {ResultOptions} options オプション
   */
  constructor({ screen, layer, game, battleLayout, bests, retry, title }) {
    super();
    /** @type {{ width: number, height: number }} 解像度 */
    this.screen = screen;
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {import('../rules/Game.js').Game} ルール層のゲーム */
    this.game = game;
    /** @type {import('../view/layout.js').BattleLayout} 盤面の攻防の配置 */
    this.battleLayout = battleLayout;
    /** @type {{ today: { score: number, isNew: boolean }, best: { score: number, isNew: boolean } }|null} 記録したベスト */
    this.bests = bests;
    /** @type {() => Scene} 新しい盤面のシーンを作る関数 */
    this.retry = retry;
    /** @type {() => Scene} タイトルの画面のシーンを作る関数 */
    this.title = title;
    /** @type {import('../view/resultLayout.js').ResultLayout|null} 結果の画面の配置（init で作る） */
    this.layout = null;
    /** @type {{ pieces: import('../view/resultLayout.js').ResultPiece[], height: number }|null} 並べた中身（init で作る） */
    this.placed = null;
    /** @type {'retry'|'title'|null} このシーンで押したボタン */
    this.pressed = null;
  }

  /**
   * ゲームを1回だけ読んで（決着 game.outcome・結果の記録・取った強化・負けた敵）中身を組み立て、配置と並べ方を作る（毎フレーム読み直さない）。
   * 決着はルール層の値（'lose'|null）をそのまま resultModel へ渡す（resultModel も 'lose'|null を受け付ける。負けて開く画面なので通常は 'lose'）。
   * @returns {void}
   */
  init() {
    const game = this.game;
    const model = resultModel({
      outcome: game.outcome,
      stats: game.gameStats(),
      upgradeRows: game.takenUpgradeRows(),
      anyTaken: takenUpgradeList(game.config, game.upgrades).length > 0,
      lostEnemy: { typeId: game.enemy.typeId, name: game.enemy.name, stageNumber: game.stageNumber },
      bests: this.bests,
    });
    this.layout = createResultLayout(this.screen);
    this.placed = placeResultPieces(model, this.layout);
    this.pressed = null;
  }

  /**
   * 押したとき（'down'）はボタンなら記録する。離したとき（'up'）は、押したボタンと同じボタンの上のときだけ働く
   * （「もう一度」はスタートの音を鳴らして新しい盤面へ、「タイトルへ」はタイトルへ切り替える）。板の外・中身を押しても何も起きない。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type === 'down') {
      const hit = resultHitTest(this.layout, pointer.x, pointer.y);
      this.pressed = hit === 'retry' || hit === 'title' ? hit : null;
    } else if (pointer.type === 'up') {
      const hit = resultHitTest(this.layout, pointer.x, pointer.y);
      const button = hit !== null && hit === this.pressed ? hit : null;
      this.pressed = null;
      if (button === 'retry') {
        playStartSe();
        Engine.changeScene(this.retry());
      } else if (button === 'title') {
        Engine.changeScene(this.title());
      }
    }
  }

  /**
   * 結果の画面を描く（状態は変えない。「DEBUG MODE」のレイヤーは背面の盤面が描く）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    drawResultScreen(ctx, this.layout, this.battleLayout, this.placed, 0, this.pressed);
  }
}
