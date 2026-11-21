/**
 * 兵全員の見た目（位置・大きさ・傾き・伸び縮み・濃さ・見えるか・描く順）を、時計から型付き配列の入れ物へ書き込んで持つ。
 * 名簿は読むだけで、書き換えない。描画はこの入れ物を読むだけ。
 */

import { sampleTroop } from './troopMotion.js';
import { breathScale } from './troopBreath.js';

/**
 * 描画に渡す全員の見た目（読むだけ）。
 * @typedef {Object} TroopSwarmLook
 * @property {number} count 兵の数
 * @property {string[]} kinds 兵ごとの種類（名簿の順）
 * @property {Int32Array} order 描く順の添字（奥から）
 * @property {Uint8Array} visible 見えるか（1／0）
 * @property {Float64Array} sortY 描く順に使う地面の上の y（持ち上がり・跳ね・落ちを含まない）
 * @property {Float64Array} x 足元の x
 * @property {Float64Array} footY 足元の y（跳ね・落ちを含む）
 * @property {Float64Array} tilt 傾き（rad）
 * @property {Float64Array} alpha 濃さ（0〜1）
 * @property {Float64Array} size 兵ごとの描く大きさ（0 なら配置の大きさ）
 * @property {Float64Array} scaleX 横の伸び縮み（1 で元の大きさ）
 * @property {Float64Array} scaleY 縦の伸び縮み（1 で元の大きさ）
 * @property {Uint8Array} idle 家で待っているか（1／0）
 */

/**
 * 兵全員の見た目の入れ物。入れ物は作るときに1回だけ用意し、`sample` で書き換える。
 */
export class TroopSwarm {
  /**
   * @param {import('./troopMotion.js').TroopUnit[]} units 名簿の兵（作った順）
   */
  constructor(units) {
    const n = units.length;
    /** @type {import('./troopMotion.js').TroopUnit[]} */
    this.units = units;
    /** @type {number} 兵の数 */
    this.count = n;
    /** @type {string[]} 兵ごとの種類 */
    this.kinds = units.map((u) => u.kind);
    /** @type {Float64Array} 足元の x */
    this.x = new Float64Array(n);
    /** @type {Float64Array} 足元の y */
    this.footY = new Float64Array(n);
    /** @type {Float64Array} 傾き */
    this.tilt = new Float64Array(n);
    /** @type {Float64Array} 濃さ */
    this.alpha = new Float64Array(n);
    /** @type {Float64Array} 兵ごとの描く大きさ（0 なら配置の大きさ。作るときだけ書く） */
    this.size = new Float64Array(n);
    /** @type {Float64Array} 描く順に使う地面の上の y */
    this.sortY = new Float64Array(n);
    /** @type {Uint8Array} 見えるか */
    this.visible = new Uint8Array(n);
    /** @type {Int32Array} 描く順の添字 */
    this.order = new Int32Array(n);
    /** @type {Float64Array} 横の伸び縮み */
    this.scaleX = new Float64Array(n).fill(1);
    /** @type {Float64Array} 縦の伸び縮み */
    this.scaleY = new Float64Array(n).fill(1);
    /** @type {Uint8Array} 家で待っているか */
    this.idle = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      this.order[i] = i;
      this.sortY[i] = units[i].homeY;
      this.size[i] = units[i].size;
    }
    /** @type {import('./troopMotion.js').TroopSample} sampleTroop 用の入れ物 */
    this._out = { visible: false, x: 0, footY: 0, sortY: 0, tilt: 0, alpha: 1, idle: false };
    /** @type {{scaleX: number, scaleY: number}} 伸び縮みの作業用の入れ物 */
    this._scale = { scaleX: 1, scaleY: 1 };
  }

  /**
   * 時計の値で全員の見た目を書き込み、`order` を `sortY` の昇順（奥から）に並べ直す。
   * 同じ `sortY` は名簿の順。
   * @param {number} clock 時計の値（ms）
   * @returns {void}
   */
  sample(clock) {
    const out = this._out;
    const units = this.units;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      out.sortY = this.sortY[i];
      sampleTroop(units[i], clock, out);
      this.visible[i] = out.visible ? 1 : 0;
      this.x[i] = out.x;
      this.footY[i] = out.footY;
      this.sortY[i] = out.sortY;
      this.tilt[i] = out.tilt;
      this.alpha[i] = out.alpha;
      this.idle[i] = out.idle ? 1 : 0;
      if (out.idle) {
        breathScale(this.kinds[i], units[i].index, clock, this._scale);
        this.scaleX[i] = this._scale.scaleX;
        this.scaleY[i] = this._scale.scaleY;
      } else {
        this.scaleX[i] = 1;
        this.scaleY[i] = 1;
      }
    }
    const order = this.order;
    const sortY = this.sortY;
    for (let i = 1; i < n; i++) {
      const cur = order[i];
      const y = sortY[cur];
      let j = i - 1;
      while (j >= 0 && (sortY[order[j]] > y || (sortY[order[j]] === y && order[j] > cur))) {
        order[j + 1] = order[j];
        j--;
      }
      order[j + 1] = cur;
    }
  }

  /**
   * 待っている兵（`idle`）の伸び縮みだけを書き直す。位置・描く順は書かない。
   * @param {number} clock 時計の値（ms）
   * @returns {void}
   */
  breathe(clock) {
    const n = this.count;
    for (let i = 0; i < n; i++) {
      if (this.idle[i] !== 1) continue;
      breathScale(this.kinds[i], this.units[i].index, clock, this._scale);
      this.scaleX[i] = this._scale.scaleX;
      this.scaleY[i] = this._scale.scaleY;
    }
  }
}
