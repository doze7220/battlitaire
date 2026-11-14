/**
 * 責務: 攻防の演出のシーン。結果を anim に渡して時間を進め、早送り・スキップ・決着後・敵を倒した後のタップを受け、timeScale を切り替えて戻すこと。
 * 終わったら次のフェーズへ進めて戻る／タイトルへ切り替え、見た目の値を view に渡して描くこと。
 * 攻防のきっかけと決着の表示で効果音を鳴らすこと（soundCues.js）。背面の盤面のシーンへ札が燃える段の盤面の見た目を答えること。
 */
import { Engine, Scene } from 'oz';
import { playBattleCueSe, playOutcomeSe } from './soundCues.js';
import { BATTLE_ANIM } from '../anim/battleAnimConfig.js';
import { buildBattleSteps } from '../anim/battleSteps.js';
import { buildBattleTimeline } from '../anim/battleTimeline.js';
import { BattleDirector } from '../anim/battleDirector.js';
import { drawBattleShow } from '../view/battleShowView.js';
import { drawBattleHud } from '../view/hudView.js';

/** 等速の Engine.timeScale */
const NORMAL_SCALE = 1;

/**
 * @typedef {Object} BattleShowOptions BattleShowScene に渡すオプション
 * @property {string} layer 描くレイヤー名
 * @property {import('../rules/Game.js').Game} game ルール層のゲーム（次のフェーズの操作と決着の問い合わせに使う）
 * @property {import('../view/layout.js').Layout} layout 画面の配置（BoardScene と同じもの）
 * @property {import('../anim/battleSteps.js').BattleSnapshot} before 攻防の前の値の写し
 * @property {import('../rules/Game.js').BattleResult} result game.resolveBattle() の戻り値
 * @property {() => Scene} createTitle タイトルの画面のシーンを作る関数
 */

/** 攻防の出来事を最上段の兵の動きで見せ、終わったら次のフェーズ／タイトルへ進むシーン（盤面のシーンの上に積む） */
export class BattleShowScene extends Scene {
  /**
   * @param {BattleShowOptions} options オプション
   */
  constructor({ layer, game, layout, before, result, createTitle }) {
    super();
    /** @type {string} 描くレイヤー名 */
    this.layer = layer;
    /** @type {import('../rules/Game.js').Game} ルール層のゲーム */
    this.game = game;
    /** @type {import('../view/layout.js').Layout} 画面の配置 */
    this.layout = layout;
    /** @type {import('../anim/battleSteps.js').BattleSnapshot} 攻防の前の値の写し */
    this.before = before;
    /** @type {import('../rules/Game.js').BattleResult} 攻防の結果 */
    this.result = result;
    /** @type {() => Scene} タイトルの画面のシーンを作る関数 */
    this.createTitle = createTitle;
    /** @type {BattleDirector|null} 演出全体の管理（init で作る） */
    this.director = null;
    /** @type {boolean} 早送り中か */
    this.fast = false;
    /** @type {boolean} 決着の効果音（勝ち・負け）を鳴らし済みか（音を1回に限るためだけに使い、演出の進み方には使わない） */
    this.outcomeSePlayed = false;
  }

  /**
   * 演出の管理を作る（シーンの操作・timeScale の変更はしない）。
   * @returns {void}
   */
  init() {
    const troopLayout = this.layout.battle.troops;
    const steps = buildBattleSteps(this.result, this.before);
    this.director = new BattleDirector({
      timeline: buildBattleTimeline(steps, this.before, troopLayout, this.layout),
      result: this.result,
      troopLayout,
      before: this.before,
    });
  }

  /**
   * 背面の盤面のシーンが読む、札が燃える段の盤面の見た目を答える（状態は変えない）。
   * @returns {import('../anim/burnTrack.js').BurnBoardLook|null} 見た目（燃える段でなければ null）
   */
  boardLook() {
    return this.director === null ? null : this.director.boardView();
  }

  /**
   * 演出の時計に dt を足し、その間に起きた攻防のきっかけと、決着の表示が出たとき（1回だけ）に効果音を鳴らす。終わったら等速に戻し、決着も敵の撃破もしていなければ間の後に次のフェーズへ進めて戻る。
   * @param {number} dt 1ティックの長さ（ミリ秒）
   * @returns {void}
   */
  update(dt) {
    this.director.update(dt);
    for (const type of this.director.cuesInLastUpdate()) playBattleCueSe(type);
    if (this.director.isFinished() && this.result.outcome !== null && !this.outcomeSePlayed) {
      this.outcomeSePlayed = true;
      playOutcomeSe(this.result.outcome);
    }
    if (this.director.isFinished() && (Engine.timeScale !== NORMAL_SCALE || this.fast)) {
      Engine.timeScale = NORMAL_SCALE;
      this.fast = false;
    }
    if (this.result.outcome === null && this.result.defeat === null && this.director.isReadyToLeave() && this.game.canStartNextPhase()) {
      Engine.timeScale = NORMAL_SCALE;
      this.game.startNextPhase();
      Engine.popScene();
    }
  }

  /**
   * 押したとき（'down'）だけ反応する。終わっていれば決着のときタイトルへ、敵を倒したときは次のフェーズへ進めて戻り（次の敵に入れ替わる）、終わっていなければ早送り・スキップを調べる。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type !== 'down') return;
    if (this.director.isFinished()) {
      if (this.game.isOver()) {
        Engine.timeScale = NORMAL_SCALE;
        Engine.changeScene(this.createTitle());
      } else if (this.result.defeat !== null && this.game.canStartNextPhase()) {
        Engine.timeScale = NORMAL_SCALE;
        this.game.startNextPhase();
        Engine.popScene();
      }
      return;
    }
    const hit = this.layout.battleHitTest(pointer.x, pointer.y);
    if (hit === 'fastForward') {
      this.fast = !this.fast;
      Engine.timeScale = this.fast ? BATTLE_ANIM.fastScale : NORMAL_SCALE;
    } else if (hit === 'skip') {
      this.director.skip();
      this.fast = false;
      Engine.timeScale = NORMAL_SCALE;
    }
  }

  /**
   * 演出中の最上段と最下段を描く（状態は変えない）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    const look = this.director.view();
    drawBattleShow(ctx, this.layout.battle, this.game, this.result, look);
    drawBattleHud(ctx, this.layout.hud, this.layout.battleControls, {
      fast: this.fast,
      showButtons: !look.finished,
      fastLabel: `×${BATTLE_ANIM.fastScale}`,
    });
  }
}
