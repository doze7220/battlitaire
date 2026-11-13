/**
 * 責務: 操作前後の盤面の写しと段取りの操作の結果から、動き（カードの移動・山札のめくれ・ゲージの数え上げ）と、放った束の連鎖のきっかけの時刻を組み立てる。
 * ルール層は import せず、描画も状態の変更も行わない。
 */

import { ANIM_TIMING } from './animConfig.js';
import { createCardTween } from './cardTween.js';
import { createDeckFlip } from './deckFlip.js';
import { createGaugeCount } from './gaugeCount.js';

/**
 * 操作の前後に読む盤面の写し。
 * @typedef {Object} BoardSnapshot
 * @property {number[]} columnLengths 列ごとのカードの枚数
 * @property {Object<string, number>} gauges ゲージの識別子ごとの値
 * @property {number[]} deckVisibleCounts 山札ごとの見えるカードの枚数
 */

/**
 * 1回の操作から作られる動きの集まり。
 * @typedef {Object} Motion
 * @property {import('./cardTween.js').CardTween[]} tweens カードの移動
 * @property {import('./deckFlip.js').DeckFlip[]} flips 山札のめくれ
 * @property {import('./gaugeCount.js').GaugeCount[]} counts ゲージの数え上げ
 * @property {number[]} chainTimes 放った束の連鎖のきっかけの時刻（ms、昇順。カードが捨て札に着く時刻。release 以外は空）
 */

/**
 * 盤面の値を写し取る（読むだけ）。
 * @param {import('../rules/Game.js').Game} game ゲームの状態
 * @returns {BoardSnapshot} 盤面の写し
 */
export function snapshotBoard(game) {
  return {
    columnLengths: game.columns.map((col) => col.length),
    gauges: { ...game.gauges },
    deckVisibleCounts: game.decks.map((_, d) => game.visibleCards(d).length),
  };
}

/**
 * 操作の結果と前後の写しから、動きを組み立てる。
 * @param {import('../rules/planningResults.js').PlanningResult} result 操作の結果
 * @param {BoardSnapshot} before 操作前の写し
 * @param {BoardSnapshot} after 操作後の写し
 * @param {import('../view/layout.js').Layout} layout 画面の配置
 * @returns {Motion} 動き（知らない操作なら空）
 */
export function buildPlanningMotion(result, before, after, layout) {
  /** @type {Motion} */
  const motion = { tweens: [], flips: [], counts: [], chainTimes: [] };
  const move = ANIM_TIMING.cardMoveMs;
  /** めくる山札の番号（重複なし）。 */
  const flipDecks = new Set();
  /**
   * 列の最上段（操作後の長さ L の一番上）の矩形を返す。
   * @param {number} c 列の番号
   * @returns {import('./cardTween.js').Rect} 矩形
   */
  const columnTop = (c) => {
    const L = after.columnLengths[c];
    return layout.columnCardRects(c, L)[L - 1];
  };
  /**
   * 1枚の移動を motion に足す。
   * @param {*} card カード
   * @param {import('./cardTween.js').Rect} from 元
   * @param {import('./cardTween.js').Rect} to 先
   * @param {'column'|'hand'|'discard'} dest 先の種類
   * @param {number} [delay] 開始の遅れ（ms）
   * @returns {void}
   */
  const addTween = (card, from, to, dest, delay = 0) => {
    motion.tweens.push(createCardTween({ card, from, to, delay, duration: move, dest }));
  };

  switch (result.type) {
    case 'place':
      addTween(result.card, layout.decks[result.deckIndex], columnTop(result.columnIndex), 'column');
      flipDecks.add(result.deckIndex);
      break;
    case 'discard':
      addTween(result.card, layout.decks[result.deckIndex], layout.discard, 'discard');
      flipDecks.add(result.deckIndex);
      break;
    case 'hold':
      addTween(result.card, layout.decks[result.deckIndex], layout.hand.slots[result.slotIndex], 'hand');
      flipDecks.add(result.deckIndex);
      break;
    case 'placeFromHand':
      addTween(result.card, layout.hand.slots[result.slotIndex], columnTop(result.columnIndex), 'column');
      break;
    case 'move': {
      const n = result.cards.length;
      const fromRects = layout.columnCardRects(result.fromColumn, before.columnLengths[result.fromColumn]);
      const L = after.columnLengths[result.toColumn];
      const toRects = layout.columnCardRects(result.toColumn, L);
      for (let k = 0; k < n; k++) {
        addTween(result.cards[k], fromRects[result.fromIndex + k], toRects[L - n + k], 'column');
      }
      break;
    }
    case 'release': {
      const n = result.cards.length;
      const stagger =
        n <= 1 ? 0 : Math.max(0, Math.min(ANIM_TIMING.releaseStaggerMs, (ANIM_TIMING.releaseTotalMaxMs - move) / (n - 1)));
      const fromRects = layout.columnCardRects(result.columnIndex, n);
      for (let k = 0; k < n; k++) {
        addTween(result.cards[k], fromRects[k], layout.discard, 'discard', (n - 1 - k) * stagger);
      }
      // 上のカード（k が大きい）から順に捨て札へ着くので、k を大きい方から数えると着く時刻は昇順になる
      for (let k = n - 1; k >= 0; k--) {
        motion.chainTimes.push((n - 1 - k) * stagger + move);
      }
      const duration = (n - 1) * stagger + move;
      for (const [gauge, gain] of Object.entries(result.gains ?? {})) {
        if (!(gain > 0)) continue;
        motion.counts.push(
          createGaugeCount({ gauge, from: before.gauges[gauge], to: after.gauges[gauge], delay: 0, duration }),
        );
      }
      break;
    }
    default:
      return motion;
  }

  for (const refill of result.refills ?? []) flipDecks.add(refill.deckIndex);
  for (const d of flipDecks) {
    if ((after.deckVisibleCounts[d] ?? 0) >= 1) {
      motion.flips.push(createDeckFlip({ deckIndex: d, delay: 0, duration: ANIM_TIMING.deckFlipMs }));
    }
  }
  return motion;
}
