/**
 * 責務: 攻防の結果の窓（暗幕・枠・見出し・出来事の行・決着・案内）の描画。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { battleEventLines, outcomeText } from './battleText.js';

const DIM_COLOR = 'rgba(0, 0, 0, 0.5)';
const PANEL_FILL = '#1e2a38';
const PANEL_STROKE = '#ffe680';
const PANEL_LINE_WIDTH = 3;
const PANEL_CORNER = 16;
const TEXT_COLOR = '#f0f0f0';
const TITLE_FONT = 'bold 32px sans-serif';
const LINE_FONT = '26px sans-serif';
const OUTCOME_FONT = 'bold 72px sans-serif';
const HINT_FONT = '22px sans-serif';
const HINT_COLOR = '#c8d0d8';
const WIN_COLOR = '#ffe680';
const LOSE_COLOR = '#ff7a7a';
const TITLE_TEXT = '攻防の結果';
const HINT_NEXT_TEXT = 'タップで次のフェーズへ';
const HINT_TITLE_TEXT = 'タップでタイトルへ';

/**
 * 攻防の結果の窓を描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./resultLayout.js').ResultLayout} resultLayout 窓の配置
 * @param {import('../rules/Game.js').BattleResult} result 攻防の結果
 * @param {boolean} over 決着したか
 * @returns {void}
 */
export function drawResultWindow(ctx, resultLayout, result, over) {
  const { screen, panel } = resultLayout;
  const centerX = panel.x + panel.w / 2;
  ctx.save();
  ctx.fillStyle = DIM_COLOR;
  ctx.fillRect(0, 0, screen.width, screen.height);

  roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, PANEL_CORNER);
  ctx.fillStyle = PANEL_FILL;
  ctx.fill();
  ctx.strokeStyle = PANEL_STROKE;
  ctx.lineWidth = PANEL_LINE_WIDTH;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = TITLE_FONT;
  ctx.fillText(TITLE_TEXT, centerX, resultLayout.titleY);

  ctx.font = LINE_FONT;
  const lines = battleEventLines(result.events);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], centerX, resultLayout.lineTop + i * resultLayout.linePitch);
  }

  if (over) {
    ctx.font = OUTCOME_FONT;
    ctx.fillStyle = result.outcome === 'win' ? WIN_COLOR : LOSE_COLOR;
    ctx.fillText(outcomeText(result.outcome), centerX, resultLayout.outcomeY);
  }

  ctx.font = HINT_FONT;
  ctx.fillStyle = HINT_COLOR;
  ctx.fillText(over ? HINT_TITLE_TEXT : HINT_NEXT_TEXT, centerX, resultLayout.hintY);
  ctx.restore();
}
