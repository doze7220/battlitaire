/**
 * 責務: 戦闘の段とソリティアの段の間の、行動のゲージの帯（残りの行動のブロック）と、帯の上の「ACTION POINT」のラベル
 * （右の強化の表示を含む）を描く。状態は変えず、値は呼ぶ側から受け取る。ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';

/** @type {string} 帯の塗り（盤面の背景より暗い色。試遊で決め直す）。 */
const BAND_COLOR = '#13261d';
/** @type {string} 埋まったブロックの色（試遊で決め直す）。 */
const FILLED_COLOR = '#6ec8ff';
/** @type {string} 金貨で増えた分のブロックの色（金貨のゲージの基本の色と同じ）。 */
const BONUS_COLOR = '#e0a030';
/** @type {string} 空のブロックの色。 */
const EMPTY_COLOR = 'rgba(255, 255, 255, 0.12)';
/** @type {number} ブロックの角の半径。 */
const BLOCK_RADIUS = 4;
/** @type {string} ラベルの文字。 */
const LABEL_TEXT = 'ACTION POINT';
/** @type {string} ラベルの縁取りの色。 */
const LABEL_OUTLINE_COLOR = '#101418';
/** @type {number} ラベルの縁取りの太さ。 */
const LABEL_OUTLINE_WIDTH = 4;
/** @type {string} アクションポイントの率が上限に着いたときの率の文字の色（オレンジ。試遊で決め直す）。 */
const CAPPED_COLOR = '#ff9a1f';

/**
 * 値を範囲内に収める。
 * @param {number} v 値
 * @param {number} lo 下限
 * @param {number} hi 上限
 * @returns {number} 収めた値
 */
function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

/**
 * 行動のゲージの帯を描く。n = ブロックの数、filled = clamp(actionsLeft, 0, n)、
 * bonus = clamp(actionsLeft - n, 0, n)。ブロック i は i < bonus なら金貨の色、
 * そうでなく i < filled なら埋まった色、それ以外は空の色（左から埋まる）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').ActionGaugeLayout} actionLayout 行動のゲージの配置
 * @param {number} actionsLeft 残りの行動の数
 * @returns {void}
 */
export function drawActionGauge(ctx, actionLayout, actionsLeft) {
  const { band, blocks } = actionLayout;
  const n = blocks.length;
  const filled = clamp(actionsLeft, 0, n);
  const bonus = clamp(actionsLeft - n, 0, n);
  ctx.save();
  ctx.fillStyle = BAND_COLOR;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  for (let i = 0; i < n; i++) {
    const b = blocks[i];
    roundRectPath(ctx, b.x, b.y, b.w, b.h, BLOCK_RADIUS);
    ctx.fillStyle = i < bonus ? BONUS_COLOR : i < filled ? FILLED_COLOR : EMPTY_COLOR;
    ctx.fill();
  }
  ctx.restore();
}

/**
 * アクションポイントの表示の文字を、率の部分を分けた3つの部分に作る（「+1(」「10%」「)」。値は渡されたものを文字にするだけ）。
 * @param {number} actions 発動で増える行動の数
 * @param {number} percent 発動率（百分率）
 * @returns {[string, string, string]} 前の部分・率の部分・後ろの部分
 */
export function chanceTextParts(actions, percent) {
  return [`+${actions}(`, `${percent}%`, ')'];
}

/**
 * 「この戦闘の間」の行動の足し分の表示の文字を作る（値は渡されたものを文字にするだけ）。
 * @param {number} n この戦闘の間、毎ターン足す行動の数
 * @returns {string} 例「・この戦闘 +1」
 */
export function battleActionText(n) {
  return `・この戦闘 +${n}`;
}

/**
 * 行動のゲージの帯の上に「ACTION POINT」のラベル（縁取りの文字。色は埋まったブロックの色）を描く。
 * `status` があれば、ラベルの右（`statusGap` あけて）に同じフォント・縁取りで、アクションポイントの「+1(10%)」
 * （率は上限に着いていれば `CAPPED_COLOR`）と、この戦闘の間の足し分の「・この戦闘 +1」を続けて描く。
 * `status` が `null`、または `chance` が `null` で `battleActions` が 0 ならラベルだけ。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').ActionGaugeLayout} actionLayout 行動のゲージの配置
 * @param {{ chance: { actions: number, percent: number, capped: boolean }|null, battleActions: number }|null} [status] 強化の表示の値（`game.actionUpgradeStatus()`）。なければラベルだけ
 * @returns {void}
 */
export function drawActionGaugeLabel(ctx, actionLayout, status = null) {
  const { x, y, size, statusGap } = actionLayout.label;
  ctx.save();
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = LABEL_OUTLINE_WIDTH;
  ctx.strokeStyle = LABEL_OUTLINE_COLOR;
  ctx.strokeText(LABEL_TEXT, x, y);
  ctx.fillStyle = FILLED_COLOR;
  ctx.fillText(LABEL_TEXT, x, y);
  if (status !== null && (status.chance !== null || status.battleActions > 0)) {
    let cx = x + ctx.measureText(LABEL_TEXT).width + statusGap;
    /** @type {Array<[string, string]>} 描く文字と色の並び */
    const parts = [];
    if (status.chance !== null) {
      const [head, rate, tail] = chanceTextParts(status.chance.actions, status.chance.percent);
      parts.push([head, FILLED_COLOR], [rate, status.chance.capped ? CAPPED_COLOR : FILLED_COLOR], [tail, FILLED_COLOR]);
    }
    if (status.battleActions > 0) parts.push([battleActionText(status.battleActions), FILLED_COLOR]);
    for (const [text, color] of parts) {
      ctx.strokeText(text, cx, y);
      ctx.fillStyle = color;
      ctx.fillText(text, cx, y);
      cx += ctx.measureText(text).width;
    }
  }
  ctx.restore();
}
