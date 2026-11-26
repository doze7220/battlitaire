/**
 * 3択の画面の時計・入りきったか・選んだ札・反応が終わったかと、見た目の値（暗幕・札ごとのスライド・押し込み・光・濃さ）を持ち答える。
 * 描画・ゲームの状態の変更は行わない。
 */

import { UPGRADE_CHOICE_ANIM } from './upgradeChoiceConfig.js';
import { clamp01, lerp, easeOutCubic } from './easing.js';

/**
 * 札1枚の見た目。
 * @typedef {Object} UpgradeItemLook
 * @property {number} enter 入りの進み（0〜1。easeOutCubic）
 * @property {number} scale 札の中心にかける倍率
 * @property {number} flash 白い光の濃さ（0〜1）
 * @property {number} alpha 札の濃さ（0〜1）
 */

/**
 * 3択の画面の見た目。
 * @typedef {Object} UpgradeChoiceLook
 * @property {number} backdrop 暗幕の進み（0〜1）
 * @property {UpgradeItemLook[]} items 札ごとの見た目（候補の並び、最後が修理）
 */

/**
 * 3択の画面の動きの管理。時計と選んだ札だけを持つ。
 */
export class UpgradeChoiceShow {
  /**
   * @param {number} itemCount 札の数（候補の数 + 1（修理））
   */
  constructor(itemCount) {
    /** @type {number} 札の数（候補の数 + 1） */
    this.itemCount = itemCount;
    /** @type {number} 3択の画面を出してからの経過時間（ミリ秒） */
    this.clock = 0;
    /** @type {number} 選んだ札の番号（まだなら -1） */
    this.chosen = -1;
    /** @type {number} 選んだ時刻（時計の値。まだなら 0） */
    this.chosenAt = 0;
  }

  /**
   * 時計を進める。
   * @param {number} ms 経過時間（ミリ秒）
   * @returns {void}
   */
  update(ms) {
    this.clock += ms;
  }

  /**
   * 札がすべて入りきったか。
   * @returns {boolean} 時計が最後の札の入りきる時刻以上なら true
   */
  isSettled() {
    return this.clock >= (this.itemCount - 1) * UPGRADE_CHOICE_ANIM.slideStaggerMs + UPGRADE_CHOICE_ANIM.slideMs;
  }

  /**
   * 札を選ぶ。入りきっていて、まだ選んでいないときだけ覚える。
   * @param {number} index 札の番号（0〜札の数 − 1）
   * @returns {boolean} 覚えたら true
   */
  choose(index) {
    if (!this.isSettled() || this.chosen >= 0) return false;
    if (!Number.isInteger(index) || index < 0 || index >= this.itemCount) return false;
    this.chosen = index;
    this.chosenAt = this.clock;
    return true;
  }

  /**
   * 選んだ札の番号。
   * @returns {number} 番号（まだ選んでいなければ -1）
   */
  chosenIndex() {
    return this.chosen;
  }

  /**
   * 選んでから反応の長さが経ったか。
   * @returns {boolean} 選んでいて、選んだ時刻 + 反応の長さに達したら true
   */
  isDone() {
    return this.chosen >= 0 && this.clock >= this.chosenAt + UPGRADE_CHOICE_ANIM.reactMs;
  }

  /**
   * 見た目（時計と選んだ時刻だけから求める。毎回新しいオブジェクトを返す）。
   * @returns {UpgradeChoiceLook} 暗幕と札ごとの見た目
   */
  look() {
    const A = UPGRADE_CHOICE_ANIM;
    const items = [];
    for (let i = 0; i < this.itemCount; i++) {
      const enter = easeOutCubic(clamp01((this.clock - i * A.slideStaggerMs) / A.slideMs));
      let scale = 1;
      let flash = 0;
      let alpha = 1;
      if (this.chosen >= 0) {
        const t = clamp01((this.clock - this.chosenAt) / A.reactMs);
        if (i === this.chosen) {
          scale = t < 0.5 ? lerp(1, A.pressScale, t / 0.5) : lerp(A.pressScale, 1, (t - 0.5) / 0.5);
          flash = A.flashAlpha * (1 - t);
        } else {
          alpha = lerp(1, A.dimAlpha, t);
        }
      }
      items.push({ enter, scale, flash, alpha });
    }
    return { backdrop: clamp01(this.clock / A.backdropMs), items };
  }
}
