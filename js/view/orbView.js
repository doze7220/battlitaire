/**
 * 放つ演出の見た目（玉に変わる前の札・スートの色の光の玉・弾ける玉・区切りの式の文字・4スートそろいの文字）を描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */
import { drawCardFace } from './cardView.js';
import { suitLook } from './suitStyle.js';
import { releaseFormulaText, allSuitsText } from './battleText.js';

/** 玉の中心の色（白に近い色）。 */
const ORB_CORE_COLOR = '#fffbe8';
/** 玉の中間の色（スートの色）を置く位置（半径に対する割合 0〜1）。試遊で決め直す。 */
const ORB_COLOR_STOP = 0.55;
/** 玉の縁の色（透明）。 */
const ORB_EDGE_COLOR = 'rgba(0, 0, 0, 0)';
/** 式の文字のフォント。試遊で決め直す。 */
const FORMULA_FONT = 'bold 24px sans-serif';
/** 式の文字と玉の縁の間の余白（px）。 */
const FORMULA_PAD = 8;
/** 式の文字の縁取りの色。 */
const FORMULA_STROKE = '#222222';
/** 式の文字の縁取りの太さ（px）。 */
const FORMULA_STROKE_W = 4;
/** 式の文字の塗りの色。 */
const FORMULA_COLOR = '#ffffff';
/** 4スートそろいの文字のフォント。試遊で決め直す。 */
const ALL_SUITS_FONT = 'bold 32px sans-serif';
/** 4スートそろいの文字の縁取りの太さ（px）。 */
const ALL_SUITS_STROKE_W = 6;
/** 4スートそろいの文字の塗りの色。 */
const ALL_SUITS_COLOR = '#ffe680';

/**
 * 玉に変わる前の札を元の矩形のまま表で描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{card: *, x: number, y: number, w: number, h: number}[]} cards 描く札（OrbCardLook の配列）
 * @param {(card: import('../rules/card.js').Card) => number} [bonusOf] 札 → 札の +◯（既定は 0 を返す）
 * @returns {void}
 */
export function drawReleaseCards(ctx, cards, bonusOf = () => 0) {
  for (const c of cards) {
    drawCardFace(ctx, c.x, c.y, c.w, c.h, c.card, bonusOf(c.card));
  }
}

/**
 * 玉（スートの色の光）と、区切りの式の文字を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{orbs: {suit: string, x: number, y: number, size: number, alpha: number}[],
 *   formulas: {sum: number, bonus: number, amount: number, x: number, y: number, gap: number, dir: number}[],
 *   labels: {suitCount: number, amount: number, x: number, y: number, maxW: number, scale: number, alpha: number}[]}} look
 *   描く見た目（ReleaseLook のうち orbs と formulas と labels）
 * @returns {void}
 */
export function drawReleaseOrbs(ctx, look) {
  for (const o of look.orbs) {
    const r = o.size / 2;
    ctx.save();
    ctx.globalAlpha = o.alpha;
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
    grad.addColorStop(0, ORB_CORE_COLOR);
    grad.addColorStop(ORB_COLOR_STOP, suitLook(o.suit).color);
    grad.addColorStop(1, ORB_EDGE_COLOR);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const f of look.formulas) {
    ctx.save();
    ctx.font = FORMULA_FONT;
    ctx.textAlign = f.dir > 0 ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = FORMULA_STROKE_W;
    ctx.strokeStyle = FORMULA_STROKE;
    ctx.fillStyle = FORMULA_COLOR;
    const text = releaseFormulaText(f.sum, f.bonus, f.amount);
    const tx = f.x + f.dir * (f.gap + FORMULA_PAD);
    ctx.strokeText(text, tx, f.y);
    ctx.fillText(text, tx, f.y);
    ctx.restore();
  }
  for (const l of look.labels) {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.scale(l.scale, l.scale);
    ctx.globalAlpha = l.alpha;
    ctx.font = ALL_SUITS_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = ALL_SUITS_STROKE_W;
    ctx.strokeStyle = FORMULA_STROKE;
    ctx.fillStyle = ALL_SUITS_COLOR;
    const text = allSuitsText(l.suitCount, l.amount);
    ctx.strokeText(text, 0, 0, l.maxW);
    ctx.fillText(text, 0, 0, l.maxW);
    ctx.restore();
  }
}
