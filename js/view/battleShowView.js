/**
 * 責務: 攻防の演出中の最上段の描画の取りまとめ（揺らして段の中で切り抜く戦闘の段（倒れる絵・兵を渡す）・ヒットマーク・エフェクト、段の暗さと光、
 * 人数の表示・敵の回復の量・最上部の HP・敵の名前・「疲弊」・TURN・金貨のゲージ・敵を倒したときの案内）。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { drawBattleStage } from './battleStageView.js';
import { drawHitMarks } from './hitMarkView.js';
import { drawImpactFx, drawStageOverlay } from './battleFxView.js';
import { drawTroopCounter } from './troopCountView.js';
import { drawTopGauges } from './topGaugeView.js';
import { defeatText, healAmountText, defeatHintText } from './battleText.js';

/** 敵を倒したときの案内の暗幕の色。 */
const CURTAIN_FILL = 'rgba(0, 0, 0, 0.55)';
/** 敵を倒したときの文字の色（黄）。 */
const WIN_COLOR = '#ffe680';
/** 敵を倒したときの案内のフォント。 */
const OUTCOME_HINT_FONT = 'bold 32px sans-serif';
/** 敵を倒したときの案内の文字の色。 */
const OUTCOME_HINT_COLOR = '#f0f0f0';
/** 敵を倒したときの「〜を倒した！」のフォント。 */
const DEFEAT_TITLE_FONT = 'bold 52px sans-serif';
/** 敵の回復の量のフォント。 */
const ENEMY_HEAL_FONT = 'bold 40px sans-serif';
/** 敵の回復の量の文字の色（緑）。 */
const ENEMY_HEAL_COLOR = '#6ee07a';

/**
 * 敵を倒したときの案内（暗幕・「〜を倒した！」・「タップで次へ」）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ enemyName: string, nextEnemyName: string|null }} defeat 倒した敵と次の敵の名前（BattleResult.defeat）
 * @returns {void}
 */
function drawDefeat(ctx, battleLayout, defeat) {
  const { area, defeat: pos } = battleLayout;
  ctx.save();
  ctx.fillStyle = CURTAIN_FILL;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = DEFEAT_TITLE_FONT;
  ctx.fillStyle = WIN_COLOR;
  ctx.fillText(defeatText(defeat.enemyName), pos.x, pos.titleY, pos.maxW);
  ctx.font = OUTCOME_HINT_FONT;
  ctx.fillStyle = OUTCOME_HINT_COLOR;
  ctx.fillText(defeatHintText(), pos.x, pos.hintY, pos.maxW);
  ctx.restore();
}

/**
 * 敵の回復の量（緑の「+20」）を敵の絵の上に描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {string} typeId 攻防をした敵の種類の識別子（絵を持つ敵なら enemyFigures の healText、なければ enemyHealText に描く）
 * @param {{ amount: number, alpha: number }} pop 回復の量と濃さ（BattleLook.enemyHealPop の null でない値）
 * @returns {void}
 */
function drawEnemyHealPop(ctx, battleLayout, typeId, pop) {
  const figures = battleLayout.enemyFigures;
  const pos = Object.prototype.hasOwnProperty.call(figures, typeId)
    ? figures[typeId].healText
    : battleLayout.enemyHealText;
  ctx.save();
  ctx.globalAlpha = pop.alpha;
  ctx.font = ENEMY_HEAL_FONT;
  ctx.fillStyle = ENEMY_HEAL_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(healAmountText(pop.amount), pos.x, pos.y);
  ctx.restore();
}

/**
 * 演出中の最上段を描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {import('../rules/Game.js').Game} game ルール層のゲーム（フェーズ・城と敵の最大 HP・攻防をした敵の種類・金貨の値と力こぶの換算の設定を読む）
 * @param {import('../rules/Game.js').BattleResult} result 攻防の結果（敵の行動・敵を倒したときの案内を読む）
 * @param {import('../anim/battleDirector.js').BattleLook} look 演出の見た目の値
 * @returns {void}
 */
export function drawBattleShow(ctx, battleLayout, game, result, look) {
  const { area } = battleLayout;
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();
  ctx.translate(look.stage.shakeX, look.stage.shakeY);
  drawBattleStage(ctx, battleLayout, {
    enemy: {
      typeId: game.enemy.typeId,
      hp: look.enemyHp,
      intent: result.enemyAction,
    },
    figure: look.figure,
    countdown: game.attackCountdown(),
    pose: look.pose,
    troops: look.troops,
  });
  drawHitMarks(ctx, look.hitMarks);
  drawImpactFx(ctx, look.fx);
  ctx.restore();
  drawStageOverlay(ctx, area, look.stage);
  drawTroopCounter(ctx, battleLayout.troopCounter, look.troopCounts);
  if (look.enemyHealPop !== null) drawEnemyHealPop(ctx, battleLayout, game.enemy.typeId, look.enemyHealPop);
  const conv = game.config.muscleConversion;
  drawTopGauges(ctx, battleLayout.topGauges, {
    turn: game.battleTurn,
    castle: { hp: look.castleHp, maxHp: game.castle.maxHp },
    enemy: { name: game.enemy.name, hp: look.enemyHp, maxHp: game.enemy.maxHp },
    fatigued: game.isEnemyFatigued(),
    coins: game.gauges[conv.gauge] ?? 0,
    coinConversion: conv,
  });
  if (look.finished && result.defeat !== null) drawDefeat(ctx, battleLayout, result.defeat);
}
