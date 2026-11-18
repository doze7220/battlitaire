/**
 * 責務: 盤面のシーン。入力を受けてルール層の操作を呼び、選択の状態を持ち（扱いは boardSelection.js）、view を呼んで盤面を描くこと。
 * 操作の結果を anim に渡して時間を進め（ReleaseShow・敵の待機 EnemyIdle の時計を含む）、札が動いている間はタップを無視し、行動終了で玉・兵が着くのを待ってから攻防に入り待っていた兵の数を演出のシーンへ渡すこと。
 * 操作・行動終了・連鎖のきっかけで効果音を鳴らすこと（soundCues.js）。積んだ演出のシーンから札が燃える段の盤面を読んで描くこと。
 */
import { Engine, Scene } from 'oz';
import { Game } from '../rules/Game.js';
import { BattleShowScene } from './BattleShowScene.js';
import { snapshotBattle } from '../anim/battleSteps.js';
import { createLayout } from '../view/layout.js';
import { drawBoard } from '../view/boardView.js';
import { BoardAnimator } from '../anim/boardAnimator.js';
import { ReleaseShow } from '../anim/releaseShow.js';
import { EnemyIdle } from '../anim/enemyIdle.js';
import { releaseGeometry } from '../view/releaseLayout.js';
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
    /** @type {BattleShowScene|null} 積んだ攻防の演出のシーン（なければ null。update の頭で外す） */
    this.battleShow = null;
    /** @type {ReleaseShow|null} 放つ演出（玉・段取りの間の兵。init で作る） */
    this.releaseShow = null;
    /** @type {EnemyIdle|null} 段取りの間の敵の待機の動き（ゴブリンの群れ・巨人・ドラゴンの伸び縮み。init で作る） */
    this.enemyIdle = null;
    /** @type {boolean} 「行動終了」を押して、玉・兵が着くのを待っているか（待つ間はタップを無視する） */
    this.pendingBattle = false;
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
    this.battleShow = null;
    this.releaseShow = new ReleaseShow(this.layout.battle.troops);
    this.enemyIdle = new EnemyIdle();
    this.pendingBattle = false;
  }

  /**
   * 動きの時計に dt（ミリ秒）を足して進める（timeScale は update の呼ばれる回数に反映されるので掛けない。ルール層の状態は変えない）。
   * 放つ演出の時計も進め、進めた直後に、その間に玉に変わった札の序数ごとに連鎖の効果音を鳴らす。
   * 頭で `this.battleShow` を外す（update は最前面のときだけ呼ばれるので、攻防の演出のシーンが外れた後になる）。
   * @param {number} dt 1ティックの長さ（ミリ秒）
   * @returns {void}
   */
  update(dt) {
    this.battleShow = null; // update は最前面のときだけ呼ばれる＝演出のシーンが外れた後
    this.animator.update(dt);
    this.releaseShow.update(dt);
    this.enemyIdle.update(dt, this.game.enemy.typeId, this.game.enemy.hp);
    for (const ordinal of this.releaseShow.chainCuesInLastUpdate()) playChainSe(ordinal);
    if (this.pendingBattle && !this.releaseShow.isBusy()) {
      this.pendingBattle = false;
      this.startBattle();
    }
  }

  /**
   * 攻防に入る（攻防の前の値の写し → 待っている兵の数 → 攻防の解決 → 行動終了の音 → 放つ演出の作り直し → 攻防の演出のシーンを積む）。
   * 攻防を解決できなければ何もしない。
   * @returns {void}
   */
  startBattle() {
    const game = this.game;
    const battleBefore = snapshotBattle(game);
    const waiting = this.releaseShow.waitingCounts();
    this.lastResult = game.resolveBattle();
    if (this.lastResult === null) return;
    playTurnEndSe(); // 行動終了（攻防に入った）の効果音
    this.releaseShow = new ReleaseShow(this.layout.battle.troops); // 次のフェーズは兵のいない状態から
    this.battleShow = new BattleShowScene({
      layer: this.layer,
      game,
      layout: this.layout,
      before: battleBefore,
      result: this.lastResult,
      createTitle: this.createTitle,
      waiting,
    });
    Engine.pushScene(this.battleShow);
  }

  /**
   * 押したとき（'down'）だけ、札の動き・山札のめくれ・玉に変わる前の札が残っている間は無視し、当たった場所に応じてルール層の操作を呼ぶ（選択の扱いは boardSelection.js）。
   * 操作が成り立ったとき・行動終了で攻防に入ったときに効果音を鳴らす（soundCues.js）。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type !== 'down') return;
    if (this.pendingBattle || this.animator.isBusy() || this.releaseShow.isHoldingCards()) return;
    const game = this.game;
    const hit = this.layout.hitTest(pointer.x, pointer.y, game.columns.map((col) => col.length));
    if (game.isOutOfActions()) {
      this.selection = null;
      if (hit !== null && hit.kind === 'actionEnd' && game.canResolveBattle()) {
        if (this.releaseShow.isBusy()) this.pendingBattle = true;
        else this.startBattle();
      }
      return;
    }
    const before = snapshotBoard(game);
    const prevSelection = this.selection;
    const step = applyTap(game, this.selection, hit);
    this.selection = step.selection;
    // タップで成り立った操作（めくる＝山札を選ぶ・置く・捨てる・放つ）を表す効果音を鳴らす（タップの時点で1つ）
    playPlanningSe(prevSelection, step);
    if (step.result !== null) {
      this.lastResult = step.result;
      this.animator.start(buildPlanningMotion(step.result, before, snapshotBoard(game), this.layout));
      if (step.result.type === 'release') {
        this.releaseShow.start(
          step.result,
          releaseGeometry(
            this.layout,
            step.result.columnIndex,
            step.result.cards.length,
            step.result.segments.map((s) => s.gauge),
            Object.keys(game.gauges),
          ),
        );
      }
    }
  }

  /**
   * ルール層の問い合わせと anim の見た目の値から盤面を描く（状態は変えない）。
   * 攻防の演出のシーンを積んでいれば、その `boardLook()`（燃える段の盤面の見た目。なければ null）を読んで `drawBoard` に渡す。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    const game = this.game;
    const burn = this.battleShow === null ? null : this.battleShow.boardLook();
    drawBoard(ctx, this.layout, game, boardUiFor(game, this.selection), this.animator.view(), this.releaseShow.view(game.gauges), burn, this.enemyIdle.look());
  }
}
