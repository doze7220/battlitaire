/**
 * 責務: 盤面の動きの集まりを持ち、時計を進め、動いているか（終わったか）を答え、描画用の見た目の値を作る。
 * 描画はせず、ゲームの状態にもルール層にも触れない。
 */

import { cardTweenEnd, sampleCardTween } from './cardTween.js';
import { deckFlipEnd, sampleDeckFlip } from './deckFlip.js';
import { gaugeCountEnd, sampleGaugeCount } from './gaugeCount.js';

/**
 * 飛んでいるカード1枚の描画用の値。
 * @typedef {Object} FlyingCard
 * @property {*} card 描くカード
 * @property {number} x 左上の x
 * @property {number} y 左上の y
 * @property {number} w 幅
 * @property {number} h 高さ
 */

/**
 * 山札のめくれの見え方。
 * @typedef {Object} FlipLook
 * @property {number} scaleX 横幅の比率（0〜1）
 * @property {boolean} faceUp 表を向いているか
 */

/**
 * 盤面の描画に渡す、動きの見た目の値。
 * @typedef {Object} BoardAnimView
 * @property {FlyingCard[]} flying 着いていない移動中のカード（手前に描く。並び順に重ねる）
 * @property {Set<number>} hiddenCardIds 列・手札の描画で隠すカードの ID（先が列・手札で着いていないもの）
 * @property {number} discardPending 捨て札へ向かっていてまだ着いていない枚数
 * @property {Map<number, FlipLook>} deckFlips めくれ中の山札の番号 -> 見え方
 * @property {Object<string, number>} gaugeValues 数え上げ中のゲージの識別子 -> 表示する値
 */

/**
 * 動きの集まりの管理。
 */
export class BoardAnimator {
  constructor() {
    /**
     * 動きの時計（ms）。`update(dt)` の `dt` を足して進める。
     * @type {number}
     */
    this.clock = 0;
    /**
     * すべての動きが終わる時刻（ms）。
     * @type {number}
     */
    this.endTime = 0;
    /**
     * 進行中の動き。なければ null。
     * @type {import('./planningMotion.js').Motion|null}
     */
    this.motion = null;
  }

  /**
   * 動きを始める。進行中の動きは置き換える。
   * @param {import('./planningMotion.js').Motion} motion 始める動き
   * @returns {void}
   */
  start(motion) {
    this.clock = 0;
    this.motion = motion;
    let end = 0;
    for (const t of motion.tweens) end = Math.max(end, cardTweenEnd(t));
    for (const f of motion.flips) end = Math.max(end, deckFlipEnd(f));
    for (const c of motion.counts) end = Math.max(end, gaugeCountEnd(c));
    this.endTime = end;
  }

  /**
   * 時計を進める。終わったら動きを捨てる。
   * @param {number} ms 進める時間（ms。`update(dt)` の `dt`）
   * @returns {void}
   */
  update(ms) {
    this.clock += ms;
    if (this.clock >= this.endTime) this.motion = null;
  }

  /**
   * 動いている最中か。
   * @returns {boolean} 動きがあり、時計が終わりの時刻より前なら true
   */
  isBusy() {
    return this.motion !== null && this.clock < this.endTime;
  }

  /**
   * 描画用の見た目の値を作る（状態は変えない）。
   * @returns {BoardAnimView} 動きの見た目の値
   */
  view() {
    /** @type {BoardAnimView} */
    const v = {
      flying: [],
      hiddenCardIds: new Set(),
      discardPending: 0,
      deckFlips: new Map(),
      gaugeValues: {},
    };
    const m = this.motion;
    if (m === null) return v;
    for (const t of m.tweens) {
      const s = sampleCardTween(t, this.clock);
      if (s.arrived) continue;
      v.flying.push({ card: t.card, x: s.x, y: s.y, w: s.w, h: s.h });
      if (t.dest === 'discard') v.discardPending += 1;
      else v.hiddenCardIds.add(t.card.id);
    }
    for (const f of m.flips) {
      const s = sampleDeckFlip(f, this.clock);
      if (s !== null) v.deckFlips.set(f.deckIndex, { scaleX: s.scaleX, faceUp: s.faceUp });
    }
    for (const c of m.counts) {
      v.gaugeValues[c.gauge] = sampleGaugeCount(c, this.clock);
    }
    return v;
  }
}
