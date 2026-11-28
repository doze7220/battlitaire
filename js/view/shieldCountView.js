/**
 * 責務: 体の前のシールドの残りの数（溜めた防御の量）の数字を、絵の横の決まった位置に縁取りつきで描く。
 * 状態は変えず、ルール層・anim は import しない。
 */

import { stockCountText } from './battleText.js';

/** 数字のフォント。 */
const SHIELD_COUNT_FONT = 'bold 28px sans-serif';
/** 数字の芯の色（白）。 */
const SHIELD_COUNT_COLOR = '#ffffff';
/** 数字の縁取りの色（濃い青）。 */
const SHIELD_COUNT_OUTLINE_COLOR = '#1f3a5f';
/** 数字の縁取りの太さ（px）。 */
const SHIELD_COUNT_OUTLINE_WIDTH = 6;

/**
 * シールドの残りの数の数字を描く（右揃え・縦は中央）。count が 0 以下なら何も描かない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number }} spot 数字の位置（x は右端、y は中心。`EnemyFigure.shieldCount`）
 * @param {number} count シールドの残りの数
 * @returns {void}
 */
export function drawShieldCount(ctx, spot, count) {
  if (!(count > 0)) return;
  const text = stockCountText(count);
  ctx.save();
  ctx.font = SHIELD_COUNT_FONT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = SHIELD_COUNT_OUTLINE_WIDTH;
  ctx.strokeStyle = SHIELD_COUNT_OUTLINE_COLOR;
  ctx.strokeText(text, spot.x, spot.y);
  ctx.fillStyle = SHIELD_COUNT_COLOR;
  ctx.fillText(text, spot.x, spot.y);
  ctx.restore();
}
