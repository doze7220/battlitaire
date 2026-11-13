/**
 * 責務: 列（重ねたカード・長い列の詰め・動いている最中のカードを隠す描画・空き枠・置ける列の強調・選んだ束の枠）と「放つ」ボタンの見た目を描く。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { drawCardFace, drawEmptySlot, drawHighlight, roundRectPath } from './cardView.js';
import { columnCardYs } from './layout.js';

const PLACEABLE_COLOR = '#7be07b';
const RUN_COLOR = '#5bc0ff';
const EMPTY_LABEL = '空き';
const BUTTON_CORNER = 8;
/** ボタンの背景（押せる範囲を示す控えめな角丸）の色。 */
const BUTTON_ON_FILL = 'rgba(192, 57, 43, 0.25)';
const BUTTON_ON_STROKE = 'rgba(255, 208, 200, 0.6)';
const BUTTON_OFF_FILL = 'rgba(58, 58, 58, 0.5)';
const BUTTON_OFF_STROKE = 'rgba(85, 85, 85, 0.6)';
const BUTTON_LINE_WIDTH = 2;
/** 矢印の色（押せるとき／押せないとき）。 */
const ARROW_ON_COLOR = '#ff6a55';
const ARROW_OFF_COLOR = '#555555';
/** 矢印の全体の幅・高さ（ボタンの領域の中央に置く）。 */
const ARROW_W = 40;
const ARROW_H = 52;
/** 矢印の軸の太さ。 */
const ARROW_SHAFT_W = 14;
/** 矢印の頭の高さ（全体の高さのうち）。 */
const ARROW_HEAD_H = 26;

/**
 * 列を描く。カードの位置は columnCardYs で求め、下から順に重ねる。空なら空き枠。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').ColumnLayout} columnLayout 列の配置
 * @param {import('../rules/card.js').Card[]} cards 列のカード（[0] が一番下）
 * @param {boolean} highlighted 置ける列（移せる列）として強調するか
 * @param {number|null} runFrom 選んだ束の一番下の番号（選んでいなければ null）
 * @param {Set<number>} [hiddenIds] 描かないカードの ID（動いている最中のカード。位置は隠したカードも数えた全体の枚数で求め、全部隠れていれば空き枠を描く）
 * @returns {void}
 */
export function drawColumn(ctx, columnLayout, cards, highlighted, runFrom, hiddenIds = new Set()) {
  const { x, y, cardW, cardH } = columnLayout;
  if (cards.length === 0 || cards.every((c) => hiddenIds.has(c.id))) {
    drawEmptySlot(ctx, x, y, cardW, cardH, EMPTY_LABEL);
    if (highlighted) drawHighlight(ctx, x, y, cardW, cardH, PLACEABLE_COLOR);
    return;
  }
  const ys = columnCardYs(columnLayout, cards.length);
  for (let i = 0; i < cards.length; i++) {
    if (hiddenIds.has(cards[i].id)) continue;
    drawCardFace(ctx, x, ys[i], cardW, cardH, cards[i]);
  }
  if (runFrom !== null && runFrom >= 0 && runFrom < cards.length) {
    const top = ys[runFrom];
    const bottom = ys[cards.length - 1] + cardH;
    drawHighlight(ctx, x, top, cardW, bottom - top, RUN_COLOR);
  }
  if (highlighted) {
    drawHighlight(ctx, x, ys[cards.length - 1], cardW, cardH, PLACEABLE_COLOR);
  }
}

/**
 * 「放つ」ボタンを描く（領域の中央に上向きの矢印。背後に押せる範囲を示す薄い角丸）。押せないときは暗い灰色にする。
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
  const cx = x + w / 2;
  const top = y + (h - ARROW_H) / 2;
  const bottom = top + ARROW_H;
  const halfW = ARROW_W / 2;
  const halfShaft = ARROW_SHAFT_W / 2;
  const headBottom = top + ARROW_HEAD_H;
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.lineTo(cx + halfW, headBottom);
  ctx.lineTo(cx + halfShaft, headBottom);
  ctx.lineTo(cx + halfShaft, bottom);
  ctx.lineTo(cx - halfShaft, bottom);
  ctx.lineTo(cx - halfShaft, headBottom);
  ctx.lineTo(cx - halfW, headBottom);
  ctx.closePath();
  ctx.fillStyle = enabled ? ARROW_ON_COLOR : ARROW_OFF_COLOR;
  ctx.fill();
  ctx.restore();
}
