/**
 * 責務: ソリティアの段の最上部に並ぶゲージ（攻撃・防御・回復・力こぶ）の枠と、名前・数値の描画。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { gaugeLabel } from './suitStyle.js';

/** ゲージの枠の塗りつぶしの色。 */
const GAUGE_FILL = 'rgba(255, 255, 255, 0.08)';
/** 枠の角の半径。 */
const GAUGE_CORNER = 8;
/** 枠の左端から文字までの余白。 */
const GAUGE_PADDING_X = 16;
/** ゲージの名前のフォント。 */
const LABEL_FONT = 'bold 24px sans-serif';
/** ゲージの数値のフォント。 */
const VALUE_FONT = 'bold 30px sans-serif';
/** 文字の色。 */
const TEXT_COLOR = '#f0f0f0';

/**
 * ゲージを描く。ゲージは gauges のキーの順に、gaugeRects[i] の枠へ描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect[]} gaugeRects ゲージの枠（並び順）
 * @param {Object<string, number>} gauges ゲージ（識別子 → 値）
 * @returns {void}
 */
export function drawGauges(ctx, gaugeRects, gauges) {
  ctx.save();
  ctx.textBaseline = 'middle';
  const keys = Object.keys(gauges);
  for (let i = 0; i < keys.length; i++) {
    const r = gaugeRects[i];
    roundRectPath(ctx, r.x, r.y, r.w, r.h, GAUGE_CORNER);
    ctx.fillStyle = GAUGE_FILL;
    ctx.fill();
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'left';
    ctx.font = LABEL_FONT;
    ctx.fillText(gaugeLabel(keys[i]), r.x + GAUGE_PADDING_X, r.y + r.h / 2);
    ctx.textAlign = 'right';
    ctx.font = VALUE_FONT;
    ctx.fillText(String(gauges[keys[i]]), r.x + r.w - GAUGE_PADDING_X, r.y + r.h / 2);
  }
  ctx.restore();
}
