/**
 * 責務: 印の列の描画（列の染め・放つ矢印の上の印・ひとりでに放つときの「混乱！」の文字）と、その大きさ・位置の定数。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { markLookOf, drawMarkIcon } from './markLooks.js';
import { roundRectPath } from './cardView.js';
import { markCallText } from './battleText.js';

/** 列の染めを列の領域より広げる幅（px。試遊で決め直す） */
const MARK_TINT_PAD = 4;
/** 列の染めの角の丸み（px） */
const MARK_TINT_CORNER = 10;
/** 列の染めの縁の太さ（px） */
const MARK_TINT_EDGE_WIDTH = 2;
/** 放つ矢印の上の印の丸の直径（px） */
const MARK_ICON_SIZE = 30;
/** 印の丸の縁の太さ（px） */
const MARK_ICON_EDGE_WIDTH = 2;
/** 印の丸の縁の色 */
const MARK_ICON_EDGE = '#e9d5ff';
/** 「混乱！」の位置（列の領域の上端から高さに対する比） */
const MARK_CALL_Y_RATIO = 0.5;
/** 「混乱！」の文字 */
const MARK_CALL_FONT = 'bold 44px sans-serif';
/** 「混乱！」の文字の最大の幅（px） */
const MARK_CALL_MAX_W = 170;
/** 「混乱！」の文字の芯の色 */
const MARK_CALL_FILL = '#ffffff';
/** 「混乱！」の文字の縁取りの太さ（px） */
const MARK_CALL_STROKE_WIDTH = 8;
/** 表にない印の種類のときの印の丸の塗りの色 */
const MARK_CALL_FALLBACK_STROKE = 'rgba(91, 33, 182, 0.92)';

/**
 * 「混乱！」の見た目の値（`MarkCallShow.look()` の戻り値と同じ形）。
 * @typedef {Object} MarkCallLook
 * @property {string} kind 印の種類
 * @property {number} column 印の列の番号
 * @property {number} scale 文字の倍率
 * @property {number} alpha 文字の濃さ（0〜1）
 */

/**
 * 印の列の領域を染める（列のカードより先＝奥に描く）。表にない種類は何も描かない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} columnLayout 列の領域
 * @param {string} kind 印の種類
 * @returns {void}
 */
export function drawColumnMarkTint(ctx, columnLayout, kind) {
  const look = markLookOf(kind);
  if (look === null) return;
  const x = columnLayout.x - MARK_TINT_PAD;
  const y = columnLayout.y - MARK_TINT_PAD;
  const w = columnLayout.w + MARK_TINT_PAD * 2;
  const h = columnLayout.h + MARK_TINT_PAD * 2;
  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, MARK_TINT_CORNER);
  ctx.fillStyle = look.tint;
  ctx.fill();
  ctx.lineWidth = MARK_TINT_EDGE_WIDTH;
  ctx.strokeStyle = look.edge;
  ctx.stroke();
  ctx.restore();
}

/**
 * 放つ矢印の上に印（紫の丸に絵）を描く（放つボタンの後に描く）。中心は列の中央・列の領域の下端と放つボタンの上端の中ほど。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} columnLayout 列の領域
 * @param {{ x: number, y: number, w: number, h: number }} releaseRect 放つボタンの領域
 * @param {string} kind 印の種類
 * @returns {void}
 */
export function drawColumnMarkIcon(ctx, columnLayout, releaseRect, kind) {
  const look = markLookOf(kind);
  const cx = columnLayout.x + columnLayout.w / 2;
  const cy = (columnLayout.y + columnLayout.h + releaseRect.y) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, MARK_ICON_SIZE / 2, 0, Math.PI * 2);
  ctx.fillStyle = look === null ? MARK_CALL_FALLBACK_STROKE : look.iconFill;
  ctx.fill();
  ctx.lineWidth = MARK_ICON_EDGE_WIDTH;
  ctx.strokeStyle = MARK_ICON_EDGE;
  ctx.stroke();
  ctx.restore();
  drawMarkIcon(ctx, kind, cx, cy, MARK_ICON_SIZE);
}

/**
 * 「混乱！」の文字を列の上に描く（縁取りの文字。倍率・濃さをかける）。`look` が null なら描かない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} columnLayout 印の列の領域
 * @param {MarkCallLook|null} look 見た目の値
 * @returns {void}
 */
export function drawMarkCall(ctx, columnLayout, look) {
  if (look === null || look.scale <= 0 || look.alpha <= 0) return;
  const markLook = markLookOf(look.kind);
  if (markLook === null) return;
  const x = columnLayout.x + columnLayout.w / 2;
  const y = columnLayout.y + columnLayout.h * MARK_CALL_Y_RATIO;
  ctx.save();
  ctx.globalAlpha = look.alpha;
  ctx.translate(x, y);
  ctx.scale(look.scale, look.scale);
  ctx.font = MARK_CALL_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = MARK_CALL_STROKE_WIDTH;
  ctx.strokeStyle = markLook.badgeFill;
  ctx.fillStyle = MARK_CALL_FILL;
  const text = markCallText(look.kind);
  ctx.strokeText(text, 0, 0, MARK_CALL_MAX_W);
  ctx.fillText(text, 0, 0, MARK_CALL_MAX_W);
  ctx.restore();
}
