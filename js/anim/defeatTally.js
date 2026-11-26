/**
 * 責務: 敵を倒したときの内訳が順に出る動きの時計を持ち、出そろったかと、時計から求めた見た目の値（項目ごと・合計の濃さ、案内を出すか）を返す。
 * 描かない。ゲームの状態に触れない。
 */

import { DEFEAT_TALLY_ANIM } from './defeatTallyConfig.js';
import { clamp01 } from './easing.js';

/**
 * 内訳の見た目の値。
 * @typedef {Object} DefeatTallyLook
 * @property {number[]} items 項目ごとの濃さ（0〜1）
 * @property {number} total 合計の濃さ（0〜1）
 * @property {boolean} hint タップの案内を出すか（出そろったか）
 */

/** 内訳が順に出る動き。 */
export class DefeatTally {
  /**
   * @param {number} itemCount 出す項目の数（0 以上）。
   */
  constructor(itemCount) {
    /** @type {number} 項目の数 */
    this.itemCount = itemCount;
    /** @type {number} 時計（ms） */
    this.clock = 0;
  }

  /**
   * 時計を進める。
   * @param {number} ms 進める時間（ms）。
   * @returns {void}
   */
  update(ms) {
    this.clock += ms;
  }

  /**
   * 出そろったか（合計まで濃くなりきった）。
   * @returns {boolean} 出そろったら真。
   */
  isComplete() {
    return this.clock >= this.itemCount * DEFEAT_TALLY_ANIM.itemMs + DEFEAT_TALLY_ANIM.fadeMs;
  }

  /**
   * 時計から見た目の値を求める。
   * @returns {DefeatTallyLook} 見た目の値。
   */
  look() {
    const { itemMs, fadeMs } = DEFEAT_TALLY_ANIM;
    const fade = (start) => (fadeMs > 0 ? clamp01((this.clock - start) / fadeMs) : this.clock >= start ? 1 : 0);
    const items = [];
    for (let i = 0; i < this.itemCount; i++) items.push(fade(i * itemMs));
    return { items, total: fade(this.itemCount * itemMs), hint: this.isComplete() };
  }
}
