/**
 * 責務: 戦闘の段の敵の絵（巨人・ドラゴンのスプライト、ゴブリンの軍勢の兵の群れ）と、常時防御力のシールドマーク（盾のスプライト）を描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { drawTroop } from './troopView.js';
import { SPRITE_IDS, drawSpriteFit, drawSpriteCentered } from './spriteView.js';

/** 群れの兵の種類（troopView.js の種類）。 */
const HORDE_KIND = 'goblin';
/** シールドマークが光るときに重ねて描く絵の不透明度。 */
const SHIELD_FLASH_ALPHA = 0.8;
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
      if (slot.row === row) drawTroop(ctx, HORDE_KIND, slot.x, slot.footY, slot.size, 0, 1);
    }
  }
}

/**
 * シールドマーク（盾のスプライト）を1つ描く。光らせるときは同じ絵を加算合成で重ねる。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect マークの矩形
 * @param {boolean} flash 光らせるか
 * @returns {void}
 */
function drawShieldMark(ctx, rect, flash) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  drawSpriteCentered(ctx, SPRITE_IDS.shield, cx, cy, rect.w);
  if (flash) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = SHIELD_FLASH_ALPHA;
    drawSpriteCentered(ctx, SPRITE_IDS.shield, cx, cy, rect.w);
    ctx.restore();
  }
}

/**
 * 敵の絵（スプライトまたは兵の群れ）と、常時防御力の数のシールドマークを描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ typeId: string, armor: number, hp: number }} enemy 描く敵（種類の識別子・常時防御力・HP。群れの数は HP）
 * @param {{ shieldFlash: boolean }} options 表示の指定（shieldFlash: シールドマークを明るく描くか）
 * @returns {void}
 */
export function drawEnemyFigure(ctx, battleLayout, enemy, { shieldFlash }) {
  ctx.save();
  let shieldBody = battleLayout.enemy;
  if (Object.prototype.hasOwnProperty.call(battleLayout.enemyFigures, enemy.typeId)) {
    const figure = battleLayout.enemyFigures[enemy.typeId];
    drawSpriteFit(ctx, figure.sprite, figure.rect);
    shieldBody = figure.shieldArea;
  } else if (HORDE_ENEMIES.has(enemy.typeId)) {
    drawHorde(ctx, battleLayout, enemy.hp);
  }
  if (enemy.armor > 0) {
    for (const rect of battleLayout.shieldRects(enemy.armor, shieldBody)) drawShieldMark(ctx, rect, shieldFlash);
  }
  ctx.restore();
}
