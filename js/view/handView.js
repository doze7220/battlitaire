/**
 * 責務: 手札（見出し・空き枠・カード・動いている最中のカードを隠す描画・選択中の枠と入れられる枠の強調）を描く。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { drawCardFace, drawEmptySlot, drawHighlight } from './cardView.js';

const TITLE_TEXT = '手札';
const TITLE_FONT = 'bold 18px sans-serif';
const TITLE_COLOR = '#ffffff';
const EMPTY_LABEL = '空き';
const SELECT_COLOR = '#ffd84a';
const HOLDABLE_COLOR = '#7be07b';

/**
 * 手札の描画に使う表示用の値。
 * @typedef {Object} HandViewState
 * @property {number|null} selectedSlot 選択中の手札の枠の番号（なければ null）
 * @property {number[]} holdSlots 山札のカードを入れられる枠の番号
 * @property {Set<number>} [hiddenIds] 描かないカードの ID（動いている最中のカード。そのカードの枠は空き枠として描く。未指定なら隠さない）
 */

/**
 * 手札を描く。状態は変えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').HandLayout} handLayout 手札の配置
 * @param {(import('../rules/card.js').Card|null)[]} hand 手札（null は空き枠）
 * @param {HandViewState} state 表示用の値
 * @returns {void}
 */
export function drawHand(ctx, handLayout, hand, state) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = TITLE_FONT;
  ctx.fillStyle = TITLE_COLOR;
  ctx.fillText(TITLE_TEXT, handLayout.title.x, handLayout.title.y);
  ctx.restore();

  for (let s = 0; s < handLayout.slots.length; s++) {
    const { x, y, w, h } = handLayout.slots[s];
    const held = hand[s] ?? null;
    const card = held !== null && state.hiddenIds?.has(held.id) ? null : held;
    if (card === null) {
      drawEmptySlot(ctx, x, y, w, h, EMPTY_LABEL);
      if (state.holdSlots.includes(s)) drawHighlight(ctx, x, y, w, h, HOLDABLE_COLOR);
    } else {
      drawCardFace(ctx, x, y, w, h, card);
      if (state.selectedSlot === s) drawHighlight(ctx, x, y, w, h, SELECT_COLOR);
    }
  }
}
