/**
 * 責務: 最上段（戦闘）の描画（背景 → 奥の兵 → 城 → 敵の絵（enemyView.js）→ 手前の兵（troopView.js。段の中で切り抜く）→ 予告と数え下ろし（intentView.js））。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { drawEnemyFigure } from './enemyView.js';
import { drawEnemyIntent } from './intentView.js';
import { SPRITE_IDS, drawSpriteFit } from './spriteView.js';
import { drawTroopSwarm } from './troopView.js';

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
 * 兵の片方の層を、戦闘の段の中で切り抜いて描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置（段の区画・兵の大きさ・境目 groundY）
 * @param {import('../anim/troopSwarm.js').TroopSwarmLook} troops 兵の見た目
 * @param {'back'|'front'} layer 描く層（back: 奥の兵、front: 手前の兵）
 * @param {string} enemyTypeId 敵の種類の識別子（群れの敵の兵の絵を選ぶ）
 * @returns {void}
 */
function drawTroopLayer(ctx, battleLayout, troops, layer, enemyTypeId) {
  const { area } = battleLayout;
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();
  drawTroopSwarm(ctx, troops, battleLayout.troops.size, layer, battleLayout.groundY, enemyTypeId);
  ctx.restore();
}

/**
 * 最上段（戦闘）を描く（背景 → 奥の兵 → 城 → 敵 → 手前の兵 → 予告）。敵の予告の札と数え下ろしは敵の頭の上に出す（enemy.hp が 0 以下か enemy.intent が null なら出さない。段取りの間は entrance に合わせる）。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ enemy: { typeId: string, hp: number, maxHp: number, intent: import('../rules/combatants.js').EnemyIntent|null }, figure?: { visible: boolean, dy: number, dx: number }|null, countdown?: number|null, pose?: { tilt: number, scaleX: number, scaleY: number }|null, idle?: { count: number, scaleX: Float64Array, scaleY: Float64Array, figure: { tilt: number, scaleX: number, scaleY: number } }|null, entrance?: import('../anim/enemyEntrance.js').EnemyEntranceLook|null, troops?: import('../anim/troopSwarm.js').TroopSwarmLook|null, unitPoints?: number }} state 表示する状態（unitPoints: 敵の1体のポイント（既定 1。群れの体の数・傷ついた体を決める）。troops: 兵の見た目。null か省くと兵を描かない。entrance: 段取りの間の敵の入りの見た目（見えるか・横のずれ）。攻防中は渡さない。null か省くと常に見えてずれなし。idle: 段取りの間の敵の待機の伸び縮み（EnemyIdleLook）。攻防中は渡さない。null か省くと伸び縮みなし。figure: 攻防の演出中の敵の絵の見た目（倒れる動き・駆け寄りのずれ）。null か省くと段取りの絵。countdown: 攻撃までの残りフェーズ数（予告の札の下に出す）。null か省くと数え下ろしを描かない。pose: ための姿勢（ChargePoseLook）。null か省くと姿勢なし）
 * @returns {void}
 */
export function drawBattleStage(ctx, battleLayout, { enemy, figure = null, countdown = null, pose = null, idle = null, entrance = null, troops = null, unitPoints = 1 }) {
  drawBackground(ctx, battleLayout);
  if (troops !== null) drawTroopLayer(ctx, battleLayout, troops, 'back', enemy.typeId);
  drawSpriteFit(ctx, SPRITE_IDS.castle, battleLayout.castle);
  drawEnemyFigure(ctx, battleLayout, enemy, figure, pose, idle, entrance, unitPoints);
  if (troops !== null) drawTroopLayer(ctx, battleLayout, troops, 'front', enemy.typeId);
  drawEnemyIntent(ctx, battleLayout, enemy, countdown, entrance);
}
