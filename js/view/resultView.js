/**
 * 責務: 決着したときの結果の表示（画面全体の暗幕・結果の板・クリアか負けか・集計の4行・タップでタイトルへの案内）を描く。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { outcomeText, resultStatLines, resultHintText } from './battleText.js';

/** 画面全体の暗幕の色。 */
const CURTAIN_FILL = 'rgba(0, 0, 0, 0.7)';
/** 結果の板の塗りの色（不透明に近い暗い色）。 */
const PANEL_FILL = 'rgba(16, 20, 28, 0.94)';
/** 結果の板の縁の色。 */
const PANEL_STROKE = '#8a94a6';
/** 結果の板の縁の太さ。 */
const PANEL_LINE_WIDTH = 4;
/** 結果の板の角の丸み。 */
const PANEL_RADIUS = 24;
/** 決着の大きな文字のフォント。 */
const OUTCOME_FONT = 'bold 96px sans-serif';
/** 勝ちの文字の色。 */
const WIN_COLOR = '#ffe680';
/** 負けの文字の色。 */
const LOSE_COLOR = '#ff7a7a';
/** 勝ちを表す決着の値。 */
const OUTCOME_WIN = 'win';
/** 集計の見出しのフォント。 */
const LABEL_FONT = 'bold 32px sans-serif';
/** 集計の数字のフォント。 */
const VALUE_FONT = 'bold 40px sans-serif';
/** 集計の文字の色。 */
const STAT_COLOR = '#f0f0f0';
/** 案内のフォント。 */
const HINT_FONT = 'bold 32px sans-serif';
/** 案内の文字の色。 */
const HINT_COLOR = '#c8ccd4';

/**
 * 結果の表示（暗幕・板・クリアか負けか・集計の4行・案内）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').ResultLayout} resultLayout 結果の表示の配置
 * @param {string} outcome 決着（BattleResult.outcome の null でない値）
 * @param {import('../rules/gameStats.js').GameStats} stats 結果の集計
 * @returns {void}
 */
export function drawResult(ctx, resultLayout, outcome, stats) {
  const { curtain, panel } = resultLayout;
  ctx.save();
  ctx.fillStyle = CURTAIN_FILL;
  ctx.fillRect(curtain.x, curtain.y, curtain.w, curtain.h);

  roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, PANEL_RADIUS);
  ctx.fillStyle = PANEL_FILL;
  ctx.fill();
  ctx.lineWidth = PANEL_LINE_WIDTH;
  ctx.strokeStyle = PANEL_STROKE;
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = OUTCOME_FONT;
  ctx.fillStyle = outcome === OUTCOME_WIN ? WIN_COLOR : LOSE_COLOR;
  ctx.fillText(outcomeText(outcome), resultLayout.x, resultLayout.outcomeY, resultLayout.maxW);

  resultStatLines(stats).forEach((line, i) => {
    const y = resultLayout.rowY(i);
    ctx.fillStyle = STAT_COLOR;
    ctx.textAlign = 'left';
    ctx.font = LABEL_FONT;
    ctx.fillText(line.label, resultLayout.labelX, y, resultLayout.labelMaxW);
    ctx.textAlign = 'right';
    ctx.font = VALUE_FONT;
    ctx.fillText(line.value, resultLayout.valueX, y, resultLayout.valueMaxW);
  });

  ctx.textAlign = 'center';
  ctx.font = HINT_FONT;
  ctx.fillStyle = HINT_COLOR;
  ctx.fillText(resultHintText(), resultLayout.x, resultLayout.hintY, resultLayout.maxW);
  ctx.restore();
}
