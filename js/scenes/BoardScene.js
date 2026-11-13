/**
 * 責務: 盤面のシーン。入力を受けてルール層の操作を呼び、選択の状態を持ち（扱いは boardSelection.js）、view を呼んで盤面を描くこと。
 * 操作の結果を anim に渡して時間を進め、動いている間はタップを無視すること。行動終了のボタンで攻防を呼び、攻防の演出のシーンを積むこと。
 * 操作が成り立ったとき・行動終了・連鎖のきっかけで効果音を鳴らすこと（soundCues.js）。
 */
import { Engine, Scene } from 'oz';
import { Game } from '../rules/Game.js';
import { BattleShowScene } from './BattleShowScene.js';
import { snapshotBattle } from '../anim/battleSteps.js';
import { createLayout } from '../view/layout.js';
import { drawBoard } from '../view/boardView.js';
import { BoardAnimator } from '../anim/boardAnimator.js';
import { snapshotBoard, buildPlanningMotion } from '../anim/planningMotion.js';
import { applyTap, boardUiFor } from './boardSelection.js';
import { playPlanningSe, playTurnEndSe, playChainSe } from './soundCues.js';

/**
 * @typedef {Object} BoardOptions BoardScene に渡すオプション
 * @property {{ width: number, height: number }} screen 解像度
 * @property {string} layer 描くレイヤー名
 * @property {() => number} random 乱数の関数（0以上1未満。ルール層へ渡す）
 * @property {() => Scene} createTitle タイトルの画面のシーンを作る関数（攻防の演出のシーンへ渡す）
 */

/** 盤面を表示し、置く・捨てる・手札に入れる・手札から置く・束の移し替え・放つ・攻防への進行をタップ／クリックで行うシーン */
export class BoardScene extends Scene {
  /**
   * @param {BoardOptions} options オプション
   */
  constructor({ screen, layer, random, createTitle }) {
    super();
    /** @type {() => Scene} タイトルの画面のシーンを作る関数 */
    this.createTitle = createTitle;
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
    /** @type {import('./boardSelection.js').BoardSelection} 選択の状態（選択なしは null） */
    this.selection = null;
    /** @type {import('../rules/planningResults.js').PlanningResult|import('../rules/Game.js').BattleResult|null} 直近の操作の結果（段取りの操作の結果、または戦闘の結果。戦闘の演出の入力にも渡す。新しい局の開始で null に戻る） */
    this.lastResult = null;
    /** @type {BoardAnimator|null} 盤面の動きの集まり（init で作る） */
    this.animator = null;
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
      handSize: this.game.hand.length,
      gaugeCount: Object.keys(this.game.gauges).length,
    });
    this.selection = null;
    this.lastResult = null;
    this.animator = new BoardAnimator();
  }

  /**
   * 動きの時計に dt（ミリ秒）を足して進める（timeScale は update の呼ばれる回数に反映されるので掛けない。ルール層の状態は変えない）。
   * 進めた直後に、その間に着いた連鎖の序数ごとに連鎖の効果音を鳴らす。
   * @param {number} dt 1ティックの長さ（ミリ秒）
   * @returns {void}
   */
  update(dt) {
    this.animator.update(dt);
    for (const ordinal of this.animator.chainCuesInLastUpdate()) playChainSe(ordinal);
  }

  /**
   * 押したとき（'down'）だけ、動いている間は無視し、当たった場所に応じてルール層の操作を呼ぶ（選択の扱いは boardSelection.js）。
   * 操作が成り立ったとき・行動終了で攻防に入ったときに効果音を鳴らす（soundCues.js）。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type !== 'down') return;
    if (this.animator.isBusy()) return;
    const game = this.game;
    const hit = this.layout.hitTest(pointer.x, pointer.y, game.columns.map((col) => col.length));
    if (game.isOutOfActions()) {
      this.selection = null;
      if (hit !== null && hit.kind === 'actionEnd' && game.canResolveBattle()) {
        const battleBefore = snapshotBattle(game);
        this.lastResult = game.resolveBattle();
        if (this.lastResult !== null) {
          playTurnEndSe(); // 行動終了（攻防に入った）の効果音
          Engine.pushScene(new BattleShowScene({
            layer: this.layer,
            game,
            layout: this.layout,
            before: battleBefore,
            result: this.lastResult,
            createTitle: this.createTitle,
          }));
        }
      }
      return;
    }
    const before = snapshotBoard(game);
    const prevSelection = this.selection;
    const step = applyTap(game, this.selection, hit);
    this.selection = step.selection;
    // 操作が成り立った（山札を選んだ）ときの効果音（タップの時点で1つ）
    playPlanningSe(prevSelection, step);
    if (step.result !== null) {
      this.lastResult = step.result;
      this.animator.start(buildPlanningMotion(step.result, before, snapshotBoard(game), this.layout));
    }
  }

  /**
   * ルール層の問い合わせと anim の見た目の値から盤面を描く（状態は変えない）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    const game = this.game;
    drawBoard(ctx, this.layout, game, boardUiFor(game, this.selection), this.animator.view());
  }
}
