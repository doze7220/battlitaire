/**
 * 責務: 最上段（戦闘）の描画（背景のスプライト・城のスプライト・敵の絵（enemyView.js。段取りの間は待機の伸び縮みを渡す）・敵の頭の上の予告と数え下ろし（intentView.js を呼ぶ））。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { drawEnemyFigure } from './enemyView.js';
import { drawEnemyIntent } from './intentView.js';
import { SPRITE_IDS, drawSpriteFit } from './spriteView.js';

/**
 * 背景（クオータービューの空と地面のスプライト）を戦闘の段の区画いっぱいに描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @returns {void}
 */
function drawBackground(ctx, battleLayout) {
  drawSpriteFit(ctx, SPRITE_IDS.background, battleLayout.area);
}

/**
 * 最上段（戦闘）を描く。敵の予告の札と数え下ろしは敵の頭の上に出す（enemy.hp が 0 以下か enemy.intent が null なら出さない。段取りの間は entrance に合わせる）。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ enemy: { typeId: string, hp: number, armor: number, intent: import('../rules/combatants.js').EnemyAction|null }, figure?: { visible: boolean, dy: number }|null, countdown?: number|null, pose?: { tilt: number, scaleX: number, scaleY: number }|null, idle?: { count: number, scaleX: Float64Array, scaleY: Float64Array, figure: { tilt: number, scaleX: number, scaleY: number } }|null, entrance?: import('../anim/enemyEntrance.js').EnemyEntranceLook|null }} state 表示する状態（entrance: 段取りの間の敵の入りの見た目（見えるか・横のずれ）。攻防中は渡さない。null か省くと常に見えてずれなし。idle: 段取りの間の敵の待機の伸び縮み（EnemyIdleLook）。攻防中は渡さない。null か省くと伸び縮みなし。figure: 攻防の演出中の敵の絵の見た目（倒れる動き）。null か省くと段取りの絵。countdown: 攻撃までの残りフェーズ数（予告の札の下に出す）。null か省くと数え下ろしを描かない。pose: ための姿勢（ChargePoseLook）。null か省くと姿勢なし）
 * @returns {void}
 */
export function drawBattleStage(ctx, battleLayout, { enemy, figure = null, countdown = null, pose = null, idle = null, entrance = null }) {
  drawBackground(ctx, battleLayout);
  drawSpriteFit(ctx, SPRITE_IDS.castle, battleLayout.castle);
  drawEnemyFigure(ctx, battleLayout, enemy, figure, pose, idle, entrance);
  drawEnemyIntent(ctx, battleLayout, enemy, countdown, entrance);
}
