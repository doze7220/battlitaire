/**
 * 札が燃える段の、1枚ごとの時刻（明滅・飛び立ち・着く）と移動の記録の組み立てと、時計からの盤面の見た目を求める。
 * 描画も状態の変更も行わない。燃える段の時刻の式はこのファイルの1か所だけに置く。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { createCardTween, sampleCardTween } from './cardTween.js';

/**
 * @typedef {{x: number, y: number, w: number, h: number}} Rect 矩形。
 */

/**
 * 燃える札1枚の記録。
 * @typedef {Object} BurnTrack
 * @property {*} card 燃える札
 * @property {number} columnIndex 燃える列の番号
 * @property {number} cardIndex 燃える時点のその列の下から数えた位置（その時点の一番上）
 * @property {Rect} from 燃える時点の札の矩形
 * @property {number} flashStart 明滅が始まる時刻（ms。演出の時計の値）
 * @property {import('./cardTween.js').CardTween} tween 捨て札へ飛ぶ移動（`delay` は飛び立つ時刻）
 */

/**
 * 時計から求めた、燃える段の盤面の見た目。
 * @typedef {Object} BurnBoardLook
 * @property {Array<Array<*>>} columns 飛び立った札を除いた列ごとのカードの並び
 * @property {Array<{card: *, x: number, y: number, w: number, h: number}>} flying 飛んでいる札
 * @property {{rect: Rect, alpha: number}|null} flash 明滅中の札の矩形と赤の濃さ（なければ null）
 * @property {number} discardPending 捨て札にまだ着いていない枚数
 */

/**
 * 段の開始から k 枚目（0から）の、明滅・飛び立ち・着く時刻を求める。
 * 燃える段の時刻の式はここだけに置き、時間割と音のきっかけの両方がこれを呼ぶ。
 * @param {number} k 何枚目か（0から）
 * @returns {{flash: number, fly: number, arrive: number}} 段の開始からの時刻（ms）
 */
export function burnCardOffsets(k) {
  const flash = k * (BATTLE_ANIM.burnFlashMs + BATTLE_ANIM.burnFlyMs);
  const fly = flash + BATTLE_ANIM.burnFlashMs;
  const arrive = fly + BATTLE_ANIM.burnFlyMs;
  return { flash, fly, arrive };
}

/**
 * 燃える段の長さを求める。
 * @param {number} count 燃える枚数
 * @returns {number} 段の長さ（ms）
 */
export function burnStepDuration(count) {
  return count * (BATTLE_ANIM.burnFlashMs + BATTLE_ANIM.burnFlyMs);
}

/**
 * 燃える札の並びから、1枚ごとの記録を作る。
 * @param {Array<{columnIndex: number, cardIndex: number, card: *}>} burns 燃える札の並び（燃える順）
 * @param {number} start 段の開始時刻（ms。演出の時計の値）
 * @param {{discard: Rect, columnCardRects: function(number, number): Rect[]}} boardLayout 盤面の配置
 * @returns {BurnTrack[]} 記録の並び（burns と同じ順）
 */
export function createBurnTracks(burns, start, boardLayout) {
  return burns.map((b, k) => {
    const off = burnCardOffsets(k);
    const from = boardLayout.columnCardRects(b.columnIndex, b.cardIndex + 1)[b.cardIndex];
    const tween = createCardTween({
      card: b.card,
      from,
      to: boardLayout.discard,
      delay: start + off.fly,
      duration: BATTLE_ANIM.burnFlyMs,
      dest: 'discard',
    });
    return {
      card: b.card,
      columnIndex: b.columnIndex,
      cardIndex: b.cardIndex,
      from,
      flashStart: start + off.flash,
      tween,
    };
  });
}

/**
 * 時計の値から、燃える段の盤面の見た目を求める。
 * @param {BurnTrack[]} tracks 記録の並び
 * @param {Array<Array<*>>} beforeColumns 攻防の前の列の写し（書き換えない）
 * @param {number} clock 演出の時計の値（ms）
 * @returns {BurnBoardLook} 盤面の見た目
 */
export function sampleBurnBoard(tracks, beforeColumns, clock) {
  const removed = beforeColumns.map(() => 0);
  /** @type {BurnBoardLook['flying']} */
  const flying = [];
  /** @type {BurnBoardLook['flash']} */
  let flash = null;
  let discardPending = 0;
  for (const t of tracks) {
    const { delay, duration } = t.tween;
    if (clock >= delay) {
      removed[t.columnIndex] += 1;
      const s = sampleCardTween(t.tween, clock);
      if (!s.arrived) flying.push({ card: t.card, x: s.x, y: s.y, w: s.w, h: s.h });
    } else if (clock >= t.flashStart) {
      const progress = (clock - t.flashStart) / (delay - t.flashStart);
      flash = {
        rect: t.from,
        alpha: 0.5 - 0.5 * Math.cos(2 * Math.PI * BATTLE_ANIM.burnBlinks * progress),
      };
    }
    if (clock < delay + duration) discardPending += 1;
  }
  const columns = beforeColumns.map((col, c) => col.slice(0, col.length - removed[c]));
  return { columns, flying, flash, discardPending };
}
