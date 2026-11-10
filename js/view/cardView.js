/**
 * 責務: カード1枚の表・空き枠・強調の枠など、カード単位の見た目を描く。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { suitLook } from './suitStyle.js';

const CORNER_RADIUS = 8;
const FACE_FILL = '#fdfaf0';
const FACE_STROKE = '#333333';
const FACE_LINE_WIDTH = 2;
const RANK_FONT = 'bold 24px sans-serif';
const EMOJI_FONT = '40px sans-serif';
const RANK_OFFSET_X = 8;
const RANK_OFFSET_Y = 6;
const EMPTY_STROKE = '#8a9a8a';
const EMPTY_LINE_WIDTH = 2;
const EMPTY_DASH = [6, 5];
const EMPTY_FONT = '16px sans-serif';
const EMPTY_TEXT_COLOR = '#8a9a8a';
const HIGHLIGHT_LINE_WIDTH = 4;
const HIGHLIGHT_MARGIN = 3;

/**
 * 角丸矩形のパスを現在のパスとして作る（描画はしない）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 左端
 * @param {number} y 上端
 * @param {number} w 幅
 * @param {number} h 高さ
 * @param {number} r 角の半径
 * @returns {void}
 */
export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * カードの表（角丸の枠・左上に数字・中央にスートの絵文字）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 左端
 * @param {number} y 上端
 * @param {number} w 幅
 * @param {number} h 高さ
 * @param {import('../rules/card.js').Card} card 描くカード
 * @returns {void}
 */
export function drawCardFace(ctx, x, y, w, h, card) {
  const look = suitLook(card.suit);
  ctx.save();
  roundRectPath(ctx, x, y, w, h, CORNER_RADIUS);
  ctx.fillStyle = FACE_FILL;
  ctx.fill();
  ctx.lineWidth = FACE_LINE_WIDTH;
  ctx.strokeStyle = FACE_STROKE;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = look.color;
  ctx.font = RANK_FONT;
  ctx.fillText(String(card.rank), x + RANK_OFFSET_X, y + RANK_OFFSET_Y);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = EMOJI_FONT;
  ctx.fillText(look.emoji, x + w / 2, y + h / 2);
  ctx.restore();
}

/**
 * 空き枠（点線の角丸枠と短い文字）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 左端
 * @param {number} y 上端
 * @param {number} w 幅
 * @param {number} h 高さ
 * @param {string} label 枠の中央に出す短い文字（空文字なら出さない）
 * @returns {void}
 */
export function drawEmptySlot(ctx, x, y, w, h, label) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, CORNER_RADIUS);
  ctx.setLineDash(EMPTY_DASH);
  ctx.lineWidth = EMPTY_LINE_WIDTH;
  ctx.strokeStyle = EMPTY_STROKE;
  ctx.stroke();
  if (label) {
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = EMPTY_FONT;
    ctx.fillStyle = EMPTY_TEXT_COLOR;
    ctx.fillText(label, x + w / 2, y + h / 2);
  }
  ctx.restore();
}

/**
 * 強調の枠（カードの外側を囲む太い角丸枠）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 囲む対象の左端
 * @param {number} y 囲む対象の上端
 * @param {number} w 囲む対象の幅
 * @param {number} h 囲む対象の高さ
 * @param {string} color 枠の色（CSS 色文字列）
 * @returns {void}
 */
export function drawHighlight(ctx, x, y, w, h, color) {
  ctx.save();
  roundRectPath(
    ctx,
    x - HIGHLIGHT_MARGIN,
    y - HIGHLIGHT_MARGIN,
    w + HIGHLIGHT_MARGIN * 2,
    h + HIGHLIGHT_MARGIN * 2,
    CORNER_RADIUS + HIGHLIGHT_MARGIN,
  );
  ctx.lineWidth = HIGHLIGHT_LINE_WIDTH;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}
