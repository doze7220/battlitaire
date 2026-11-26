/**
 * 責務: 指で縦にずらすスクロールの状態（位置・ドラッグ中か・前の y）と操作（始める・動かす・終える）を持つ。
 * 何も import せず、描画も入力の受け取りもしない純粋な状態。
 */

/** 指に付いて動く縦スクロールの状態と操作 */
export class DragScroll {
  /**
   * @param {number} max 位置の最大（0 以上。0 なら動かない）
   */
  constructor(max) {
    /** @type {number} 位置の最大 */
    this.max = Math.max(0, max);
    /** @type {number} 今の位置（0〜max。0 が一番上） */
    this.offset = 0;
    /** @type {boolean} ドラッグ中か */
    this.dragging = false;
    /** @type {number} 前の y */
    this.lastY = 0;
  }

  /**
   * ドラッグを始める。
   * @param {number} y 指の y
   * @returns {void}
   */
  begin(y) {
    this.dragging = true;
    this.lastY = y;
  }

  /**
   * 指に付いて位置を動かす（指を上へ動かすと中身も上へ動く＝位置が増える）。ドラッグ中でなければ何もしない。
   * @param {number} y 指の y
   * @returns {void}
   */
  move(y) {
    if (!this.dragging) return;
    this.offset = Math.min(this.max, Math.max(0, this.offset + (this.lastY - y)));
    this.lastY = y;
  }

  /**
   * ドラッグを終える。
   * @returns {void}
   */
  end() {
    this.dragging = false;
  }
}
