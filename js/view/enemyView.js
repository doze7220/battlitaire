/**
 * 責務: 戦闘の段の敵の絵（巨人・ドラゴン。攻防中は倒れる動きのずれ・ための姿勢で段の中に切り抜く）と、段取りの間の群れ・シールドマークを描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { drawTroop } from './troopView.js';
import { SPRITE_IDS, drawSpriteFit, drawSpriteCentered } from './spriteView.js';

/** 群れの兵の種類（troopView.js の種類）。 */
const HORDE_KIND = 'goblin';
/** 群れで描く敵の種類の識別子。 */
const HORDE_ENEMIES = new Set(['goblins']);

/**
 * ゴブリンの軍勢の兵の群れ（HP の数）を、奥の行から順に描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {number} count 群れの兵の数（敵の HP）
 * @returns {void}
 */
function drawHorde(ctx, battleLayout, count) {
  const slots = battleLayout.hordeSlots(count);
  let maxRow = 0;
  for (const slot of slots) maxRow = Math.max(maxRow, slot.row);
  for (let row = maxRow; row >= 0; row--) {
    for (const slot of slots) {
      if (slot.row === row) drawTroop(ctx, HORDE_KIND, slot.x, slot.footY, slot.size, 0, 1, 1, 1);
    }
  }
}

/**
 * シールドマーク（盾のスプライト）を1つ描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect マークの矩形
 * @returns {void}
 */
function drawShieldMark(ctx, rect) {
  drawSpriteCentered(ctx, SPRITE_IDS.shield, rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w);
}

/**
 * 敵の絵を描く。段取りの間（figure が null）は絵または兵の群れと常時防御力のシールドマークを描き、
 * 攻防の演出中は絵だけを倒れる動きのずれで段の中に切り抜いて描く（群れ・シールドは名簿の1体として別に描かれる）。
 * 引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ typeId: string, armor: number, hp: number }} enemy 描く敵（種類の識別子・常時防御力・HP。群れの数は HP）
 * @param {{ visible: boolean, dy: number }|null} [figure] 倒れる絵の見た目（EnemyFigureLook）。null か省くと段取りの絵
 * @param {{ tilt: number, scaleX: number, scaleY: number }|null} [pose] ための姿勢（ChargePoseLook。攻防の演出中の絵を足元を軸に傾け・伸ばす）。null か省くと姿勢なし
 * @returns {void}
 */
export function drawEnemyFigure(ctx, battleLayout, enemy, figure = null, pose = null) {
  const hasFigure = Object.prototype.hasOwnProperty.call(battleLayout.enemyFigures, enemy.typeId);
  ctx.save();
  if (figure !== null) {
    if (hasFigure && figure.visible) {
      const fig = battleLayout.enemyFigures[enemy.typeId];
      const { area } = battleLayout;
      ctx.beginPath();
      ctx.rect(area.x, area.y, area.w, area.h);
      ctx.clip();
      ctx.translate(0, figure.dy);
      if (pose !== null && (pose.tilt !== 0 || pose.scaleX !== 1 || pose.scaleY !== 1)) {
        const footX = fig.rect.x + fig.rect.w / 2;
        const footY = fig.rect.y + fig.rect.h;
        ctx.translate(footX, footY);
        ctx.rotate(pose.tilt);
        ctx.scale(pose.scaleX, pose.scaleY);
        ctx.translate(-footX, -footY);
      }
      drawSpriteFit(ctx, fig.sprite, fig.rect);
    }
    ctx.restore();
    return;
  }
  let shieldBody = battleLayout.enemy;
  if (hasFigure) {
    const fig = battleLayout.enemyFigures[enemy.typeId];
    drawSpriteFit(ctx, fig.sprite, fig.rect);
    shieldBody = fig.shieldArea;
  } else if (HORDE_ENEMIES.has(enemy.typeId)) {
    drawHorde(ctx, battleLayout, enemy.hp);
  }
  if (enemy.armor > 0) {
    for (const rect of battleLayout.shieldRects(enemy.armor, shieldBody)) drawShieldMark(ctx, rect);
  }
  ctx.restore();
}
