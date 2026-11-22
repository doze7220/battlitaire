/**
 * 放つ演出全体の管理（時計を進め、放つたびの玉の記録と段取りの間の兵を持ち、連鎖のきっかけ・札を止めているか・動いているか・ゲージの表示値・待っている兵の数・描画用の見た目の値を答え、段取りの間の兵の数をその場で合わせる）。
 * 描画せず、ゲームの状態に触れない。
 */

import { ANIM_TIMING } from './animConfig.js';
import { createReleaseOrbs, sampleReleaseOrbs } from './orbTrack.js';
import { CampTroops } from './campTroops.js';
import { OWN_KINDS } from './troopRoster.js';
import { createGaugeCount, sampleGaugeCount, gaugeCountEnd } from './gaugeCount.js';

/**
 * 描画用の見た目の値。
 * @typedef {Object} ReleaseLook
 * @property {import('./orbTrack.js').OrbCardLook[]} cards 玉に変わる前の札
 * @property {import('./orbTrack.js').OrbLook[]} orbs 玉
 * @property {import('./orbTrack.js').FormulaLook[]} formulas 式
 * @property {import('./troopSwarm.js').TroopSwarmLook} troops 段取りの間の兵
 * @property {Object<string, number>} gaugeValues まだ数えていない分のあるゲージだけの表示値
 */

/**
 * 放つ演出全体の管理。
 */
export class ReleaseShow {
  /**
   * @param {import('../view/layout.js').TroopLayout} troopLayout 兵の陣地の配置（`layout.battle.troops`）
   */
  constructor(troopLayout) {
    /** @type {number} 放つ演出の時計（ms） */
    this.clock = 0;
    /** @type {number} 直前の `update` の前の時計（ms） */
    this.prevClock = 0;
    /** @type {import('./orbTrack.js').ReleaseOrbs[]} 動いている放つの記録 */
    this.releases = [];
    /** @type {import('./gaugeCount.js').GaugeCount[]} 区切りごとの数え上げ */
    this.counts = [];
    /** @type {{time: number, ordinal: number}[]} 連鎖のきっかけ（時刻の昇順） */
    this.chainCues = [];
    /** @type {CampTroops} 段取りの間の兵 */
    this.camp = new CampTroops(troopLayout);
    /** @type {number} すべてが終わる時刻（ms） */
    this.endTime = 0;
  }

  /**
   * 放った結果を、玉の動きと兵として記録に足す。
   * @param {{segments: Array<{suit: string, gauge: string, cards: Array<*>, sum: number, bonus: number, amount: number}>}} result 放った結果（`ReleaseResult`）
   * @param {import('../view/releaseLayout.js').ReleaseGeometry} geometry 放つ演出の配置
   * @returns {void}
   */
  start(result, geometry) {
    const orbs = createReleaseOrbs(result.segments, geometry, this.clock);
    this.releases.push(orbs);
    orbs.chainTimes.forEach((time, i) => this.chainCues.push({ time, ordinal: i + 1 }));
    this.chainCues.sort((a, b) => a.time - b.time);
    let end = Math.max(this.endTime, orbs.endTime);
    orbs.segments.forEach((seg) => {
      if (seg.amount <= 0) return;
      let duration;
      if (OWN_KINDS.includes(seg.gauge)) {
        const last = this.camp.land(seg.gauge, seg.amount, seg.target.x, seg.target.y, seg.arriveAt);
        duration = last - seg.arriveAt;
      } else {
        duration = ANIM_TIMING.coinCountMs;
      }
      const count = createGaugeCount({ gauge: seg.gauge, from: 0, to: seg.amount, delay: seg.arriveAt, duration });
      this.counts.push(count);
      end = Math.max(end, gaugeCountEnd(count));
    });
    this.endTime = end;
    // 作り直した入れ物は visible が 0 なので、update が0回のフレームでも消えないよう今の時計で書き込む
    this.camp.sample(this.clock);
  }

  /**
   * 時計を進める。
   * @param {number} ms 進める時間（ms。エンジンの `dt`）
   * @returns {void}
   */
  update(ms) {
    this.chainCues = this.chainCues.filter((c) => c.time > this.clock);
    this.prevClock = this.clock;
    this.clock += ms;
    this.camp.sample(this.clock);
    this.releases = this.releases.filter((r) => r.endTime > this.clock);
    this.counts = this.counts.filter((c) => gaugeCountEnd(c) > this.clock);
  }

  /**
   * 直前の `update` の間に玉に変わった札の、何枚目かを時刻の順に返す。
   * @returns {number[]} 何枚目か（1 始まり）の配列
   */
  chainCuesInLastUpdate() {
    return this.chainCues
      .filter((c) => c.time > this.prevClock && c.time <= this.clock)
      .map((c) => c.ordinal);
  }

  /**
   * 玉に変わっていない札が残っているか。
   * @returns {boolean}
   */
  isHoldingCards() {
    return this.releases.some((r) => this.clock < r.holdUntil);
  }

  /**
   * 玉・兵・数え上げのどれかが動いているか。
   * @returns {boolean}
   */
  isBusy() {
    return this.clock < this.endTime;
  }

  /**
   * 段取りの間に待っている兵の種類ごとの数。
   * @returns {import('./campTroops.js').CampCounts}
   */
  waitingCounts() {
    return this.camp.counts();
  }

  /**
   * 段取りの間の兵の数を、玉を飛ばさずその場で count 体にそろえる。
   * 動いている間（`isBusy()`）は呼ばないこと（判断は呼ぶ側）。
   * @param {string} kind 兵の種類（'attack' | 'defense' | 'heal'）
   * @param {number} count そろえる数（0 以上の整数）
   * @returns {void}
   */
  setCampCount(kind, count) {
    this.camp.setCount(kind, count, this.clock);
  }

  /**
   * 描画用の見た目の値を作る。状態は変えない。
   * @param {Object<string, number>} gauges ルール層のゲージの値
   * @returns {ReleaseLook}
   */
  view(gauges) {
    const out = { cards: [], orbs: [], formulas: [] };
    for (const r of this.releases) sampleReleaseOrbs(r, this.clock, out);
    /** @type {Object<string, number>} */
    const gaugeValues = {};
    for (const c of this.counts) {
      const pending = c.to - sampleGaugeCount(c, this.clock);
      if (pending > 0) gaugeValues[c.gauge] = (gaugeValues[c.gauge] ?? gauges[c.gauge]) - pending;
    }
    return { cards: out.cards, orbs: out.orbs, formulas: out.formulas, troops: this.camp.look(), gaugeValues };
  }
}
