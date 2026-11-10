/**
 * 責務: 盤面下端の状況の帯（フェーズ・城の HP・敵の HP・敵の次の行動の予告）の描画。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { enemyActionText } from './battleText.js';

const BOX_FILL = 'rgba(0, 0, 0, 0.35)';
const BOX_CORNER = 8;
const BOX_PADDING_X = 14;
const TEXT_COLOR = '#f0f0f0';
const TEXT_FONT = 'bold 24px sans-serif';
const PHASE_LABEL = 'フェーズ';
const CASTLE_LABEL = '城 HP';
const ENEMY_LABEL = '敵 HP';
const INTENT_LABEL = '次の行動';
const NO_INTENT_TEXT = '－';

/**
 * 枠を1つ描き、左寄せで文字を出す。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 枠の矩形
 * @param {string} text 出す文字
 * @returns {void}
 */
function drawBox(ctx, rect, text) {
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, BOX_CORNER);
  ctx.fillStyle = BOX_FILL;
  ctx.fill();
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = TEXT_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rect.x + BOX_PADDING_X, rect.y + rect.h / 2);
  ctx.restore();
}

/**
 * 状況の帯を描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').StatusLayout} statusLayout 帯の配置
 * @param {{ phase: number, castle: import('../rules/combatants.js').Castle, enemy: import('../rules/combatants.js').Enemy }} state 表示する状態
 * @returns {void}
 */
export function drawStatus(ctx, statusLayout, { phase, castle, enemy }) {
  drawBox(ctx, statusLayout.phase, `${PHASE_LABEL} ${phase}`);
  drawBox(ctx, statusLayout.castle, `${CASTLE_LABEL} ${castle.hp} / ${castle.maxHp}`);
  drawBox(ctx, statusLayout.enemy, `${ENEMY_LABEL} ${enemy.hp} / ${enemy.maxHp}`);
  const intentText = enemy.intent === null ? NO_INTENT_TEXT : enemyActionText(enemy.intent);
  drawBox(ctx, statusLayout.intent, `${INTENT_LABEL} ${intentText}`);
}
