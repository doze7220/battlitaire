/**
 * 責務: 攻防の演出のシーン。結果を anim に渡して時間を進め、決着後・敵を倒した後のタップだけを受けること（演出の途中のタップでは何もしない）。
 * 終わったら次のフェーズへ進めて（ターンの始まりを中断データに保存して）戻る／タイトルへ切り替え、負けの結果が出たとき中断データを消し、見た目の値を view に渡して描き、背面の盤面のシーンへ札が燃える段の盤面の見た目を答えること。
 * 攻防のきっかけ・決着と敵の撃破の表示で効果音を鳴らし（soundCues.js）、HP が 0 になった瞬間に BGM を止めること（bgmCues.js）。設定の演出の速さで時間を進めること。
 */
import { Engine, Scene } from 'oz';
import { saveSuspend, clearSuspend } from './suspendStore.js';
import { playBattleCueSe, playOutcomeSe } from './soundCues.js';
import { stopBgmOnKnockout } from './bgmCues.js';
import { battleSpeedRate } from './settingsStore.js';
import { buildBattleSteps } from '../anim/battleSteps.js';
import { buildBattleTimeline } from '../anim/battleTimeline.js';
import { BattleDirector } from '../anim/battleDirector.js';
import { drawBattleShow } from '../view/battleShowView.js';
import { drawResult } from '../view/resultView.js';
import { drawActionGaugeLabel } from '../view/actionGaugeView.js';

/**
 * @typedef {Object} BattleShowOptions BattleShowScene に渡すオプション
 * @property {string} layer 描くレイヤー名
 * @property {import('../rules/Game.js').Game} game ルール層のゲーム（次のフェーズの操作と決着の問い合わせに使う）
 * @property {import('../view/layout.js').Layout} layout 画面の配置（BoardScene と同じもの）
 * @property {import('../anim/battleSteps.js').BattleSnapshot} before 攻防の前の値の写し
 * @property {import('../rules/Game.js').BattleResult} result game.resolveBattle() の戻り値
 * @property {() => Scene} createTitle タイトルの画面のシーンを作る関数
 * @property {{attack: number, defense: number, heal: number}} waiting 段取りの間に陣地で待っていた兵の数（時間割へ引き継ぐ）
 * @property {{attack: number, defense: number, heal: number}} [waitingAuto] 待っていた兵のうち自動兵士の印のある数（時間割へ引き継ぐ。見た目だけ。省略は 0・0・0）
 */

/** 攻防の出来事を最上段の兵の動きで見せ、終わったら次のフェーズ／タイトルへ進むシーン（盤面のシーンの上に積む） */
export class BattleShowScene extends Scene {
  /**
   * @param {BattleShowOptions} options オプション
   */
  constructor({ layer, game, layout, before, result, createTitle, waiting, waitingAuto = { attack: 0, defense: 0, heal: 0 } }) {
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
    /** @type {{attack: number, defense: number, heal: number}} 段取りの間に待っていた兵の数 */
    this.waiting = waiting;
    /** @type {{attack: number, defense: number, heal: number}} 待っていた兵のうち自動兵士の印のある数（見た目だけ） */
    this.waitingAuto = waitingAuto;
    /** @type {BattleDirector|null} 演出全体の管理（init で作る） */
    this.director = null;
    /** @type {boolean} 決着（負け）・敵を倒したときの効果音を鳴らし済みか（音を鳴らす・中断データを消すのを1回に限るためだけに使い、演出の進み方には使わない） */
    this.outcomeSePlayed = false;
    /** @type {boolean} この攻防で HP が 0 になって BGM を止め済みか（止めるのを1回に限るためだけに使う） */
    this.bgmStopped = false;
    /** @type {number} 演出の時計に足す時間の倍率（設定の演出の速さ。init で攻防ごとに1回読む） */
    this.speedRate = 1;
  }

  /**
   * 演出の管理を作る（シーンの操作はしない）。待っていた兵の数（自動兵士の印のある数を含む）を時間割へ渡し、設定の演出の速さの倍率を1回読む（次の攻防から効く。演出の途中ではメニューを開けない）。
   * @returns {void}
   */
  init() {
    this.speedRate = battleSpeedRate();
    const troopLayout = this.layout.battle.troopsFor(this.before.enemyTypeId);
    const steps = buildBattleSteps(this.result, this.before);
    this.director = new BattleDirector({
      timeline: buildBattleTimeline(steps, this.before, troopLayout, this.layout, this.waiting, this.waitingAuto),
      result: this.result,
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
   * HP が 0 になっていて、まだ止めていなければ BGM を止める（攻防ごとに1回。状態はこの印だけ変える）。
   * @returns {void}
   */
  stopBgmOnKnockout() {
    if (this.bgmStopped || !this.director.isKnockedOut()) return;
    this.bgmStopped = true;
    stopBgmOnKnockout();
  }

  /**
   * 次のフェーズへ進め、新しいターンの始まりを中断データとして保存してから、この演出のシーンを外して盤面へ戻る（保存はここだけ。デバッグでは保存されない）。
   * @returns {void}
   */
  goToNextPhase() {
    this.game.startNextPhase();
    saveSuspend(this.game);
    Engine.popScene();
  }

  /**
   * 演出の時計に dt に倍率（speedRate）を掛けた時間を足し（ヒットストップ・音のきっかけ・BGM を止める時刻を含む演出の全体が同じ割合で速くなる。攻防の結果は変わらない）、その間に起きた攻防のきっかけの効果音を鳴らし、HP が 0 になったら BGM を止め、演出が終わったとき（決着・敵を倒したとき、1回だけ）に負けの音（敵を倒したときは敵を倒した音）を鳴らし、負けの結果が出ていれば中断データを消す。決着も敵の撃破もしていなければ間の後に次のフェーズへ進めて戻る。
   * @param {number} dt 1ティックの長さ（ミリ秒）
   * @returns {void}
   */
  update(dt) {
    this.director.update(dt * this.speedRate);
    for (const type of this.director.cuesInLastUpdate()) {
      playBattleCueSe(type, this.before.enemyTypeId, this.result.enemyAction.variant);
    }
    this.stopBgmOnKnockout();
    if (this.director.isFinished() && !this.outcomeSePlayed) {
      this.outcomeSePlayed = true;
      playOutcomeSe(this.result.outcome, this.result.defeat);
      if (this.result.outcome !== null) clearSuspend();
    }
    if (this.result.outcome === null && this.result.defeat === null && this.director.isReadyToLeave() && this.game.canStartNextPhase()) {
      this.goToNextPhase();
    }
  }

  /**
   * 押したとき（'down'）だけ反応する。終わっていれば決着のときタイトルへ、敵を倒したときは次のフェーズへ進めて戻り（次の敵に入れ替わる）、終わっていなければ何もしない（早送り・スキップはない）。
   * @param {{ type: string, x: number, y: number }} pointer ポインタ入力
   * @returns {void}
   */
  onPointer(pointer) {
    if (pointer.type !== 'down') return;
    if (!this.director.isFinished()) return;
    if (this.game.isOver()) {
      Engine.changeScene(this.createTitle());
    } else if (this.result.defeat !== null && this.game.canStartNextPhase()) {
      this.goToNextPhase();
    }
  }

  /**
   * 演出中の最上段を描き、行動のゲージのラベル（揺らさない。戦闘の段より手前、結果の表示より奥）を重ね、決着したときは最後に画面全体へ結果の表示を重ねる（状態は変えない）。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {string} layer レイヤー名
   * @returns {void}
   */
  draw(ctx, layer) {
    if (layer !== this.layer) return;
    const look = this.director.view();
    drawBattleShow(ctx, this.layout.battle, this.game, this.result, look);
    drawActionGaugeLabel(ctx, this.layout.actionGauge);
    if (look.finished && this.result.outcome !== null) {
      drawResult(ctx, this.layout.result, this.result.outcome, this.game.gameStats());
    }
  }
}
