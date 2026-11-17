/**
 * 攻防のエフェクト（当たりの光・数字・粒、戦闘の段の揺れ・暗さ・撃つ瞬間の光、ための姿勢）の見た目の入れ物を作って時計から書くことと、
 * エフェクトが消える時刻を求める。描画も状態の変更もしない。
 */
import { BATTLE_ANIM } from './battleAnimConfig.js';
import { IMPACT_KINDS } from './impactLog.js';
import { ImpactFx } from './impactFx.js';
import { createStageFx, sampleStageFx } from './stageFx.js';
import { chargeWindows, sampleChargePose } from './chargeShow.js';

/**
 * 攻防のエフェクトの取りまとめ。作るのは攻防の始めに1回だけで、毎フレームは `sample` が入れ物に書くだけ。
 */
export class BattleFx {
  /**
   * @param {import('./battleTimeline.js').BattleTimeline} timeline 時間割（読むだけ）
   */
  constructor(timeline) {
    /** @type {ImpactFx} 当たりの光・数字・粒の入れ物（`ImpactFxLook` として読める） */
    this.impacts = new ImpactFx(timeline.impacts);
    /** @type {import('./stageFx.js').StageFx} 戦闘の段のエフェクトの記録 */
    this.stageSpec = createStageFx(timeline.impacts, timeline.steps);
    /** @type {import('./chargeShow.js').ChargeWindow[]} ための段の窓 */
    this.charges = chargeWindows(timeline.steps);
    /** @type {import('./stageFx.js').StageFxLook} 戦闘の段の揺れ・暗さ・光の見た目の入れ物 */
    this.stage = { shakeX: 0, shakeY: 0, dim: 0, flash: 0 };
    /** @type {import('./chargeShow.js').ChargePoseLook} ための姿勢の見た目の入れ物 */
    this.pose = { tilt: 0, scaleX: 1, scaleY: 1 };
  }

  /**
   * いまの時計でエフェクトの見た目を入れ物に書く。
   * @param {number} clock 演出の時計（ms）
   * @param {number} wall 壁の時計（ms。揺れの拍子に使う）
   * @returns {void}
   */
  sample(clock, wall) {
    this.impacts.sample(clock);
    sampleStageFx(this.stageSpec, clock, wall, this.stage);
    sampleChargePose(this.charges, clock, this.pose);
  }
}

/**
 * エフェクトが消える時刻（ms）を求める。
 * @param {import('./impactLog.js').ImpactLog} log 当たりの記録
 * @param {Array<{type: string, start: number, end: number, heavy?: boolean}>} timedSteps 時刻つきの段の並び
 * @returns {number} 消える時刻（エフェクトがなければ 0）
 */
export function battleFxEnd(log, timedSteps) {
  const A = BATTLE_ANIM;
  let end = 0;
  for (let i = 0; i < log.time.length; i += 1) {
    const kind = log.kind[i];
    let len;
    if (kind === IMPACT_KINDS.repair) {
      len = A.sparkMs;
    } else if (kind === IMPACT_KINDS.enemyDamage || kind === IMPACT_KINDS.castleDamage) {
      len = Math.max(A.flashMs, A.damagePopMs, A.sparkMs);
    } else {
      len = A.flashMs;
    }
    if (log.heavy[i] === 1 && kind !== IMPACT_KINDS.repair) len = Math.max(len, A.shakeMs);
    end = Math.max(end, log.time[i] + len);
  }
  for (const step of timedSteps) {
    if (step.heavy === true) {
      end = Math.max(end, step.start + A.fireFlashMs);
      break;
    }
  }
  return end;
}
