/**
 * 責務: 列（重ねたカード・空き枠・置ける列の強調）と「放つ」ボタンの見た目を描く。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { drawCardFace, drawEmptySlot, drawHighlight, roundRectPath } from './cardView.js';

const PLACEABLE_COLOR = '#7be07b';
const EMPTY_LABEL = '空き';
const BUTTON_LABEL = '放つ';
const BUTTON_CORNER = 8;
const BUTTON_FONT = 'bold 20px sans-serif';
const BUTTON_ON_FILL = '#c0392b';
const BUTTON_ON_STROKE = '#ffd0c8';
const BUTTON_ON_TEXT = '#ffffff';
const BUTTON_OFF_FILL = '#3a3a3a';
const BUTTON_OFF_STROKE = '#555555';
const BUTTON_OFF_TEXT = '#777777';
const BUTTON_LINE_WIDTH = 2;

/**
 * 列を描く。カードは下から順に step ずつずらして重ねる。空なら空き枠。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').ColumnLayout} columnLayout 列の配置
 * @param {import('../rules/card.js').Card[]} cards 列のカード（[0] が一番下）
 * @param {boolean} highlighted 置ける列として強調するか
 * @returns {void}
 */
export function drawColumn(ctx, columnLayout, cards, highlighted) {
  const { x, y, step, cardW, cardH } = columnLayout;
  if (cards.length === 0) {
    drawEmptySlot(ctx, x, y, cardW, cardH, EMPTY_LABEL);
    if (highlighted) drawHighlight(ctx, x, y, cardW, cardH, PLACEABLE_COLOR);
    return;
  }
  for (let i = 0; i < cards.length; i++) {
    drawCardFace(ctx, x, y + step * i, cardW, cardH, cards[i]);
  }
  if (highlighted) {
    const topY = y + step * (cards.length - 1);
    drawHighlight(ctx, x, topY, cardW, cardH, PLACEABLE_COLOR);
  }
}

/**
 * 「放つ」ボタンを描く。押せないときは暗い色と薄い文字にする。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} rect ボタンの領域
 * @param {boolean} enabled 押せるか
 * @returns {void}
 */
export function drawReleaseButton(ctx, rect, enabled) {
  const { x, y, w, h } = rect;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, BUTTON_CORNER);
  ctx.fillStyle = enabled ? BUTTON_ON_FILL : BUTTON_OFF_FILL;
  ctx.fill();
  ctx.lineWidth = BUTTON_LINE_WIDTH;
  ctx.strokeStyle = enabled ? BUTTON_ON_STROKE : BUTTON_OFF_STROKE;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = BUTTON_FONT;
  ctx.fillStyle = enabled ? BUTTON_ON_TEXT : BUTTON_OFF_TEXT;
  ctx.fillText(BUTTON_LABEL, x + w / 2, y + h / 2);
  ctx.restore();
}
