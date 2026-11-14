/**
 * 責務: 最上段（戦闘）の描画（背景・地面の線・城の仮の図形・敵の図形（enemyView.js）・フェーズ・城の HP・敵の名前と HP・敵の予告（爪・ブレスの種類を目立たせる）・数え下ろし）。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { enemyActionText, countdownText } from './battleText.js';
import { drawEnemyFigure } from './enemyView.js';

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
/** 城の上辺の狭間の数。 */
const MERLON_COUNT = 3;
/** 狭間1つの幅の、城の幅に対する割合。 */
const MERLON_W_RATIO = 0.16;
/** 狭間の高さの、城の幅に対する割合。 */
const MERLON_H_RATIO = 0.1;

/** 枠の塗りつぶしの色。 */
const BOX_FILL = 'rgba(0, 0, 0, 0.35)';
/** 枠の角の半径。 */
const BOX_CORNER = 8;
/** 枠の左端から文字までの余白。 */
const BOX_PADDING_X = 14;
/** 目立たせる枠の塗りつぶしの色。 */
const EMPHASIS_FILL = 'rgba(150, 20, 20, 0.85)';
/** 目立たせる枠の文字の色。 */
const EMPHASIS_COLOR = '#ffe45c';
/**
 * 予告の枠を目立たせる行動の中の種類（variant）の集合。
 * @type {Set<string>}
 */
const EMPHASIZED_VARIANTS = new Set(['breath']);
/** 目立たせる枠の見た目。 */
const EMPHASIS_STYLE = Object.freeze({ fill: EMPHASIS_FILL, color: EMPHASIS_COLOR });
/** 文字の色。 */
const TEXT_COLOR = '#f0f0f0';
/** 文字のフォント。 */
const TEXT_FONT = 'bold 24px sans-serif';
/** フェーズの枠の見出し。 */
const PHASE_LABEL = 'フェーズ';
/** 城の HP の枠の見出し。 */
const CASTLE_LABEL = '城 HP';
/** 予告の枠の見出し。 */
const INTENT_LABEL = '次の行動';
/** 予告がないときに出す文字。 */
const NO_INTENT_TEXT = '－';

/**
 * 枠を1つ描き、左寄せで文字を出す（文字は枠の幅からはみ出さないよう最大の幅を渡す）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 枠の矩形
 * @param {string} text 出す文字
 * @param {{ fill: string, color: string }} [style] 見た目（塗りと文字の色。省くと通常の色）
 * @returns {void}
 */
function drawBox(ctx, rect, text, style) {
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, BOX_CORNER);
  ctx.fillStyle = style ? style.fill : BOX_FILL;
  ctx.fill();
  ctx.fillStyle = style ? style.color : TEXT_COLOR;
  ctx.font = TEXT_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rect.x + BOX_PADDING_X, rect.y + rect.h / 2, rect.w - BOX_PADDING_X * 2);
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
 * 最上段（戦闘）を描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ phase: number, castle: { hp: number, maxHp: number }, enemy: { typeId: string, name: string, hp: number, maxHp: number, armor: number, intent: import('../rules/combatants.js').EnemyAction|null }, shieldFlash?: boolean, countdown?: number|null }} state 表示する状態（shieldFlash: シールドマークを明るく描くか。省くと false。countdown: 攻撃までの残りフェーズ数。null か省くと数え下ろしを描かない）
 * @returns {void}
 */
export function drawBattleStage(ctx, battleLayout, { phase, castle, enemy, shieldFlash = false, countdown = null }) {
  drawBackground(ctx, battleLayout);
  drawCastleShape(ctx, battleLayout.castle);
  drawEnemyFigure(ctx, battleLayout, enemy, { shieldFlash });
  drawBox(ctx, battleLayout.phase, `${PHASE_LABEL} ${phase}`);
  drawBox(ctx, battleLayout.castleHp, `${CASTLE_LABEL} ${castle.hp} / ${castle.maxHp}`);
  drawBox(ctx, battleLayout.enemyHp, `${enemy.name} ${enemy.hp} / ${enemy.maxHp}`);
  const intentText = enemy.intent === null ? NO_INTENT_TEXT : enemyActionText(enemy.intent);
  const emphasized = enemy.intent !== null && EMPHASIZED_VARIANTS.has(enemy.intent.variant);
  drawBox(ctx, battleLayout.intent, `${INTENT_LABEL} ${intentText}`, emphasized ? EMPHASIS_STYLE : undefined);
  if (countdown !== null) {
    drawBox(ctx, battleLayout.countdown, countdownText(countdown));
  }
}
