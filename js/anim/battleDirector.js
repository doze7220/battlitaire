/**
 * 攻防の演出全体の管理。時計を進め、いまの段・終わったか・次へ進んでよいかを答え、スキップで終わりへ移り、見た目の値を作る。
 * 描画せず、ゲームの状態に触れない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { sampleSquadTrack } from './squadTrack.js';
import { sampleHp } from './hpTrack.js';
import { formationUnits } from './troopFormation.js';

/**
 * 描画用の見た目の値。
 * @typedef {Object} BattleLook
 * @property {import('./troopFormation.js').UnitLook[]} units 描く兵（後ろの列から順）
 * @property {number} castleHp 表示する城の HP
 * @property {number} enemyHp 表示する敵の HP
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
   */
  constructor({ timeline, result, troopLayout }) {
    /** @type {import('./battleTimeline.js').BattleTimeline} 時間割 */
    this.timeline = timeline;
    /** @type {import('../rules/Game.js').BattleResult} 攻防の結果 */
    this.result = result;
    /** @type {import('../view/layout.js').TroopLayout} 兵の配置 */
    this.troopLayout = troopLayout;
    /** @type {number} 演出の時計（ms） */
    this.clock = 0;
    /** @type {boolean} スキップされたか */
    this.skipped = false;
  }

  /**
   * 時計を進める（終わった後も進める）。
   * @param {number} ms 進める時間（ms）
   * @returns {void}
   */
  update(ms) {
    this.clock += ms;
  }

  /**
   * 演出を終わりまで飛ばす。
   * @returns {void}
   */
  skip() {
    this.skipped = true;
    this.clock = Math.max(this.clock, this.timeline.endTime);
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
    return {
      units,
      castleHp: finished ? this.result.castleHp : sampleHp(tl.castleHpStart, tl.castleHpChanges, this.clock),
      enemyHp: finished ? this.result.enemyHp : sampleHp(tl.enemyHpStart, tl.enemyHpChanges, this.clock),
      stepType: this.currentStepType(),
      finished,
    };
  }
}
