/**
 * ヒットマークの記録（位置と出る時刻）の組み立てと、時計からの見た目（見えるか・大きさ・濃さ）を型付き配列の入れ物へ書くこと。
 * 時間と大きさは BATTLE_ANIM。描画も状態の変更もしない。
 */
import { BATTLE_ANIM } from './battleAnimConfig.js';

/**
 * ヒットマークの記録（並んだ配列。同じ番号が1つのマーク）。
 * @typedef {Object} HitMarkList
 * @property {number[]} x マークの中心の x
 * @property {number[]} y マークの中心の y
 * @property {number[]} time マークが出る時刻（ms）
 */

/**
 * 空のヒットマークの記録を作る。
 * @returns {HitMarkList}
 */
export function createHitMarkList() {
  return { x: [], y: [], time: [] };
}

/**
 * ヒットマークを1つ記録に足す。
 * @param {HitMarkList} list 記録
 * @param {number} x 中心の x
 * @param {number} y 中心の y
 * @param {number} time 出る時刻（ms）
 * @returns {void}
 */
export function addHitMark(list, x, y, time) {
  list.x.push(x);
  list.y.push(y);
  list.time.push(time);
}

/**
 * 最後のヒットマークが消える時刻を返す。
 * @param {HitMarkList} list 記録
 * @returns {number} max(time) + hitMarkMs（マークがなければ 0）
 */
export function hitMarksEnd(list) {
  if (list.time.length === 0) return 0;
  return Math.max(...list.time) + BATTLE_ANIM.hitMarkMs;
}

/**
 * ヒットマークの見た目（描画が読む。毎回同じ入れ物）。
 * @typedef {Object} HitMarkLook
 * @property {number} count マークの数
 * @property {Uint8Array} visible 見えるか（1 または 0）
 * @property {Float64Array} x 中心の x
 * @property {Float64Array} y 中心の y
 * @property {Float64Array} size 大きさ
 * @property {Float64Array} alpha 濃さ（0〜1）
 */

/**
 * ヒットマークの見た目を型付き配列に書く入れ物。作るのは1回だけで、毎フレームは `sample` が書くだけ。
 * 型付き配列の中身は `HitMarkLook` として読める。
 */
export class HitMarkSwarm {
  /**
   * @param {HitMarkList} list 時間割が記録したヒットマーク
   */
  constructor(list) {
    /** @type {number} */
    this.count = list.time.length;
    /** @type {Uint8Array} */
    this.visible = new Uint8Array(this.count);
    /** @type {Float64Array} */
    this.x = Float64Array.from(list.x);
    /** @type {Float64Array} */
    this.y = Float64Array.from(list.y);
    /** @type {Float64Array} */
    this.size = new Float64Array(this.count);
    /** @type {Float64Array} */
    this.alpha = new Float64Array(this.count);
    /** @type {Float64Array} */
    this.time = Float64Array.from(list.time);
  }

  /**
   * 時計の時刻でのマークの見た目を書く。
   * @param {number} clock 演出の時計（ms）
   * @returns {void}
   */
  sample(clock) {
    const ms = BATTLE_ANIM.hitMarkMs;
    for (let i = 0; i < this.count; i++) {
      const tau = clock - this.time[i];
      if (tau >= 0 && tau < ms) {
        this.visible[i] = 1;
        this.size[i] = BATTLE_ANIM.hitMarkSize;
        this.alpha[i] = 1 - tau / ms;
      } else {
        this.visible[i] = 0;
      }
    }
  }
}
