/**
 * 責務: ひとりでに放つときの「混乱！」の文字の時計（出す・進める・動いているか）と、時計から見た目の値（倍率・濃さ）を求めること。
 * 時間の数値は ANIM_TIMING を読み、ゲームの状態は変えず、ルール層・view・Sound は import しない。
 */

import { ANIM_TIMING } from './animConfig.js';
import { clamp01, lerp, easeOutBack } from './easing.js';

/**
 * 「混乱！」の見た目の値。
 * @typedef {Object} MarkCallLook
 * @property {string} kind 印の種類
 * @property {number} column 印の列の番号
 * @property {number} scale 文字の倍率
 * @property {number} alpha 文字の濃さ（0〜1）
 */

/** 「混乱！」の文字の時計 */
export class MarkCallShow {
  constructor() {
    /** @type {string|null} 出している印の種類（出していなければ null） */
    this.kind = null;
    /** @type {number} 印の列の番号 */
    this.column = 0;
    /** @type {number} 出してからの時計（ms） */
    this.clock = 0;
  }

  /**
   * 「混乱！」を出し始める（時計を 0 にする）。
   * @param {string} kind 印の種類
   * @param {number} column 印の列の番号
   * @returns {void}
   */
  start(kind, column) {
    this.kind = kind;
    this.column = column;
    this.clock = 0;
  }

  /**
   * 時計を進める（出していなければ何もしない）。
   * @param {number} ms 進める時間（ms）
   * @returns {void}
   */
  update(ms) {
    if (this.kind === null) return;
    this.clock += ms;
  }

  /**
   * 出している途中か。
   * @returns {boolean} 出していて、時計が全体の時間に届いていなければ `true`
   */
  isBusy() {
    return this.kind !== null && this.clock < ANIM_TIMING.markCallMs;
  }

  /**
   * 見た目の値を求める（状態は変えない）。
   * 倍率は `markCallPopScale` から 1 へ `easeOutBack` で縮む。`easeOutBack` は 1 を超えてから戻るため、
   * 倍率は一瞬 1 を少し下回ってから（約 0.96）1 に落ち着く（大きく出た文字が列へ叩きつけられて少し沈む、意図した動き）。
   * 濃さは終わりの `markCallFadeMs` で 1 → 0。
   * @returns {MarkCallLook|null} 見た目の値。出していない・時間が過ぎたなら null
   */
  look() {
    if (!this.isBusy()) return null;
    const t = ANIM_TIMING;
    const scale = lerp(t.markCallPopScale, 1, easeOutBack(clamp01(this.clock / t.markCallPopMs)));
    const alpha = 1 - clamp01((this.clock - (t.markCallMs - t.markCallFadeMs)) / t.markCallFadeMs);
    return { kind: this.kind, column: this.column, scale, alpha };
  }
}
