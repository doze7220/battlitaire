/**
 * 段取りの間に陣地で待つ自軍の兵（名簿と、全員の見た目の入れ物）を持ち、弾けた玉から兵を足し、時計から見た目を書き込み、種類ごとの数を答える。
 * 種類の兵の数をその場でそろえ、自動兵士（印つき）を家に現し、印のある兵の数を答える。描画も状態の変更（ルール層）もしない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { createTroopRoster, landTroops, OWN_KINDS, removeTroops, spawnTroops } from './troopRoster.js';
import { TroopSwarm } from './troopSwarm.js';

/**
 * 段取りの間に待っている自軍の兵の、種類ごとの数。
 * @typedef {Object} CampCounts
 * @property {number} attack 攻撃の兵の数
 * @property {number} defense 防御の兵の数
 * @property {number} heal 修理の兵の数
 */

/**
 * 段取りの間の自軍の兵。名簿を1つと、見た目の入れ物を持つ。
 */
export class CampTroops {
  /**
   * @param {import('../view/layout.js').TroopLayout} troopLayout 兵の陣地の配置（`layout.battle.troops`）
   */
  constructor(troopLayout) {
    /** @type {import('./troopRoster.js').TroopRoster} 兵の名簿 */
    this.roster = createTroopRoster(troopLayout);
    /** @type {TroopSwarm} 全員の見た目の入れ物 */
    this.swarm = new TroopSwarm([]);
    /** @type {number} 全員が家に着く時刻（ms） */
    this.settledAt = 0;
    /** @type {boolean} 見た目を書き直す必要があるか */
    this.dirty = false;
  }

  /**
   * 弾けた玉の位置から、兵を count 体、家へ跳ばせて足す。
   * 入れ物を作り直すので、作り直した直後は `visible` がすべて 0 である。
   * 呼び出し側は続けて今の時計で `sample` を呼ぶこと。
   * @param {string} kind 兵の種類（'attack' | 'defense' | 'heal'）
   * @param {number} count 足す数（0 以下なら何もしない）
   * @param {number} x 飛び出す位置の x
   * @param {number} y 飛び出す位置の y
   * @param {number} t 兵が飛び出し始める時刻（ms）
   * @returns {number} 全員が家に着く時刻（ms。count が 0 以下なら t）
   */
  land(kind, count, x, y, t) {
    if (count <= 0) return t;
    const end = landTroops(this.roster, kind, count, x, y, t, BATTLE_ANIM.landMs);
    this.swarm = new TroopSwarm(this.roster.units);
    this.settledAt = Math.max(this.settledAt, end);
    this.dirty = true;
    return end;
  }

  /**
   * 自動兵士を count 体、陣地の家にその場で濃くなって現す（印を付ける。家の番号はその種類のすでにいる兵の続き）。
   * 入れ物を作り直し、今の時計で見た目を書き込む。
   * @param {string} kind 兵の種類（'attack' | 'defense' | 'heal'）
   * @param {number} count 足す数（0 以下なら何もしない）
   * @param {number} clock 現れ始める時刻（ms。今の時計の値）
   * @returns {number} 全員が現れきる時刻（ms。count が 0 以下なら clock）
   */
  appear(kind, count, clock) {
    if (count <= 0) return clock;
    const ms = BATTLE_ANIM.autoTroopAppearMs;
    spawnTroops(this.roster, kind, count, clock, ms, true);
    this.swarm = new TroopSwarm(this.roster.units);
    this.dirty = true;
    this.settledAt = Math.max(this.settledAt, clock + ms);
    this.sample(clock);
    return clock + ms;
  }

  /**
   * 種類の兵の数を、玉を飛ばさずその場で count 体にそろえる（足りなければ家にすぐ現し、多ければ番号の大きい方から消す）。
   * 変えたときは入れ物を作り直し、今の時計で見た目を書き込む。
   * @param {string} kind 兵の種類（'attack' | 'defense' | 'heal'）
   * @param {number} count そろえる数（0 以上の整数）
   * @param {number} clock 時計の値（ms）
   * @returns {void}
   */
  setCount(kind, count, clock) {
    const now = (this.roster.ranked[kind] ?? []).length;
    if (count === now) return;
    if (count > now) spawnTroops(this.roster, kind, count - now, clock, 0);
    else removeTroops(this.roster, kind, now - count);
    this.swarm = new TroopSwarm(this.roster.units);
    this.dirty = true;
    this.settledAt = Math.max(this.settledAt, clock);
    this.sample(clock);
  }

  /**
   * 時計の値で見た目を書き込む。全員が家に着いた後は呼吸の伸び縮みだけを書く。
   * @param {number} clock 時計の値（ms）
   * @returns {void}
   */
  sample(clock) {
    if (!this.dirty) {
      this.swarm.breathe(clock);
      return;
    }
    this.swarm.sample(clock);
    if (clock >= this.settledAt) this.dirty = false;
  }

  /**
   * 描画に渡す全員の見た目（毎回同じ入れ物。読むだけ）。
   * @returns {import('./troopSwarm.js').TroopSwarmLook}
   */
  look() {
    return this.swarm;
  }

  /**
   * 待っている兵の種類ごとの数。家の番号は 0 から数−1。
   * @returns {CampCounts}
   */
  counts() {
    const out = { attack: 0, defense: 0, heal: 0 };
    for (const kind of OWN_KINDS) out[kind] = (this.roster.ranked[kind] ?? []).length;
    return out;
  }

  /**
   * 待っている兵のうち、自動兵士の印のある兵の種類ごとの数。
   * @returns {CampCounts}
   */
  autoCounts() {
    const out = { attack: 0, defense: 0, heal: 0 };
    for (const kind of OWN_KINDS) {
      for (const unit of this.roster.ranked[kind] ?? []) {
        if (unit.auto) out[kind]++;
      }
    }
    return out;
  }
}
