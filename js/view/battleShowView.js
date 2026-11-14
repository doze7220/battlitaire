/**
 * 責務: 攻防の演出中の最上段の描画の取りまとめ（HP の表示値を差し替えた戦闘の段・兵・敵の回復の量・決着の表示・敵を倒したときの案内）。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { drawBattleStage } from './battleStageView.js';
import { drawTroops } from './troopView.js';
import { outcomeText, defeatText, nextEnemyText, healAmountText } from './battleText.js';

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
/** 敵を倒したときの「〜を倒した！」のフォント。 */
const DEFEAT_TITLE_FONT = 'bold 52px sans-serif';
/** 敵を倒したときの「次は〜」のフォント。 */
const DEFEAT_NEXT_FONT = 'bold 36px sans-serif';
/** 敵を倒したときの案内の文字。 */
const DEFEAT_HINT_TEXT = 'タップで次へ';
/** シールドマークが光る段の種類（BattleLook.stepType の値）。 */
const ARMOR_BLOCK_STEP = 'armorBlock';
/** 敵の回復の量のフォント。 */
const ENEMY_HEAL_FONT = 'bold 40px sans-serif';
/** 敵の回復の量の文字の色（緑）。 */
const ENEMY_HEAL_COLOR = '#6ee07a';

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
 * 敵を倒したときの案内（暗幕・「〜を倒した！」・「次は〜」・「タップで次へ」）を描く。
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
  if (defeat.nextEnemyName !== null) {
    ctx.font = DEFEAT_NEXT_FONT;
    ctx.fillStyle = OUTCOME_HINT_COLOR;
    ctx.fillText(nextEnemyText(defeat.nextEnemyName), pos.x, pos.nextY, pos.maxW);
  }
  ctx.font = OUTCOME_HINT_FONT;
  ctx.fillStyle = OUTCOME_HINT_COLOR;
  ctx.fillText(DEFEAT_HINT_TEXT, pos.x, pos.hintY, pos.maxW);
  ctx.restore();
}

/**
 * 敵の回復の量（緑の「+20」）を巨人の玉の上に描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ amount: number, alpha: number }} pop 回復の量と濃さ（BattleLook.enemyHealPop の null でない値）
 * @returns {void}
 */
function drawEnemyHealPop(ctx, battleLayout, pop) {
  const pos = battleLayout.enemyHealText;
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
 * @param {import('../rules/Game.js').Game} game ルール層のゲーム（フェーズ・最大 HP・攻防をした敵の種類・名前・常時防御力を読む）
 * @param {import('../rules/Game.js').BattleResult} result 攻防の結果（敵の行動・決着・敵を倒したときの案内を読む）
 * @param {{ units: Array<object>, castleHp: number, enemyHp: number, finished: boolean, stepType: string|null, enemyHealPop: { amount: number, alpha: number }|null }} look 演出の見た目の値（BattleLook）
 * @returns {void}
 */
export function drawBattleShow(ctx, battleLayout, game, result, look) {
  drawBattleStage(ctx, battleLayout, {
    phase: game.phase,
    castle: { hp: look.castleHp, maxHp: game.castle.maxHp },
    enemy: {
      typeId: game.enemy.typeId,
      name: game.enemy.name,
      hp: look.enemyHp,
      maxHp: game.enemy.maxHp,
      armor: game.enemy.armor,
      intent: result.enemyAction,
    },
    shieldFlash: look.stepType === ARMOR_BLOCK_STEP,
    countdown: game.attackCountdown(),
  });
  drawTroops(ctx, look.units);
  if (look.enemyHealPop !== null) drawEnemyHealPop(ctx, battleLayout, look.enemyHealPop);
  if (look.finished && result.outcome !== null) drawOutcome(ctx, battleLayout, result.outcome);
  else if (look.finished && result.defeat !== null) drawDefeat(ctx, battleLayout, result.defeat);
}
