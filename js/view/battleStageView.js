/**
 * 責務: 最上段（戦闘）の描画（背景・地面の線・城と敵の仮の図形・フェーズ・城と敵の HP・敵の予告）。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { enemyActionText } from './battleText.js';

/** 空の色。 */
const SKY_COLOR = '#2a3a5c';
/** 地面の色。 */
const GROUND_COLOR = '#3b2f2a';
/** 地面の線の色。 */
const GROUND_LINE_COLOR = '#8a7a6a';
/** 地面の線の太さ。 */
const GROUND_LINE_WIDTH = 3;
/** 城の仮の図形の色。 */
const CASTLE_COLOR = '#9aa3b5';
/** 敵の仮の図形の色。 */
const ENEMY_COLOR = '#b5463f';
/** 城の上辺の狭間の数。 */
const MERLON_COUNT = 3;
/** 狭間1つの幅の、城の幅に対する割合。 */
const MERLON_W_RATIO = 0.16;
/** 狭間の高さの、城の幅に対する割合。 */
const MERLON_H_RATIO = 0.1;

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
 * 背景（空・地面・地面の線）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @returns {void}
 */
function drawBackground(ctx, battleLayout) {
  const { area, groundY } = battleLayout;
  ctx.save();
  ctx.fillStyle = SKY_COLOR;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(area.x, groundY, area.w, area.y + area.h - groundY);
  ctx.strokeStyle = GROUND_LINE_COLOR;
  ctx.lineWidth = GROUND_LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(area.x, groundY);
  ctx.lineTo(area.x + area.w, groundY);
  ctx.stroke();
  ctx.restore();
}

/**
 * 城の仮の図形（四角と上辺の狭間）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} castle 城の矩形
 * @returns {void}
 */
function drawCastleShape(ctx, castle) {
  const merlonW = castle.w * MERLON_W_RATIO;
  const merlonH = castle.w * MERLON_H_RATIO;
  const gap = (castle.w - merlonW * MERLON_COUNT) / (MERLON_COUNT - 1);
  ctx.save();
  ctx.fillStyle = CASTLE_COLOR;
  ctx.fillRect(castle.x, castle.y, castle.w, castle.h);
  for (let i = 0; i < MERLON_COUNT; i += 1) {
    ctx.fillRect(castle.x + (merlonW + gap) * i, castle.y - merlonH, merlonW, merlonH);
  }
  ctx.restore();
}

/**
 * 敵の仮の図形（矩形に内接する丸）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} enemy 敵の矩形
 * @returns {void}
 */
function drawEnemyShape(ctx, enemy) {
  ctx.save();
  ctx.fillStyle = ENEMY_COLOR;
  ctx.beginPath();
  ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, Math.min(enemy.w, enemy.h) / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 最上段（戦闘）を描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ phase: number, castle: import('../rules/combatants.js').Castle, enemy: import('../rules/combatants.js').Enemy }} state 表示する状態
 * @returns {void}
 */
export function drawBattleStage(ctx, battleLayout, { phase, castle, enemy }) {
  drawBackground(ctx, battleLayout);
  drawCastleShape(ctx, battleLayout.castle);
  drawEnemyShape(ctx, battleLayout.enemy);
  drawBox(ctx, battleLayout.phase, `${PHASE_LABEL} ${phase}`);
  drawBox(ctx, battleLayout.castleHp, `${CASTLE_LABEL} ${castle.hp} / ${castle.maxHp}`);
  drawBox(ctx, battleLayout.enemyHp, `${ENEMY_LABEL} ${enemy.hp} / ${enemy.maxHp}`);
  const intentText = enemy.intent === null ? NO_INTENT_TEXT : enemyActionText(enemy.intent);
  drawBox(ctx, battleLayout.intent, `${INTENT_LABEL} ${intentText}`);
}
