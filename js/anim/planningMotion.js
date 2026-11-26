/**
 * 責務: 操作前後の盤面の写しと段取りの操作の結果から、動き（カードの移動・山札のめくれ・長い列の詰め直し）を組み立てる。放った札は releaseShow.js が見せる。
 * ルール層は import せず、描画も状態の変更も行わない。
 */

import { ANIM_TIMING } from './animConfig.js';
import { buildColumnSettle } from './columnSettle.js';
import { createCardTween } from './cardTween.js';
import { createDeckFlip } from './deckFlip.js';

/**
 * 操作の前後に読む盤面の写し。
 * @typedef {Object} BoardSnapshot
 * @property {number[]} columnLengths 列ごとのカードの枚数
 * @property {number[]} deckVisibleCounts 山札ごとの見えるカードの枚数
 * @property {number} handSize 手札の枠の数（`game.hand.length`。手札へ・手札からの動きの枠の矩形を引く）
 */

/**
 * 1回の操作から作られる動きの集まり。
 * @typedef {Object} Motion
 * @property {import('./cardTween.js').CardTween[]} tweens カードの移動
 * @property {import('./deckFlip.js').DeckFlip[]} flips 山札のめくれ
 * @property {import('./columnSettle.js').ColumnSettle[]} settles 列の詰め直し（列にもとからあったカードの移動）
 */

/**
 * 盤面の値を写し取る（読むだけ）。
 * @param {import('../rules/Game.js').Game} game ゲームの状態
 * @returns {BoardSnapshot} 盤面の写し
 */
export function snapshotBoard(game) {
  return {
    columnLengths: game.columns.map((col) => col.length),
    deckVisibleCounts: game.decks.map((_, d) => game.visibleCards(d).length),
    handSize: game.hand.length,
  };
}

/**
 * 操作の結果と前後の写しから、動きを組み立てる。
 * 手札へ入れる動きの先は操作後の手札の枠の数、手札から置く動きの元は操作前の手札の枠の数で引いた枠の矩形（2枠以上は縮めた枠）。
 * 山札のめくれは、カードが抜けてから `deckFlipDelayMs` の待ちの後に始まる（補充のめくれも同じ）。
 * 置く・手札から置く・束を移すで長い列の詰めが変わるときは、動くカードが着いた後（`cardMoveMs` の後）から
 * 列にもとからあったカードが新しい位置へ動く詰め直し（`settles`）を足す。
 * @param {import('../rules/planningResults.js').PlanningResult} result 操作の結果
 * @param {BoardSnapshot} before 操作前の写し
 * @param {BoardSnapshot} after 操作後の写し
 * @param {import('../view/layout.js').Layout} layout 画面の配置
 * @returns {Motion} 動き（知らない操作なら空）
 */
export function buildPlanningMotion(result, before, after, layout) {
  /** @type {Motion} */
  const motion = { tweens: [], flips: [], settles: [] };
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

  /**
   * 列の詰め直し（動くカードが着いてから、列にもとからあったカードが動く）を、あれば motion に足す。
   * @param {number} c 列の番号
   * @returns {void}
   */
  const addSettle = (c) => {
    const settle = buildColumnSettle(
      layout, c, before.columnLengths[c], after.columnLengths[c], ANIM_TIMING.cardMoveMs, ANIM_TIMING.columnSettleMs,
    );
    if (settle !== null) motion.settles.push(settle);
  };

  switch (result.type) {
    case 'place':
      addTween(result.card, layout.decks[result.deckIndex], columnTop(result.columnIndex), 'column');
      addSettle(result.columnIndex);
      flipDecks.add(result.deckIndex);
      break;
    case 'discard':
      addTween(result.card, layout.decks[result.deckIndex], layout.discard, 'discard');
      flipDecks.add(result.deckIndex);
      break;
    case 'hold':
      addTween(result.card, layout.decks[result.deckIndex], layout.hand.slotsFor(after.handSize)[result.slotIndex], 'hand');
      flipDecks.add(result.deckIndex);
      break;
    case 'placeFromHand':
      addTween(result.card, layout.hand.slotsFor(before.handSize)[result.slotIndex], columnTop(result.columnIndex), 'column');
      addSettle(result.columnIndex);
      break;
    case 'move': {
      const n = result.cards.length;
      const fromRects = layout.columnCardRects(result.fromColumn, before.columnLengths[result.fromColumn]);
      const L = after.columnLengths[result.toColumn];
      const toRects = layout.columnCardRects(result.toColumn, L);
      for (let k = 0; k < n; k++) {
        addTween(result.cards[k], fromRects[result.fromIndex + k], toRects[L - n + k], 'column');
      }
      addSettle(result.toColumn);
      addSettle(result.fromColumn);
      break;
    }
    case 'release':
      // 列の札をすべて放ち列が空になるので、残るカードがなく詰め直しは起きない（作らない）
      // 放った札は releaseShow.js が玉で見せる（ここでは補充のめくれだけを後の共通の処理で足す）
      break;
    default:
      return motion;
  }

  for (const refill of result.refills ?? []) flipDecks.add(refill.deckIndex);
  for (const d of flipDecks) {
    if ((after.deckVisibleCounts[d] ?? 0) >= 1) {
      // 抜けたカードが半分ほど離れた頃にめくれ始める。待つ間は裏のまま（sampleDeckFlip）。補充のめくれも同じ
      motion.flips.push(createDeckFlip({ deckIndex: d, delay: ANIM_TIMING.deckFlipDelayMs, duration: ANIM_TIMING.deckFlipMs }));
    }
  }
  return motion;
}
