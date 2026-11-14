/**
 * 攻防の演出全体の管理。時計を進め、いまの段・終わったか・次へ進んでよいか・直前の進みの間に起きたきっかけを答え、
 * スキップで終わりへ移り、見た目の値（ブレスチャージの表示値・燃える段の盤面を含む）を作る。描画せず、ゲームの状態に触れない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { sampleSquadTrack } from './squadTrack.js';
import { sampleHp } from './hpTrack.js';
import { samplePopTrack } from './popTrack.js';
import { formationUnits } from './troopFormation.js';
import { buildBattleCues } from './battleCues.js';
import { sampleBurnBoard } from './burnTrack.js';

/**
 * 描画用の見た目の値。
 * @typedef {Object} BattleLook
 * @property {import('./troopFormation.js').UnitLook[]} units 描く兵（後ろの列から順）
 * @property {number} castleHp 表示する城の HP
 * @property {number} enemyHp 表示する敵の HP
 * @property {{amount: number, alpha: number}|null} enemyHealPop 敵の回復の量の浮き出し（なければ null）
 * @property {{current: number, max: number}|null} enemyCharge 表示する敵のブレスチャージ（持たない敵は null）
 * @property {string|null} stepType いま進行中の段の種類（なければ null）
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
   * @param {import('../view/layout.js').TroopLayout} options.troopLayout 兵の配置
   * @param {import('./battleSteps.js').BattleSnapshot} options.before 攻防の前の写し（チャージ・列。読むだけ）
   */
  constructor({ timeline, result, troopLayout, before }) {
    /** @type {import('./battleTimeline.js').BattleTimeline} 時間割 */
    this.timeline = timeline;
    /** @type {import('../rules/Game.js').BattleResult} 攻防の結果 */
    this.result = result;
    /** @type {import('../view/layout.js').TroopLayout} 兵の配置 */
    this.troopLayout = troopLayout;
    /** @type {import('./battleSteps.js').BattleSnapshot} 攻防の前の写し */
    this.before = before;
    /** @type {number} 演出の時計（ms） */
    this.clock = 0;
    /** @type {number} 直前の update の前の時計（ms）。きっかけの区間を答えるためだけに使う */
    this.prevClock = 0;
    /** @type {import('./battleCues.js').BattleCue[]} 音を合わせるきっかけ（時刻の昇順） */
    this.cues = buildBattleCues(timeline.steps);
    /** @type {boolean} スキップされたか */
    this.skipped = false;
  }

  /**
   * 時計を進める（終わった後も進める）。
   * @param {number} ms 進める時間（ms）
   * @returns {void}
   */
  update(ms) {
    this.prevClock = this.clock;
    this.clock += ms;
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
    this.clock = Math.max(this.clock, this.timeline.endTime);
    // 飛ばした段のきっかけを、次の問い合わせで出さない
    this.prevClock = this.clock;
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
   * いま進行中の段の種類。
   * @returns {string|null} なければ null
   */
  currentStepType() {
    for (const step of this.timeline.steps) {
      if (step.start <= this.clock && this.clock < step.end) return step.type;
    }
    return null;
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
    const units = [];
    if (!finished) {
      for (const track of tl.squads) {
        const sample = sampleSquadTrack(track, this.clock);
        if (sample !== null) units.push(...formationUnits(sample, this.troopLayout, BATTLE_ANIM.unitSize));
      }
    }
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
    const enemyCharge = !finished && this.clock < tl.enemyStrikeTime ? this.before.enemyCharge : this.result.enemyCharge;
    return {
      units,
      castleHp: finished ? this.result.castleHp : sampleHp(tl.castleHpStart, tl.castleHpChanges, this.clock),
      enemyHp: finished ? this.result.enemyHp : sampleHp(tl.enemyHpStart, tl.enemyHpChanges, this.clock),
      enemyHealPop,
      enemyCharge,
      stepType: this.currentStepType(),
      finished,
    };
  }
}
