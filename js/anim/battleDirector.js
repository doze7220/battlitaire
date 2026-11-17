/**
 * 攻防の演出全体の管理。時計を進め（ヒットストップ：壁の時計から演出の時計を求める）、終わったか・次へ進んでよいか・直前の進みの間に起きたきっかけを答え、
 * スキップで終わりへ移り、見た目の値（兵全員・ヒットマーク・倒れる絵・人数・燃える段の盤面・エフェクトを含む）を作る。描画せず、ゲームの状態に触れない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { createHitStops, showTimeAt, wallTimeAt } from './hitStop.js';
import { sampleHp } from './hpTrack.js';
import { samplePopTrack } from './popTrack.js';
import { TroopSwarm } from './troopSwarm.js';
import { sampleTroopCounts } from './troopCounter.js';
import { buildBattleCues } from './battleCues.js';
import { sampleBurnBoard } from './burnTrack.js';
import { HitMarkSwarm } from './hitMarks.js';
import { sampleEnemyFigure } from './enemyBody.js';
import { BattleFx } from './battleFx.js';

/**
 * 描画用の見た目の値。
 * @typedef {Object} BattleLook
 * @property {import('./troopSwarm.js').TroopSwarmLook} troops 兵全員の見た目（読むだけ。毎回同じ入れ物）
 * @property {import('./hitMarks.js').HitMarkLook} hitMarks ヒットマークの見た目（読むだけ。毎回同じ入れ物）
 * @property {import('./enemyBody.js').EnemyFigureLook} figure 倒れる絵の見た目（読むだけ。毎回同じ入れ物）
 * @property {import('./impactFx.js').ImpactFxLook} fx 当たりの光・数字・粒の見た目（読むだけ。毎回同じ入れ物）
 * @property {import('./stageFx.js').StageFxLook} stage 戦闘の段の揺れ・暗さ・撃つ瞬間の光（読むだけ。毎回同じ入れ物）
 * @property {import('./chargeShow.js').ChargePoseLook} pose ための姿勢（読むだけ。毎回同じ入れ物）
 * @property {{attack: number, defense: number, heal: number}} troopCounts 攻撃・防御・修理の人数の表示値
 * @property {number} castleHp 表示する城の HP
 * @property {number} enemyHp 表示する敵の HP
 * @property {{amount: number, alpha: number}|null} enemyHealPop 敵の回復の量の浮き出し（なければ null）
 * @property {boolean} finished 演出が終わったか
 */

/**
 * 攻防の演出全体の管理。
 */
export class BattleDirector {
  /**
   * @param {Object} options
   * @param {import('./battleTimeline.js').BattleTimeline} options.timeline 時間割
   * @param {import('../rules/Game.js').BattleResult} options.result 攻防の結果（終わったときの HP に使う。読むだけ）
   * @param {import('./battleSteps.js').BattleSnapshot} options.before 攻防の前の写し（列。読むだけ）
   */
  constructor({ timeline, result, before }) {
    /** @type {import('./battleTimeline.js').BattleTimeline} 時間割 */
    this.timeline = timeline;
    /** @type {import('../rules/Game.js').BattleResult} 攻防の結果 */
    this.result = result;
    /** @type {import('./battleSteps.js').BattleSnapshot} 攻防の前の写し */
    this.before = before;
    /** @type {number} 壁の時計（ms）。`dt` を足して進め、ヒットストップの間も進む */
    this.wall = 0;
    /** @type {import('./hitStop.js').HitStops} ヒットストップの並び */
    this.stops = createHitStops(timeline.impacts);
    /** @type {number} 演出の時計（ms。時間割の時刻。壁の時計からヒットストップの並びで求める） */
    this.clock = 0;
    /** @type {number} 直前の update の前の時計（ms）。きっかけの区間を答えるためだけに使う */
    this.prevClock = 0;
    /** @type {import('./battleCues.js').BattleCue[]} 音を合わせるきっかけ（時刻の昇順） */
    this.cues = buildBattleCues(timeline.steps);
    /** @type {boolean} スキップされたか */
    this.skipped = false;
    /** @type {TroopSwarm} 兵全員の見た目の入れ物（名簿は読むだけ） */
    this.swarm = new TroopSwarm(timeline.roster.units);
    /** @type {HitMarkSwarm} ヒットマークの見た目の入れ物 */
    this.marks = new HitMarkSwarm(timeline.hitMarks);
    /** @type {import('./enemyBody.js').EnemyFigureLook} 倒れる絵の見た目の入れ物 */
    this.figure = { visible: false, dy: 0 };
    /** @type {import('./troopMotion.js').TroopSample} 倒れる絵を求める作業用の入れ物 */
    this.figureScratch = { visible: false, x: 0, footY: 0, sortY: 0, tilt: 0, alpha: 1, idle: false };
    /** @type {BattleFx} 攻防のエフェクトの見た目の入れ物 */
    this.fx = new BattleFx(timeline);
    this.sampleLooks();
  }

  /**
   * 兵・ヒットマーク・倒れる絵の見た目を、いまの時計で入れ物に書く。
   * @returns {void}
   */
  sampleLooks() {
    this.swarm.sample(this.clock);
    this.marks.sample(this.clock);
    this.fx.sample(this.clock, this.wall);
    sampleEnemyFigure(this.timeline.body, this.clock, this.figure, this.figureScratch);
  }

  /**
   * 時計を進める（終わった後も進める）。
   * @param {number} ms 進める時間（ms）
   * @returns {void}
   */
  update(ms) {
    this.prevClock = this.clock;
    this.wall += ms;
    this.clock = showTimeAt(this.stops, this.wall);
    this.sampleLooks();
  }

  /**
   * 直前の `update` の間（prevClock < 時刻 <= clock）に起きたきっかけの段の種類を、時刻の順に返す（状態は変えない）。
   * @returns {string[]} 段の種類の並び
   */
  cuesInLastUpdate() {
    return this.cues.filter((cue) => this.prevClock < cue.time && cue.time <= this.clock).map((cue) => cue.type);
  }

  /**
   * 演出を終わりまで飛ばす。
   * @returns {void}
   */
  skip() {
    this.skipped = true;
    this.wall = Math.max(this.wall, wallTimeAt(this.stops, this.timeline.endTime));
    this.clock = Math.max(this.clock, this.timeline.endTime);
    // 飛ばした段のきっかけを、次の問い合わせで出さない
    this.prevClock = this.clock;
    this.sampleLooks();
  }

  /**
   * 演出が終わったか。
   * @returns {boolean}
   */
  isFinished() {
    return this.clock >= this.timeline.endTime;
  }

  /**
   * 次のフェーズへ進んでよいか（終わってから間を置く。スキップならすぐ）。
   * @returns {boolean}
   */
  isReadyToLeave() {
    return this.isFinished() && (this.skipped || this.clock >= this.timeline.endTime + BATTLE_ANIM.endDelayMs);
  }

  /**
   * 燃える段の盤面の見た目を作る（状態は変えない）。燃える札がない・演出が終わった・スキップ後は null
   * （ルール層の盤面をそのまま描く）。
   * @returns {import('./burnTrack.js').BurnBoardLook|null}
   */
  boardView() {
    if (this.timeline.burns.length === 0 || this.isFinished()) return null;
    return sampleBurnBoard(this.timeline.burns, this.before.columns, this.clock);
  }

  /**
   * 描画用の見た目の値を作る（状態は変えない）。
   * @returns {BattleLook}
   */
  view() {
    const finished = this.isFinished();
    const tl = this.timeline;
    let enemyHealPop = null;
    if (!finished) {
      for (const track of tl.enemyHealPops) {
        const pop = samplePopTrack(track, this.clock);
        if (pop !== null) {
          enemyHealPop = pop;
          break;
        }
      }
    }
    return {
      troops: this.swarm,
      hitMarks: this.marks,
      figure: this.figure,
      fx: this.fx.impacts,
      stage: this.fx.stage,
      pose: this.fx.pose,
      troopCounts: sampleTroopCounts(tl.troopCounter, this.clock),
      castleHp: finished ? this.result.castleHp : sampleHp(tl.castleHpStart, tl.castleHpChanges, this.clock),
      enemyHp: finished ? this.result.enemyHp : sampleHp(tl.enemyHpStart, tl.enemyHpChanges, this.clock),
      enemyHealPop,
      finished,
    };
  }
}
