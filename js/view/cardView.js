/**
 * 責務: カード1枚の表・裏・めくれ（横幅を縮めた表裏）・空き枠・強調の枠・色の重ねなど、カード単位の見た目を描く。
 * 表の枠と裏はスプライト（spriteView.js）で描き、強化の量「+◯」は数字の右下に文字で描く。状態は変えず、ルール層は実行時に import しない。
 */

import { suitLook } from './suitStyle.js';
import { SPRITE_IDS, drawSpriteCentered, drawSpriteStretched } from './spriteView.js';

const CORNER_RADIUS = 8;
const RANK_FONT = 'bold 24px sans-serif';
/** カードの短い辺に対する、スートの絵の長い辺の割合 */
const SUIT_ART_RATIO = 0.5;
const RANK_OFFSET_X = 8;
const RANK_OFFSET_Y = 6;
/** 札の +◯（強化の量）の文字。数字の右に空ける幅・数字の上端からの下げ幅・文字・色・縁取り */
const BONUS_GAP_X = 2;
const BONUS_OFFSET_Y = 12;
const BONUS_FONT = 'bold 16px sans-serif';
const BONUS_COLOR = '#ff8a1f';
const BONUS_OUTLINE_COLOR = 'rgba(20, 20, 20, 0.9)';
const BONUS_OUTLINE_WIDTH = 3;
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
 * カードの表を描く。表の枠はスートごとのスプライト、その上に左上の数字と中央のスートの絵を重ねる。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 左端
 * @param {number} y 上端
 * @param {number} w 幅
 * @param {number} h 高さ
 * @param {import('../rules/card.js').Card} card 描くカード
 * @param {number} [bonus] 強化の量（札の +◯）。1 以上なら数字の右下にオレンジの「+◯」を重ねる。0 なら何も足さない
 * @returns {void}
 */
export function drawCardFace(ctx, x, y, w, h, card, bonus = 0) {
  const look = suitLook(card.suit);
  drawSpriteStretched(ctx, look.frame, x, y, w, h);

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = look.color;
  ctx.font = RANK_FONT;
  const rankText = String(card.rank);
  ctx.fillText(rankText, x + RANK_OFFSET_X, y + RANK_OFFSET_Y);

  if (bonus >= 1) {
    const rankWidth = ctx.measureText(rankText).width;
    const bonusX = x + RANK_OFFSET_X + rankWidth + BONUS_GAP_X;
    const bonusY = y + RANK_OFFSET_Y + BONUS_OFFSET_Y;
    ctx.font = BONUS_FONT;
    ctx.lineJoin = 'round';
    ctx.lineWidth = BONUS_OUTLINE_WIDTH;
    ctx.strokeStyle = BONUS_OUTLINE_COLOR;
    ctx.strokeText(`+${bonus}`, bonusX, bonusY);
    ctx.fillStyle = BONUS_COLOR;
    ctx.fillText(`+${bonus}`, bonusX, bonusY);
  }

  ctx.restore();

  if (look.sprite !== null) {
    drawSpriteCentered(ctx, look.sprite, x + w / 2, y + h / 2, Math.min(w, h) * SUIT_ART_RATIO);
  }
}

/**
 * カードの裏を、裏のスプライト（card_back）を矩形に合わせて描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 左端
 * @param {number} y 上端
 * @param {number} w 幅
 * @param {number} h 高さ
 * @returns {void}
 */
export function drawCardBack(ctx, x, y, w, h) {
  drawSpriteStretched(ctx, SPRITE_IDS.cardBack, x, y, w, h);
}

/**
 * カードの中心を軸に横幅だけ縮めて、裏か表を描く。scaleX が 0 以下なら何も描かない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 左端（縮める前の矩形）
 * @param {number} y 上端
 * @param {number} w 幅（縮める前）
 * @param {number} h 高さ
 * @param {import('../rules/card.js').Card} card 表を描くときのカード
 * @param {number} scaleX 横幅の比率（0〜1）
 * @param {boolean} faceUp true なら表、false なら裏
 * @param {number} [bonus] 表のときに drawCardFace へ渡す札の +◯（既定 0）
 * @returns {void}
 */
export function drawCardFlip(ctx, x, y, w, h, card, scaleX, faceUp, bonus = 0) {
  if (scaleX <= 0) return;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scaleX, 1);
  if (faceUp) drawCardFace(ctx, -w / 2, -h / 2, w, h, card, bonus);
  else drawCardBack(ctx, -w / 2, -h / 2, w, h);
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
 * カードの角丸の形に色を重ねる（明滅などの色の重ね）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 左端
 * @param {number} y 上端
 * @param {number} w 幅
 * @param {number} h 高さ
 * @param {string} color 重ねる色（CSS 色文字列）
 * @param {number} alpha 濃さ（0〜1）
 * @returns {void}
 */
export function drawCardTint(ctx, x, y, w, h, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  roundRectPath(ctx, x, y, w, h, CORNER_RADIUS);
  ctx.fillStyle = color;
  ctx.fill();
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
