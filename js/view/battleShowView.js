/**
 * 責務: 攻防の演出中の最上段の描画の取りまとめ（HP の表示値を差し替えた戦闘の段・兵・決着の表示）。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { drawBattleStage } from './battleStageView.js';
import { drawTroops } from './troopView.js';
import { outcomeText } from './battleText.js';

/** 決着の表示の暗幕の色。 */
const CURTAIN_FILL = 'rgba(0, 0, 0, 0.55)';
/** 決着の大きな文字のフォント。 */
const OUTCOME_FONT = 'bold 96px sans-serif';
/** 勝ちの文字の色。 */
const WIN_COLOR = '#ffe680';
/** 負けの文字の色。 */
const LOSE_COLOR = '#ff7a7a';
/** 決着の案内の文字。 */
const OUTCOME_HINT_TEXT = 'タップでタイトルへ';
/** 決着の案内のフォント。 */
const OUTCOME_HINT_FONT = 'bold 32px sans-serif';
/** 決着の案内の文字の色。 */
const OUTCOME_HINT_COLOR = '#f0f0f0';
/** 勝ちを表す決着の値。 */
const OUTCOME_WIN = 'win';

/**
 * 決着の表示（暗幕・大きな勝ち負け・案内）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {string} outcome 決着（BattleResult.outcome の null でない値）
 * @returns {void}
 */
function drawOutcome(ctx, battleLayout, outcome) {
  const { area, outcome: pos } = battleLayout;
  ctx.save();
  ctx.fillStyle = CURTAIN_FILL;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = OUTCOME_FONT;
  ctx.fillStyle = outcome === OUTCOME_WIN ? WIN_COLOR : LOSE_COLOR;
  ctx.fillText(outcomeText(outcome), pos.x, pos.textY);
  ctx.font = OUTCOME_HINT_FONT;
  ctx.fillStyle = OUTCOME_HINT_COLOR;
  ctx.fillText(OUTCOME_HINT_TEXT, pos.x, pos.hintY);
  ctx.restore();
}

/**
 * 演出中の最上段を描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {import('../rules/Game.js').Game} game ルール層のゲーム（フェーズと最大 HP を読む）
 * @param {import('../rules/Game.js').BattleResult} result 攻防の結果（敵の行動と決着を読む）
 * @param {{ units: Array<object>, castleHp: number, enemyHp: number, finished: boolean }} look 演出の見た目の値（BattleLook）
 * @returns {void}
 */
export function drawBattleShow(ctx, battleLayout, game, result, look) {
  drawBattleStage(ctx, battleLayout, {
    phase: game.phase,
    castle: { hp: look.castleHp, maxHp: game.castle.maxHp },
    enemy: { hp: look.enemyHp, maxHp: game.enemy.maxHp, intent: result.enemyAction },
  });
  drawTroops(ctx, look.units);
  if (look.finished && result.outcome !== null) drawOutcome(ctx, battleLayout, result.outcome);
}
