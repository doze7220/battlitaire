/**
 * 責務: 戦闘の段の敵の絵（巨人・ドラゴン。攻防中は倒れる動きのずれ・姿勢で段の中に切り抜く）と、段取りの間の絵・群れ（待機の伸び縮み）・シールドマークを描く。
 * 段取りの間は入りのずれ（見えるか・横のずれ）を受けて描く。状態は変えず、ルール層・anim は実行時に import しない。
 */

import { drawTroop } from './troopView.js';
import { isHordeEnemy } from './hordeSkins.js';
import { drawSpriteFit } from './spriteView.js';
import { bodyScale, scaledShieldArea } from './figureScale.js';

/** 群れの兵の種類（troopView.js の種類）。 */
const HORDE_KIND = 'goblin';
/** シールドマークの兵の種類（troopView.js の種類）。 */
const SHIELD_KIND = 'shield';
/** 姿勢なし（傾きなし・伸び縮みなし）。体の縮みだけを重ねるときの基準。 */
const NO_POSE = Object.freeze({ tilt: 0, scaleX: 1, scaleY: 1 });

/**
 * 群れの敵（ゴブリン・骸骨の軍勢）の兵の群れ（HP の数）を、足元の y の小さい（奥の）順（同じなら番号の小さい順）に描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {string} typeId 敵の種類の識別子（群れの兵の絵を選ぶ）
 * @param {number} count 群れの兵の数（敵の HP）
 * @param {{ count: number, scaleX: Float64Array, scaleY: Float64Array }|null} idle 待機の伸び縮み（並びの番号 i が idle.count 未満ならその値、そうでなければ 1・1。null なら伸び縮みなし）
 * @returns {void}
 */
function drawHorde(ctx, battleLayout, typeId, count, idle) {
  const slots = battleLayout.hordeSlots(count);
  const order = [];
  for (let i = 0; i < slots.length; i++) order.push(i);
  order.sort((a, b) => slots[a].footY - slots[b].footY || a - b);
  for (const i of order) {
    const slot = slots[i];
    const own = idle !== null && i < idle.count;
    drawTroop(ctx, HORDE_KIND, slot.x, slot.footY, slot.size, 0, 1, own ? idle.scaleX[i] : 1, own ? idle.scaleY[i] : 1, typeId);
  }
}

/**
 * 絵の足元（矩形の下端の中央）を軸に、傾け・伸ばし・体の大きさの倍率をかける変換を ctx に重ねる（傾き 0・伸び 1・1・倍率 1 なら何もしない）。
 * 呼ぶ側が ctx.save()／restore() で囲む。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 絵の矩形
 * @param {{ tilt: number, scaleX: number, scaleY: number }} pose 姿勢（傾き・横と縦の伸び縮み）
 * @param {number} scale 体の大きさの倍率（横も縦もかける。1 なら体の大きさは変えない）
 * @returns {void}
 */
function applyFootPose(ctx, rect, pose, scale) {
  if (pose.tilt === 0 && pose.scaleX === 1 && pose.scaleY === 1 && scale === 1) return;
  const footX = rect.x + rect.w / 2;
  const footY = rect.y + rect.h;
  ctx.translate(footX, footY);
  ctx.rotate(pose.tilt);
  ctx.scale(pose.scaleX * scale, pose.scaleY * scale);
  ctx.translate(-footX, -footY);
}

/**
 * シールドマーク（盾のスプライト）を drawTroop の 'shield' で1つ描く。
 * 矩形は正方形（shieldRects）。足元を矩形の下端の中央にそろえ、大きさ rect.w で描くので、今と同じ位置・大きさ。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect マークの矩形
 * @returns {void}
 */
function drawShieldMark(ctx, rect) {
  drawTroop(ctx, SHIELD_KIND, rect.x + rect.w / 2, rect.y + rect.h, rect.w, 0, 1, 1, 1);
}

/**
 * 敵の絵を描く。段取りの間（figure が null）は絵または兵の群れを描き、絵を持つ敵にはそのターンの防御の量のシールドマークも描き、
 * 攻防の演出中は絵だけを倒れる動きのずれで段の中に切り抜いて描く（群れ・シールドは名簿の1体として別に描かれる）。
 * 段取りの間は entrance を受け、見えないなら何も描かず、横のずれがあれば絵・群れ・シールドマークをまとめてずらす。
 * 引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ typeId: string, hp: number, maxHp: number, intent: import('../rules/combatants.js').EnemyIntent|null }} enemy 描く敵（種類の識別子・HP・最大 HP・予告。群れの数は HP、シールドマークの数は予告の `defense`、絵の体の大きさ（縮み）は HP と最大 HP と表の `minScale`。群れにはシールドマークを描かない）
 * @param {{ visible: boolean, dy: number }|null} [figure] 倒れる絵の見た目（EnemyFigureLook）。null か省くと段取りの絵
 * @param {{ tilt: number, scaleX: number, scaleY: number }|null} [pose] ための姿勢（ChargePoseLook。攻防の演出中の絵を足元を軸に傾け・伸ばす）。null か省くと姿勢なし
 * @param {{ count: number, scaleX: Float64Array, scaleY: Float64Array, figure: { tilt: number, scaleX: number, scaleY: number } }|null} [idle] 段取りの間の待機の伸び縮み（EnemyIdleLook。絵は足元を軸に、群れは1体ずつ。null か省くと伸び縮みなし。シールドマークは伸び縮みしない）
 * @param {import('../anim/enemyEntrance.js').EnemyEntranceLook|null} [entrance] 段取りの間の敵の入りの見た目（visible が偽なら描かない、dx は右へのずれ px。攻防の演出中は使わない。null か省くと常に見えてずれなし）
 * @returns {void}
 */
export function drawEnemyFigure(ctx, battleLayout, enemy, figure = null, pose = null, idle = null, entrance = null) {
  const hasFigure = Object.prototype.hasOwnProperty.call(battleLayout.enemyFigures, enemy.typeId);
  const scale = hasFigure ? bodyScale(battleLayout.enemyFigures[enemy.typeId].minScale, enemy.hp, enemy.maxHp) : 1;
  ctx.save();
  if (figure !== null) {
    if (hasFigure && figure.visible) {
      const fig = battleLayout.enemyFigures[enemy.typeId];
      const { area } = battleLayout;
      ctx.beginPath();
      ctx.rect(area.x, area.y, area.w, area.h);
      ctx.clip();
      ctx.translate(0, figure.dy);
      applyFootPose(ctx, fig.rect, pose === null ? NO_POSE : pose, scale);
      drawSpriteFit(ctx, fig.sprite, fig.rect);
    }
    ctx.restore();
    return;
  }
  if (entrance !== null && !entrance.visible) {
    ctx.restore();
    return;
  }
  if (entrance !== null && entrance.dx !== 0) ctx.translate(entrance.dx, 0);
  if (hasFigure) {
    const fig = battleLayout.enemyFigures[enemy.typeId];
    ctx.save();
    applyFootPose(ctx, fig.rect, idle === null ? NO_POSE : idle.figure, scale);
    drawSpriteFit(ctx, fig.sprite, fig.rect);
    ctx.restore();
    if (fig.shieldArea !== null && enemy.intent !== null && enemy.intent.defense > 0) {
      const shieldArea = scale === 1 ? fig.shieldArea : scaledShieldArea(fig, scale);
      for (const rect of battleLayout.shieldRects(enemy.intent.defense, shieldArea)) drawShieldMark(ctx, rect);
    }
  } else if (isHordeEnemy(enemy.typeId)) {
    drawHorde(ctx, battleLayout, enemy.typeId, enemy.hp, idle);
  }
  ctx.restore();
}
