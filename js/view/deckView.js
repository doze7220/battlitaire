/**
 * 責務: 山札（一番上の表またはめくれ・残り枚数・選択枠・「捨てる」表示）と捨て札（着いていない分を除く枚数）の見た目を描く。
 * 山札の左下に精鋭の確率と能力を出す。状態は変えず、ルール層は実行時に import しない。
 */

import { drawCardFace, drawCardFlip, drawEmptySlot, drawHighlight, roundRectPath } from './cardView.js';
import { ELITE_BODY_COLOR, ELITE_ACCENT_COLOR } from './eliteStyle.js';

const ELITE_FONT = 'bold 12px sans-serif';
const ELITE_COLOR = '#ffffff';
const ELITE_MARGIN = 2;
const ELITE_PAD = 2;
const ELITE_DOT_R = 4;
const ELITE_DOT_GAP = 2;
const ELITE_BOARD_H = 18;
const ELITE_BOARD_FILL = 'rgba(0, 0, 0, 0.6)';
const ELITE_BOARD_CORNER = 4;

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
 * @property {(card: import('../rules/card.js').Card) => number} [bonusOf] 札 → 札の +◯（未指定なら 0 を返す）
 * @property {{ percent: number, power: number, capped: boolean, raised: boolean }|null} [elite] そのスートの精鋭の状態（null か未指定、または percent が 0 なら出さない）
 */

/**
 * 山札を描く。見えるカードの先頭を表で、その下に残りの枚数を出す。空なら空き枠と「空」。左下には精鋭の角の表示（elite があり percent が 0 でないとき）を出す。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} rect 山札の領域
 * @param {import('../rules/card.js').Card[]} visibleCards 見えるカード（先頭が一番上）
 * @param {number} hiddenCount 見えない残りの枚数
 * @param {DeckViewState} state 表示用の状態
 * @returns {void}
 */
export function drawDeck(ctx, rect, visibleCards, hiddenCount, { selected, discardMode, flip, bonusOf = () => 0, elite = null }) {
  const { x, y, w, h } = rect;
  if (visibleCards.length === 0) {
    drawEmptySlot(ctx, x, y, w, h, EMPTY_LABEL);
  } else {
    const bonus = bonusOf(visibleCards[0]);
    if (flip) drawCardFlip(ctx, x, y, w, h, visibleCards[0], flip.scaleX, flip.faceUp, bonus);
    else drawCardFace(ctx, x, y, w, h, visibleCards[0], bonus);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = COUNT_FONT;
    ctx.fillStyle = COUNT_COLOR;
    ctx.fillText(`残り ${hiddenCount}`, x + w / 2, y + h + COUNT_OFFSET_Y);
    ctx.restore();
  }
  if (elite !== null && elite.percent > 0) drawEliteCorner(ctx, rect, elite);
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
 * 山札の矩形の左下に、青い丸・確率「20%」・能力「 +2」（能力を取っているとき）を暗い板の上に描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} rect 山札の領域
 * @param {{ percent: number, power: number, capped: boolean, raised: boolean }} elite 精鋭の状態
 * @returns {void}
 */
function drawEliteCorner(ctx, rect, elite) {
  const { x, y, h } = rect;
  const percentText = `${elite.percent}%`;
  const powerText = elite.raised ? ` +${elite.power}` : '';
  ctx.save();
  ctx.font = ELITE_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const percentW = ctx.measureText(percentText).width;
  const powerW = powerText === '' ? 0 : ctx.measureText(powerText).width;
  const boardX = x + ELITE_MARGIN;
  const boardY = y + h - ELITE_MARGIN - ELITE_BOARD_H;
  const boardW = ELITE_PAD * 2 + ELITE_DOT_R * 2 + ELITE_DOT_GAP + percentW + powerW;
  const midY = boardY + ELITE_BOARD_H / 2;
  roundRectPath(ctx, boardX, boardY, boardW, ELITE_BOARD_H, ELITE_BOARD_CORNER);
  ctx.fillStyle = ELITE_BOARD_FILL;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(boardX + ELITE_PAD + ELITE_DOT_R, midY, ELITE_DOT_R, 0, Math.PI * 2);
  ctx.fillStyle = ELITE_BODY_COLOR;
  ctx.fill();
  const textX = boardX + ELITE_PAD + ELITE_DOT_R * 2 + ELITE_DOT_GAP;
  ctx.fillStyle = elite.capped ? ELITE_ACCENT_COLOR : ELITE_COLOR;
  ctx.fillText(percentText, textX, midY);
  if (powerText !== '') {
    ctx.fillStyle = ELITE_COLOR;
    ctx.fillText(powerText, textX + percentW, midY);
  }
  ctx.restore();
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
