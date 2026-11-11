/**
 * 責務: 山札（一番上の表またはめくれ・残り枚数・選択枠・「捨てる」表示）と捨て札（着いていない分を除く枚数）の見た目を描く。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { drawCardFace, drawCardFlip, drawEmptySlot, drawHighlight, roundRectPath } from './cardView.js';

const SELECT_COLOR = '#ffd84a';
const COUNT_FONT = '16px sans-serif';
const COUNT_COLOR = '#e8e8e8';
const COUNT_OFFSET_Y = 8;
const EMPTY_LABEL = '空';
const DISCARD_LABEL = '捨て札';
const DISCARD_FONT = '16px sans-serif';
const DISCARD_COLOR = '#e8e8e8';
const DISCARD_FILL = '#3a3f3a';
const DISCARD_STROKE = '#8a9a8a';
const DISCARD_LINE_WIDTH = 2;
const DISCARD_CORNER = 8;
const DISCARD_COUNT_FONT = 'bold 28px sans-serif';
const BAND_TEXT = '捨てる';
const BAND_H = 36;
const BAND_FILL = 'rgba(160, 30, 30, 0.85)';
const BAND_FONT = 'bold 20px sans-serif';
const BAND_COLOR = '#ffffff';

/**
 * 山札の表示用の状態。
 * @typedef {Object} DeckViewState
 * @property {boolean} selected 選択中か
 * @property {boolean} discardMode 「捨てる」の帯を出すか
 * @property {{ scaleX: number, faceUp: boolean }|null} [flip] めくれ中の見た目（null か未指定なら普通の表）
 */

/**
 * 山札を描く。見えるカードの先頭を表で、その下に残りの枚数を出す。空なら空き枠と「空」。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} rect 山札の領域
 * @param {import('../rules/card.js').Card[]} visibleCards 見えるカード（先頭が一番上）
 * @param {number} hiddenCount 見えない残りの枚数
 * @param {DeckViewState} state 表示用の状態
 * @returns {void}
 */
export function drawDeck(ctx, rect, visibleCards, hiddenCount, { selected, discardMode, flip }) {
  const { x, y, w, h } = rect;
  if (visibleCards.length === 0) {
    drawEmptySlot(ctx, x, y, w, h, EMPTY_LABEL);
  } else {
    if (flip) drawCardFlip(ctx, x, y, w, h, visibleCards[0], flip.scaleX, flip.faceUp);
    else drawCardFace(ctx, x, y, w, h, visibleCards[0]);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = COUNT_FONT;
    ctx.fillStyle = COUNT_COLOR;
    ctx.fillText(`残り ${hiddenCount}`, x + w / 2, y + h + COUNT_OFFSET_Y);
    ctx.restore();
  }
  if (selected) drawHighlight(ctx, x, y, w, h, SELECT_COLOR);
  if (discardMode) {
    ctx.save();
    ctx.fillStyle = BAND_FILL;
    ctx.fillRect(x, y + (h - BAND_H) / 2, w, BAND_H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = BAND_FONT;
    ctx.fillStyle = BAND_COLOR;
    ctx.fillText(BAND_TEXT, x + w / 2, y + h / 2);
    ctx.restore();
  }
}

/**
 * 捨て札（枠・「捨て札」・枚数）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} rect 捨て札の領域
 * @param {number} count 捨て札の枚数（ルール層の値）
 * @param {number} [pending] まだ着いていない飛行中のカードの枚数（出す枚数は count から引く。既定 0）
 * @returns {void}
 */
export function drawDiscard(ctx, rect, count, pending = 0) {
  const { x, y, w, h } = rect;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, DISCARD_CORNER);
  ctx.fillStyle = DISCARD_FILL;
  ctx.fill();
  ctx.lineWidth = DISCARD_LINE_WIDTH;
  ctx.strokeStyle = DISCARD_STROKE;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = DISCARD_COLOR;
  ctx.font = DISCARD_FONT;
  ctx.fillText(DISCARD_LABEL, x + w / 2, y + h * 0.3);
  ctx.font = DISCARD_COUNT_FONT;
  ctx.fillText(String(Math.max(0, count - pending)), x + w / 2, y + h * 0.62);
  ctx.restore();
}
